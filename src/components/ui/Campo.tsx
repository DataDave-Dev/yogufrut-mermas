import type { ReactNode } from "react";

type Props = { id: string; etiqueta: string; error?: string; ayuda?: string; children: ReactNode; className?: string };

/** Etiqueta + control + ayuda/error. El control debe llevar el mismo `id`. */
export function Campo({ id, etiqueta, error, ayuda, children, className = "" }: Props) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-arena-700">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rojo-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-arena-500">{ayuda}</p>
      )}
    </div>
  );
}
