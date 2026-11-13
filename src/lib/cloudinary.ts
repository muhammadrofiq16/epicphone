import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean((cloudName && apiKey && apiSecret) || cloudinaryUrl);

if (cloudinaryUrl) {
  // Cloudinary SDK natively reads CLOUDINARY_URL
  cloudinary.config({
    secure: true,
  });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  ig_square_url: string;    // 1:1 Feed Instagram (1080x1080)
  ig_portrait_url: string;  // 4:5 Feed Instagram (1080x1350)
  watermarked_url: string;  // With EpicPhone branding watermark
}

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    tags?: string[];
    watermarkText?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary credentials are not configured in environment variables.');
  }

  const folder = options.folder || 'epicphone/units';
  const watermark = options.watermarkText || 'EpicPhone Store';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        tags: options.tags || ['epicphone', 'inventory'],
        resource_type: 'image',
        format: 'webp', // auto convert to modern high-quality WebP
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed without error result.'));
        }

        // Generate dynamic transformation URLs for Instagram / Facebook
        const publicId = result.public_id;

        // 1. Instagram Square 1:1 (1080x1080)
        const igSquareUrl = cloudinary.url(publicId, {
          width: 1080,
          height: 1080,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true,
        });

        // 2. Instagram Portrait 4:5 (1080x1350)
        const igPortraitUrl = cloudinary.url(publicId, {
          width: 1080,
          height: 1350,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true,
        });

        // 3. Watermarked URL (EpicPhone Store watermark at bottom or top-right)
        const watermarkedUrl = cloudinary.url(publicId, {
          width: 1080,
          height: 1080,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
          overlay: {
            font_family: 'Arial',
            font_size: 42,
            font_weight: 'bold',
            text: watermark,
          },
          color: '#ffffff',
          gravity: 'south_east',
          x: 25,
          y: 25,
          opacity: 85,
          secure: true,
        });

        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          ig_square_url: igSquareUrl,
          ig_portrait_url: igPortraitUrl,
          watermarked_url: watermarkedUrl,
        });
      }
    );

    uploadStream.end(buffer);
  });
}
