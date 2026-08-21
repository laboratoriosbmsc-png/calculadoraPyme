export const AMORTIZACIONES = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']

export const GARANTIAS = [
  'Diferente a hipoteca inmueble (<=60%)',
  'Hipoteca mixta (<=70%)',
  'Hipoteca 100% o EEFF (<=80%)',
]

export const PLAN_FIELDS = [
  ['montoFinanciar', 'Monto a financiar'],
  ['plazoAnios', 'Plazo (años)'],
  ['tasaInteres', 'Tasa de interés fija anual (%)'],
  ['tasaVariable', 'Tasa variable a partir de la cuota'],
  ['treMonedaNacional', 'TRE moneda nacional anual (%)'],
  ['seguroAnual', 'Seguro anual (%)'],
]

export const FLUJO_FIELDS = [
  ['ingresosActividad1', 'Ingresos mensuales de actividad 1'],
  ['costosActividad1', 'Costos mensuales de actividad 1'],
  ['margenActividad1', 'Margen operativo actividad 1'],
  ['ingresosActividad2', 'Ingresos mensuales de actividad 2'],
  ['costosActividad2', 'Costos mensuales de actividad 2'],
  ['margenActividad2', 'Margen operativo actividad 2'],
  ['otrosIngresos', 'Otros ingresos'],
  ['gastosFamiliares', 'Gastos familiares mensuales (Bs)'],
  ['margenOperativoTotal', 'Margen operativo total'],
  ['cuotaPropuesta', 'Cuota mensual propuesta (Bs)'],
  ['cuotaSistemaFinanciero', 'Cuota en sistema financiero'],
]

export const SECTORES_CAEDEC = ['Producción', 'Comercio', 'Servicios']

export const TAMANO_FIELDS = [
  ['ingresosAnuales', 'Ingresos anuales'],
  ['patrimonio', 'Patrimonio'],
  ['personalOcupado', 'Personal ocupado'],
]

export const BALANCE_ACTIVOS_FIELDS = [
  ['efectivo', 'Efectivo'],
  ['bancos', 'Bancos'],
  ['cuentasPorCobrar', 'Cuentas por cobrar'],
  ['inventarios', 'Inventarios'],
  ['vehiculos', 'Vehículos'],
  ['maquinariasEquipos', 'Maquinarias y equipos'],
  ['inmuebles', 'Inmuebles'],
  ['otrosActivos', 'Otros activos'],
]

export const BALANCE_PASIVOS_FIELDS = [
  ['pasivosProveedores', 'Pasivos con proveedores'],
  ['deudasCapitalOperativo', 'Deudas de capital operativo'],
  ['deudasInversion', 'Deudas de inversión'],
]

export const GARANTIAS_BALANCE = [
  'Hipoteca Inmueble al 100% (2,5:1)',
  'Diferente a Hipoteca Inmueble (1:1)',
]
