import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  if (!params.slug || params.slug.length === 0) {
    return new NextResponse('File not specified', { status: 400 });
  }

  const fileName = params.slug.join('/');
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, 'uploads', fileName);

  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = 'application/octet-stream'; // Default MIME type
      
      // You might want to determine the MIME type dynamically
      // based on the file extension for better browser support.
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
        },
      });
    } else {
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving temp file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}