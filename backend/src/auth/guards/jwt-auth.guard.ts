import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { isUUID } from "class-validator";
import type { Request } from "express";
import { Repository } from "typeorm";

import { User } from "../../iam/entities/user.entity.js";

export type AuthenticatedUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "status"
>;

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tokenVersion: number;
}

interface AccessTokenPayload {
  sub: string;
  exp: number;
  v: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,

    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new UnauthorizedException("Bearer token is required");
    }

    let payload: AccessTokenPayload;

    try {
      // Uses the verification settings from AuthModule.
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(match[1]);

      if (
        typeof payload.sub !== "string" ||
        !isUUID(payload.sub) ||
        typeof payload.exp !== "number" ||
        !Number.isInteger(payload.v) ||
        payload.v < 0
      ) {
        throw new Error("Invalid token payload");
      }
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    // Check the database so suspended or deleted users lose access.
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        authVersion: true,
      },
    });

    if (!user || user.status !== "active" || user.authVersion !== payload.v) {
      throw new UnauthorizedException("User account is unavailable");
    }

    request.tokenVersion = payload.v;
    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    };

    return true;
  }
}
