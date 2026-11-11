export const ROLES = ["empleado", "encargado", "gerente", "admin"] as const;
export type Rol = (typeof ROLES)[number];
