export type TrancheIBS = {
  plafond: number | null;
  taux: number;
  deduction: number;
};

export type ParametresSociete = {
  id: string;
  nom_societe: string;
  raison_sociale: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  ice: string | null;
  matricule_fiscal: string | null;
  numero_tva: string | null;
  capital: number;
  rib: string | null;
  banque: string | null;
  logo_url: string | null;
  taux_tva_disponibles: number[];
  taux_tva_defaut: number;
  taux_cnss_salarie: number;
  taux_cnss_employeur: number;
  plafond_cnss: number;
  taux_amo_salarie: number;
  taux_amo_employeur: number;
  plafond_amo: number;
  bareme_ibs: TrancheIBS[];
  abattement_mensuel: number;
  allocation_familiale: number;
  majoration_heures_sup: number;
  jours_base_mensuel: number;
  created_at?: string;
  updated_at?: string;
};

export type Produit = {
  id: string;
  nom: string;
  reference: string | null;
  description: string | null;
  unite: string;
  prix_achat_ht: number;
  prix_vente_ht: number;
  quantite: number;
  quantite_min: number;
  taux_tva: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TypeMouvement = "entree" | "sortie";
export type MotifMouvement =
  | "achat"
  | "vente"
  | "inventaire"
  | "ajustement"
  | "retour";

export type MouvementStock = {
  id: string;
  produit_id: string;
  type: TypeMouvement;
  quantite: number;
  motif: MotifMouvement;
  doc_reference: string | null;
  date_mouvement: string;
  notes: string | null;
  cree_par?: string | null;
  created_at?: string;
  produits?: Produit | null;
};

export type Client = {
  id: string;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  ice: string | null;
  matricule_fiscal: string | null;
  numero_tva: string | null;
  notes: string | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Fournisseur = Client;

export type StatutDevis = "brouillon" | "envoye" | "accepte" | "refuse";

export type LigneDocument = {
  id?: string;
  produit_id?: string | null;
  description: string;
  quantite: number;
  prix_ht: number;
  taux_tva: number;
};

export type Devis = {
  id: string;
  numero: string;
  client_id: string;
  facture_id?: string | null;
  date_devis: string;
  date_validite: string | null;
  statut: StatutDevis;
  sous_total_ht: number;
  total_tva: number;
  total_ttc: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  clients?: Client | null;
  devis_lignes?: LigneDocument[];
  factures?: { numero: string; id: string } | null;
};

export type StatutFacture =
  | "brouillon"
  | "emise"
  | "payee"
  | "en_retard"
  | "annulee";

export type Facture = {
  id: string;
  numero: string;
  client_id: string;
  devis_id: string | null;
  date_facture: string;
  date_echeance: string | null;
  statut: StatutFacture;
  sous_total_ht: number;
  total_tva: number;
  total_ttc: number;
  montant_paye: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  clients?: Client | null;
  facture_lignes?: LigneDocument[];
  devis?: { numero: string } | null;
};

export type StatutAchat = "brouillon" | "recue" | "payee";

export type Achat = {
  id: string;
  numero: string;
  fournisseur_id: string;
  date_achat: string;
  reference_fournisseur: string | null;
  statut: StatutAchat;
  sous_total_ht: number;
  total_tva: number;
  total_ttc: number;
  montant_paye: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  fournisseurs?: Fournisseur | null;
  achat_lignes?: LigneDocument[];
};

export type Employe = {
  id: string;
  nom: string;
  prenom: string;
  cin: string | null;
  poste: string | null;
  date_embauche: string;
  salaire_base_brut: number;
  numero_cnss: string | null;
  rib: string | null;
  telephone: string | null;
  email: string | null;
  nb_enfants: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Pointage = {
  id: string;
  employe_id: string;
  date_pointage: string;
  heure_entree: string | null;
  heure_sortie: string | null;
  heures_sup: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  employes?: Employe | null;
};

export type StatutBulletin = "brouillon" | "valide" | "paye";

export type BulletinPaie = {
  id: string;
  employe_id: string;
  periode: string;
  salaire_base: number;
  heures_sup: number;
  total_primes: number;
  total_retenues: number;
  base_imposable: number;
  montant_cnss: number;
  montant_amo: number;
  montant_ir: number;
  net_a_payer: number;
  cout_employeur: number;
  details: Record<string, unknown> | null;
  statut: StatutBulletin;
  created_at?: string;
  updated_at?: string;
  employes?: Employe | null;
};

export type TotauxDocument = {
  sous_total_ht: number;
  total_tva: number;
  total_ttc: number;
};
