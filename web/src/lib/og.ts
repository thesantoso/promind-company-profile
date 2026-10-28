import { getImage } from 'astro:assets';
import photo from '../assets/photos/building-operations.jpg';

/** Default social preview: a 1.91:1 crop of the field photo (the source is 1132px wide, so no upscaling). */
export async function getOgImage(site: URL): Promise<string> {
  const img = await getImage({ src: photo, width: 1132, height: 593, format: 'jpg', fit: 'cover', position: 'center' });
  return new URL(img.src, site).href;
}
