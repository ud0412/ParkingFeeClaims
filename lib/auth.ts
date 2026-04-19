import { jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'warm-parking-claims-super-secret');

export async function signToken(payload: { sub: string; role: string; name: string }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 20 * 60; // 20 minutes from now

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export function setTokenCookie(res: NextResponse, token: string) {
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 20 * 60, // 20 minutes
    path: '/',
  });
}

export function clearTokenCookie(res: NextResponse) {
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
  });
}
