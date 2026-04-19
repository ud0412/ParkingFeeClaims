import { NextResponse } from 'next/server';
import { deleteUser, updateUserRole, resetUserPassword } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  
  if (id === payload.sub) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const success = deleteUser(id);
  if (!success) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();

  if (body.action === 'changeRole') {
    if (id === payload.sub) {
       return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }
    const success = updateUserRole(id, body.role);
    if (!success) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, newRole: body.role });
  } 
  
  if (body.action === 'resetPassword') {
    if (!body.newPassword) return NextResponse.json({ error: 'New password required' }, { status: 400 });
    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    const success = resetUserPassword(id, passwordHash);
    if (!success) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
