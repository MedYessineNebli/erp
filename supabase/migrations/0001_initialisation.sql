-- ============================================================
-- ERP Tunisien — Initialisation de la base de données
-- Tables et colonnes en français. Exécuter dans le SQL Editor Supabase.
-- ============================================================

-- ---------- Paramètres société (singleton éditable par l'admin) ----------
create table if not exists public.parametres_societe (
  id uuid primary key default gen_random_uuid(),
  nom_societe text not null default 'Ma Société',
  raison_sociale text,
  adresse text,
  ville text,
  code_postal text,
  telephone text,
  email text,
  site_web text,
  ice text,
  matricule_fiscal text,
  numero_tva text,
  capital numeric not null default 0,
  rib text,
  banque text,
  logo_url text,
  -- TVA (Tunisie)
  taux_tva_disponibles numeric[] not null default array[0, 7, 13, 19],
  taux_tva_defaut numeric not null default 19,
  -- CNSS
  taux_cnss_salarie numeric not null default 5.75,
  taux_cnss_employeur numeric not null default 16.77,
  plafond_cnss numeric not null default 2000,
  -- AMO
  taux_amo_salarie numeric not null default 1.1125,
  taux_amo_employeur numeric not null default 4.3425,
  plafond_amo numeric not null default 2000,
  -- IBS (barème annuel, montants en TND)
  bareme_ibs jsonb not null default '[
    {"plafond": 5000,  "taux": 0,  "deduction": 0},
    {"plafond": 20000, "taux": 26, "deduction": 1300},
    {"plafond": 30000, "taux": 28, "deduction": 1700},
    {"plafond": 50000, "taux": 30, "deduction": 2300},
    {"plafond": null,  "taux": 34, "deduction": 4300}
  ]'::jsonb,
  abattement_mensuel numeric not null default 500,
  -- Autres
  allocation_familiale numeric not null default 10,
  majoration_heures_sup numeric not null default 1.5,
  jours_base_mensuel numeric not null default 26,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Produits ----------
create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  reference text unique,
  description text,
  unite text not null default 'pièce',
  prix_achat_ht numeric not null default 0 check (prix_achat_ht >= 0),
  prix_vente_ht numeric not null default 0 check (prix_vente_ht >= 0),
  quantite numeric not null default 0,
  quantite_min numeric not null default 0,
  taux_tva numeric not null default 19,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Mouvements de stock ----------
create table if not exists public.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references public.produits(id) on delete restrict,
  type text not null check (type in ('entree', 'sortie')),
  quantite numeric not null check (quantite > 0),
  motif text not null default 'ajustement' check (motif in ('achat', 'vente', 'inventaire', 'ajustement', 'retour')),
  doc_reference text,
  date_mouvement timestamptz not null default now(),
  notes text,
  cree_par uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ---------- Clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  contact text,
  email text,
  telephone text,
  adresse text,
  ville text,
  ice text,
  matricule_fiscal text,
  numero_tva text,
  notes text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Fournisseurs ----------
create table if not exists public.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  contact text,
  email text,
  telephone text,
  adresse text,
  ville text,
  ice text,
  matricule_fiscal text,
  numero_tva text,
  notes text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Devis ----------
create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  date_devis date not null default current_date,
  date_validite date,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'envoye', 'accepte', 'refuse')),
  sous_total_ht numeric not null default 0,
  total_tva numeric not null default 0,
  total_ttc numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devis_lignes (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid not null references public.devis(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  description text not null,
  quantite numeric not null check (quantite > 0),
  prix_ht numeric not null check (prix_ht >= 0),
  taux_tva numeric not null default 19,
  created_at timestamptz not null default now()
);

-- ---------- Factures (ventes) ----------
create table if not exists public.factures (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  devis_id uuid references public.devis(id) on delete set null,
  date_facture date not null default current_date,
  date_echeance date,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'emise', 'payee', 'en_retard', 'annulee')),
  sous_total_ht numeric not null default 0,
  total_tva numeric not null default 0,
  total_ttc numeric not null default 0,
  montant_paye numeric not null default 0,
  notes text,
  cree_par uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devis
  add column if not exists facture_id uuid references public.factures(id) on delete set null;

create table if not exists public.facture_lignes (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references public.factures(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  description text not null,
  quantite numeric not null check (quantite > 0),
  prix_ht numeric not null check (prix_ht >= 0),
  taux_tva numeric not null default 19,
  created_at timestamptz not null default now()
);

-- ---------- Achats ----------
create table if not exists public.achats (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  fournisseur_id uuid not null references public.fournisseurs(id) on delete restrict,
  date_achat date not null default current_date,
  reference_fournisseur text,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'recue', 'payee')),
  sous_total_ht numeric not null default 0,
  total_tva numeric not null default 0,
  total_ttc numeric not null default 0,
  montant_paye numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achat_lignes (
  id uuid primary key default gen_random_uuid(),
  achat_id uuid not null references public.achats(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  description text not null,
  quantite numeric not null check (quantite > 0),
  prix_ht numeric not null check (prix_ht >= 0),
  taux_tva numeric not null default 19,
  created_at timestamptz not null default now()
);

-- ---------- Employés ----------
create table if not exists public.employes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  cin text,
  poste text,
  date_embauche date not null default current_date,
  salaire_base_brut numeric not null default 0 check (salaire_base_brut >= 0),
  numero_cnss text,
  rib text,
  telephone text,
  email text,
  nb_enfants integer not null default 0 check (nb_enfants >= 0),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Pointages ----------
create table if not exists public.pointages (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references public.employes(id) on delete cascade,
  date_pointage date not null default current_date,
  heure_entree time,
  heure_sortie time,
  heures_sup numeric not null default 0 check (heures_sup >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employe_id, date_pointage)
);

-- ---------- Bulletins de paie ----------
create table if not exists public.bulletins_paie (
  id uuid primary key default gen_random_uuid(),
  employe_id uuid not null references public.employes(id) on delete restrict,
  periode text not null, -- format AAAA-MM
  salaire_base numeric not null default 0,
  heures_sup numeric not null default 0,
  total_primes numeric not null default 0,
  total_retenues numeric not null default 0,
  base_imposable numeric not null default 0,
  montant_cnss numeric not null default 0,
  montant_amo numeric not null default 0,
  montant_ir numeric not null default 0,
  net_a_payer numeric not null default 0,
  cout_employeur numeric not null default 0,
  details jsonb,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'valide', 'paye')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employe_id, periode)
);

-- ============================================================
-- Fonctions et triggers
-- ============================================================

create or replace function public.maj_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'parametres_societe', 'produits', 'clients', 'fournisseurs', 'devis',
    'factures', 'achats', 'employes', 'pointages', 'bulletins_paie'
  ]
  loop
    execute format('drop trigger if exists trg_maj_updated_at on public.%I', t);
    execute format(
      'create trigger trg_maj_updated_at before update on public.%I
       for each row execute function public.maj_updated_at()',
      t
    );
  end loop;
end;
$$;

-- Numérotation documentaire : DEV-AAAA-0001, FAC-AAAA-0001, ACH-AAAA-0001
create or replace function public.prochain_numero(prefixe text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  nom_table text;
  annee text := to_char(current_date, 'YYYY');
  dernier int;
  motif text;
begin
  case upper(prefixe)
    when 'DEV' then nom_table := 'devis';
    when 'FAC' then nom_table := 'factures';
    when 'ACH' then nom_table := 'achats';
    else raise exception 'Préfixe de document inconnu : %', prefixe;
  end case;

  motif := prefixe || '-' || annee || '-%';

  execute format(
    'select coalesce(max(
       case when numero ~ ''^%s-%s-[0-9]+$''
         then substring(numero from %s)::int
       end
     ), 0) + 1
     from public.%I where numero like $1',
    prefixe, annee, length(prefixe || '-' || annee || '-') + 1, nom_table
  )
  into dernier
  using motif;

  return prefixe || '-' || annee || '-' || lpad(dernier::text, 4, '0');
end;
$$;

-- ============================================================
-- Row Level Security — MVP mono-société : accès complet aux utilisateurs authentifiés
-- ============================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'parametres_societe', 'produits', 'mouvements_stock', 'clients', 'fournisseurs',
    'devis', 'devis_lignes', 'factures', 'facture_lignes', 'achats', 'achat_lignes',
    'employes', 'pointages', 'bulletins_paie'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Accès complet (authentifiés)" on public.%I', t);
    execute format(
      'create policy "Accès complet (authentifiés)" on public.%I
       for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;

-- ============================================================
-- Privilèges — les rôles Supabase doivent avoir accès aux tables
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- ============================================================
-- Données initiales : paramètres société par défaut
-- ============================================================

insert into public.parametres_societe (nom_societe)
select 'Ma Société'
where not exists (select 1 from public.parametres_societe);
