import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUsers, saveUsers, getUserByEmail } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, name, accountInfo, role } = await request.json();

    if (!email || !password || !name || !accountInfo) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    if (getUserByEmail(email)) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 400 });
    }

    // Hash password 
    const passwordHash = await bcrypt.hash(password, 10);
    const users = getUsers();

    let assignedRole = role === 'admin' ? 'admin' : 'user';
    if (name.trim().toLowerCase() === 'admin') {
      const adminExists = users.some(u => u.name.trim().toLowerCase() === 'admin');
      if (adminExists) {
        return NextResponse.json({ error: '관리자 계정은 이미 등록되어 있습니다.' }, { status: 400 });
      }
      assignedRole = 'admin';
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      name,
      accountInfo, // In a real system, you'd encrypt accountInfo symmetrically, but hashing password provides strong user security.
      role: assignedRole as 'user' | 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
