"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  ouvert,
  onFermer,
  titre,
  large = false,
  children,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  large?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const onEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", onEchap);
    return () => document.removeEventListener("keydown", onEchap);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-16"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={`carte w-full ${large ? "max-w-3xl" : "max-w-lg"} shadow-xl`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
