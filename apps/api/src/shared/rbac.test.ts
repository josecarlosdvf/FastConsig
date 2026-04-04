import { Request, Response } from "express";
import { requireRole, requirePermission } from "./middleware/rbac.middleware";

const mockNext = jest.fn();

function makeReq(userRole: string): Partial<Request> {
  return { userRole } as unknown as Partial<Request>;
}

function makeRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("requireRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve chamar next() quando o role está autorizado", () => {
    const middleware = requireRole("ADMIN");
    const req = makeReq("ADMIN");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve retornar 403 quando o role não está autorizado", () => {
    const middleware = requireRole("ADMIN");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Permissão insuficiente" }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve aceitar múltiplos roles", () => {
    const middleware = requireRole("ADMIN", "MEMBER");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});

describe("requirePermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve chamar next() quando ADMIN tem a permissão", () => {
    const middleware = requirePermission("user:write");
    const req = makeReq("ADMIN");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("deve retornar 403 quando MEMBER não tem a permissão user:write", () => {
    const middleware = requirePermission("user:write");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ required: "user:write" })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve chamar next() quando MEMBER tem a permissão user:read", () => {
    const middleware = requirePermission("user:read");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("deve chamar next() quando MEMBER tem audit:read", () => {
    const middleware = requirePermission("audit:read");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("deve retornar 403 quando MEMBER tenta event:write", () => {
    const middleware = requirePermission("event:write");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("deve retornar 403 quando MEMBER tenta acessar tenant:admin", () => {
    const middleware = requirePermission("tenant:admin");
    const req = makeReq("MEMBER");
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("ADMIN deve ter todas as permissões do catálogo", () => {
    const allPermissions: Array<Parameters<typeof requirePermission>[0]> = [
      "user:read", "user:write", "user:delete",
      "tenant:read", "tenant:write", "tenant:admin",
      "audit:read", "event:read", "event:write",
      "session:read", "session:delete",
    ];

    for (const perm of allPermissions) {
      jest.clearAllMocks();
      const middleware = requirePermission(perm);
      const req = makeReq("ADMIN");
      const res = makeRes();

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    }
  });
});
