import type { SupabaseClient } from "@supabase/supabase-js";
import { arrondir3, calculerTotaux, lireLignesFormulaire } from "@/lib/documents";
import type { LigneDocument } from "@/lib/types";

export async function resoudreNumero(
  supabase: SupabaseClient,
  prefixe: "DEV" | "FAC" | "ACH"
): Promise<string> {
  const { data, error } = await supabase.rpc("prochain_numero", {
    prefixe,
  });
  if (error || !data) {
    throw new Error(
      `Impossible de générer le numéro de document : ${error?.message ?? "erreur inconnue"}`
    );
  }
  return data as string;
}

export async function insererLignes(
  supabase: SupabaseClient,
  table: "devis_lignes" | "facture_lignes" | "achat_lignes",
  colonneDocument: "devis_id" | "facture_id" | "achat_id",
  documentId: string,
  lignes: LigneDocument[]
): Promise<void> {
  const valeurs = lignes.map((ligne) => ({
    [colonneDocument]: documentId,
    produit_id: ligne.produit_id || null,
    description: ligne.description,
    quantite: ligne.quantite,
    prix_ht: ligne.prix_ht,
    taux_tva: ligne.taux_tva,
  }));

  const { error } = await supabase.from(table).insert(valeurs);
  if (error) throw new Error(`Erreur lors de l'enregistrement des lignes : ${error.message}`);
}

export async function supprimerLignes(
  supabase: SupabaseClient,
  table: "devis_lignes" | "facture_lignes" | "achat_lignes",
  colonneDocument: "devis_id" | "facture_id" | "achat_id",
  documentId: string
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq(colonneDocument, documentId);
  if (error) throw new Error(`Erreur lors de la mise à jour des lignes : ${error.message}`);
}

export function preparerLignesEtTotaux(formData: FormData): {
  lignes: LigneDocument[];
  totaux: ReturnType<typeof calculerTotaux>;
} {
  const lignes = lireLignesFormulaire(formData);
  return { lignes, totaux: calculerTotaux(lignes) };
}

export async function appliquerStockFacture(
  supabase: SupabaseClient,
  factureId: string,
  numero: string
): Promise<void> {
  const { data: lignes, error } = await supabase
    .from("facture_lignes")
    .select("produit_id, quantite")
    .eq("facture_id", factureId);

  if (error) throw new Error(`Erreur lecture lignes facture : ${error.message}`);

  for (const ligne of lignes ?? []) {
    if (!ligne.produit_id) continue;

    const { data: produit } = await supabase
      .from("produits")
      .select("id, nom, quantite")
      .eq("id", ligne.produit_id)
      .single();

    if (!produit) continue;
    if (produit.quantite < ligne.quantite) {
      throw new Error(
        `Stock insuffisant pour « ${produit.nom} » : ${produit.quantite} disponible(s), ${ligne.quantite} requis.`
      );
    }

    const { error: erreurMvt } = await supabase.from("mouvements_stock").insert({
      produit_id: ligne.produit_id,
      type: "sortie",
      quantite: ligne.quantite,
      motif: "vente",
      doc_reference: numero,
    });
    if (erreurMvt) throw new Error(`Erreur mouvement de stock : ${erreurMvt.message}`);

    const { error: erreurProduit } = await supabase
      .from("produits")
      .update({ quantite: arrondir3(produit.quantite - ligne.quantite) })
      .eq("id", ligne.produit_id);
    if (erreurProduit) throw new Error(`Erreur mise à jour stock : ${erreurProduit.message}`);
  }
}

export async function appliquerStockAchat(
  supabase: SupabaseClient,
  achatId: string,
  numero: string
): Promise<void> {
  const { data: lignes, error } = await supabase
    .from("achat_lignes")
    .select("produit_id, quantite")
    .eq("achat_id", achatId);

  if (error) throw new Error(`Erreur lecture lignes achat : ${error.message}`);

  for (const ligne of lignes ?? []) {
    if (!ligne.produit_id) continue;

    const { data: produit } = await supabase
      .from("produits")
      .select("id, quantite")
      .eq("id", ligne.produit_id)
      .single();

    if (!produit) continue;

    const { error: erreurMvt } = await supabase.from("mouvements_stock").insert({
      produit_id: ligne.produit_id,
      type: "entree",
      quantite: ligne.quantite,
      motif: "achat",
      doc_reference: numero,
    });
    if (erreurMvt) throw new Error(`Erreur mouvement de stock : ${erreurMvt.message}`);

    const { error: erreurProduit } = await supabase
      .from("produits")
      .update({ quantite: arrondir3(produit.quantite + ligne.quantite) })
      .eq("id", ligne.produit_id);
    if (erreurProduit) throw new Error(`Erreur mise à jour stock : ${erreurProduit.message}`);
  }
}
