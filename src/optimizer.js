import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

export async function createOptimizedVariants(
  sourcePath,
  targetBasePath,
  maxDimension
) {
  const jpegPath = `${targetBasePath}.jpg`;
  const webpPath = `${targetBasePath}.webp`;

  await mkdir(path.dirname(targetBasePath), { recursive: true });

  const pipeline = sharp(sourcePath)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    });

  await pipeline
    .clone()
    .jpeg({ quality: 82, progressive: true })
    .toFile(jpegPath);

  await pipeline.clone().webp({ quality: 82 }).toFile(webpPath);

  return {
    jpegPath,
    webpPath,
  };
}
