import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { desc, eq } from "drizzle-orm";
import { users, type Database, type NewUser, type User } from "@cometkit/db";
import type {
  AuthUser,
  CreateUserInput,
  ListUsersQuery,
  Paginated,
  UpdateProfileInput,
  UpdateUserInput,
  UserDto,
} from "@cometkit/shared";
import { DB } from "../database/database.module";
import { hashPassword } from "../common/password";
import { buildPageMeta, canDeleteUser, toUserDto } from "./users.policy";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
  ) {}

  findByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.email, email) });
  }

  findById(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async create(data: NewUser): Promise<User> {
    const [row] = await this.db.insert(users).values(data).returning();
    if (!row) throw new Error("Insert returned no row");
    this.logger.info({ userId: row.id, role: row.role }, "user.created");
    return row;
  }

  /** Admin: paginated list, newest first (ULIDs sort by creation time). */
  async list(query: ListUsersQuery): Promise<Paginated<UserDto>> {
    const { page, limit } = query;
    const [rows, total] = await Promise.all([
      this.db
        .select()
        .from(users)
        .orderBy(desc(users.id))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.$count(users),
    ]);
    return { data: rows.map(toUserDto), meta: buildPageMeta(page, limit, total) };
  }

  /** Admin: create a user with an explicit role. */
  async createUser(input: CreateUserInput): Promise<UserDto> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }
    const row = await this.create({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name ?? null,
      role: input.role,
    });
    return toUserDto(row);
  }

  /** Admin: update name and/or role. */
  async updateUser(id: string, input: UpdateUserInput): Promise<UserDto> {
    const [row] = await this.db
      .update(users)
      .set(input)
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new NotFoundException("User not found");
    if (input.role) {
      this.logger.info({ userId: id, role: input.role }, "user.role_changed");
    }
    return toUserDto(row);
  }

  /** Admin: delete any user except yourself. */
  async deleteUser(actor: AuthUser, id: string): Promise<void> {
    if (!canDeleteUser(actor, id)) {
      throw new ForbiddenException("You cannot delete your own account");
    }
    const [row] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!row) throw new NotFoundException("User not found");
    this.logger.info({ userId: id, actorId: actor.id }, "user.deleted");
  }

  /** Any signed-in user: update own profile. */
  async updateProfile(
    actorId: string,
    input: UpdateProfileInput,
  ): Promise<UserDto> {
    const [row] = await this.db
      .update(users)
      .set({ name: input.name })
      .where(eq(users.id, actorId))
      .returning();
    if (!row) throw new NotFoundException("User not found");
    return toUserDto(row);
  }
}
