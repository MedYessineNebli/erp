"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TypeTiers = "clients" | "fournisseurs";
export type EtatTiers = { erreur?: string; succes?: boolean };

function lireChamps(formData: FormData) {
  return {
    nom: String(formData.get("nom") ?? "").trim(),
    contact: String(formData.get("contact") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    telephone: String(formData.get("telephone") ?? "").trim() || null,
    adresse: String(formData.get("adresse") ?? "").trim() || null,
    ville: String(formData.get("ville") ?? "").trim() || null,
    ice: String(formData.get("ice") ?? "").trim() || null,
    matricule_fiscal: String(formData.get("matricule_fiscal") ?? "").trim() || null,
    numero_tva: String(formData.get("numero_tva") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    actif: formData.get("actif") === "on",
  };
}

export async function creerTiers(
  type: TypeTiers,
  _etat: EtatTiers,
  formData: FormData
): Promise<EtatTiers> {
  const valeurs = lireChamps(formData);
  if (!valeurs.nom) return { erreur: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from(type).insert(valeurs);
  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath(`/${type}`);
  revalidatePath("/dashboard");
  redirect(`/${type}`);
}

export async function modifierTiers(
  type: TypeTiers,
  id: string,
  _etat: EtatTiers,
  formData: FormData
): Promise<EtatTiers> {
  const valeurs = lireChamps(formData);
  if (!valeurs.nom) return { erreur: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from(type).update(valeurs).eq("id", id);
  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath(`/${type}`);
  redirect(`/${type}`);
}

export async function supprimerTiers(type: TypeTiers, id: string) {
  const supabase = await createClient();
  await supabase.from(type).delete().eq("id", id);
  revalidatePath(`/${type}`);
}
