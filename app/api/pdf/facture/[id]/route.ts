import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfFacture } from "@/lib/pdf/generateur";
import type { Client, Facture, LigneDocument, ParametresSociete } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });

  const [{ data: facture }, { data: parametres }] = await Promise.all([
    supabase.from("factures").select("*, clients(*), facture_lignes(*)").eq("id", id).single(),
    supabase.from("parametres_societe").select("*").limit(1).maybeSingle(),
  ]);

  if (!facture) {
    return NextResponse.json({ erreur: "Facture introuvable" }, { status: 404 });
  }

  const f = facture as unknown as Facture & {
    clients: Client | null;
    facture_lignes: LigneDocument[];
  };

  const doc = pdfFacture(f, f.clients, f.facture_lignes ?? [], parametres as ParametresSociete | null);
  const contenu = doc.output("arraybuffer");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${f.numero}.pdf"`,
    },
  });
}
