import { describe, it, expect } from "vitest";
import { calcularPuntoPedido, determinarEstadoStock } from "./calcularPuntoPedido";

describe("Lógica Core: Punto de Pedido (PdP) y Alertas", () => {
  describe("calcularPuntoPedido", () => {
    it("debería calcular correctamente el PdP usando la fórmula", () => {
      // Stock Mínimo = 10, Consumo Diario = 5, Días Demora = 3
      // PdP = 10 + (5 * 3) = 25
      const resultado = calcularPuntoPedido(10, 5, 3);
      expect(resultado).toBe(25);
    });

    it("debería manejar casos donde los días de demora o consumo sean cero", () => {
      // Stock Mínimo = 15, Consumo Diario = 0, Días Demora = 10 -> PdP = 15
      expect(calcularPuntoPedido(15, 0, 10)).toBe(15);
      
      // Stock Mínimo = 15, Consumo Diario = 4, Días Demora = 0 -> PdP = 15
      expect(calcularPuntoPedido(15, 4, 0)).toBe(15);
    });

    it("debería arrojar error si recibe valores negativos", () => {
      expect(() => calcularPuntoPedido(-1, 5, 3)).toThrow();
      expect(() => calcularPuntoPedido(10, -5, 3)).toThrow();
      expect(() => calcularPuntoPedido(10, 5, -3)).toThrow();
    });
  });

  describe("determinarEstadoStock", () => {
    it("debería clasificar como 'critico' si el stock actual es menor o igual al stock mínimo", () => {
      // Stock Actual (8) <= Stock Mínimo (10)
      const estado = determinarEstadoStock(8, 10, 25);
      expect(estado).toBe("critico");

      const estadoLimite = determinarEstadoStock(10, 10, 25);
      expect(estadoLimite).toBe("critico");
    });

    it("debería clasificar como 'alerta' si el stock es menor o igual al PdP pero mayor que el Stock Mínimo", () => {
      // Stock Mínimo (10) < Stock Actual (18) <= PdP (25)
      const estado = determinarEstadoStock(18, 10, 25);
      expect(estado).toBe("alerta");

      const estadoLimitePdP = determinarEstadoStock(25, 10, 25);
      expect(estadoLimitePdP).toBe("alerta");
    });

    it("debería clasificar como 'normal' si el stock actual supera el PdP", () => {
      // Stock Actual (30) > PdP (25)
      const estado = determinarEstadoStock(30, 10, 25);
      expect(estado).toBe("normal");
    });
  });
});
