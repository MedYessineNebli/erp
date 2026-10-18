import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfDevis } from "@/lib/pdf/generateur";
import type { Client, Devis, LigneDocument, ParametresSociete } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });

  const [{ data: devis }, { data: parametres }] = await Promise.all([
    supabase.from("devis").select("*, clients(*), devis_lignes(*)").eq("id", id).single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!devis) {
    return NextResponse.json({ erreur: "Devis introuvable" }, { status: 404 });
  }

  const d = devis as unknown as Devis & {
    clients: Client | null;
    devis_lignes: LigneDocument[];
  };

  const doc = pdfDevis(d, d.clients, d.devis_lignes ?? [], parametres as ParametresSociete | null);
  const contenu = doc.output("arraybuffer");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="devis-${d.numero}.pdf"`,
    },
  });
}
