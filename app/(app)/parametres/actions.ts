"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TrancheIBS } from "@/lib/types";

export type EtatParametres = {
  erreur?: string;
  succes?: boolean;
};

function nombre(valeur: FormDataEntryValue | null, defaut: number): number {
  const n = Number(String(valeur ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : defaut;
}

export async function enregistrerParametres(
  _etatPrecedent: EtatParametres,
  formData: FormData
): Promise<EtatParametres> {
  const nomSociete = String(formData.get("nom_societe") ?? "").trim();
  if (!nomSociete) {
    return { erreur: "Le nom de la société est obligatoire." };
  }

  // Taux de TVA disponibles
  const tauxTvaBruts = String(formData.get("taux_tva_disponibles") ?? "")
    .split(",")
    .map((t) => Number(t.trim().replace(",", ".")))
    .filter((t) => Number.isFinite(t) && t >= 0 && t <= 100);
  const tauxTvaDisponibles =
    tauxTvaBruts.length > 0 ? [...new Set(tauxTvaBruts)].sort((a, b) => a - b) : [0, 7, 13, 19];

  // Barème IBS
  let baremeIbs: TrancheIBS[];
  try {
    const brut = JSON.parse(String(formData.get("bareme_ibs") ?? "[]")) as {
      plafond: string | null;
      taux: string;
      deduction: string;
    }[];
    baremeIbs = brut
      .filter((t) => t.taux !== "")
      .map((t) => ({
        plafond: t.plafond === null || t.plafond === "" ? null : Number(t.plafond),
        taux: Number(t.taux) || 0,
        deduction: Number(t.deduction) || 0,
      }))
      .sort((a, b) => (a.plafond ?? Infinity) - (b.plafond ?? Infinity));
  } catch {
    return { erreur: "Barème IBS invalide." };
  }

  const valeurs = {
    nom_societe: nomSociete,
    raison_sociale: String(formData.get("raison_sociale") ?? "").trim() || null,
    adresse: String(formData.get("adresse") ?? "").trim() || null,
    ville: String(formData.get("ville") ?? "").trim() || null,
    code_postal: String(formData.get("code_postal") ?? "").trim() || null,
    telephone: String(formData.get("telephone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    site_web: String(formData.get("site_web") ?? "").trim() || null,
    ice: String(formData.get("ice") ?? "").trim() || null,
    matricule_fiscal: String(formData.get("matricule_fiscal") ?? "").trim() || null,
    numero_tva: String(formData.get("numero_tva") ?? "").trim() || null,
    capital: nombre(formData.get("capital"), 0),
    rib: String(formData.get("rib") ?? "").trim() || null,
    banque: String(formData.get("banque") ?? "").trim() || null,
    taux_tva_disponibles: tauxTvaDisponibles,
    taux_tva_defaut: nombre(formData.get("taux_tva_defaut"), 19),
    taux_cnss_salarie: nombre(formData.get("taux_cnss_salarie"), 5.75),
    taux_cnss_employeur: nombre(formData.get("taux_cnss_employeur"), 16.77),
    plafond_cnss: nombre(formData.get("plafond_cnss"), 2000),
    taux_amo_salarie: nombre(formData.get("taux_amo_salarie"), 1.1125),
    taux_amo_employeur: nombre(formData.get("taux_amo_employeur"), 4.3425),
    plafond_amo: nombre(formData.get("plafond_amo"), 2000),
    bareme_ibs: baremeIbs,
    abattement_mensuel: nombre(formData.get("abattement_mensuel"), 500),
    allocation_familiale: nombre(formData.get("allocation_familiale"), 10),
    majoration_heures_sup: nombre(formData.get("majoration_heures_sup"), 1.5),
    jours_base_mensuel: nombre(formData.get("jours_base_mensuel"), 26),
  };

  const supabase = await createClient();
  const { data: existant } = await supabase
    .from("parametres_societe")
    .select("id")
    .limit(1)
    .maybeSingle();

  const resultat = existant
    ? await supabase.from("parametres_societe").update(valeurs).eq("id", existant.id)
    : await supabase.from("parametres_societe").insert(valeurs);

  if (resultat.error) {
    return { erreur: `Erreur lors de l'enregistrement : ${resultat.error.message}` };
  }

  revalidatePath("/parametres");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { succes: true };
}
