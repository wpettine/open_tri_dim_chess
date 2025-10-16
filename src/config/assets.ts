/**
 * Asset CDN Configuration
 * 
 * In development: uses local assets from /public
 * In production: uses Cloudflare R2 CDN
 */

const CDN_URL = import.meta.env.VITE_ASSET_CDN_URL || '';

/**
 * Get the full URL for an asset path
 * @param path - Asset path starting with / (e.g., '/models/chess/basic/pawn.gltf')
 * @returns Full URL to the asset
 */
export function getAssetUrl(path: string): string {
  // If no CDN URL is configured, return the local path
  if (!CDN_URL) {
    return path;
  }
  
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Combine CDN URL with path
  return `${CDN_URL}/${cleanPath}`;
}

