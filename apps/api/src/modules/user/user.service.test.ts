import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { eventBus } from "@fastconsig/core";

jest.mock("./user.repository");

const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe("UserService", () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    MockUserRepository.mockClear();
    eventBus.clear();
    service = new UserService(new MockUserRepository());
    repo = MockUserRepository.mock.instances[0] as jest.Mocked<UserRepository>;
  });

  const TENANT_ID = "tenant-123";

  const mockUser = {
    id: "user-1",
    name: "João Silva",
    email: "joao@example.com",
    role: "MEMBER" as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe("findAll", () => {
    it("deve retornar todos os usuários do tenant", async () => {
      repo.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll(TENANT_ID);

      expect(result).toEqual([mockUser]);
      expect(repo.findAll).toHaveBeenCalledWith(TENANT_ID);
    });
  });

  describe("findById", () => {
    it("deve retornar o usuário quando encontrado", async () => {
      repo.findById.mockResolvedValue(mockUser);

      const result = await service.findById("user-1", TENANT_ID);

      expect(result).toEqual(mockUser);
      expect(repo.findById).toHaveBeenCalledWith("user-1", TENANT_ID);
    });

    it("deve lançar 404 quando o usuário não existe", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById("ghost", TENANT_ID)).rejects.toMatchObject({
        message: "Usuário não encontrado",
        statusCode: 404,
      });
    });
  });

  describe("create", () => {
    const createData = {
      name: "Maria",
      email: "maria@example.com",
      password: "senha-forte-123",
    };

    it("deve criar o usuário com senha hasheada", async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...mockUser, email: createData.email });

      const result = await service.create(createData, TENANT_ID);

      expect(result.email).toBe(createData.email);
      expect(repo.create).toHaveBeenCalledTimes(1);

      // Senha não deve ser armazenada em texto plano
      const createdWith = repo.create.mock.calls[0][0];
      expect(createdWith.password).not.toBe(createData.password);
      expect(createdWith.tenant_id).toBe(TENANT_ID);
    });

    it("deve emitir evento user.created após criação", async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...mockUser, email: createData.email });

      const handler = jest.fn();
      eventBus.on("user.created", handler);

      await service.create(createData, TENANT_ID);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_ID, userId: mockUser.id })
      );
    });

    it("deve lançar 409 quando e-mail já existe no tenant", async () => {
      repo.findByEmail.mockResolvedValue({ ...mockUser, password: "hash" });

      await expect(service.create(createData, TENANT_ID)).rejects.toMatchObject({
        message: "E-mail já cadastrado neste tenant",
        statusCode: 409,
      });

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("deve atualizar um usuário existente", async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.update.mockResolvedValue({ ...mockUser, name: "Novo Nome" });

      const result = await service.update("user-1", TENANT_ID, { name: "Novo Nome" });

      expect(result.name).toBe("Novo Nome");
      expect(repo.update).toHaveBeenCalledWith("user-1", TENANT_ID, { name: "Novo Nome" });
    });

    it("deve lançar 404 ao tentar atualizar usuário inexistente", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update("ghost", TENANT_ID, { name: "x" })).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deve realizar soft-delete em usuário existente", async () => {
      repo.findById.mockResolvedValue(mockUser);
      repo.softDelete.mockResolvedValue({ ...mockUser, is_active: false } as never);

      await service.remove("user-1", TENANT_ID);

      expect(repo.softDelete).toHaveBeenCalledWith("user-1", TENANT_ID);
    });

    it("deve lançar 404 ao tentar remover usuário inexistente", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove("ghost", TENANT_ID)).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });
});
