const loginAttempts = new Map();

const FIFTEEN_MIN = 15 * 60 * 1000;
const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function getAttempts(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return null;
  if (entry.banUntil && Date.now() > entry.banUntil) {
    if (entry.banLevel === 1 && entry.count >= MAX_ATTEMPTS) {
      entry.banLevel = 2;
      entry.banUntil = Date.now() + TWENTY_FOUR_H;
      entry.count = 0;
    } else {
      loginAttempts.delete(key);
      return null;
    }
  }
  return entry;
}

export function recordFail(key) {
  let entry = loginAttempts.get(key);
  if (!entry) {
    entry = { count: 0, banUntil: null, banLevel: 0 };
    loginAttempts.set(key, entry);
  }
  if (entry.banUntil) return entry;
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.banLevel = 1;
    entry.banUntil = Date.now() + FIFTEEN_MIN;
  }
  return entry;
}

export function recordSuccess(key) {
  loginAttempts.delete(key);
}

export function resetAttempts(key) {
  loginAttempts.delete(key);
}
