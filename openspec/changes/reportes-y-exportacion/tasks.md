## 1. Fase 1 — Historial con filtros: filtrar → ver registros y totales → detalle

- [x] 1.1 Módulo `periodos.ts` (rango de fechas locales a ms UTC en America/Monterrey; día, semana lun–dom, mes; anterior/siguiente) con pruebas unitarias
- [x] 1.2 Permisos `puedeVerReportes` y `puedeExportar` en `permisos.ts` con pruebas; menú "Historial" para encargado, gerente y admin
- [x] 1.3 Validación de filtros desde la URL con Zod (desde, hasta, producto, motivo, usuario, estado, página; sucursal solo admin) y aviso de fechas invertidas
- [x] 1.4 Consulta del historial con filtros combinados, paginación y totales del resultado completo (registros y costo sin cancelados)
- [x] 1.5 Pantalla `/sucursal` como historial: formulario de filtros GET, totales, lista con enlace al detalle; usuario limitado a la sucursal
- [x] 1.6 E2E: encargado filtra por motivo y fechas, ve totales y abre un detalle; empleado recibe acceso denegado; gerente no ve otra sucursal por URL
- [x] 1.7 Verificación manual: como gerente filtrar por producto y por usuario, comprobar totales y que la URL filtrada se puede recargar

## 2. Fase 2 — Panel de reportes: elegir periodo → indicadores y rankings

- [ ] 2.1 `obtenerReporte(sucursalId, periodo)`: totales, productos (costo, registros, cantidad), motivos, empleados y desglose por día, sin cancelados
- [ ] 2.2 Pantalla `/reportes`: selector día/semana/mes, navegación anterior/siguiente, tarjetas de totales, rankings y desglose por día con barras CSS; estado sin registros
- [ ] 2.3 Enlaces de rankings al historial filtrado por producto/motivo/usuario y periodo
- [ ] 2.4 Resumen general `/reportes/general` (admin): sucursales del periodo ordenadas por costo, total general y acceso al panel de cada una
- [ ] 2.5 Menú "Reportes" según rol (admin al resumen general)
- [ ] 2.6 Pruebas unitarias de agregados con base de pruebas; E2E: gerente ve panel del mes con rankings correctos y cancelados excluidos; admin ve resumen general
- [ ] 2.7 Verificación manual: registrar mermas de varios productos, cancelar una, revisar que el panel del día, semana y mes cuadre con el historial

## 3. Fase 3 — Exportación: Excel y PDF del periodo

- [ ] 3.1 Agregar `exceljs`; `obtenerRegistrosDelPeriodo` con límite de 10 000 filas
- [ ] 3.2 Ruta `/reportes/excel` (gerente su sucursal, admin cualquiera) con hojas "Resumen" y "Registros" y nombre `mermas-<sucursal>-<periodo>.xlsx`
- [ ] 3.3 Vista `/reportes/imprimir` sin menú, CSS de impresión tamaño carta, encabezado con sucursal y periodo, resumen y tabla; abre el diálogo de impresión
- [ ] 3.4 Botones "Descargar Excel" e "Imprimir / PDF" en el panel para gerente y admin
- [ ] 3.5 E2E: gerente descarga Excel y se validan hojas y totales; encargado recibe 403 en la ruta de Excel; la vista imprimible muestra resumen y registros
- [ ] 3.6 Verificación manual: abrir el Excel descargado y guardar el PDF desde Chrome; comprobar que coinciden con el panel
