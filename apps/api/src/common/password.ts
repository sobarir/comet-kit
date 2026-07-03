/**
 * Password hashing - the one place bcrypt appears.
 * Used by auth (register/login) and user management (admin create).
 */
import * as bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
