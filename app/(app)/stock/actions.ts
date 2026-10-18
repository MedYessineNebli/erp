"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatMouvement = { erreur?: string; succes?: boolean };

export async function creerMouvement(
  _etat: EtatMouvement,
  formData: FormData
): Promise<EtatMouvement> {
  const produitId = String(formData.get("produit_id") ?? "");
  const type = String(formData.get("type") ?? "entree") as "entree" | "sortie";
  const quantite = Number(formData.get("quantite") ?? 0);
  const motif = String(formData.get("motif") ?? "ajustement");
  const docReference = String(formData.get("doc_reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!produitId) return { erreur: "Veuillez sélectionner un produit." };
  if (!["entree", "sortie"].includes(type))
    return { erreur: "Type de mouvement invalide." };
  if (!quantite || quantite <= 0)
    return { erreur: "La quantité doit être strictement positive." };

  const supabase = await createClient();

  const { data: produit } = await supabase
    .from("produits")
    .select("id, nom, quantite")
    .eq("id", produitId)
    .single();

  if (!produit) return { erreur: "Produit introuvable." };

  if (type === "sortie" && produit.quantite < quantite) {
    return {
      erreur: `Stock insuffisant pour « ${produit.nom} » : ${produit.quantite} disponible(s).`,
    };
  }

  const nouvelleQuantite =
    type === "entree"
      ? produit.quantite + quantite
      : produit.quantite - quantite;

  const { error: erreurMouvement } = await supabase.from("mouvements_stock").insert({
    produit_id: produitId,
    type,
    quantite,
    motif,
    doc_reference: docReference,
    notes,
  });

  if (erreurMouvement) {
    return { erreur: `Erreur : ${erreurMouvement.message}` };
  }

  const { error: erreurProduit } = await supabase
    .from("produits")
    .update({ quantite: nouvelleQuantite })
    .eq("id", produitId);

  if (erreurProduit) {
    return { erreur: `Erreur stock : ${erreurProduit.message}` };
  }

  revalidatePath("/stock");
  revalidatePath("/produits");
  revalidatePath("/dashboard");
  return { succes: true };
}
