"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatEmploye = { erreur?: string };

function lireChamps(formData: FormData) {
  return {
    nom: String(formData.get("nom") ?? "").trim(),
    prenom: String(formData.get("prenom") ?? "").trim(),
    cin: String(formData.get("cin") ?? "").trim() || null,
    poste: String(formData.get("poste") ?? "").trim() || null,
    date_embauche: String(formData.get("date_embauche") ?? new Date().toISOString().slice(0, 10)),
    salaire_base_brut: Number(formData.get("salaire_base_brut") ?? 0) || 0,
    numero_cnss: String(formData.get("numero_cnss") ?? "").trim() || null,
    rib: String(formData.get("rib") ?? "").trim() || null,
    telephone: String(formData.get("telephone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    nb_enfants: Math.max(0, Number(formData.get("nb_enfants") ?? 0) || 0),
    actif: formData.get("actif") === "on",
  };
}

export async function creerEmploye(
  _etat: EtatEmploye,
  formData: FormData
): Promise<EtatEmploye> {
  const valeurs = lireChamps(formData);
  if (!valeurs.nom || !valeurs.prenom)
    return { erreur: "Le nom et le prénom sont obligatoires." };

  const supabase = await createClient();
  const { error } = await supabase.from("employes").insert(valeurs);
  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath("/employes");
  revalidatePath("/paie");
  redirect("/employes");
}

export async function modifierEmploye(
  id: string,
  _etat: EtatEmploye,
  formData: FormData
): Promise<EtatEmploye> {
  const valeurs = lireChamps(formData);
  if (!valeurs.nom || !valeurs.prenom)
    return { erreur: "Le nom et le prénom sont obligatoires." };

  const supabase = await createClient();
  const { error } = await supabase.from("employes").update(valeurs).eq("id", id);
  if (error) return { erreur: `Erreur : ${error.message}` };

  revalidatePath("/employes");
  revalidatePath("/paie");
  redirect("/employes");
}

export async function supprimerEmploye(id: string): Promise<{ erreur?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("employes").delete().eq("id", id);

  if (error) {
    return {
      erreur:
        error.code === "23503"
          ? "Cet employé possède des bulletins de paie ou des pointages et ne peut pas être supprimé. Désactivez-le plutôt."
          : `Erreur : ${error.message}`,
    };
  }

  revalidatePath("/employes");
  return {};
}
