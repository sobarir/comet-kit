import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import {
  loginSchema,
  registerSchema,
  type AuthResponse,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "@cometkit/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
  ): Promise<AuthResponse> {
    return this.auth.register(input);
  }

  @Post("login")
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
  ): Promise<AuthResponse> {
    return this.auth.login(input);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
