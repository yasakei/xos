// packages/backend/src/services/encryption.service.ts
import type { Request } from "express";
import fs from "fs/promises";
import CryptoJS from "crypto-js";
import { getSafePath, USER_DATA_PATH } from "../utils/vfs.utils";

async function getEncryptionKey(): Promise<string> {
  const userFilePath = getSafePath(USER_DATA_PATH);
  const data = await fs.readFile(userFilePath, "utf-8").catch(() => {
    throw new Error("User profile not found. Cannot get encryption key.");
  });
  const userData = JSON.parse(data);
  if (!userData.passwordHash)
    throw new Error("User password hash not found for encryption.");
  return userData.passwordHash;
}

export function verifyPassword(
  passwordAttempt: string,
  saltHex: string,
  storedHash: string
): boolean {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const hash = CryptoJS.PBKDF2(passwordAttempt, salt, {
    keySize: 512 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA512,
  }).toString(CryptoJS.enc.Hex);
  return hash === storedHash;
}

export const encrypt = async (text: string): Promise<string> => {
  const key = await getEncryptionKey();
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = async (
  ciphertext: string,
): Promise<string> => {
  const key = await getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
