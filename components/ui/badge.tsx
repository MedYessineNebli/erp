import type { ReactNode } from "react";

const TONS: Record<string, string> = {
  neutre: "bg-slate-100 text-slate-700 ring-slate-200",
  information: "bg-blue-50 text-blue-700 ring-blue-200",
  succes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  attention: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function Badge({
  ton = "neutre",
  children,
}: {
  ton?: keyof typeof TONS | string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONS[ton] ?? TONS.neutre}`}
    >
      {children}
    </span>
  );
}

export function badgeStatutDevis(statut: string) {
  switch (statut) {
    case "brouillon":
      return { ton: "neutre", texte: "Brouillon" };
    case "envoye":
      return { ton: "information", texte: "Envoyé" };
    case "accepte":
      return { ton: "succes", texte: "Accepté" };
    case "refuse":
      return { ton: "danger", texte: "Refusé" };
    default:
      return { ton: "neutre", texte: statut };
  }
}

export function badgeStatutFacture(statut: string) {
  switch (statut) {
    case "brouillon":
      return { ton: "neutre", texte: "Brouillon" };
    case "emise":
      return { ton: "information", texte: "Émise" };
    case "payee":
      return { ton: "succes", texte: "Payée" };
    case "en_retard":
      return { ton: "danger", texte: "En retard" };
    case "annulee":
      return { ton: "neutre", texte: "Annulée" };
    default:
      return { ton: "neutre", texte: statut };
  }
}

export function badgeStatutAchat(statut: string) {
  switch (statut) {
    case "brouillon":
      return { ton: "neutre", texte: "Brouillon" };
    case "recue":
      return { ton: "information", texte: "Reçue" };
    case "payee":
      return { ton: "succes", texte: "Payée" };
    default:
      return { ton: "neutre", texte: statut };
  }
}

export function badgeStatutBulletin(statut: string) {
  switch (statut) {
    case "brouillon":
      return { ton: "neutre", texte: "Brouillon" };
    case "valide":
      return { ton: "information", texte: "Validé" };
    case "paye":
      return { ton: "succes", texte: "Payé" };
    default:
      return { ton: "neutre", texte: statut };
  }
}
