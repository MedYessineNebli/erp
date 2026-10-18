import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { arrondir3, montantEnLettres } from "@/lib/documents";
import { formatDate, formatTND, moisEnLettres } from "@/lib/formatage";
import type {
  Achat,
  BulletinPaie,
  Client,
  Devis,
  Facture,
  LigneDocument,
  ParametresSociete,
} from "@/lib/types";

export function textePDF(texte: string | null | undefined): string {
  if (!texte) return "";
  return texte
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/Å/g, "oe")
    .replace(/Å/g, "OE")
    .replace(/Ã¦/g, "ae")
    .replace(/Ã/g, "AE")
    .replace(/\u00A0/g, " ");
}

function enTeteSociete(doc: jsPDF, p: ParametresSociete | null): number {
  let y = 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(textePDF(p?.nom_societe ?? "Ma Societe"), 14, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);

  const lignesAdress: string[] = [];
  if (p?.raison_sociale) lignesAdress.push(p.raison_sociale);
  const adresse = [p?.adresse, p?.code_postal, p?.ville].filter(Boolean).join(", ");
  if (adresse) lignesAdress.push(adresse);
  if (p?.telephone) lignesAdress.push(`Tel : ${p.telephone}`);
  if (p?.email) lignesAdress.push(p.email);
  if (p?.site_web) lignesAdress.push(p.site_web);

  for (const ligne of lignesAdress) {
    doc.text(textePDF(ligne), 14, y);
    y += 4.5;
  }

  // Colonne droite : mentions lÃ©gales
  let yDroit = 16;
  const mentions: string[] = [];
  if (p?.ice) mentions.push(`ICE : ${p.ice}`);
  if (p?.matricule_fiscal) mentions.push(`Matricule fiscal : ${p.matricule_fiscal}`);
  if (p?.numero_tva) mentions.push(`NÂ° TVA (NR_ART) : ${p.numero_tva}`);
  if (p?.capital) mentions.push(`Capital : ${formatTND(p.capital)} TND`);
  if (p?.rib) mentions.push(`RIB : ${p.rib}`);

  for (const mention of mentions) {
    doc.text(textePDF(mention), 196, yDroit, { align: "right" });
    yDroit += 4.5;
  }

  doc.setTextColor(30);
  return Math.max(y, yDroit) + 4;
}

function blocEntite(
  doc: jsPDF,
  y: number,
  libelle: string,
  entite: Partial<Client> | null,
  extraGauche: { libelle: string; valeur: string }[],
  extraDroite: { libelle: string; valeur: string }[]
): number {
  doc.setDrawColor(220);
  doc.roundedRect(14, y, 90, 8 + extraGauche.length * 4.5 + 14, 1.5, 1.5);
  doc.roundedRect(112, y, 84, 8 + extraDroite.length * 4.5 + 14, 1.5, 1.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(textePDF(libelle), 17, y + 6);

  doc.setFont("helvetica", "normal");
  let yG = y + 11;
  if (entite?.nom) {
    doc.setFont("helvetica", "bold");
    doc.text(textePDF(entite.nom), 17, yG);
    doc.setFont("helvetica", "normal");
    yG += 4.5;
  }
  const adresse = [entite?.adresse, entite?.ville].filter(Boolean).join(", ");
  if (adresse) {
    doc.text(textePDF(adresse), 17, yG);
    yG += 4.5;
  }
  if (entite?.ice) {
    doc.text(textePDF(`ICE : ${entite.ice}`), 17, yG);
    yG += 4.5;
  }
  if (entite?.matricule_fiscal) {
    doc.text(textePDF(`MF : ${entite.matricule_fiscal}`), 17, yG);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Informations", 115, y + 6);
  doc.setFont("helvetica", "normal");
  let yD = y + 11;
  for (const info of extraDroite) {
    doc.setFont("helvetica", "normal");
    doc.text(textePDF(info.libelle), 115, yD);
    doc.text(textePDF(info.valeur), 193, yD, { align: "right" });
    yD += 4.5;
  }
  for (const info of extraGauche) {
    void info;
  }

  return Math.max(yG, yD) + 4;
}

function tableauLignes(doc: jsPDF, y: number, lignes: LigneDocument[]): number {
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Description", "Quantite", "Prix HT", "TVA", "Total HT"]],
    body: lignes.map((ligne) => [
      textePDF(ligne.description),
      String(ligne.quantite),
      `${formatTND(ligne.prix_ht)}`,
      `${ligne.taux_tva} %`,
      `${formatTND(ligne.quantite * ligne.prix_ht)}`,
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
  return finalY + 6;
}

function blocTotaux(
  doc: jsPDF,
  y: number,
  sousTotalHt: number,
  totalTva: number,
  totalTtc: number
): number {
  doc.setFontSize(10);
  const x = 130;
  doc.setFont("helvetica", "normal");
  doc.text("Sous-total HT", x, y);
  doc.text(`${formatTND(sousTotalHt)} TND`, 196, y, { align: "right" });
  doc.text("Total TVA", x, y + 6);
  doc.text(`${formatTND(totalTva)} TND`, 196, y + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", x, y + 14);
  doc.text(`${formatTND(totalTtc)} TND`, 196, y + 14, { align: "right" });
  return y + 22;
}

function piedDePage(doc: jsPDF, y: number, notes: string | null, extra?: string) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110);

  if (extra) {
    doc.text(textePDF(extra), 14, y, { maxWidth: 182 });
  }

  let yPied = y + (extra ? 6 : 0);
  if (notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes / conditions", 14, yPied);
    doc.setFont("helvetica", "normal");
    yPied += 4.5;
    const lignes = doc.splitTextToSize(textePDF(notes), 182) as string[];
    for (const ligne of lignes.slice(0, 4)) {
      doc.text(ligne, 14, yPied);
      yPied += 4;
    }
  }

  doc.setTextColor(140);
  doc.text(
    textePDF(`Edité le ${formatDate(new Date().toISOString())} - ERP Tunisie`),
    14,
    290
  );
}

export function pdfFacture(
  facture: Facture,
  client: Client | null,
  lignes: LigneDocument[],
  p: ParametresSociete | null
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = enTeteSociete(doc, p);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(textePDF(`FACTURE NÂ° ${facture.numero}`), 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(textePDF(`Echeance : ${formatDate(facture.date_echeance)}`), 196, y, {
    align: "right",
  });
  y += 6;

  y = blocEntite(doc, y, "Facture pour", client, [], [
    { libelle: "Date", valeur: formatDate(facture.date_facture) },
    ...(facture.devis ? [{ libelle: "Devis", valeur: facture.devis.numero }] : []),
  ]);
  y = tableauLignes(doc, y, lignes);
  y = blocTotaux(doc, y, facture.sous_total_ht, facture.total_tva, facture.total_ttc);

  piedDePage(
    doc,
    y + 4,
    facture.notes,
    `Arretee la presente facture a la somme de : ${montantEnLettres(facture.total_ttc)}.`
  );

  return doc;
}

export function pdfDevis(
  devis: Devis,
  client: Client | null,
  lignes: LigneDocument[],
  p: ParametresSociete | null
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = enTeteSociete(doc, p);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(textePDF(`DEVIS NÂ° ${devis.numero}`), 14, y);
  y += 6;

  y = blocEntite(doc, y, "Devis pour", client, [], [
    { libelle: "Date", valeur: formatDate(devis.date_devis) },
    { libelle: "Validite", valeur: formatDate(devis.date_validite) },
  ]);
  y = tableauLignes(doc, y, lignes);
  y = blocTotaux(doc, y, devis.sous_total_ht, devis.total_tva, devis.total_ttc);
  piedDePage(doc, y + 4, devis.notes);

  return doc;
}

export function pdfAchat(
  achat: Achat,
  fournisseur: Client | null,
  lignes: LigneDocument[],
  p: ParametresSociete | null
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = enTeteSociete(doc, p);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(textePDF(`ACHAT NÂ° ${achat.numero}`), 14, y);
  y += 6;

  y = blocEntite(doc, y, "Facture d'achat de", fournisseur, [], [
    { libelle: "Date", valeur: formatDate(achat.date_achat) },
    ...(achat.reference_fournisseur
      ? [{ libelle: "Ref. fournisseur", valeur: achat.reference_fournisseur }]
      : []),
  ]);
  y = tableauLignes(doc, y, lignes);
  y = blocTotaux(doc, y, achat.sous_total_ht, achat.total_tva, achat.total_ttc);
  piedDePage(doc, y + 4, achat.notes);

  return doc;
}

type DetailBulletin = {
  bruts?: { libelle: string; montant: number }[];
  retenues?: { libelle: string; montant: number; taux?: number }[];
};

export function pdfBulletin(
  bulletin: BulletinPaie,
  employe: {
    nom: string;
    prenom: string;
    poste: string | null;
    numero_cnss: string | null;
    cin: string | null;
    rib: string | null;
  } | null,
  p: ParametresSociete | null
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = enTeteSociete(doc, p);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(textePDF(`BULLETIN DE PAIE - ${moisEnLettres(bulletin.periode).toUpperCase()}`), 14, y);
  y += 8;

  doc.setDrawColor(220);
  doc.roundedRect(14, y, 182, 26, 1.5, 1.5);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    textePDF(
      `${employe?.nom.toUpperCase() ?? ""} ${employe?.prenom ?? ""}`
    ),
    17,
    y + 7
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (employe?.poste) doc.text(textePDF(`Poste : ${employe.poste}`), 17, y + 13);
  if (employe?.numero_cnss)
    doc.text(textePDF(`NÂ° CNSS : ${employe.numero_cnss}`), 17, y + 18);
  if (employe?.cin) doc.text(textePDF(`CIN : ${employe.cin}`), 110, y + 7);
  if (employe?.rib) doc.text(textePDF(`RIB : ${employe.rib}`), 110, y + 13);
  y += 32;

  const details = (bulletin.details ?? {}) as DetailBulletin;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Designification", "Base", "Taux", "Montant"]],
    body: [
      ...(details.bruts ?? []).map((l) => [
        textePDF(l.libelle),
        "",
        "",
        formatTND(l.montant),
      ]),
      ...(details.retenues ?? []).map((l) => [
        textePDF(l.libelle),
        "",
        l.taux != null ? `${l.taux} %` : "",
        `-${formatTND(l.montant)}`,
      ]),
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    columnStyles: { 3: { halign: "right" } },
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const resume: [string, string][] = [
    ["Salaire brut imposable", `${formatTND(bulletin.salaire_base + bulletin.total_primes)} TND`],
    ["Base imposable", `${formatTND(bulletin.base_imposable)} TND`],
    ["CNSS ouvriere", `-${formatTND(bulletin.montant_cnss)} TND`],
    ["AMO ouvriere", `-${formatTND(bulletin.montant_amo)} TND`],
    ["IBS (impot)", `-${formatTND(bulletin.montant_ir)} TND`],
  ];
  for (const [libelle, valeur] of resume) {
    doc.text(textePDF(libelle), 120, y);
    doc.text(textePDF(valeur), 196, y, { align: "right" });
    y += 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Net a payer", 120, y + 3);
  doc.text(`${formatTND(bulletin.net_a_payer)} TND`, 196, y + 3, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    textePDF(
      `Cout employeur (estimation) : ${formatTND(bulletin.cout_employeur)} TND`
    ),
    14,
    y + 3
  );

  doc.setTextColor(140);
  doc.setFontSize(8);
  doc.text(
    textePDF(`Edité le ${formatDate(new Date().toISOString())} - ERP Tunisie`),
    14,
    290
  );

  return doc;
}

export function pdfPaiePeriode(
  bulletins: (BulletinPaie & {
    employes: { nom: string; prenom: string } | null;
  })[],
  periode: string,
  p: ParametresSociete | null
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = enTeteSociete(doc, p);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    textePDF(`ETAT DE PAIE - ${moisEnLettres(periode).toUpperCase()}`),
    14,
    y
  );
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Employe", "Brut", "CNSS", "AMO", "IBS", "Net a payer"]],
    body: bulletins.map((b) => [
      textePDF(
        `${b.employes?.nom.toUpperCase() ?? ""} ${b.employes?.prenom ?? ""}`
      ),
      formatTND(b.salaire_base + b.total_primes),
      formatTND(b.montant_cnss),
      formatTND(b.montant_amo),
      formatTND(b.montant_ir),
      formatTND(b.net_a_payer),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const totalNet = arrondir3(bulletins.reduce((s, b) => s + b.net_a_payer, 0));
  const totalCout = arrondir3(bulletins.reduce((s, b) => s + b.cout_employeur, 0));

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total net a payer", 120, y);
  doc.text(`${formatTND(totalNet)} TND`, 196, y, { align: "right" });
  doc.text("Cout employeur total", 120, y + 6);
  doc.text(`${formatTND(totalCout)} TND`, 196, y + 6, { align: "right" });

  return doc;
}
