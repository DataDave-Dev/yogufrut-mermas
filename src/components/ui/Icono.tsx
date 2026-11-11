// Íconos de trazo propios (24×24, trazo 1.75) para no depender de una librería.
const TRAZOS = {
  inicio: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  registrar: "M12 8v8M8 12h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  lista: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  historial: "M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2",
  reportes: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  usuarios: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.75",
  sucursal: "M4 9h16l-1-5H5L4 9Zm0 0v11h16V9M4 9a3 3 0 0 0 5.33 1.9A3 3 0 0 0 12 12a3 3 0 0 0 2.67-1.1A3 3 0 0 0 20 9M10 20v-5h4v5",
  producto: "M21 8 12 3 3 8m18 0v8l-9 5m9-13-9 5m0 8-9-5V8m9 13v-8M3 8l9 5M7.5 5.5l9 5",
  motivo: "M3 12V4h8l9 9-8 8-9-9ZM7.5 7.5h.01",
  salir: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  derecha: "M9 6l6 6-6 6",
  izquierda: "M15 6l-6 6 6 6",
  camara: "M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  descarga: "M12 4v11M7 10l5 5 5-5M5 20h14",
  imprimir: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7v-7Z",
  filtro: "M3 5h18l-7 8.5V19l-4 2v-7.5L3 5Z",
  alerta: "M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  check: "M5 12.5 10 17 19 7",
  cerrar: "M6 6l12 12M18 6 6 18",
  vacio: "M4 13h4l1.5 3h5l1.5-3h4M5.5 6.5 4 13v6h16v-6l-1.5-6.5a1 1 0 0 0-1-.75h-11a1 1 0 0 0-1 .75Z",
  menu: "M4 7h16M4 12h16M4 17h10",
  contraer: "M11 6l-6 6 6 6M19 6l-6 6 6 6",
  expandir: "M13 6l6 6-6 6M5 6l6 6-6 6",
  tendenciaArriba: "M3 17l6-6 4 4 8-8M15 7h6v6",
  tendenciaAbajo: "M3 7l6 6 4-4 8 8M15 17h6v-6",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

type Props = { nombre: NombreIcono; className?: string; titulo?: string };

export function Icono({ nombre, className = "size-5", titulo }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={titulo ? undefined : true}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
