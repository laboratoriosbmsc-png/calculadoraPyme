# AGENTS.md — Calculadora Pyme

## Propósito del proyecto

Calculadora Pyme es una aplicación web frontend para ejecutivos del banco. Permite crear solicitudes por cliente o empresa y completar, en cualquier orden, cuatro evaluaciones independientes:

1. Plan de Pagos.
2. Flujo de Caja.
3. Tamaño Actividad.
4. Balance General.

La interfaz y todos los mensajes visibles deben mantenerse en español. La aplicación es responsive, accesible y está orientada a escritorio y dispositivos móviles.

## Stack y restricciones

- Node.js 20.x.
- React 18 con Vite 6.
- React Router.
- TailwindCSS mediante `@tailwindcss/vite`; la mayor parte de los estilos actuales vive en `src/index.css`.
- Lucide React para iconografía.
- JavaScript; no migrar a TypeScript salvo solicitud explícita.
- Aplicación únicamente frontend: no agregar backend, base de datos, Redux ni servicios externos sin autorización.
- No agregar dependencias de interfaz, pago o almacenamiento sin solicitud explícita.
- No editar `node_modules/` ni `dist/` manualmente.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm start
```

- Desarrollo local: `npm run dev -- --host 0.0.0.0 --port 4173`.
- Render Web Service:
  - Build Command: `npm install && npm run build`.
  - Start Command: `npm start`.
- `npm start` publica `dist/` mediante Vite Preview, escuchando en `0.0.0.0` y en el puerto `$PORT` de Render.
- El dominio de producción autorizado actualmente es `calculadorapyme.onrender.com`, definido en `preview.allowedHosts` de `vite.config.js`.

Antes de entregar cambios, ejecutar como mínimo `npm run build`.

## Estructura relevante

```text
src/
  components/        Componentes compartidos, layout, modal y estados
  hooks/             Contexto de solicitudes y aviso de cambios sin guardar
  pages/
    Login/
    Dashboard/
    Solicitudes/
    PlanPagos/
    FlujoCaja/
    TamanoActividad/
    BalanceGeneral/
  services/          Autenticación simulada, cálculos y formatos
  storage/           Lectura y escritura de localStorage
  types/             Catálogos y definición de campos
```

Archivos fuente principales:

- `src/App.jsx`: rutas y protección de acceso.
- `src/hooks/useSolicitudes.jsx`: creación, edición, eliminación, propiedad y persistencia.
- `src/storage/solicitudes.js`: contrato de almacenamiento local.
- `src/services/calculos.js`: cálculos compartidos y plan de pagos.
- `src/types/constants.js`: catálogos y campos de los formularios.
- `src/index.css`: sistema visual y comportamiento responsive.

## Autenticación actual

- El acceso es una simulación sin envío de correo ni backend.
- Solo se aceptan correos que terminen exactamente en `@bmsc.com.bo`, sin distinguir mayúsculas y minúsculas.
- El OTP válido es `111111`.
- La sesión se guarda en `sessionStorage` con la clave `calculadoraPymeSession`.
- Las rutas internas están protegidas; sin sesión se redirige a `/login`.
- Cerrar sesión elimina la sesión de la pestaña.

No implementar envío real de OTP ni autenticación remota salvo que se solicite expresamente.

## Persistencia y propiedad de datos

La información se guarda en `localStorage` bajo la clave `solicitudes`. Cada navegador mantiene sus propios datos; no existe sincronización entre usuarios o dispositivos.

Contrato vigente:

```js
[
  {
    id,
    propietarioEmail,
    nombreReferencia,
    fechaCreacion,
    fechaActualizacion,
    planPagos: null | { campos, tabla },
    flujoCaja: null | {
      campos,
      totalFlujoNeto,
      cargaFinanciera,
      resultadoCargaFinanciera,
      limiteGarantia
    },
    tamanoActividad: null | { campos, indice, resultadoFinal },
    balanceGeneral: null | {
      campos,
      totalActivos,
      totalPasivos,
      limiteFinanciamiento
    }
  }
]
```

Reglas:

- `id` se genera con `crypto.randomUUID()` y no se muestra.
- Las fechas se almacenan en ISO y se presentan en formato local `es-BO`.
- `fechaActualizacion` cambia al editar el nombre o guardar cualquier sección.
- `propietarioEmail` separa las solicitudes por ejecutivo autenticado.
- Al leer datos dañados se usa un arreglo vacío para no bloquear la aplicación.
- Las solicitudes antiguas sin alguna propiedad de sección se consideran incompletas.
- Los formularios no guardan borradores parciales.
- Si falla `localStorage`, se debe conservar y mostrar el error de persistencia.

## Solicitudes y navegación

- El nombre de referencia es obligatorio, admite letras, números y signos comunes, y tiene un máximo de 50 caracteres.
- Al crear una solicitud se elige inmediatamente una de las cuatro secciones; no existe un orden obligatorio.
- El listado permite buscar por nombre, navegar por páginas de 10 registros y abrir directamente cada sección.
- Al pulsar el nombre se abre un selector con las cuatro secciones.
- El menú de tres puntos contiene: ver informe, editar nombre y eliminar; en móvil también permite compartir el informe como PDF mediante las opciones nativas del dispositivo.
- Eliminar exige confirmación y elimina definitivamente toda la solicitud.
- La ruta histórica `/solicitudes/:id` redirige al listado.
- Una solicitud es completa solo cuando existen las cuatro secciones guardadas.
- Flujo de Caja puede mostrar `Rechazo`; las demás secciones usan `En blanco` o `Completada`.
- El informe de `/solicitudes/:id/informe` incluye los datos disponibles de las cuatro secciones y está preparado para impresión o guardado como PDF desde el navegador.

## Dashboard

El inicio muestra únicamente información del ejecutivo autenticado:

- Solicitudes creadas durante el mes actual.
- Solicitudes creadas durante el mes anterior.
- Solicitudes completas con sus cuatro secciones guardadas.
- Las cinco solicitudes más recientes.
- Progreso de cada solicitud como `n/4 secciones`.
- Acceso rápido a una nueva solicitud.

## Reglas de los formularios

Reglas comunes:

- Todos los campos visibles son obligatorios.
- Cero es un valor válido; no se aceptan negativos.
- Los campos definidos como enteros no aceptan decimales.
- Los catálogos se presentan como opciones visibles de selección única.
- Los resultados de solo lectura se actualizan cuando existen los datos requeridos.
- Los números mostrados usan punto decimal y coma de miles; los importes conservan dos decimales y el índice, cuatro.
- Guardar una sección actualiza el estado y `fechaActualizacion`.
- `useUnsavedWarning` debe seguir avisando al recargar o navegar con cambios sin guardar.
- Una solicitud inexistente debe mostrar una pantalla recuperable con regreso al listado.
- Los campos numéricos inválidos muestran un icono de error junto a la etiqueta, con el mensaje completo disponible para tecnologías de asistencia, sin alterar la alineación de las columnas.
- Al guardar cualquiera de las cuatro secciones, la confirmación aparece como una notificación fija en la parte superior durante aproximadamente 2,6 segundos, en móvil y escritorio.

### Plan de Pagos

Campos:

- Monto a financiar: entero.
- Plazo en años: entero.
- Tasa de interés fija anual: decimal.
- Forma de amortización: Mensual, Bimestral, Trimestral, Semestral o Anual.
- Tasa variable a partir de la cuota: decimal usado actualmente como número de cuota de cambio.
- TRE moneda nacional anual: decimal usado como tasa variable anual.
- Seguro anual: decimal.

Cálculo vigente en `generarTablaDemo`:

- Cuotas totales = años por frecuencia anual: 12, 6, 4, 2 o 1.
- La tasa fija y la TRE se convierten a tasa mensual dividiendo entre 100 y entre 12.
- El cambio a tasa variable comienza en `ceil(tasaVariable)`, con mínimo 1.
- Se usa una cuota base de amortización francesa; al cambiar la tasa se recalcula sobre el saldo y cuotas restantes.
- El seguro de cada cuota es saldo por tasa de seguro mensual.
- La tabla guarda número de cuota, saldo, amortización, intereses, seguros y cuota total.
- La tabla se pagina de 12 en 12.

No reemplazar este cálculo por la antigua tabla fija demostrativa ni por una suma simple salvo requerimiento explícito.

- En móvil, los campos numéricos de condiciones del financiamiento se muestran en dos columnas.

### Flujo de Caja

- Garantías: las tres opciones de `GARANTIAS`.
- Actividad 1: ingresos, costos y gastos operativos, enteros. El margen es de solo lectura y se calcula como ingresos menos costos menos gastos operativos.
- Segunda actividad: `No` aparece seleccionado inicialmente. Con `Sí` se muestran y exigen ingresos, costos y gastos operativos; su margen se calcula con la misma fórmula. Con `No` se limpian y se excluyen esos campos, y su margen vale cero.
- El margen operativo total de actividades es de solo lectura y suma los márgenes calculados de ambas actividades.
- Otros ingresos, gastos familiares y cuota propuesta: enteros.
- Cuota en sistema financiero: decimal.
- `margenTotalOperativo` = margen operativo total de actividades + otros ingresos - gastos familiares.
- En el resumen, el margen total operativo ocupa una fila completa; las cuotas se muestran después de este resultado.
- `totalFlujoNeto` = margen total operativo - cuota mensual propuesta - cuota en sistema financiero.
- `cargaFinanciera` = (cuota mensual propuesta + cuota en sistema financiero) / margen total operativo × 100.
- El límite de garantía se extrae de la opción seleccionada: 60%, 70% u 80%.
- `resultadoCargaFinanciera` es `APROBADO` cuando la carga es menor o igual al límite; es `RECHAZADO` cuando lo supera o cuando el margen total operativo no es positivo.
- La interfaz móvil de Flujo de Caja conserva dos columnas para los campos numéricos.
- Para compatibilidad, `getResultadoCargaFinanciera` también interpreta registros antiguos que guardaban `APROBADO` o `RECHAZADO` directamente en `cargaFinanciera`.

### Tamaño Actividad

- Sector CAEDEC: Producción, Comercio o Servicios.
- Ingresos anuales, patrimonio y personal ocupado: enteros.
- `indice` = `((((ingresosAnuales + patrimonio) / 2) / D_fin) × 0,6) + ((personalOcupado / D_pers) × 0,4)`.
- Para Producción y Comercio: `D_fin = 52.000.000` y `D_pers = 32`.
- Para Servicios: `D_fin = 31.000.000` y `D_pers = 22`.
- Mientras falte el sector o algún campo numérico, el índice y la clasificación muestran `—`.
- Cero es un valor válido; cuando el sector y los tres campos están completos con cero, el índice calculado es `0.0000` y corresponde a `Microempresa`.
- El índice se presenta con cuatro decimales.
- Resultado:
  - Índice menor o igual a 0,035: `Microempresa` en verde.
  - Mayor a 0,035 y menor o igual a 0,115: `Pequeña Empresa` en amarillo.
  - Mayor a 0,115 y menor o igual a 1,000: `Mediana Empresa` en naranja.
  - Mayor a 1,000: `Gran Empresa` en rojo.
- En móvil, los sectores, los campos numéricos y los dos resultados se mantienen en columnas para reducir el desplazamiento vertical.

### Balance General

Activos decimales:

- Efectivo, bancos, cuentas por cobrar, inventarios, vehículos, maquinarias y equipos, inmuebles y otros activos.

Pasivos decimales:

- Pasivos con proveedores, deudas de capital operativo y deudas de inversión.

Resumen:

- `totalActivos` suma los ocho activos.
- `totalPasivos` suma los tres pasivos.
- Ambos totales se muestran primero en `Resumen` como campos de solo lectura, antes de seleccionar la garantía.
- `totalPatrimonio` se muestra como tercer campo de solo lectura en la misma fila y se calcula como `totalActivos - totalPasivos`; se deriva de los totales y no añade una clave almacenada.
- El informe de la solicitud también muestra el patrimonio derivado de los totales guardados.
- Las dos opciones de garantía se muestran lado a lado también en móvil.
- Los campos numéricos de Activos y Pasivos se muestran en dos columnas también en móvil.
- Hipoteca Inmueble al 100% (2,5:1): límite = patrimonio × 2,5.
- Diferente a Hipoteca Inmueble (1:1): límite = patrimonio × 1.
- El límite se recalcula con esta regla al visualizar registros antiguos en el informe; al guardar Balance General se persiste el valor actualizado.

## Diseño y accesibilidad

Paleta principal:

- Verde corporativo: `#006341`.
- Borgoña: `#6F263D`.
- Dorado: `#B9975B`.
- Fondo: `#F8F9F7`.
- Superficies: `#FFFFFF`.
- Texto principal: `#1F2937`.
- Texto secundario: `#6B7280`.
- Bordes: `#E5E7EB`.

Mantener:

- Estética corporativa limpia, con inspiración Fluent Design y Stripe.
- Diseño mobile-first y controles táctiles suficientemente grandes.
- En móvil, el encabezado compartido muestra menú a la izquierda y `Volver` a la derecha en las cuatro páginas de secciones; el enlace de regreso dentro del contenido se oculta.
- El encabezado móvil se oculta al desplazarse hacia abajo y reaparece al desplazarse hacia arriba.
- Los encabezados de las cuatro secciones muestran el estado a la derecha del título y omiten el texto descriptivo superior para ahorrar espacio.
- En móvil no se muestra navegación inferior; el acceso a la navegación se concentra en el menú del encabezado.
- En Flujo de Caja, las tres garantías permanecen distribuidas en tres columnas también en móvil.
- El botón `Volver` del encabezado móvil confirma la salida cuando existen cambios sin guardar.
- En las cuatro secciones, los errores de los campos numéricos se señalan junto a la etiqueta con un icono accesible para mantener alineados los controles sin textos extensos.
- Bordes redondeados de 12–16 px y sombras suaves.
- Contraste WCAG AA y foco visible.
- Etiquetas asociadas, errores junto al campo y navegación por teclado.
- Estados comunicados con texto e icono, nunca únicamente mediante color.
- Tablas con desplazamiento horizontal controlado en móvil.

## Criterios de verificación

Para cambios funcionales, revisar según corresponda:

1. Login con dominio válido e inválido, OTP correcto e incorrecto y cierre de sesión.
2. Separación de solicitudes entre dos correos en el mismo navegador.
3. Creación, edición, eliminación y fechas de una solicitud.
4. Validaciones de obligatorios, cero, negativos, enteros y decimales.
5. Advertencia de cambios sin guardar.
6. Cálculos y límites de cada sección.
7. Estados, progreso `n/4`, métricas e informe imprimible.
8. Solicitudes antiguas con propiedades ausentes.
9. Vista de escritorio y móvil, teclado, foco y legibilidad.
10. `npm run build` sin errores.

## Convenciones para futuros cambios

- Reutilizar los componentes, catálogos, hooks y servicios existentes antes de duplicar lógica.
- Centralizar nuevos catálogos y listas de campos en `src/types/constants.js`.
- Centralizar cálculos compartidos y formatos en `src/services/calculos.js`.
- Toda mutación de solicitudes debe pasar por `useSolicitudes` para respetar propiedad, fecha y manejo de errores.
- Preservar compatibilidad con datos existentes en `localStorage`.
- No cambiar claves almacenadas, fórmulas, rutas ni estados silenciosamente.
- Evitar cambios no relacionados y documentar cualquier modificación del contrato de datos.
