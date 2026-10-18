"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatProduit = { erreur?: string; succes?: boolean };

function lireChamps(formData: FormData) {
  return {
    nom: String(formData.get("nom") ?? "").trim(),
    reference: String(formData.get("reference") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    unite: String(formData.get("unite") ?? "pièce").trim() || "pièce",
    prix_achat_ht: Number(formData.get("prix_achat_ht") ?? 0) || 0,
    prix_vente_ht: Number(formData.get("prix_vente_ht") ?? 0) || 0,
    quantite: Number(formData.get("quantite") ?? 0) || 0,
    quantite_min: Number(formData.get("quantite_min") ?? 0) || 0,
    taux_tva: Number(formData.get("taux_tva") ?? 19) || 0,
    actif: formData.get("actif") === "on",
  };
}

export async function creerProduit(
  _etat: EtatProduit,
  formData: FormData
): Promise<EtatProduit> {
  const valeurs = lireChamps(formData);
  if (!valeurs.nom) return { erreur: "Le nom du produit est obligatoire." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produits")
    .insert(valeurs)
    .select("id")
    .single();

  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath("/produits");
  revalidatePath("/dashboard");
  redirect(`/produits?succes=${encodeURIComponent(data.id)}`);
}

export async function modifierProduit(
  id: string,
  _etat: EtatProduit,
  formData: FormData
): Promise<EtatProduit> {
  const { quantite: _quantiteIgnoree, ...valeurs } = lireChamps(formData);
  void _quantiteIgnoree;
  if (!valeurs.nom) return { erreur: "Le nom du produit est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("produits").update(valeurs).eq("id", id);

  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath("/produits");
  revalidatePath("/dashboard");
  redirect("/produits");
}

export async function supprimerProduit(id: string) {
  const supabase = await createClient();
  await supabase.from("produits").delete().eq("id", id);
  revalidatePath("/produits");
  revalidatePath("/dashboard");
}
