const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/**
 * Generates an 8-character URL-safe identifier avoiding ambiguous characters (0, 1, l, o).
 */
export function generateCollectionId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
