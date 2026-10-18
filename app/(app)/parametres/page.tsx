import { FormulaireParametres } from "@/components/parametres/formulaire-parametres";
import { EnTetePage } from "@/components/ui/carte";
import { createClient } from "@/lib/supabase/server";
import type { ParametresSociete, TrancheIBS } from "@/lib/types";

const PARAMETRES_DEFAUT: Omit<ParametresSociete, "id"> = {
  nom_societe: "Ma Société",
  raison_sociale: null,
  adresse: null,
  ville: null,
  code_postal: null,
  telephone: null,
  email: null,
  site_web: null,
  ice: null,
  matricule_fiscal: null,
  numero_tva: null,
  capital: 0,
  rib: null,
  banque: null,
  logo_url: null,
  taux_tva_disponibles: [0, 7, 13, 19],
  taux_tva_defaut: 19,
  taux_cnss_salarie: 5.75,
  taux_cnss_employeur: 16.77,
  plafond_cnss: 2000,
  taux_amo_salarie: 1.1125,
  taux_amo_employeur: 4.3425,
  plafond_amo: 2000,
  bareme_ibs: [
    { plafond: 5000, taux: 0, deduction: 0 },
    { plafond: 20000, taux: 26, deduction: 1300 },
    { plafond: 30000, taux: 28, deduction: 1700 },
    { plafond: 50000, taux: 30, deduction: 2300 },
    { plafond: null, taux: 34, deduction: 4300 },
  ] as TrancheIBS[],
  abattement_mensuel: 500,
  allocation_familiale: 10,
  majoration_heures_sup: 1.5,
  jours_base_mensuel: 26,
};

export default async function PageParametres() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parametres_societe")
    .select("*")
    .limit(1)
    .maybeSingle();

  const parametres: ParametresSociete = data
    ? (data as ParametresSociete)
    : ({ id: "nouveau", ...PARAMETRES_DEFAUT } as ParametresSociete);

  return (
    <div>
      <EnTetePage
        titre="Paramètres"
        description="Identité de la société et paramètres fiscaux et sociaux utilisés dans tous les calculs (TVA, CNSS, AMO, IBS)"
      />
      <FormulaireParametres parametres={parametres} />
    </div>
  );
}
