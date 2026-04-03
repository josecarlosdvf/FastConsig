import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async login(email: string, password: string, tenantId: string) {
    const user = await this.repo.findUserByEmail(email, tenantId);

    if (!user) {
      const err = new Error("Credenciais inválidas") as Error & {
        statusCode: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const err = new Error("Credenciais inválidas") as Error & {
        statusCode: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret || !refreshSecret) {
      throw new Error("JWT secrets não configurados");
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, tenantId: user.tenant_id },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "1h" }
    );

    const refreshToken = jwt.sign(
      { sub: user.id, tenantId: user.tenant_id },
      refreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
