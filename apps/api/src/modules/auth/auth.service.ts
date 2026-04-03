import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eventBus, createLogger } from "@fastconsig/core";
import { AuthRepository } from "./auth.repository";

const log = createLogger("auth-service");
const REFRESH_TOKEN_BYTES = 64;

export interface LoginContext {
  ip?: string;
  deviceInfo?: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    log.warn({ value }, "parseExpiresIn: formato inválido, usando fallback de 7 dias");
    return 7 * 24 * 3600;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const SECONDS_PER_UNIT: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  // Default to 1 hour (3600s) when unit is unrecognised — shouldn't happen given the regex
  const SECONDS_PER_HOUR = 3600;
  return amount * (SECONDS_PER_UNIT[unit] ?? SECONDS_PER_HOUR);
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
    const { secret } = this.getSecrets();

    const expiresInStr = process.env.JWT_EXPIRES_IN ?? "1h";
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

    // Use the numeric (seconds) form so @types/jsonwebtoken's StringValue
    // template-literal constraint is satisfied without unsafe casts.
    const expiresInSeconds = parseExpiresIn(expiresInStr);

    const accessToken = jwt.sign(
      { sub: userId, role, tenantId },
      secret,
      { expiresIn: expiresInSeconds }
    );

    const rawRefreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + parseExpiresIn(refreshExpiresIn) * 1000);
    return { accessToken, rawRefreshToken, tokenHash, expiresAt };
  }

  async login(email: string, password: string, tenantId: string, ctx: LoginContext = {}) {
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
      deviceInfo: ctx.deviceInfo,
      ipAddress: ctx.ip,
    });

    eventBus.emit("auth.login", {
      tenantId: user.tenant_id,
      userId: user.id,
      ip: ctx.ip,
      deviceInfo: ctx.deviceInfo,
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

    eventBus.emit("auth.token_refreshed", {
      tenantId,
      userId: user.id,
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
    const stored = await this.repo.findRefreshToken(tokenHash, tenantId);
    await this.repo.revokeRefreshToken(tokenHash, tenantId);

    if (stored) {
      eventBus.emit("auth.logout", {
        tenantId,
        userId: stored.user_id,
      });
    }
  }
}

