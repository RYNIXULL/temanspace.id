import { hash, verify } from "@node-rs/argon2";

// Algorithm 2 = Argon2id
const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hash a plaintext password with Argon2id.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(
  passwordHash: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, plainPassword);
  } catch {
    return false;
  }
}
