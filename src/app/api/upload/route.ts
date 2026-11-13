import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '@/lib/cloudinary';

// Check upload service status
export async function GET() {
  return NextResponse.json({
    cloudinaryConfigured: isCloudinaryConfigured,
    mode: isCloudinaryConfigured ? 'cloudinary' : 'local',
    message: isCloudinaryConfigured
      ? 'Cloudinary aktif. Foto akan otomatis di-upload ke Cloudinary dengan optimasi sosmed.'
      : 'Mode penyimpanan direktori lokal aktif. Tambahkan kunci Cloudinary di .env.local untuk aktivasi cloud.',
  });
}

// Upload file handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slot = (formData.get('slot') as string) || 'unit';
    const isLogo = slot === 'logo';
    const unitTipe = (formData.get('unitTipe') as string) || (isLogo ? 'toko' : 'iphone');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file gambar yang diunggah' }, { status: 400 });
    }

    // Validate mime type (support JPEG, PNG, WebP, HEIC, and SVG for logos)
    const validMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/jpg',
      'image/svg+xml',
      'image/svg',
    ];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap gunakan format JPG, PNG, WebP, atau SVG.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeTipe = unitTipe.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const extension = file.name.split('.').pop() || (file.type.includes('svg') ? 'svg' : 'jpg');
    const localFileName = isLogo
      ? `store-logo-${timestamp}-${randomSuffix}.${extension}`
      : `${safeTipe}-${slot}-${timestamp}-${randomSuffix}.${extension}`;

    const subFolder = isLogo ? 'branding' : 'units';

    // 1. If Cloudinary is configured, prioritize uploading to Cloudinary
    if (isCloudinaryConfigured) {
      try {
        const cloudResult = await uploadImageToCloudinary(buffer, {
          folder: `epicphone/${subFolder}`,
          publicId: isLogo ? `store-logo-${timestamp}` : `${safeTipe}-${slot}-${timestamp}`,
          tags: isLogo ? ['epicphone', 'logo', 'branding'] : ['epicphone', slot, safeTipe],
          watermarkText: isLogo ? undefined : 'EpicPhone Store',
        });

        // Safely try saving a local copy in dev environment (ignore EROFS in serverless)
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
          await fs.mkdir(uploadDir, { recursive: true });
          const localFilePath = path.join(uploadDir, localFileName);
          await fs.writeFile(localFilePath, buffer);
        } catch {
          // Read-only filesystem on Vercel is expected and safely ignored
        }

        return NextResponse.json({
          success: true,
          provider: 'cloudinary',
          url: cloudResult.secure_url,
          localUrl: cloudResult.secure_url,
          public_id: cloudResult.public_id,
          ig_square_url: cloudResult.ig_square_url,
          ig_portrait_url: cloudResult.ig_portrait_url,
          watermarked_url: cloudResult.watermarked_url,
          fileName: localFileName,
        });
      } catch (cloudErr: any) {
        console.error('Cloudinary upload error:', cloudErr);
      }
    }

    // 2. Try saving to local filesystem (development environment)
    let localSaved = false;
    const localUrl = `/uploads/${subFolder}/${localFileName}`;
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder);
      await fs.mkdir(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, localFileName);
      await fs.writeFile(localFilePath, buffer);
      localSaved = true;
    } catch {
      // Serverless environment like Vercel has read-only filesystem
      console.warn('Filesystem is read-only (serverless environment like Vercel).');
    }

    if (localSaved) {
      return NextResponse.json({
        success: true,
        provider: 'local',
        url: localUrl,
        localUrl,
        fileName: localFileName,
        message: 'Foto berhasil disimpan di direktori lokal server.',
      });
    }

    // 3. Fallback for Vercel when Cloudinary is not yet configured: Base64 Data URL
    // This guarantees the upload NEVER fails with EROFS error!
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
    return NextResponse.json({
      success: true,
      provider: 'base64_fallback',
      url: base64Data,
      localUrl: base64Data,
      fileName: localFileName,
      warning:
        'Foto disimpan sebagai Data URL karena Cloudinary belum aktif di Vercel. Tambahkan CLOUDINARY_URL di Environment Variables Vercel untuk performa cloud optimal.',
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses upload foto' },
      { status: 500 }
    );
  }
}
