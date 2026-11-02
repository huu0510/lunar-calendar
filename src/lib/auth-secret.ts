/** NextAuth v4 reads NEXTAUTH_SECRET. The project env name is AUTH_SECRET. */
export function ensureAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) {
    if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = secret;
    if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = secret;
  }
  return secret;
}
