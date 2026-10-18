import Link from "next/link";
import { connection } from "next/server";
import { EnTetePage, Carte, EtatVide } from "@/components/ui/carte";
import { Badge, badgeStatutDevis, badgeStatutFacture } from "@/components/ui/badge";
import { formatDate, formatTND } from "@/lib/formatage";
import { createClient } from "@/lib/supabase/server";

export default async function PageTableauBord() {
  await connection();

  const supabase = await createClient();

  const debutMois = new Date();
  debutMois.setDate(1);
  const dateDebutMois = debutMois.toISOString().slice(0, 10);

  const [caMois, impayes, valeurStock, employes, dernieresFactures, derniersDevis, produitsStock] =
    await Promise.all([
      supabase
        .from("factures")
        .select("total_ttc")
        .in("statut", ["emise", "payee"])
        .gte("date_facture", dateDebutMois),
      supabase
        .from("factures")
        .select("id, total_ttc, montant_paye")
        .in("statut", ["emise", "en_retard"]),
      supabase.from("produits").select("quantite, prix_achat_ht").eq("actif", true),
      supabase.from("employes").select("id", { count: "exact", head: true }).eq("actif", true),
      supabase
        .from("factures")
        .select("id, numero, date_facture, statut, total_ttc, clients(nom)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("devis")
        .select("id, numero, date_devis, statut, total_ttc, clients(nom)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("produits").select("id, nom, quantite, quantite_min, unite").eq("actif", true),
    ]);

  const alertes = (produitsStock.data ?? []).filter(
    (p) => p.quantite <= p.quantite_min
  );

  const totalCa = (caMois.data ?? []).reduce(
    (somme, f) => somme + Number(f.total_ttc),
    0
  );
  const totalImpayes = (impayes.data ?? []).reduce(
    (somme, f) => somme + Number(f.total_ttc) - Number(f.montant_paye),
    0
  );
  const totalValeurStock = (valeurStock.data ?? []).reduce(
    (somme, p) => somme + Number(p.quantite) * Number(p.prix_achat_ht),
    0
  );

  const cartes = [
    {
      libelle: "Chiffre d'affaires du mois",
      valeur: `${formatTND(totalCa)} TND`,
      couleur: "text-emerald-700",
    },
    {
      libelle: "Factures impayées",
      valeur: `${formatTND(totalImpayes)} TND`,
      couleur: "text-red-700",
    },
    {
      libelle: "Valeur du stock (achat)",
      valeur: `${formatTND(totalValeurStock)} TND`,
      couleur: "text-blue-700",
    },
    {
      libelle: "Produits en alerte",
      valeur: String(alertes.length),
      couleur: alertes.length > 0 ? "text-amber-700" : "text-slate-700",
    },
    {
      libelle: "Employés actifs",
      valeur: String(employes.count ?? 0),
      couleur: "text-slate-700",
    },
  ];

  return (
    <div>
      <EnTetePage
        titre="Tableau de bord"
        description="Vue d'ensemble de l'activité de la société"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cartes.map((carte) => (
          <div key={carte.libelle} className="carte p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {carte.libelle}
            </p>
            <p className={`mt-2 text-2xl font-bold ${carte.couleur}`}>
              {carte.valeur}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Carte
          titre="Dernières factures"
          actions={
            <Link href="/factures" className="text-sm font-medium text-blue-700 hover:underline">
              Tout voir
            </Link>
          }
        >
          {dernieresFactures.data && dernieresFactures.data.length > 0 ? (
            <table className="tableau">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th className="text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {dernieresFactures.data.map((facture) => {
                  const info = badgeStatutFacture(facture.statut);
                  return (
                    <tr key={facture.id}>
                      <td>
                        <Link
                          href={`/factures/${facture.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {facture.numero}
                        </Link>
                      </td>
                      <td>{(facture.clients as unknown as { nom: string } | null)?.nom ?? "—"}</td>
                      <td>
                        <Badge ton={info.ton}>{info.texte}</Badge>
                      </td>
                      <td className="text-right font-medium">
                        {formatTND(facture.total_ttc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EtatVide titre="Aucune facture" message="Créez votre première facture depuis le module Factures." />
          )}
        </Carte>

        <Carte
          titre="Derniers devis"
          actions={
            <Link href="/devis" className="text-sm font-medium text-blue-700 hover:underline">
              Tout voir
            </Link>
          }
        >
          {derniersDevis.data && derniersDevis.data.length > 0 ? (
            <table className="tableau">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th className="text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {derniersDevis.data.map((devis) => {
                  const info = badgeStatutDevis(devis.statut);
                  return (
                    <tr key={devis.id}>
                      <td>
                        <Link
                          href={`/devis/${devis.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {devis.numero}
                        </Link>
                      </td>
                      <td>{(devis.clients as unknown as { nom: string } | null)?.nom ?? "—"}</td>
                      <td>
                        <Badge ton={info.ton}>{info.texte}</Badge>
                      </td>
                      <td className="text-right font-medium">
                        {formatTND(devis.total_ttc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EtatVide titre="Aucun devis" message="Créez votre premier devis depuis le module Devis." />
          )}
        </Carte>

        <Carte
          titre="Alertes de stock"
          actions={
            <Link href="/produits" className="text-sm font-medium text-blue-700 hover:underline">
              Gérer les produits
            </Link>
          }
          className="lg:col-span-2"
        >
          {alertes.length > 0 ? (
            <table className="tableau">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th className="text-right">Quantité</th>
                  <th className="text-right">Seuil d&apos;alerte</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map((produit) => (
                  <tr key={produit.id}>
                    <td className="font-medium">{produit.nom}</td>
                    <td className="text-right">{formatTND(produit.quantite)}</td>
                    <td className="text-right">{formatTND(produit.quantite_min)}</td>
                    <td>
                      <Badge ton={produit.quantite <= 0 ? "danger" : "attention"}>
                        {produit.quantite <= 0 ? "Rupture" : "Stock faible"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EtatVide titre="Aucune alerte" message="Tous les produits sont au-dessus de leur seuil d'alerte." />
          )}
        </Carte>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Dernière mise à jour : {formatDate(new Date().toISOString())}
      </p>
    </div>
  );
}
