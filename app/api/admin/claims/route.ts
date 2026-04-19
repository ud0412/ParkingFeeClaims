import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getClaims, getUsers } from '@/lib/db';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  // Determine scope (Sunday to Saturday by default)
  const now = new Date();
  let currentWeekStart = startOfWeek(now, { weekStartsOn: 0 });
  let currentWeekEnd = endOfWeek(now, { weekStartsOn: 0 });

  if (startParam) {
    const parsed = new Date(startParam);
    if (!isNaN(parsed.getTime())) {
      currentWeekStart = parsed;
      currentWeekStart.setHours(0, 0, 0, 0);
    }
  }
  
  if (endParam) {
    const parsed = new Date(endParam);
    if (!isNaN(parsed.getTime())) {
      currentWeekEnd = parsed;
      currentWeekEnd.setHours(23, 59, 59, 999);
    }
  }

  const claims = getClaims();
  const users = getUsers();

  const enrichedClaims = claims
    .filter(claim => {
      const claimDate = new Date(claim.createdAt);
      return isWithinInterval(claimDate, { start: currentWeekStart, end: currentWeekEnd });
    })
    .map(claim => {
      const user = users.find(u => u.id === claim.userId);
      return {
        id: claim.id,
        userName: user?.name || 'Unknown',
        accountInfo: user?.accountInfo || 'Unknown',
        entryTime: claim.entryTime,
        exitTime: claim.exitTime,
        imageUrl: claim.imageUrl,
        fee: claim.fee,
        parkingName: claim.parkingName,
        createdAt: claim.createdAt
      };
    })
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Generate CSV data for export
  const csvHeaders = ['사용자 이름', '계좌 정보', '입차 일시', '청구 금액(원)', '주차장 이름', '청구 일자'];
  const csvRows = enrichedClaims.map(c => {
    const d = new Date(c.createdAt);
    const dateFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    return [
      `"${c.userName}"`,
      `"${c.accountInfo}"`,
      `"${c.entryTime || ''}"`,
      c.fee,
      `"${c.parkingName}"`,
      `"${dateFormatted}"`
    ];
  });
  const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');

  return NextResponse.json({
    list: enrichedClaims,
    csvData: csvContent,
    weekStart: currentWeekStart.toISOString(),
    weekEnd: currentWeekEnd.toISOString()
  });
}
