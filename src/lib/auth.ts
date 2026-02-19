import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secretKey = process.env.SESSION_SECRET || 'default-secret-key-change-me';
const key = new TextEncoder().encode(secretKey);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Daniel1099#';

export async function encrypt(payload: { authenticated: boolean; exp: number }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as { authenticated: boolean; exp: number; iat: number };
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD;
}

export async function createSession(): Promise<string> {
  // exp will be set by setExpirationTime('24h'), not by us
  const token = await encrypt({ authenticated: true, exp: 0 });
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

// For server components and pages
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  // JWT exp is in seconds, Date.now() is in milliseconds
  const nowSeconds = Math.floor(Date.now() / 1000);
  return session.authenticated && session.exp > nowSeconds;
}

// For API routes - reads cookie from request
export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    return false;
  }
  
  const session = await decrypt(token);
  
  if (!session) {
    return false;
  }
  
  // JWT exp is in seconds, Date.now() is in milliseconds
  const nowSeconds = Math.floor(Date.now() / 1000);
  return session.authenticated && session.exp > nowSeconds;
}
