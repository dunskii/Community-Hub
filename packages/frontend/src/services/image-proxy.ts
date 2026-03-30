/**
 * Image Proxy Client
 *
 * Downloads remote stock images through the backend proxy so that
 * local paths are stored in the database instead of temporary external URLs.
 */

import { get, post } from './api-client';

interface ProxyResponse {
  success: boolean;
  data: { path: string };
}

export interface StockPhotoHit {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
}

interface StockSearchResponse {
  success: boolean;
  data: {
    hits: StockPhotoHit[];
    totalHits: number;
  };
}

/**
 * Download a remote stock image through the backend proxy.
 * The backend downloads, validates, processes (Sharp/WebP), and saves
 * the image to /uploads/, returning the local path.
 *
 * @param url - The remote image URL (e.g. Pixabay largeImageURL)
 * @param context - Where the image will be used ('business' | 'deal' | 'event')
 * @param entityId - Optional entity ID (e.g. business ID for organizing uploads)
 * @returns Local image path (e.g. "/uploads/businesses/abc/img.webp")
 */
export async function proxyStockImage(
  url: string,
  context: 'business' | 'deal' | 'event',
  entityId?: string,
): Promise<string> {
  const response = await post<ProxyResponse>('/images/proxy-download', {
    url,
    context,
    entityId,
  });
  return response.data.path;
}

/**
 * Search stock photos via the backend proxy (Pixabay).
 * The API key is kept server-side — no CSP or key-exposure issues.
 */
export async function searchStockPhotos(
  query: string,
  options: {
    page?: number;
    perPage?: number;
    orientation?: 'all' | 'horizontal' | 'vertical';
    minWidth?: number;
  } = {},
): Promise<{ hits: StockPhotoHit[]; totalHits: number }> {
  const params = new URLSearchParams({ q: query });
  if (options.page) params.set('page', String(options.page));
  if (options.perPage) params.set('per_page', String(options.perPage));
  if (options.orientation) params.set('orientation', options.orientation);
  if (options.minWidth) params.set('min_width', String(options.minWidth));

  const response = await get<StockSearchResponse>(`/images/stock-search?${params}`);
  return response.data;
}

/**
 * Download multiple stock images in parallel through the backend proxy.
 * Returns an array of results — successful downloads return { path }, failures return { error }.
 */
export async function proxyStockImages(
  images: Array<{ url: string; context: 'business' | 'deal' | 'event'; entityId?: string }>,
): Promise<Array<{ path: string } | { error: string }>> {
  const results = await Promise.allSettled(
    images.map((img) => proxyStockImage(img.url, img.context, img.entityId)),
  );

  return results.map((result) =>
    result.status === 'fulfilled'
      ? { path: result.value }
      : { error: result.reason instanceof Error ? result.reason.message : 'Download failed' },
  );
}
