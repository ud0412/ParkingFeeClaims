import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ week: string, filename: string }> }) {
  const { week, filename } = await params;
  
  // Safe path joining to prevent directory traversal
  const safeWeek = path.basename(week);
  const safeFilename = path.basename(filename);
  
  const filePath = path.join(process.cwd(), 'data', 'uploads', safeWeek, safeFilename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const fileInfo = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  const ext = path.extname(safeFilename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileInfo.size.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
