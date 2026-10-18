import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfPaiePeriode } from "@/lib/pdf/generateur";
import type { BulletinPaie, ParametresSociete } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ periode: string }> }
) {
  const { periode } = await params;

  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ erreur: "Periode invalide" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });

  const [{ data: bulletins }, { data: parametres }] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("*, employes(nom, prenom)")
      .eq("periode", periode)
      .order("created_at"),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  const liste = (bulletins ?? []) as unknown as (BulletinPaie & {
    employes: { nom: string; prenom: string } | null;
  })[];

  const doc = pdfPaiePeriode(liste, periode, parametres as ParametresSociete | null);
  const contenu = doc.output("arraybuffer");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="etat-paie-${periode}.pdf"`,
    },
  });
}
