import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from "@cometkit/shared";
import type { User } from "@cometkit/db";
import { hashPassword, verifyPassword } from "../common/password";
import { UsersService } from "../users/users.service";
import type { JwtPayload } from "./jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const user = await this.users.create({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name ?? null,
      role: "user",
    });

    return this.toAuthResponse(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.toAuthResponse(user);
  }

  private toAuthResponse(user: User): AuthResponse {
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      user: authUser,
      tokens: { accessToken: this.jwt.sign(payload) },
    };
  }
}
