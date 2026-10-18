import type { ImgHTMLAttributes } from 'react';
import manifest from './generated/images.json';

type ImageVariant = { src: string; width: number; height: number; bytes: number };
type ImageRecord = { width: number; height: number; avif: ImageVariant[]; webp: ImageVariant[] };
const images: Record<string, ImageRecord> = manifest;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> & { src: string; sizes: string };

export function ResponsiveImage({ src, sizes, alt, ...props }: Props) {
  const image = images[src];
  if (!image) throw new Error(`Missing optimized image: ${src}. Run npm run images.`);
  const srcSet = (variants: ImageVariant[]) => variants.map(variant => `${variant.src} ${variant.width}w`).join(', ');
  return (
    <picture className="responsive-picture">
      <source type="image/avif" srcSet={srcSet(image.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(image.webp)} sizes={sizes} />
      <img {...props} src={image.webp[image.webp.length - 1].src} srcSet={srcSet(image.webp)} sizes={sizes} width={image.width} height={image.height} alt={alt} />
    </picture>
  );
}
