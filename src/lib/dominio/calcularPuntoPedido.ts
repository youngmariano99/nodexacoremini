/**
 * Calcula el Punto de Pedido (PdP) de un producto.
 * Fórmula: PdP = Stock Mínimo + (Consumo Diario Estimado * Días de Demora del Proveedor)
 */
export function calcularPuntoPedido(
  stockMinimo: number,
  consumoDiario: number,
  diasDemora: number
): number {
  if (stockMinimo < 0 || consumoDiario < 0 || diasDemora < 0) {
    throw new Error("Los valores del inventario no pueden ser negativos");
  }
  return Number((stockMinimo + (consumoDiario * diasDemora)).toFixed(2));
}

/**
 * Determina el estado de alerta del producto en base a su stock actual y punto de pedido.
 */
export function determinarEstadoStock(
  stockActual: number,
  stockMinimo: number,
  puntoPedido: number
): "normal" | "alerta" | "critico" {
  if (stockActual <= stockMinimo) {
    return "critico";
  }
  if (stockActual <= puntoPedido) {
    return "alerta";
  }
  return "normal";
}
