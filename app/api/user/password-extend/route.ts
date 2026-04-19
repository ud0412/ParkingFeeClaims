import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUsers, saveUsers } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === payload.sub);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    users[userIndex].passwordUpdatedAt = new Date().toISOString();
    saveUsers(users);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

