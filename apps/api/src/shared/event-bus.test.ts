import { EventBus } from "@fastconsig/core";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  afterEach(() => {
    bus.clear();
  });

  describe("on / off", () => {
    it("deve registrar e chamar handler no emit", async () => {
      const handler = jest.fn();
      bus.on("user.created", handler);

      bus.emit("user.created", {
        tenantId: "t1",
        userId: "u1",
        email: "a@b.com",
        role: "MEMBER",
      });
      await bus.flush();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("deve remover handler via unsubscribe retornado", async () => {
      const handler = jest.fn();
      const unsub = bus.on("user.created", handler);
      unsub();

      bus.emit("user.created", {
        tenantId: "t1",
        userId: "u1",
        email: "a@b.com",
        role: "MEMBER",
      });
      await bus.flush();

      expect(handler).not.toHaveBeenCalled();
    });

    it("deve remover handler via off()", async () => {
      const handler = jest.fn();
      bus.on("user.updated", handler);
      bus.off("user.updated", handler);

      bus.emit("user.updated", { tenantId: "t1", userId: "u1" });
      await bus.flush();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("emit (fire-and-forget)", () => {
    it("não deve bloquear o caller — handler roda depois do tick atual", async () => {
      const order: string[] = [];

      bus.on("user.deleted", async () => {
        order.push("handler");
      });

      bus.emit("user.deleted", { tenantId: "t1", userId: "u1" });
      order.push("after-emit");

      await bus.flush();

      expect(order).toEqual(["after-emit", "handler"]);
    });

    it("deve chamar múltiplos handlers do mesmo evento", async () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      bus.on("auth.login", h1);
      bus.on("auth.login", h2);

      bus.emit("auth.login", { tenantId: "t1", userId: "u1" });
      await bus.flush();

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("não deve propagar erro de handler para o caller", async () => {
      bus.on("auth.logout", () => {
        throw new Error("handler crash");
      });

      expect(() =>
        bus.emit("auth.logout", { tenantId: "t1", userId: "u1" })
      ).not.toThrow();

      // flush should complete without throwing
      await expect(bus.flush()).resolves.toBeUndefined();
    });

    it("não deve lançar erro quando não há handlers registrados", () => {
      expect(() =>
        bus.emit("user.updated", { tenantId: "t1", userId: "u1" })
      ).not.toThrow();
    });
  });

  describe("flush()", () => {
    it("deve aguardar handler assíncrono", async () => {
      let resolved = false;
      bus.on("user.created", async () => {
        await new Promise<void>((r) => setTimeout(r, 10));
        resolved = true;
      });

      bus.emit("user.created", {
        tenantId: "t1",
        userId: "u1",
        email: "x@y.com",
        role: "ADMIN",
      });

      expect(resolved).toBe(false);
      await bus.flush();
      expect(resolved).toBe(true);
    });
  });

  describe("clear()", () => {
    it("deve remover todos os handlers", async () => {
      const handler = jest.fn();
      bus.on("auth.token_refreshed", handler);
      bus.clear();

      bus.emit("auth.token_refreshed", { tenantId: "t1", userId: "u1" });
      await bus.flush();

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
