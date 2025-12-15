// utils/encryption.ts — Client-side encryption using Web Crypto API
// All custom lens data is encrypted locally before storage

import { EncryptedUserInputs } from '../types/lens';

const ENCRYPTION_KEY_NAME = 'grove-lens-key';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Get or create a persistent encryption key for this browser
 * Key is stored in localStorage and never leaves the client
 */
export async function getOrCreateKey(): Promise<CryptoKey> {
  // Check for existing key
  const stored = localStorage.getItem(ENCRYPTION_KEY_NAME);

  if (stored) {
    try {
      const keyData = JSON.parse(stored);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (err) {
      console.warn('Failed to import stored key, generating new one:', err);
      // Fall through to generate new key
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  // Export and store for persistence
  const exported = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));

  return key;
}

/**
 * Encrypt data using AES-GCM
 * Returns IV and ciphertext as number arrays for JSON serialization
 */
export async function encryptData(data: string): Promise<EncryptedUserInputs> {
  const key = await getOrCreateKey();

  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode data to bytes
  const encoded = new TextEncoder().encode(data);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

/**
 * Decrypt data using AES-GCM
 * Accepts IV and ciphertext as number arrays from JSON
 */
export async function decryptData(encrypted: EncryptedUserInputs): Promise<string> {
  const key = await getOrCreateKey();

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.data)
  );

  // Decode to string
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a JavaScript object (serialized to JSON)
 */
export async function encryptObject<T>(obj: T): Promise<EncryptedUserInputs> {
  const json = JSON.stringify(obj);
  return encryptData(json);
}

/**
 * Decrypt to a JavaScript object
 */
export async function decryptObject<T>(encrypted: EncryptedUserInputs): Promise<T> {
  const json = await decryptData(encrypted);
  return JSON.parse(json);
}

/**
 * Check if encryption is available in this browser
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.generateKey === 'function';
}

/**
 * Clear the encryption key (useful for testing or user-initiated data clearing)
 * Warning: This will make all encrypted data unrecoverable!
 */
export function clearEncryptionKey(): void {
  localStorage.removeItem(ENCRYPTION_KEY_NAME);
}
