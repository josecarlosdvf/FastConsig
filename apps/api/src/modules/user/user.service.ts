import bcrypt from "bcrypt";
import { eventBus } from "@fastconsig/core";
import { UserRepository, CreateUserData } from "./user.repository";

const BCRYPT_ROUNDS = 12;

export class UserService {
  constructor(private repo: UserRepository) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const user = await this.repo.findById(id, tenantId);
    if (!user) {
      const err = new Error("Usuário não encontrado") as Error & {
        statusCode: number;
      };
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  async create(
    data: Omit<CreateUserData, "tenant_id">,
    tenantId: string
  ) {
    const existing = await this.repo.findByEmail(data.email, tenantId);
    if (existing) {
      const err = new Error("E-mail já cadastrado neste tenant") as Error & {
        statusCode: number;
      };
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await this.repo.create({
      ...data,
      password: hashedPassword,
      tenant_id: tenantId,
    });

    eventBus.emit("user.created", {
      tenantId,
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return user;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Pick<CreateUserData, "name" | "email" | "role">>
  ) {
    await this.findById(id, tenantId);
    const user = await this.repo.update(id, tenantId, data);

    eventBus.emit("user.updated", { tenantId, userId: id });

    return user;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const result = await this.repo.softDelete(id, tenantId);

    eventBus.emit("user.deleted", { tenantId, userId: id });

    return result;
  }
}
