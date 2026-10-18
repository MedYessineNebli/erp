import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfBulletin } from "@/lib/pdf/generateur";
import type { BulletinPaie, ParametresSociete } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });

  const [{ data: bulletin }, { data: parametres }] = await Promise.all([
    supabase.from("bulletins_paie").select("*, employes(*)").eq("id", id).single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!bulletin) {
    return NextResponse.json({ erreur: "Bulletin introuvable" }, { status: 404 });
  }

  const b = bulletin as unknown as BulletinPaie & {
    employes: {
      nom: string;
      prenom: string;
      poste: string | null;
      numero_cnss: string | null;
      cin: string | null;
      rib: string | null;
    } | null;
  };

  const doc = pdfBulletin(b, b.employes, parametres as ParametresSociete | null);
  const contenu = doc.output("arraybuffer");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bulletin-${b.periode}-${b.employes?.nom ?? "employe"}.pdf"`,
    },
  });
}
