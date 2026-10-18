"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  insererLignes,
  preparerLignesEtTotaux,
  resoudreNumero,
  supprimerLignes,
} from "@/lib/documents-serveur";
import type { EtatDocument } from "@/components/documents/formulaire-document";

export async function creerDevis(
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Veuillez sélectionner un client." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne au devis." };

  const supabase = await createClient();

  try {
    const numero = await resoudreNumero(supabase, "DEV");
    const { data, error } = await supabase
      .from("devis")
      .insert({
        numero,
        client_id: clientId,
        date_devis: String(formData.get("date_devis") ?? new Date().toISOString().slice(0, 10)),
        date_validite: String(formData.get("date_validite") ?? "") || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        statut: "brouillon",
        ...totaux,
      })
      .select("id")
      .single();

    if (error) return { erreur: `Erreur : ${error.message}` };
    await insererLignes(supabase, "devis_lignes", "devis_id", data.id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/devis");
  revalidatePath("/dashboard");
  redirect("/devis");
}

export async function modifierDevis(
  id: string,
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Veuillez sélectionner un client." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne au devis." };

  const supabase = await createClient();

  try {
    const { data: existant } = await supabase
      .from("devis")
      .select("statut, facture_id")
      .eq("id", id)
      .single();

    if (!existant) return { erreur: "Devis introuvable." };
    if (existant.facture_id)
      return { erreur: "Ce devis est lié à une facture et ne peut plus être modifié." };

    const { error } = await supabase
      .from("devis")
      .update({
        client_id: clientId,
        date_devis: String(formData.get("date_devis") ?? new Date().toISOString().slice(0, 10)),
        date_validite: String(formData.get("date_validite") ?? "") || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        ...totaux,
      })
      .eq("id", id);

    if (error) return { erreur: `Erreur : ${error.message}` };

    await supprimerLignes(supabase, "devis_lignes", "devis_id", id);
    await insererLignes(supabase, "devis_lignes", "devis_id", id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/devis");
  redirect("/devis");
}

export async function changerStatutDevis(
  id: string,
  statut: "envoye" | "accepte" | "refuse" | "brouillon"
) {
  const supabase = await createClient();
  await supabase.from("devis").update({ statut }).eq("id", id);
  revalidatePath("/devis");
  revalidatePath(`/devis/${id}`);
  revalidatePath("/dashboard");
}

export async function convertirEnFacture(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: devis } = await supabase
    .from("devis")
    .select("*, devis_lignes(*)")
    .eq("id", id)
    .single();

  if (!devis) redirect("/devis");
  if (devis.facture_id) {
    redirect(`/factures/${devis.facture_id}`);
  }

  const numero = await resoudreNumero(supabase, "FAC");
  const echeance = new Date();
  echeance.setDate(echeance.getDate() + 30);

  const { data: facture, error } = await supabase
    .from("factures")
    .insert({
      numero,
      client_id: devis.client_id,
      devis_id: devis.id,
      date_facture: new Date().toISOString().slice(0, 10),
      date_echeance: echeance.toISOString().slice(0, 10),
      statut: "brouillon",
      notes: devis.notes,
      sous_total_ht: devis.sous_total_ht,
      total_tva: devis.total_tva,
      total_ttc: devis.total_ttc,
    })
    .select("id")
    .single();

  if (error || !facture) {
    redirect("/devis");
  }

  await insererLignes(
    supabase,
    "facture_lignes",
    "facture_id",
    facture.id,
    (devis.devis_lignes ?? []).map((l: { produit_id: string | null; description: string; quantite: number; prix_ht: number; taux_tva: number }) => ({
      produit_id: l.produit_id,
      description: l.description,
      quantite: l.quantite,
      prix_ht: l.prix_ht,
      taux_tva: l.taux_tva,
    }))
  );

  await supabase
    .from("devis")
    .update({ statut: "accepte", facture_id: facture.id })
    .eq("id", id);

  revalidatePath("/devis");
  revalidatePath("/factures");
  redirect(`/factures/${facture.id}`);
}

export async function supprimerDevis(id: string) {
  const supabase = await createClient();
  const { data: devis } = await supabase
    .from("devis")
    .select("facture_id")
    .eq("id", id)
    .single();

  if (devis?.facture_id) return;

  await supabase.from("devis").delete().eq("id", id);
  revalidatePath("/devis");
  revalidatePath("/dashboard");
}
