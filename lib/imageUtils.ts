/**
 * Utility functions for handling Supabase Storage image URLs
 */

import { getSupabaseClient } from './supabaseClient';

/**
 * Get the public URL for a storage path
 * @param path - The storage path (e.g., "userId/memoryId/timestamp-filename.jpg")
 * @param bucket - The bucket name (default: 'tets')
 * @returns The public URL
 */
export function getPublicImageUrl(path: string, bucket: string = 'tets'): string {
    const supabase = getSupabaseClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Get a signed URL for a storage path (for private buckets)
 * @param path - The storage path
 * @param bucket - The bucket name (default: 'tets')
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with the signed URL
 */
export async function getSignedImageUrl(
    path: string,
    bucket: string = 'tets',
    expiresIn: number = 3600
): Promise<string | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error('[STORAGE] Error creating signed URL:', error);
        return null;
    }

    return data?.signedUrl || null;
}

/**
 * Check if a URL is already a full URL or just a path
 * @param urlOrPath - The URL or path to check
 * @returns true if it's a full URL, false if it's a path
 */
export function isFullUrl(urlOrPath: string): boolean {
    return urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://');
}

/**
 * Convert a path to a public URL if needed
 * If the input is already a full URL, return it as-is
 * If it's a path, convert it to a public URL
 * @param urlOrPath - The URL or path
 * @param bucket - The bucket name (default: 'tets')
 * @returns The full public URL
 */
export function ensurePublicUrl(urlOrPath: string, bucket: string = 'tets'): string {
    if (isFullUrl(urlOrPath)) {
        return urlOrPath;
    }
    return getPublicImageUrl(urlOrPath, bucket);
}
