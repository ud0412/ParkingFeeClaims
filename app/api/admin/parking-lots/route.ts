import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getParkingLots, saveParkingLots, ParkingLot } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lots = getParkingLots();
  return NextResponse.json({ list: lots });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, maxFee } = await request.json();
    if (!name || typeof maxFee !== 'number') {
       return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const lots = getParkingLots();
    const newLot: ParkingLot = {
      id: Date.now().toString(),
      name,
      maxFee,
      createdAt: new Date().toISOString()
    };
    lots.push(newLot);
    saveParkingLots(lots);

    return NextResponse.json({ success: true, lot: newLot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id, name, maxFee } = await request.json();
    if (!id || !name || typeof maxFee !== 'number') {
       return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const lots = getParkingLots();
    const index = lots.findIndex(l => l.id === id);
    if (index === -1) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    lots[index].name = name;
    lots[index].maxFee = maxFee;
    saveParkingLots(lots);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
       return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const lots = getParkingLots();
    const updated = lots.filter(l => l.id !== id);
    if (lots.length === updated.length) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    saveParkingLots(updated);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
