import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { signToken, setTokenCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '잘못된 이메일 또는 비밀번호입니다.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: '잘못된 이메일 또는 비밀번호입니다.' }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, role: user.role, name: user.name });
    
    const response = NextResponse.json({ success: true, role: user.role });
    setTokenCookie(response, token);

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
