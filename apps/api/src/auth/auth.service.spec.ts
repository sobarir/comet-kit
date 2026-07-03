import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@cometkit/db";
import { AuthService } from "./auth.service";
import type { UsersService } from "../users/users.service";

const demoUser: User = {
  id: "01JX0000000000000000000000",
  email: "demo@cometkit.dev",
  passwordHash: bcrypt.hashSync("password123", 10),
  name: "Demo User",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("AuthService", () => {
  let usersMock: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(() => {
    usersMock = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const jwt = new JwtService({
      secret: "test-secret-at-least-16-chars",
      signOptions: { expiresIn: "15m" },
    });
    service = new AuthService(usersMock as unknown as UsersService, jwt);
  });

  it("registers a new user and returns a token", async () => {
    usersMock.findByEmail.mockResolvedValue(undefined);
    usersMock.create.mockResolvedValue(demoUser);

    const result = await service.register({
      email: "demo@cometkit.dev",
      password: "password123",
      name: "Demo User",
    });

    expect(result.user.email).toBe("demo@cometkit.dev");
    expect(result.tokens.accessToken).toBeTruthy();
    expect(usersMock.create).toHaveBeenCalledOnce();
  });

  it("rejects registration when email is taken", async () => {
    usersMock.findByEmail.mockResolvedValue(demoUser);

    await expect(
      service.register({ email: demoUser.email, password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("logs in with valid credentials", async () => {
    usersMock.findByEmail.mockResolvedValue(demoUser);

    const result = await service.login({
      email: demoUser.email,
      password: "password123",
    });

    expect(result.user.id).toBe(demoUser.id);
    expect(result.tokens.accessToken).toBeTruthy();
  });

  it("rejects login with a wrong password", async () => {
    usersMock.findByEmail.mockResolvedValue(demoUser);

    await expect(
      service.login({ email: demoUser.email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
