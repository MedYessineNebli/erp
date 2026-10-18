"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = {
  erreur?: string;
};

export async function connexion(
  _etatPrecedent: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Veuillez saisir votre email et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    return {
      erreur:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : `Échec de la connexion : ${error.message}`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
