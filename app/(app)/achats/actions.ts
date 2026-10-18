"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  appliquerStockAchat,
  insererLignes,
  preparerLignesEtTotaux,
  resoudreNumero,
  supprimerLignes,
} from "@/lib/documents-serveur";
import type { EtatDocument } from "@/components/documents/formulaire-document";

export async function creerAchat(
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const fournisseurId = String(formData.get("fournisseur_id") ?? "");
  if (!fournisseurId) return { erreur: "Veuillez sélectionner un fournisseur." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne à l'achat." };

  const supabase = await createClient();

  try {
    const numero = await resoudreNumero(supabase, "ACH");
    const { data, error } = await supabase
      .from("achats")
      .insert({
        numero,
        fournisseur_id: fournisseurId,
        date_achat: String(formData.get("date_achat") ?? new Date().toISOString().slice(0, 10)),
        reference_fournisseur: String(formData.get("reference_fournisseur") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        statut: "brouillon",
        ...totaux,
      })
      .select("id")
      .single();

    if (error) return { erreur: `Erreur : ${error.message}` };
    await insererLignes(supabase, "achat_lignes", "achat_id", data.id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/achats");
  revalidatePath("/dashboard");
  redirect("/achats");
}

export async function modifierAchat(
  id: string,
  _etat: EtatDocument,
  formData: FormData
): Promise<EtatDocument> {
  const fournisseurId = String(formData.get("fournisseur_id") ?? "");
  if (!fournisseurId) return { erreur: "Veuillez sélectionner un fournisseur." };

  const { lignes, totaux } = preparerLignesEtTotaux(formData);
  if (lignes.length === 0) return { erreur: "Ajoutez au moins une ligne à l'achat." };

  const supabase = await createClient();

  const { data: existant } = await supabase
    .from("achats")
    .select("statut")
    .eq("id", id)
    .single();

  if (!existant) return { erreur: "Achat introuvable." };
  if (existant.statut !== "brouillon")
    return { erreur: "Seul un achat en brouillon peut être modifié." };

  try {
    const { error } = await supabase
      .from("achats")
      .update({
        fournisseur_id: fournisseurId,
        date_achat: String(formData.get("date_achat") ?? new Date().toISOString().slice(0, 10)),
        reference_fournisseur: String(formData.get("reference_fournisseur") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        ...totaux,
      })
      .eq("id", id);

    if (error) return { erreur: `Erreur : ${error.message}` };

    await supprimerLignes(supabase, "achat_lignes", "achat_id", id);
    await insererLignes(supabase, "achat_lignes", "achat_id", id, lignes);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur inconnue." };
  }

  revalidatePath("/achats");
  redirect("/achats");
}

export async function recevoirAchat(id: string): Promise<{ erreur?: string }> {
  const supabase = await createClient();

  const { data: achat } = await supabase
    .from("achats")
    .select("id, numero, statut")
    .eq("id", id)
    .single();

  if (!achat) return { erreur: "Achat introuvable." };
  if (achat.statut !== "brouillon")
    return { erreur: "Seul un achat en brouillon peut être réceptionné." };

  try {
    await appliquerStockAchat(supabase, id, achat.numero);
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : "Erreur stock." };
  }

  const { error } = await supabase
    .from("achats")
    .update({ statut: "recue" })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/achats");
  revalidatePath(`/achats/${id}`);
  revalidatePath("/produits");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  return {};
}

export async function marquerAchatPaye(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: achat } = await supabase
    .from("achats")
    .select("id, total_ttc, statut")
    .eq("id", id)
    .single();

  if (!achat || achat.statut === "brouillon") return;

  await supabase
    .from("achats")
    .update({ statut: "payee", montant_paye: achat.total_ttc })
    .eq("id", id);

  revalidatePath("/achats");
  revalidatePath(`/achats/${id}`);
  revalidatePath("/dashboard");
}

export async function supprimerAchat(id: string) {
  const supabase = await createClient();
  const { data: achat } = await supabase
    .from("achats")
    .select("statut")
    .eq("id", id)
    .single();

  if (!achat || achat.statut !== "brouillon") return;

  await supabase.from("achats").delete().eq("id", id);
  revalidatePath("/achats");
  revalidatePath("/dashboard");
}
