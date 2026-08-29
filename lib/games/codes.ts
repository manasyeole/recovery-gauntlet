import { randomBytes } from "node:crypto";
import { CODE_LENGTH } from "./protocol";

/**
 * Room codes get read out loud across a room, or typed one-handed by someone
 * who is not paying full attention. So: no O/0, no I/1, no letters that sound
 * alike over a bad connection when you already know the alphabet is small.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Rejection sampling rather than `% ALPHABET.length` — 256 is not a multiple
 * of 32 for every alphabet you might swap in here, and a biased room code is
 * a silly thing to ship.
 */
export function newRoomCode(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < CODE_LENGTH) {
    for (const byte of randomBytes(CODE_LENGTH * 2)) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === CODE_LENGTH) break;
    }
  }
  return out;
}

/** 32 bytes of nothing-to-guess, held only in one browser's localStorage. */
export function newPlayerToken(): string {
  return randomBytes(24).toString("base64url");
}
