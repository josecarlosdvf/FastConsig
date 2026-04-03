import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { eventBus } from "@fastconsig/core";

jest.mock("./auth.repository");
jest.mock("bcrypt");
jest.mock("crypto", () => ({
  ...jest.requireActual<typeof import("crypto")>("crypto"),
  randomBytes: jest.fn().mockReturnValue(Buffer.from("a".repeat(64))),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("hashed-token"),
  }),
}));

import bcrypt from "bcrypt";

const MockAuthRepository = AuthRepository as jest.MockedClass<typeof AuthRepository>;

describe("AuthService", () => {
  let service: AuthService;
  let repo: jest.Mocked<AuthRepository>;

  const TENANT_ID = "tenant-abc";

  const mockUser = {
    id: "user-1",
    tenant_id: TENANT_ID,
    name: "Admin",
    email: "admin@example.com",
    password: "$2b$12$hashedpassword",
    role: "ADMIN" as const,
    is_active: true,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    MockAuthRepository.mockClear();
    eventBus.clear();
    service = new AuthService(new MockAuthRepository());
    repo = MockAuthRepository.mock.instances[0] as jest.Mocked<AuthRepository>;

    process.env.JWT_SECRET = "test-secret-key-for-unit-tests";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe("login", () => {
    it("deve retornar tokens e dados do usuário em login válido", async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repo.storeRefreshToken.mockResolvedValue({} as never);

      const result = await service.login("admin@example.com", "senha-correta", TENANT_ID);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("admin@example.com");
      expect(result.user).not.toHaveProperty("password");
      expect(repo.storeRefreshToken).toHaveBeenCalledTimes(1);
    });

    it("deve passar device_info e ip para storeRefreshToken", async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repo.storeRefreshToken.mockResolvedValue({} as never);

      await service.login("admin@example.com", "senha-correta", TENANT_ID, {
        ip: "192.168.1.1",
        deviceInfo: "Mozilla/5.0",
      });

      expect(repo.storeRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: "192.168.1.1", deviceInfo: "Mozilla/5.0" })
      );
    });

    it("deve emitir evento auth.login em login válido", async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repo.storeRefreshToken.mockResolvedValue({} as never);

      const handler = jest.fn();
      eventBus.on("auth.login", handler);

      await service.login("admin@example.com", "senha-correta", TENANT_ID);
      await eventBus.flush();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, userId: mockUser.id })
      );
    });

    it("deve lançar 401 quando o usuário não existe", async () => {
      repo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login("naoexiste@example.com", "qualquer", TENANT_ID)
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("deve lançar 401 quando a senha está incorreta", async () => {
      repo.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login("admin@example.com", "senha-errada", TENANT_ID)
      ).rejects.toMatchObject({ statusCode: 401, message: "Credenciais inválidas" });
    });

    it("deve lançar erro quando JWT_SECRET não está configurado", async () => {
      delete process.env.JWT_SECRET;
      repo.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login("admin@example.com", "correta", TENANT_ID)
      ).rejects.toThrow("JWT secrets não configurados");
    });
  });

  describe("refresh", () => {
    it("deve emitir novo par de tokens e revogar o antigo", async () => {
      const storedToken = {
        id: "rt-1",
        user_id: mockUser.id,
        tenant_id: TENANT_ID,
        token_hash: "hashed-token",
        expires_at: new Date(Date.now() + 3600_000),
        revoked_at: null,
        device_info: null,
        ip_address: null,
        last_used_at: null,
        created_at: new Date(),
      };

      repo.findRefreshToken.mockResolvedValue(storedToken);
      repo.findUserById.mockResolvedValue(mockUser);
      repo.revokeRefreshToken.mockResolvedValue({} as never);
      repo.storeRefreshToken.mockResolvedValue({} as never);

      const result = await service.refresh("valid-raw-token", TENANT_ID);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(repo.revokeRefreshToken).toHaveBeenCalledTimes(1);
      expect(repo.storeRefreshToken).toHaveBeenCalledTimes(1);
    });

    it("deve emitir evento auth.token_refreshed", async () => {
      const storedToken = {
        id: "rt-1",
        user_id: mockUser.id,
        tenant_id: TENANT_ID,
        token_hash: "hashed-token",
        expires_at: new Date(Date.now() + 3600_000),
        revoked_at: null,
        device_info: null,
        ip_address: null,
        last_used_at: null,
        created_at: new Date(),
      };

      repo.findRefreshToken.mockResolvedValue(storedToken);
      repo.findUserById.mockResolvedValue(mockUser);
      repo.revokeRefreshToken.mockResolvedValue({} as never);
      repo.storeRefreshToken.mockResolvedValue({} as never);

      const handler = jest.fn();
      eventBus.on("auth.token_refreshed", handler);

      await service.refresh("valid-raw-token", TENANT_ID);
      await eventBus.flush();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, userId: mockUser.id })
      );
    });

    it("deve lançar 401 para token inválido ou não encontrado", async () => {
      repo.findRefreshToken.mockResolvedValue(null);

      await expect(
        service.refresh("invalid-token", TENANT_ID)
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("logout", () => {
    it("deve revogar o refresh token", async () => {
      repo.revokeRefreshToken.mockResolvedValue({} as never);
      repo.findRefreshToken.mockResolvedValue(null);

      await service.logout("some-token", TENANT_ID);

      expect(repo.revokeRefreshToken).toHaveBeenCalledTimes(1);
    });

    it("deve emitir evento auth.logout quando token é encontrado", async () => {
      const storedToken = {
        id: "rt-1",
        user_id: mockUser.id,
        tenant_id: TENANT_ID,
        token_hash: "hashed-token",
        expires_at: new Date(Date.now() + 3600_000),
        revoked_at: null,
        device_info: null,
        ip_address: null,
        last_used_at: null,
        created_at: new Date(),
      };

      repo.findRefreshToken.mockResolvedValue(storedToken);
      repo.revokeRefreshToken.mockResolvedValue({} as never);

      const handler = jest.fn();
      eventBus.on("auth.logout", handler);

      await service.logout("some-token", TENANT_ID);
      await eventBus.flush();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, userId: mockUser.id })
      );
    });
  });
});
