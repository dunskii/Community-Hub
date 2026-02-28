/**
 * Unit tests for Language Negotiation Middleware
 */

import { describe, it, expect, vi } from 'vitest';
import { languageNegotiation } from './language-negotiation.js';
import type { Request, Response, NextFunction } from 'express';

describe('languageNegotiation', () => {
  const createMockRequest = (acceptLanguageHeader?: string): Partial<Request> => ({
    get: vi.fn((header: string) => {
      if (header === 'Accept-Language') {
        return acceptLanguageHeader;
      }
      return undefined;
    }),
  });

  const mockResponse = {} as Response;
  const mockNext: NextFunction = vi.fn();

  it('should default to "en" when no Accept-Language header', () => {
    const req = createMockRequest() as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should detect English (en)', () => {
    const req = createMockRequest('en') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en');
  });

  it('should detect English from en-US', () => {
    const req = createMockRequest('en-US') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en');
  });

  it('should detect English from en-GB', () => {
    const req = createMockRequest('en-GB') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en');
  });

  it('should detect Arabic (ar)', () => {
    const req = createMockRequest('ar') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ar');
  });

  it('should detect Arabic from ar-SA', () => {
    const req = createMockRequest('ar-SA') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ar');
  });

  it('should detect Simplified Chinese (zh-CN)', () => {
    const req = createMockRequest('zh-CN') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-CN');
  });

  it('should detect Traditional Chinese (zh-TW)', () => {
    const req = createMockRequest('zh-TW') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-TW');
  });

  it('should detect Simplified Chinese from zh-Hans', () => {
    const req = createMockRequest('zh-Hans') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-CN');
  });

  it('should detect Traditional Chinese from zh-Hant', () => {
    const req = createMockRequest('zh-Hant') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-TW');
  });

  it('should default Chinese to Simplified (zh-CN)', () => {
    const req = createMockRequest('zh') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-CN');
  });

  it('should detect Vietnamese (vi)', () => {
    const req = createMockRequest('vi') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('vi');
  });

  it('should detect Hindi (hi)', () => {
    const req = createMockRequest('hi') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('hi');
  });

  it('should detect Urdu (ur)', () => {
    const req = createMockRequest('ur') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ur');
  });

  it('should detect Korean (ko)', () => {
    const req = createMockRequest('ko') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ko');
  });

  it('should detect Greek (el)', () => {
    const req = createMockRequest('el') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('el');
  });

  it('should detect Italian (it)', () => {
    const req = createMockRequest('it') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('it');
  });

  it('should handle quality values and select highest preference', () => {
    const req = createMockRequest('en;q=0.8,ar;q=0.9,vi;q=0.7') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ar'); // Highest q value
  });

  it('should handle quality values with no spaces', () => {
    const req = createMockRequest('en;q=0.5,vi;q=1.0,ar;q=0.8') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('vi'); // Highest q value
  });

  it('should default quality to 1.0 when not specified', () => {
    const req = createMockRequest('en,ar;q=0.9') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en'); // Default q=1.0 is higher than 0.9
  });

  it('should handle complex Accept-Language header', () => {
    const req = createMockRequest('en-US,en;q=0.9,ar;q=0.8,vi;q=0.7') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en'); // First with q=1.0 (en-US)
  });

  it('should fallback to English for unsupported languages', () => {
    const req = createMockRequest('fr,de,es') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en'); // Default
  });

  it('should handle mixed supported and unsupported languages', () => {
    const req = createMockRequest('fr;q=1.0,ar;q=0.9,de;q=0.8') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('ar'); // First supported language
  });

  it('should handle whitespace in Accept-Language header', () => {
    const req = createMockRequest('  en-US  ,  ar ; q=0.9  ') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('en');
  });

  it('should handle case insensitivity for Chinese variants', () => {
    const req = createMockRequest('zh-cn') as Request;

    languageNegotiation(req, mockResponse, mockNext);

    expect(req.language).toBe('zh-CN');
  });

  it('should call next() after setting language', () => {
    const req = createMockRequest('en') as Request;
    const next = vi.fn();

    languageNegotiation(req, mockResponse, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
