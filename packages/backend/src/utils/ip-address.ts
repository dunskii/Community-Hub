/**
 * IP Address Utilities
 *
 * Extract client IP address from requests, handling proxies and load balancers.
 * Spec §4: Security & Privacy
 */

import { Request } from 'express';

/**
 * Extract client IP address from request
 *
 * Handles various proxy scenarios:
 * - X-Forwarded-For (from proxies, load balancers)
 * - X-Real-IP (from nginx)
 * - CF-Connecting-IP (from Cloudflare)
 * - Direct connection IP
 *
 * Security notes:
 * - For rate limiting, use req.ip or first IP in X-Forwarded-For
 * - For logging, we log all IPs to detect proxy chains
 * - Be aware that X-Forwarded-For can be spoofed if not behind a trusted proxy
 *
 * @param req - Express request object
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  // Cloudflare CDN
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    return cfIp;
  }

  // Nginx reverse proxy
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Standard proxy header (comma-separated list, first is client)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      const ips = forwardedFor.split(',').map((ip) => ip.trim());
      if (ips[0]) {
        return ips[0];
      }
    } else if (Array.isArray(forwardedFor) && forwardedFor[0]) {
      return forwardedFor[0];
    }
  }

  // Direct connection or Express-provided IP
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Get all IP addresses from request (for audit logging)
 *
 * Returns array of IPs including proxy chain.
 * Useful for security auditing to detect proxy abuse.
 *
 * @param req - Express request object
 * @returns Array of IP addresses
 */
export function getAllIps(req: Request): string[] {
  const ips: string[] = [];

  // Get forwarded IPs
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (typeof forwardedFor === 'string') {
      ips.push(...forwardedFor.split(',').map((ip) => ip.trim()));
    } else if (Array.isArray(forwardedFor)) {
      ips.push(...forwardedFor);
    }
  }

  // Add real IP if present
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string' && !ips.includes(realIp)) {
    ips.push(realIp);
  }

  // Add direct IP
  const directIp = req.ip || req.socket.remoteAddress;
  if (directIp && !ips.includes(directIp)) {
    ips.push(directIp);
  }

  return ips.length > 0 ? ips : ['unknown'];
}

/**
 * Sanitize IP address for logging
 *
 * For privacy compliance (GDPR, Australian Privacy Principles),
 * you may want to hash or truncate IPs before long-term storage.
 *
 * Current implementation: stores full IP for security audit purposes.
 * TODO: Consider hashing for long-term storage if required by privacy policy.
 *
 * @param ip - IP address
 * @returns Sanitized IP address
 */
export function sanitizeIpForLogging(ip: string): string {
  // Currently returns full IP for security auditing
  // Future: Could implement IP hashing or truncation
  return ip;
}

/**
 * Check if IP is private/internal
 *
 * @param ip - IP address
 * @returns True if IP is private
 */
export function isPrivateIp(ip: string): boolean {
  if (ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
    return true;
  }

  // IPv4 private ranges
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
  ];

  return privateRanges.some((range) => range.test(ip));
}
