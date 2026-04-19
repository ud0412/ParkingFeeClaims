import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getClaims, saveClaims, checkDuplicateClaim } from '@/lib/db';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { startOfWeek, format } from 'date-fns';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const claims = getClaims();
  const userClaims = claims.filter(c => c.userId === payload.sub).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(userClaims);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || !payload.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const parkingName = formData.get('parkingName') as string;
    const feeString = formData.get('fee') as string;
    const entryTime = formData.get('entryTime') as string;
    const exitTime = formData.get('exitTime') as string;
    const file = formData.get('file') as File;

    if (!parkingName || !feeString || !entryTime || !exitTime || !file) {
      return NextResponse.json({ error: '모든 필드와 영수증 이미지가 필요합니다.' }, { status: 400 });
    }

    // Check duplicate
    if (checkDuplicateClaim(entryTime, exitTime)) {
      return NextResponse.json({ error: '이미 존재하는 청구 건과 입/출차 시간이 동일합니다. (중복 청구)' }, { status: 400 });
    }

    // Parse fee and apply limits
    let rawFee = parseInt(feeString, 10);
    if (isNaN(rawFee)) {
      rawFee = 0;
    }
    
    // Get active parking lots
    const { getParkingLots } = await import('@/lib/db');
    const parkingLots = getParkingLots();
    const validLot = parkingLots.find(p => p.name === parkingName);
    
    if (!validLot) {
       return NextResponse.json({ error: '등록된 주차장이 아닙니다. 청구할 수 없습니다.' }, { status: 400 });
    }

    let claimedFee = Math.min(rawFee, validLot.maxFee);

    // Process file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Directory mapping (Sunday to Saturday week)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // 0 = Sunday
    const weekFolder = format(weekStart, 'yyyy-MM-dd');
    
    // Make sure dir exists
    const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads', weekFolder);
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save image
    fs.writeFileSync(filePath, buffer);

    // Provide a URL accessible path
    const imageUrl = `/api/uploads/${weekFolder}/${filename}`;

    // Update DB
    const claims = getClaims();
    const newClaim = {
      id: uniqueId,
      userId: payload.sub as string,
      parkingName,
      fee: claimedFee,       // This is the fee calculated with limits
      originalFee: rawFee,   // Keeping original for reference
      entryTime,
      exitTime,
      status: 'pending' as const,
      imageUrl,
      createdAt: new Date().toISOString()
    };

    claims.push(newClaim);
    saveClaims(claims);

    return NextResponse.json({ success: true, claim: newClaim });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
