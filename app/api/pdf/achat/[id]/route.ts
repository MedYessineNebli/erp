import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfAchat } from "@/lib/pdf/generateur";
import type { Achat, Client, LigneDocument, ParametresSociete } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });

  const [{ data: achat }, { data: parametres }] = await Promise.all([
    supabase.from("achats").select("*, fournisseurs(*), achat_lignes(*)").eq("id", id).single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!achat) {
    return NextResponse.json({ erreur: "Achat introuvable" }, { status: 404 });
  }

  const a = achat as unknown as Achat & {
    fournisseurs: Client | null;
    achat_lignes: LigneDocument[];
  };

  const doc = pdfAchat(a, a.fournisseurs, a.achat_lignes ?? [], parametres as ParametresSociete | null);
  const contenu = doc.output("arraybuffer");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="achat-${a.numero}.pdf"`,
    },
  });
}
