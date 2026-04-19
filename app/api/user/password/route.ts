import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUsers, saveUsers } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // Verify user
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

    const user = users[userIndex];
    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    users[userIndex].passwordHash = newPasswordHash;
    users[userIndex].passwordUpdatedAt = new Date().toISOString();
    
    saveUsers(users);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

