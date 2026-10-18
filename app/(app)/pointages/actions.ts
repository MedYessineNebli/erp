"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dureeEnHeures } from "@/lib/pointages";

export type EtatPointage = { erreur?: string; succes?: boolean };

export async function enregistrerPointage(
  _etat: EtatPointage,
  formData: FormData
): Promise<EtatPointage> {
  const employeId = String(formData.get("employe_id") ?? "");
  const datePointage = String(formData.get("date_pointage") ?? "");
  const heureEntree = String(formData.get("heure_entree") ?? "") || null;
  const heureSortie = String(formData.get("heure_sortie") ?? "") || null;
  const heuresSup = Number(formData.get("heures_sup") ?? 0) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!employeId) return { erreur: "Veuillez sélectionner un employé." };
  if (!datePointage) return { erreur: "La date est obligatoire." };
  if (heureEntree && heureSortie && dureeEnHeures(heureEntree, heureSortie) <= 0)
    return { erreur: "L'heure de sortie doit être postérieure à l'heure d'entrée." };

  const supabase = await createClient();

  const { data: existant } = await supabase
    .from("pointages")
    .select("id")
    .eq("employe_id", employeId)
    .eq("date_pointage", datePointage)
    .maybeSingle();

  const valeurs = {
    employe_id: employeId,
    date_pointage: datePointage,
    heure_entree: heureEntree,
    heure_sortie: heureSortie,
    heures_sup: Math.max(0, heuresSup),
    notes,
  };

  const resultat = existant
    ? await supabase.from("pointages").update(valeurs).eq("id", existant.id)
    : await supabase.from("pointages").insert(valeurs);

  if (resultat.error) return { erreur: `Erreur : ${resultat.error.message}` };

  revalidatePath("/pointages");
  revalidatePath("/paie");
  return { succes: true };
}

export async function supprimerPointage(id: string) {
  const supabase = await createClient();
  await supabase.from("pointages").delete().eq("id", id);
  revalidatePath("/pointages");
  revalidatePath("/paie");
}
