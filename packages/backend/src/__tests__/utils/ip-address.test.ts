/**
 * IP Address Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { Request } from 'express';
import {
  getClientIp,
  getAllIps,
  isPrivateIp,
  sanitizeIpForLogging,
} from '../../utils/ip-address';

// Helper to create mock request
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ip: undefined,
    socket: { remoteAddress: undefined },
    ...overrides,
  } as any;
}

describe('IP Address Utilities', () => {
  describe('getClientIp', () => {
    it('should extract IP from CF-Connecting-IP header (Cloudflare)', () => {
      const req = createMockRequest({
        headers: { 'cf-connecting-ip': '203.0.113.5' },
      });

      expect(getClientIp(req)).toBe('203.0.113.5');
    });

    it('should extract IP from X-Real-IP header (Nginx)', () => {
      const req = createMockRequest({
        headers: { 'x-real-ip': '198.51.100.10' },
      });

      expect(getClientIp(req)).toBe('198.51.100.10');
    });

    it('should extract first IP from X-Forwarded-For header', () => {
      const req = createMockRequest({
        headers: { 'x-forwarded-for': '192.0.2.1, 203.0.113.2, 198.51.100.3' },
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('should handle X-Forwarded-For with single IP', () => {
      const req = createMockRequest({
        headers: { 'x-forwarded-for': '192.0.2.1' },
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('should handle X-Forwarded-For as array', () => {
      const req = createMockRequest({
        headers: { 'x-forwarded-for': ['192.0.2.1', '203.0.113.2'] as any },
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('should fall back to req.ip', () => {
      const req = createMockRequest({
        ip: '192.0.2.1',
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('should fall back to socket.remoteAddress', () => {
      const req = createMockRequest({
        socket: { remoteAddress: '192.0.2.1' } as any,
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });

    it('should return "unknown" if no IP found', () => {
      const req = createMockRequest();

      expect(getClientIp(req)).toBe('unknown');
    });

    it('should prioritize CF-Connecting-IP over other headers', () => {
      const req = createMockRequest({
        headers: {
          'cf-connecting-ip': '203.0.113.1',
          'x-forwarded-for': '192.0.2.1',
          'x-real-ip': '198.51.100.1',
        },
      });

      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('should prioritize X-Real-IP over X-Forwarded-For', () => {
      const req = createMockRequest({
        headers: {
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1',
        },
      });

      expect(getClientIp(req)).toBe('198.51.100.1');
    });

    it('should trim whitespace from X-Forwarded-For IPs', () => {
      const req = createMockRequest({
        headers: { 'x-forwarded-for': '  192.0.2.1  , 203.0.113.2  ' },
      });

      expect(getClientIp(req)).toBe('192.0.2.1');
    });
  });

  describe('getAllIps', () => {
    it('should return all IPs from proxy chain', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '192.0.2.1, 203.0.113.2',
          'x-real-ip': '198.51.100.1',
        },
        ip: '203.0.113.3',
      });

      const ips = getAllIps(req);

      expect(ips).toContain('192.0.2.1');
      expect(ips).toContain('203.0.113.2');
      expect(ips).toContain('198.51.100.1');
      expect(ips).toContain('203.0.113.3');
    });

    it('should deduplicate IPs', () => {
      const req = createMockRequest({
        headers: {
          'x-forwarded-for': '192.0.2.1',
          'x-real-ip': '192.0.2.1',
        },
        ip: '192.0.2.1',
      });

      const ips = getAllIps(req);

      expect(ips).toEqual(['192.0.2.1']);
    });

    it('should return ["unknown"] if no IPs found', () => {
      const req = createMockRequest();

      expect(getAllIps(req)).toEqual(['unknown']);
    });
  });

  describe('isPrivateIp', () => {
    it('should identify localhost addresses', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('unknown')).toBe(true);
    });

    it('should identify 10.0.0.0/8 range', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('should identify 172.16.0.0/12 range', () => {
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
    });

    it('should identify 192.168.0.0/16 range', () => {
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('192.168.255.255')).toBe(true);
    });

    it('should return false for public IPs', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('203.0.113.1')).toBe(false);
    });

    it('should not match IPs outside private ranges', () => {
      expect(isPrivateIp('11.0.0.1')).toBe(false); // Just outside 10.0.0.0/8
      expect(isPrivateIp('172.15.0.1')).toBe(false); // Just below 172.16.0.0/12
      expect(isPrivateIp('172.32.0.1')).toBe(false); // Just above 172.16.0.0/12
      expect(isPrivateIp('192.167.0.1')).toBe(false); // Just below 192.168.0.0/16
      expect(isPrivateIp('192.169.0.1')).toBe(false); // Just above 192.168.0.0/16
    });
  });

  describe('sanitizeIpForLogging', () => {
    it('should currently return IP unchanged', () => {
      expect(sanitizeIpForLogging('192.0.2.1')).toBe('192.0.2.1');
      expect(sanitizeIpForLogging('203.0.113.5')).toBe('203.0.113.5');
    });

    it('should handle unknown IP', () => {
      expect(sanitizeIpForLogging('unknown')).toBe('unknown');
    });
  });
});
