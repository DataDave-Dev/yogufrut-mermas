# catalogos Specification

## Purpose
Catálogos de productos (categoría, unidad y costo unitario) y de motivos de merma que alimentan el registro, administrados por el administrador general.
## Requirements
### Requirement: Catálogo de productos
El sistema SHALL mantener un catálogo de productos con categoría, nombre, unidad de medida (L, kg o pz) y costo unitario en MXN mayor o igual a 0. El administrador general SHALL poder crear, editar y desactivar productos. El nombre MUST ser único.

#### Scenario: Editar costo
- **WHEN** el administrador cambia el costo de "Leche entera" de 28.00 a 30.00
- **THEN** las mermas nuevas usan 30.00 y las ya registradas conservan 28.00

#### Scenario: Producto desactivado
- **WHEN** el administrador desactiva un producto
- **THEN** ya no aparece al registrar mermas, pero los registros existentes lo siguen mostrando

### Requirement: Catálogo de motivos
El sistema SHALL mantener un catálogo de motivos de merma que el administrador general puede crear, renombrar y desactivar.

#### Scenario: Motivo desactivado
- **WHEN** el administrador desactiva el motivo "Muestra / degustación"
- **THEN** ya no aparece al registrar mermas

### Requirement: Datos iniciales
El sistema SHALL cargar los productos de `docs/catalogo-productos.csv` y los motivos de `docs/catalogo-motivos.csv`, una sucursal de prueba "Sucursal Sendero" y un usuario de cada rol para desarrollo. La carga MUST poder repetirse sin crear duplicados.

#### Scenario: Ejecutar carga dos veces
- **WHEN** se ejecuta la carga inicial dos veces
- **THEN** cada producto, motivo, sucursal y usuario existe una sola vez

