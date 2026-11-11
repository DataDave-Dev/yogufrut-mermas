## ADDED Requirements

### Requirement: Registrar merma
Los usuarios con sucursal (empleado, encargado y gerente) SHALL poder registrar una merma indicando producto activo del catálogo, cantidad mayor a 0, motivo activo y observaciones opcionales (máximo 500 caracteres). La unidad de medida MUST tomarse del producto.

#### Scenario: Registro exitoso
- **WHEN** un empleado registra 3 L de "Base de yogurt de fresa" con motivo "Caducidad"
- **THEN** el sistema guarda el registro y muestra confirmación con el costo calculado

#### Scenario: Cantidad inválida
- **WHEN** el usuario captura cantidad 0, negativa o no numérica
- **THEN** el sistema no guarda y señala el campo

#### Scenario: Unidad automática
- **WHEN** el usuario selecciona un producto
- **THEN** el formulario muestra la unidad de ese producto sin permitir cambiarla

### Requirement: Datos automáticos del registro
Al guardar, el sistema SHALL registrar automáticamente fecha y hora del servidor (zona `America/Monterrey`), usuario, puesto, sucursal y el costo unitario vigente. El costo total MUST ser cantidad × costo unitario congelado.

#### Scenario: Datos no manipulables
- **WHEN** el cliente envía una sucursal, fecha o costo distinto en la petición
- **THEN** el sistema los ignora y usa los valores de la sesión y del servidor

### Requirement: Foto opcional
El usuario SHALL poder adjuntar una foto (JPEG, PNG o WebP, máximo 5 MB) como evidencia. Solo usuarios con acceso al registro MUST poder verla.

#### Scenario: Foto adjunta
- **WHEN** el usuario adjunta una foto válida y guarda
- **THEN** la foto queda asociada al registro y se ve en su detalle

#### Scenario: Archivo inválido
- **WHEN** el usuario adjunta un PDF o una imagen de más de 5 MB
- **THEN** el sistema rechaza el archivo con un mensaje claro

### Requirement: Aviso de posible duplicado
Si el mismo usuario registró el mismo producto con la misma cantidad en los últimos 5 minutos, el sistema SHALL pedir confirmación antes de guardar.

#### Scenario: Duplicado confirmado
- **WHEN** aparece el aviso y el usuario confirma
- **THEN** el sistema guarda el registro

#### Scenario: Duplicado descartado
- **WHEN** aparece el aviso y el usuario cancela
- **THEN** no se guarda nada

#### Scenario: Doble clic
- **WHEN** el usuario presiona "Guardar" dos veces seguidas
- **THEN** solo se crea un registro

### Requirement: Mis registros
Cada usuario SHALL poder consultar las mermas que él registró, de la más reciente a la más antigua, mostrando fecha, hora, producto, cantidad, unidad, motivo, costo y estado.

#### Scenario: Solo propios
- **WHEN** un empleado abre "Mis registros"
- **THEN** ve solo los registros que él capturó

### Requirement: Cancelación con motivo
Los registros no SHALL editarse ni borrarse. El gerente (para su sucursal) y el administrador general SHALL poder cancelar un registro indicando un motivo obligatorio; el sistema MUST guardar quién canceló y cuándo.

#### Scenario: Cancelar registro
- **WHEN** un gerente cancela un registro de su sucursal con motivo "Capturado dos veces"
- **THEN** el registro queda como "Cancelado" con quién, cuándo y motivo, y su autor lo ve así en "Mis registros"

#### Scenario: Cancelación sin motivo
- **WHEN** se intenta cancelar sin motivo
- **THEN** el sistema lo rechaza

#### Scenario: Ya cancelado
- **WHEN** se intenta cancelar un registro ya cancelado
- **THEN** el sistema lo rechaza

### Requirement: Registros de la sucursal para cancelación
El gerente SHALL poder ver los registros recientes de su sucursal (más reciente primero, paginados de 50 en 50) para elegir cuál cancelar. El administrador general SHALL elegir primero la sucursal. Esta vista no incluye filtros ni reportes (cambio posterior).

#### Scenario: Gerente ve registros de su sucursal
- **WHEN** un gerente abre "Registros de la sucursal"
- **THEN** ve los registros de todos los usuarios de su sucursal con el nombre de quién registró cada uno
