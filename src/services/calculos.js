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

export function generarTablaDemo(campos) {
 /*
  console.log("CRIS campos.plazoAnios: " + campos.plazoAnios);
  console.log("CRIS campos.formaAmortizacion: " + campos.formaAmortizacion);
  console.log("CRIS campos.montoFinanciar: " + campos.montoFinanciar);
  console.log("CRIS campos.tasaInteres: " + campos.tasaInteres);
  console.log("CRIS campos.treMonedaNacional: " + campos.treMonedaNacional);
  console.log("CRIS campos.seguroAnual: " + campos.seguroAnual);
  console.log("CRIS campos.tasaVariable: " + campos.tasaVariable);*/

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
  return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

export function formatDate(value, includeTime = true) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}
