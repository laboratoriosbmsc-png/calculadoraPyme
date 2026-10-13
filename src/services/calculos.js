import { GARANTIAS_BALANCE } from '../types/constants.js'

const pagosPorAnio = {
  Mensual: 12,
  Bimestral: 6,
  Trimestral: 4,
  Semestral: 2,
  Anual: 1,
}

export function sumarCampos(campos, nombres) {
  return nombres.reduce((total, nombre) => total + (Number(campos[nombre]) || 0), 0)
}

export function calcularLimiteFinanciamientoBalance(totalActivos, totalPasivos, tipoGarantia) {
  if (!tipoGarantia) return null
  const totalPatrimonio = totalActivos - totalPasivos
  return totalPatrimonio * (tipoGarantia === GARANTIAS_BALANCE[0] ? 2.5 : 1)
}

export function calcularIndiceTamano(campos) {
  if (!campos?.sector) return 0
  const servicios = campos.sector === 'Servicios'
  const divisorFinanciero = servicios ? 31_000_000 : 52_000_000
  const divisorPersonal = servicios ? 22 : 32
  const ingreso = Number(campos.ingresosAnuales) || 0
  const patrimonio = Number(campos.patrimonio) || 0
  const personal = Number(campos.personalOcupado) || 0
  return ((((ingreso + patrimonio) / 2) / divisorFinanciero) * 0.6)
    + ((personal / divisorPersonal) * 0.4)
}

export function clasificarTamano(indice) {
  if (indice <= 0.035) return 'Microempresa'
  if (indice <= 0.115) return 'Pequeña Empresa'
  if (indice <= 1) return 'Mediana Empresa'
  return 'Gran Empresa'
}

export function formatIndex(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(Number(value) || 0)
}

export function generarTablaDemo(campos) {

  const anios = Math.max(1, Math.trunc(Number(campos.plazoAnios) || 1));
  const frecuencia = pagosPorAnio[campos.formaAmortizacion];
  const totalCuotas = anios * frecuencia;
 

  const planPagos = [];
  let saldo = Number(campos.montoFinanciar); 
  const tasaInteresFijaMensual = Number(campos.tasaInteres) / 100 / 12;
  const tasaInteresVariableMensual = Number(campos.treMonedaNacional) / 100 / 12;
  const tasaSeguroMensual = Number(campos.seguroAnual) / 100 / 12;
  const mesCambio = Math.max(1, Math.ceil(Number(campos.tasaVariable)));

  const calcularCuotaBase = (capital, tasa, cuotas) => {
    if (tasa === 0) return capital / cuotas;
    return (capital * tasa) / (1 - (1 + tasa) ** -cuotas);
  };

  const tasaInicial = mesCambio === 1
    ? tasaInteresVariableMensual
    : tasaInteresFijaMensual;
  let cuotaBase = calcularCuotaBase(saldo, tasaInicial, totalCuotas);

  for (let numeroCuota = 1; numeroCuota <= totalCuotas; numeroCuota += 1) {
    const tasaActual = numeroCuota >= mesCambio
      ? tasaInteresVariableMensual
      : tasaInteresFijaMensual;

    if (numeroCuota === mesCambio && numeroCuota > 1) {
      cuotaBase = calcularCuotaBase(
        saldo,
        tasaActual,
        totalCuotas - numeroCuota + 1,
      );
    }

    const intereses = saldo * tasaActual;
    const amortizacion = Math.min(cuotaBase - intereses, saldo);
    const seguros = saldo * tasaSeguroMensual;

    planPagos.push({
      numeroCuota,
      saldoCapital: saldo,
      amortizacionCapital:amortizacion,
      intereses,
      seguros,
      cuotaTotal: amortizacion + intereses + seguros,
    });

    saldo = Math.max(saldo - amortizacion, 0);
  }
 
  return planPagos; 
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

export function formatDate(value, includeTime = true) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function getResultadoCargaFinanciera(flujoCaja) {
  if (!flujoCaja) return null
  if (['APROBADO', 'RECHAZADO'].includes(flujoCaja.resultadoCargaFinanciera)) return flujoCaja.resultadoCargaFinanciera
  return ['APROBADO', 'RECHAZADO'].includes(flujoCaja.cargaFinanciera) ? flujoCaja.cargaFinanciera : null
}
