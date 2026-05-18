/** Private cache for authenticated JSON API responses (browser + CDN). */
export const PRIVATE_API_CACHE = 'private, max-age=60, stale-while-revalidate=300'

export function privateApiCacheHeaders(): HeadersInit {
  return { 'Cache-Control': PRIVATE_API_CACHE }
}
