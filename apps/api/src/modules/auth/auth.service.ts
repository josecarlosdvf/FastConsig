import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 3600;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (multipliers[unit] ?? 3600);
}

export class AuthService {
  constructor(private repo: AuthRepository) {}

  private getSecrets() {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret || !refreshSecret) {
      throw new Error("JWT secrets não configurados");
    }
    return { secret, refreshSecret };
  }

  private issueTokenPair(userId: string, role: string, tenantId: string) {
    const { secret, refreshSecret } = this.getSecrets();

    const expiresIn = process.env.JWT_EXPIRES_IN ?? "1h";
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

    const accessToken = jwt.sign(
      { sub: userId, role, tenantId },
      secret,
      { expiresIn }
    );

    const rawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + parseExpiresIn(refreshExpiresIn) * 1000);

    return { accessToken, rawRefreshToken, tokenHash, expiresAt };
  }

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

    const { accessToken, rawRefreshToken, tokenHash, expiresAt } =
      this.issueTokenPair(user.id, user.role, user.tenant_id);

    await this.repo.storeRefreshToken({
      userId: user.id,
      tenantId: user.tenant_id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(rawToken: string, tenantId: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.repo.findRefreshToken(tokenHash, tenantId);

    if (!stored) {
      // Token not found, revoked, or expired.
      // If the hash exists but was already revoked, this may be a reuse attack.
      // Safest response: reject without revealing which case.
      const err = new Error("Refresh token inválido, expirado ou já utilizado") as Error & {
        statusCode: number;
      };
      err.statusCode = 401;
      throw err;
    }

    const user = await this.repo.findUserById(stored.user_id, tenantId);

    if (!user) {
      const err = new Error("Usuário não encontrado") as Error & {
        statusCode: number;
      };
      err.statusCode = 401;
      throw err;
    }

    // Rotate: revoke old token and issue new pair
    await this.repo.revokeRefreshToken(tokenHash, tenantId);

    const { accessToken, rawRefreshToken, tokenHash: newHash, expiresAt } =
      this.issueTokenPair(user.id, user.role, tenantId);

    await this.repo.storeRefreshToken({
      userId: user.id,
      tenantId,
      tokenHash: newHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(rawToken: string, tenantId: string) {
    const tokenHash = hashToken(rawToken);
    await this.repo.revokeRefreshToken(tokenHash, tenantId);
  }
}
