"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  appliquerStockFacture,
  insererLignes,
  preparerLignesEtTotaux,
  resoudreNumero,
  supprimerLignes,
} from "@/lib/documents-serveur";
import type { EtatDocument } from "@/components/documents/formulaire-document";

export async function creerFacture(
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Veuillez sélectionner un client." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne à la facture." };

  const supabase = await createClient();

  try {
    const numero = await resoudreNumero(supabase, "FAC");
    const { data, error } = await supabase
      .from("factures")
      .insert({
        numero,
        client_id: clientId,
        date_facture: String(formData.get("date_facture") ?? new Date().toISOString().slice(0, 10)),
        date_echeance: String(formData.get("date_echeance") ?? "") || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        statut: "brouillon",
        ...totaux,
      })
      .select("id")
      .single();

    if (error) return { erreur: `Erreur : ${error.message}` };
    await insererLignes(supabase, "facture_lignes", "facture_id", data.id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/factures");
  revalidatePath("/dashboard");
  redirect("/factures");
}

export async function modifierFacture(
  id: string,
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Veuillez sélectionner un client." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne à la facture." };

  const supabase = await createClient();

  const { data: existant } = await supabase
    .from("factures")
    .select("statut")
    .eq("id", id)
    .single();

  if (!existant) return { erreur: "Facture introuvable." };
  if (existant.statut !== "brouillon")
    return { erreur: "Seule une facture en brouillon peut être modifiée." };

  try {
    const { error } = await supabase
      .from("factures")
      .update({
        client_id: clientId,
        date_facture: String(formData.get("date_facture") ?? new Date().toISOString().slice(0, 10)),
        date_echeance: String(formData.get("date_echeance") ?? "") || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        ...totaux,
      })
      .eq("id", id);

    if (error) return { erreur: `Erreur : ${error.message}` };

    await supprimerLignes(supabase, "facture_lignes", "facture_id", id);
    await insererLignes(supabase, "facture_lignes", "facture_id", id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/factures");
  redirect("/factures");
}

export async function emettreFacture(id: string): Promise<{ erreur?: string }> {
  const supabase = await createClient();

  const { data: facture } = await supabase
    .from("factures")
    .select("id, numero, statut")
    .eq("id", id)
    .single();

  if (!facture) return { erreur: "Facture introuvable." };
  if (facture.statut !== "brouillon")
    return { erreur: "Seule une facture en brouillon peut être émise." };

  try {
    await appliquerStockFacture(supabase, id, facture.numero);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur stock." };
  }

  const { error } = await supabase
    .from("factures")
    .update({ statut: "emise" })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/produits");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  return {};
}

export async function marquerFacturePayee(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: facture } = await supabase
    .from("factures")
    .select("id, total_ttc, statut")
    .eq("id", id)
    .single();

  if (!facture || facture.statut === "annulee" || facture.statut === "brouillon") return;

  await supabase
    .from("factures")
    .update({ statut: "payee", montant_paye: facture.total_ttc })
    .eq("id", id);

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/dashboard");
}

export async function enregistrerPaiement(id: string, montant: number): Promise<{ erreur?: string }> {
  if (!montant || montant <= 0) return { erreur: "Montant invalide." };

  const supabase = await createClient();
  const { data: facture } = await supabase
    .from("factures")
    .select("id, total_ttc, montant_paye, statut")
    .eq("id", id)
    .single();

  if (!facture) return { erreur: "Facture introuvable." };

  const nouveauMontant = facture.montant_paye + montant;
  const statut =
    nouveauMontant >= facture.total_ttc ? "payee" : facture.statut === "payee" ? "emise" : facture.statut;

  const { error } = await supabase
    .from("factures")
    .update({ montant_paye: nouveauMontant, statut })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function annulerFacture(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("factures").update({ statut: "annulee" }).eq("id", id);
  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/dashboard");
}

export async function supprimerFacture(id: string) {
  const supabase = await createClient();
  const { data: facture } = await supabase
    .from("factures")
    .select("statut")
    .eq("id", id)
    .single();

  if (!facture || facture.statut !== "brouillon") return;

  await supabase.from("factures").delete().eq("id", id);
  revalidatePath("/factures");
  revalidatePath("/dashboard");
}
