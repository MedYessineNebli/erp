"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculerPaie } from "@/lib/paie/calculs";
import { arrondir3 } from "@/lib/documents";
import { periodeCourante } from "@/lib/formatage";
import type { ParametresSociete } from "@/lib/types";

export type EtatBulletin = { erreur?: string; succes?: boolean };

export async function genererBulletins(periode?: string): Promise<EtatBulletin> {
  const p = periode ?? periodeCourante();
  const supabase = await createClient();

  const [{ data: parametres }, { data: employes }, { data: existants }] =
    await Promise.all([
      supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
      supabase.from("employes").select("*").eq("actif", true),
      supabase.from("bulletins_paie").select("employe_id").eq("periode", p),
    ]);

  if (!parametres) return { erreur: "Configurez d'abord les paramètres de la société." };

  const dejaGeneres = new Set((existants ?? []).map((b) => b.employe_id));
  const debut = `${p}-01`;
  const fin = `${p}-31`;

  const { data: pointages } = await supabase
    .from("pointages")
    .select("employe_id, heures_sup")
    .gte("date_pointage", debut)
    .lte("date_pointage", fin);

  const heuresSupParEmploye = new Map<string, number>();
  for (const pointage of pointages ?? []) {
    heuresSupParEmploye.set(
      pointage.employe_id,
      (heuresSupParEmploye.get(pointage.employe_id) ?? 0) + pointage.heures_sup
    );
  }

  let crees = 0;

  for (const employe of employes ?? []) {
    if (dejaGeneres.has(employe.id)) continue;

    const heuresSup = heuresSupParEmploye.get(employe.id) ?? 0;
    const resultat = calculerPaie(
      {
        salaire_base: employe.salaire_base_brut,
        primes: 0,
        retenues_absences: 0,
        heures_sup: heuresSup,
        nb_enfants: employe.nb_enfants,
      },
      parametres as ParametresSociete
    );

    const { error } = await supabase.from("bulletins_paie").insert({
      employe_id: employe.id,
      periode: p,
      salaire_base: employe.salaire_base_brut,
      heures_sup: heuresSup,
      total_primes: 0,
      total_retenues: 0,
      base_imposable: resultat.base_imposable,
      montant_cnss: resultat.montant_cnss,
      montant_amo: resultat.montant_amo,
      montant_ir: resultat.montant_ir,
      net_a_payer: resultat.net_a_payer,
      cout_employeur: resultat.cout_employeur,
      details: resultat.details,
      statut: "brouillon",
    });

    if (error) return { erreur: `Erreur pour ${employe.nom} : ${error.message}` };
    crees += 1;
  }

  revalidatePath("/paie");
  return crees > 0
    ? { succes: true }
    : { erreur: "Tous les bulletins de cette période existent déjà." };
}

export async function modifierBulletin(
  id: string,
  _etat: EtatBulletin,
  formData: FormData
): Promise<EtatBulletin> {
  const primes = Math.max(0, Number(formData.get("primes") ?? 0) || 0);
  const retenuesAbsences = Math.max(0, Number(formData.get("retenues_absences") ?? 0) || 0);
  const heuresSup = Math.max(0, Number(formData.get("heures_sup") ?? 0) || 0);
  const salaireBase = Math.max(0, Number(formData.get("salaire_base") ?? 0) || 0);

  const supabase = await createClient();

  const [{ data: bulletin }, { data: parametres }] = await Promise.all([
    supabase.from("bulletins_paie").select("*, employes(*)").eq("id", id).single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!bulletin || !parametres) return { erreur: "Bulletin introuvable." };
  if (bulletin.statut !== "brouillon")
    return { erreur: "Seul un bulletin en brouillon peut être modifié." };

  const employe = bulletin.employes as unknown as {
    nb_enfants: number;
  };

  const resultat = calculerPaie(
    {
      salaire_base: salaireBase,
      primes,
      retenues_absences: retenuesAbsences,
      heures_sup: heuresSup,
      nb_enfants: employe.nb_enfants,
    },
    parametres as ParametresSociete
  );

  const { error } = await supabase
    .from("bulletins_paie")
    .update({
      salaire_base: salaireBase,
      heures_sup: heuresSup,
      total_primes: arrondir3(primes),
      total_retenues: arrondir3(retenuesAbsences),
      base_imposable: resultat.base_imposable,
      montant_cnss: resultat.montant_cnss,
      montant_amo: resultat.montant_amo,
      montant_ir: resultat.montant_ir,
      net_a_payer: resultat.net_a_payer,
      cout_employeur: resultat.cout_employeur,
      details: resultat.details,
    })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/paie");
  revalidatePath(`/paie/${id}`);
  return { succes: true };
}

export async function changerStatutBulletin(
  id: string,
  statut: "brouillon" | "valide" | "paye"
): Promise<{ erreur?: string }> {
  const supabase = await createClient();

  const { data: bulletin } = await supabase
    .from("bulletins_paie")
    .select("statut")
    .eq("id", id)
    .single();

  if (!bulletin) return { erreur: "Bulletin introuvable." };
  if (bulletin.statut === "paye" && statut !== "paye")
    return { erreur: "Un bulletin payé ne peut pas revenir en arrière." };

  const { error } = await supabase
    .from("bulletins_paie")
    .update({ statut })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/paie");
  revalidatePath(`/paie/${id}`);
  return {};
}

export async function supprimerBulletin(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: bulletin } = await supabase
    .from("bulletins_paie")
    .select("statut")
    .eq("id", id)
    .single();

  if (!bulletin || bulletin.statut !== "brouillon") return;

  await supabase.from("bulletins_paie").delete().eq("id", id);
  revalidatePath("/paie");
}

export async function supprimerBulletinsBrouillon(periode: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("bulletins_paie")
    .delete()
    .eq("periode", periode)
    .eq("statut", "brouillon");
  revalidatePath("/paie");
}

export async function validerBulletinFormulaire(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await changerStatutBulletin(id, "valide");
}

export async function payerBulletinFormulaire(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await changerStatutBulletin(id, "paye");
}
