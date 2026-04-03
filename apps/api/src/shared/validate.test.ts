import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "./middleware/validate.middleware";

const mockNext = jest.fn();

function makeReq(body: unknown): Partial<Request> {
  return { body } as Partial<Request>;
}

function makeRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const testSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

describe("validate middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve chamar next() e substituir req.body com dados validados", () => {
    const middleware = validate(testSchema);
    const req = makeReq({ name: "Maria", email: "maria@example.com", extra: "ignored" });
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    // extra fields are stripped by Zod (default behavior)
    expect((req as Request).body).toEqual({ name: "Maria", email: "maria@example.com" });
  });

  it("deve chamar next(ZodError) quando a validação falha", () => {
    const middleware = validate(testSchema);
    const req = makeReq({ name: "X", email: "não-é-email" });
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    const calledWith = (mockNext as jest.Mock).mock.calls[0][0];
    expect(calledWith).toBeDefined();
    expect(calledWith.name).toBe("ZodError");
  });

  it("deve chamar next(ZodError) quando o body está vazio", () => {
    const middleware = validate(testSchema);
    const req = makeReq({});
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    const calledWith = (mockNext as jest.Mock).mock.calls[0][0];
    expect(calledWith).toBeDefined();
    expect(calledWith.name).toBe("ZodError");
  });

  it("não deve chamar res.status diretamente (passa o erro ao error handler)", () => {
    const middleware = validate(testSchema);
    const req = makeReq({ name: "X" });
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("deve aceitar body válido com campos opcionais ausentes", () => {
    const schemaWithOptional = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(["ADMIN", "MEMBER"]).optional(),
    });
    const middleware = validate(schemaWithOptional);
    const req = makeReq({ name: "João", email: "joao@example.com" });
    const res = makeRes();

    middleware(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((req as Request).body).toEqual({ name: "João", email: "joao@example.com" });
  });
});
