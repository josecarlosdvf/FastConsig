import { SessionRepository } from "./session.repository";

export class SessionService {
  constructor(private repo: SessionRepository) {}

  async listSessions(userId: string, tenantId: string) {
    return this.repo.findAllActive(userId, tenantId);
  }

  async revokeSession(sessionId: string, userId: string, tenantId: string) {
    const session = await this.repo.findActiveById(sessionId, tenantId);

    if (!session) {
      const err = new Error("Sessão não encontrada") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }

    // Ensure the session belongs to the requesting user (within the tenant)
    if (session.user_id !== userId) {
      const err = new Error("Sessão não pertence ao usuário") as Error & {
        statusCode: number;
      };
      err.statusCode = 403;
      throw err;
    }

    await this.repo.revokeById(sessionId, tenantId);
  }

  async revokeAllSessions(userId: string, tenantId: string) {
    await this.repo.revokeAllForUser(userId, tenantId);
  }
}
