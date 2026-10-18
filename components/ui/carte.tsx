import type { ReactNode } from "react";

export function EnTetePage({
  titre,
  description,
  actions,
}: {
  titre: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {titre}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Carte({
  titre,
  actions,
  children,
  className = "",
}: {
  titre?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`carte ${className}`}>
      {titre || actions ? (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          {titre ? (
            <h2 className="text-base font-semibold text-slate-900">{titre}</h2>
          ) : (
            <span />
          )}
          {actions}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EtatVide({
  titre,
  message,
  action,
}: {
  titre: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-700">{titre}</p>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function Alerte({
  ton = "danger",
  children,
}: {
  ton?: "danger" | "succes" | "attention" | "information";
  children: ReactNode;
}) {
  const tons = {
    danger: "border-red-200 bg-red-50 text-red-800",
    succes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    attention: "border-amber-200 bg-amber-50 text-amber-800",
    information: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${tons[ton]}`}
      role="alert"
    >
      {children}
    </div>
  );
}
