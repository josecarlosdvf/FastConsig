import { SessionService } from "./session.service";
import { SessionRepository } from "./session.repository";

jest.mock("./session.repository");

const MockSessionRepository = SessionRepository as jest.MockedClass<typeof SessionRepository>;

describe("SessionService", () => {
  let service: SessionService;
  let repo: jest.Mocked<SessionRepository>;

  const TENANT_ID = "tenant-xyz";
  const USER_ID = "user-1";
  const SESSION_ID = "session-1";

  const mockSession = {
    id: SESSION_ID,
    tenant_id: TENANT_ID,
    user_id: USER_ID,
    token_hash: "hash",
    expires_at: new Date(Date.now() + 3_600_000),
    revoked_at: null,
    device_info: "Mozilla/5.0",
    ip_address: "127.0.0.1",
    last_used_at: null,
    created_at: new Date(),
  };

  beforeEach(() => {
    MockSessionRepository.mockClear();
    service = new SessionService(new MockSessionRepository());
    repo = MockSessionRepository.mock.instances[0] as jest.Mocked<SessionRepository>;
  });

  describe("listSessions", () => {
    it("deve retornar sessões ativas do usuário", async () => {
      const activeSessions = [
        {
          id: SESSION_ID,
          device_info: "Mozilla",
          ip_address: "127.0.0.1",
          last_used_at: null,
          created_at: new Date(),
          expires_at: new Date(Date.now() + 3_600_000),
        },
      ];
      repo.findAllActive.mockResolvedValue(activeSessions);

      const result = await service.listSessions(USER_ID, TENANT_ID);

      expect(result).toEqual(activeSessions);
      expect(repo.findAllActive).toHaveBeenCalledWith(USER_ID, TENANT_ID);
    });
  });

  describe("revokeSession", () => {
    it("deve revogar a sessão quando pertence ao usuário", async () => {
      repo.findActiveById.mockResolvedValue(mockSession);
      repo.revokeById.mockResolvedValue({ count: 1 });

      await service.revokeSession(SESSION_ID, USER_ID, TENANT_ID);

      expect(repo.revokeById).toHaveBeenCalledWith(SESSION_ID, TENANT_ID);
    });

    it("deve lançar 404 quando a sessão não existe", async () => {
      repo.findActiveById.mockResolvedValue(null);

      await expect(
        service.revokeSession("ghost-session", USER_ID, TENANT_ID)
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(repo.revokeById).not.toHaveBeenCalled();
    });

    it("deve lançar 403 quando a sessão pertence a outro usuário", async () => {
      repo.findActiveById.mockResolvedValue({
        ...mockSession,
        user_id: "outro-usuario",
      });

      await expect(
        service.revokeSession(SESSION_ID, USER_ID, TENANT_ID)
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(repo.revokeById).not.toHaveBeenCalled();
    });
  });

  describe("revokeAllSessions", () => {
    it("deve revogar todas as sessões do usuário", async () => {
      repo.revokeAllForUser.mockResolvedValue({ count: 3 });

      await service.revokeAllSessions(USER_ID, TENANT_ID);

      expect(repo.revokeAllForUser).toHaveBeenCalledWith(USER_ID, TENANT_ID);
    });
  });
});
