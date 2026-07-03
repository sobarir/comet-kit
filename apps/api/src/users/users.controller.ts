import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateUserSchema,
  type AuthUser,
  type CreateUserInput,
  type ListUsersQuery,
  type Paginated,
  type UpdateProfileInput,
  type UpdateUserInput,
  type UserDto,
} from "@cometkit/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // NOTE: static routes ("me") are declared before parameterized (":id").
  @Patch("me")
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ): Promise<UserDto> {
    return this.users.updateProfile(user.id, input);
  }

  @Get()
  @Roles("admin")
  list(
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQuery,
  ): Promise<Paginated<UserDto>> {
    return this.users.list(query);
  }

  @Post()
  @Roles("admin")
  create(
    @Body(new ZodValidationPipe(createUserSchema)) input: CreateUserInput,
  ): Promise<UserDto> {
    return this.users.createUser(input);
  }

  @Patch(":id")
  @Roles("admin")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) input: UpdateUserInput,
  ): Promise<UserDto> {
    return this.users.updateUser(id, input);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ): Promise<void> {
    await this.users.deleteUser(user, id);
  }
}
