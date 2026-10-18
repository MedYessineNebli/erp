"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { deconnexion } from "@/app/(auth)/actions";

const SECTIONS = [
  {
    titre: "Pilotage",
    liens: [{ href: "/dashboard", libelle: "Tableau de bord" }],
  },
  {
    titre: "Commerce",
    liens: [
      { href: "/devis", libelle: "Devis" },
      { href: "/factures", libelle: "Factures" },
      { href: "/achats", libelle: "Achats" },
    ],
  },
  {
    titre: "Stock",
    liens: [
      { href: "/produits", libelle: "Produits" },
      { href: "/stock", libelle: "Mouvements" },
    ],
  },
  {
    titre: "Référentiel",
    liens: [
      { href: "/clients", libelle: "Clients" },
      { href: "/fournisseurs", libelle: "Fournisseurs" },
    ],
  },
  {
    titre: "Ressources humaines",
    liens: [
      { href: "/employes", libelle: "Employés" },
      { href: "/pointages", libelle: "Pointages" },
      { href: "/paie", libelle: "Bulletins de paie" },
    ],
  },
  {
    titre: "Système",
    liens: [{ href: "/parametres", libelle: "Paramètres" }],
  },
];

export function Navigation({ email }: { email: string }) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm lg:hidden"
        onClick={() => setOuvert(!ouvert)}
        aria-label="Ouvrir le menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {ouvert ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setOuvert(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${ouvert ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">ERP Tunisie</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.titre} className="mb-5">
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.titre}
              </p>
              <ul className="space-y-0.5">
                {section.liens.map((lien) => {
                  const actif =
                    chemin === lien.href || chemin.startsWith(`${lien.href}/`);
                  return (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        onClick={() => setOuvert(false)}
                        className={`block rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                          actif
                            ? "bg-blue-50 text-blue-800"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {lien.libelle}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <form action={deconnexion} className="border-t border-slate-200 p-3">
          <button
            type="submit"
            className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            Se déconnecter
          </button>
        </form>
      </aside>
    </>
  );
}
