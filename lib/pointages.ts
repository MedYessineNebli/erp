export function dureeEnHeures(
  entree: string | null,
  sortie: string | null
): number {
  if (!entree || !sortie) return 0;
  const [h1, m1] = entree.split(":").map(Number);
  const [h2, m2] = sortie.split(":").map(Number);
  let minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}
