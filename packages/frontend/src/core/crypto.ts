// packages/frontend/src/core/crypto.ts
import CryptoJS from 'crypto-js';

const KEY_SIZE = 512 / 32; // 512 bits
// THE FIX IS HERE: Reduced from 200,000 to a much faster 10,000
const ITERATIONS = 10000;

/**
 * Hashes a password using PBKDF2 with a new random salt.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA512
  }).toString(CryptoJS.enc.Hex);

  return { salt: salt.toString(CryptoJS.enc.Hex), hash };
}

/**
 * Verifies a password against a stored salt and hash.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA512
  }).toString(CryptoJS.enc.Hex);

  return hash === storedHash;
}