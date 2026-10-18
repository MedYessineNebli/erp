const formateurTND = new Intl.NumberFormat("fr-TN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const formateurNombre = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatTND(montant: number | null | undefined): string {
  if (montant == null || Number.isNaN(montant)) return "0,000";
  return formateurTND.format(montant);
}

export function formatNombre(valeur: number | null | undefined): string {
  if (valeur == null || Number.isNaN(valeur)) return "0";
  return formateurNombre.format(valeur);
}

export function formatPourcent(taux: number | null | undefined): string {
  if (taux == null || Number.isNaN(taux)) return "0 %";
  return `${formateurNombre.format(taux)} %`;
}

export function formatDate(valeur: string | null | undefined): string {
  if (!valeur) return "—";
  const date = new Date(valeur.length === 10 ? `${valeur}T00:00:00` : valeur);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatHeure(valeur: string | null | undefined): string {
  if (!valeur) return "—";
  return valeur.slice(0, 5);
}

export function formatDureeHeures(heures: number): string {
  const h = Math.floor(heures);
  const m = Math.round((heures - h) * 60);
  return `${h} h${m > 0 ? ` ${String(m).padStart(2, "0")}` : ""}`;
}

export function moisEnLettres(periode: string): string {
  const [annee, mois] = periode.split("-");
  const date = new Date(Number(annee), Number(mois) - 1, 1);
  return date.toLocaleDateString("fr-TN", { month: "long", year: "numeric" });
}

export function periodeCourante(): string {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}
