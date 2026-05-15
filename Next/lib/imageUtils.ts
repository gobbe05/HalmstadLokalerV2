/**
 * Utility functions for handling optimized images with multiple sizes.
 * Images are stored with naming convention: [id]_[index]_[timestamp]_[random]_[size].webp
 * where size is: large (1600x900), medium (1200x675), small (800x450)
 */

export type ImageSize = 'large' | 'medium' | 'small';

interface ImageUrls {
  large: string;
  medium: string;
  small: string;
}

/**
 * Get the URL for a specific size from an optimized image URL
 */
export function getImageUrl(url: string, size: ImageSize): string {
  if (!url) return '/placeholder.svg';
  
  // Check if this is an optimized image with size suffix
  if (url.includes('_large.webp')) {
    return url.replace('_large.webp', `_${size}.webp`);
  }
  if (url.includes('_medium.webp')) {
    return url.replace('_medium.webp', `_${size}.webp`);
  }
  if (url.includes('_small.webp')) {
    return url.replace('_small.webp', `_${size}.webp`);
  }
  
  // Legacy image without size suffix - return as-is
  return url;
}

/**
 * Get all size URLs from a single image URL
 */
export function getAllImageUrls(url: string): ImageUrls {
  return {
    large: getImageUrl(url, 'large'),
    medium: getImageUrl(url, 'medium'),
    small: getImageUrl(url, 'small'),
  };
}

/**
 * Check if an image URL is an optimized image with multiple sizes
 */
export function isOptimizedImage(url: string): boolean {
  return url.includes('_large.webp') || 
         url.includes('_medium.webp') || 
         url.includes('_small.webp');
}

/**
 * Generate srcset attribute for responsive images
 */
export function getSrcSet(url: string): string {
  if (!url || !isOptimizedImage(url)) {
    return '';
  }
  
  const urls = getAllImageUrls(url);
  return `${urls.small} 800w, ${urls.medium} 1200w, ${urls.large} 1600w`;
}

/**
 * Generate sizes attribute for responsive images
 */
export function getSizes(type: 'card' | 'slider' | 'thumbnail' = 'card'): string {
  switch (type) {
    case 'card':
      // Property cards in grid
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'slider':
      // Main image in detail page slider
      return '(max-width: 1200px) 100vw, 1600px';
    case 'thumbnail':
      // Small thumbnails
      return '120px';
    default:
      return '100vw';
  }
}
