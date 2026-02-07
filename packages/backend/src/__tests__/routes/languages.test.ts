import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../index.js';
import { CacheService } from '../../cache/cache-service.js';

describe('GET /api/v1/languages', () => {
  const cacheService = CacheService.getInstance();

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.delete('platform:languages');
  });

  it('should return list of enabled languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('defaultLanguage');
    expect(res.body.defaultLanguage).toBe('en');
    expect(res.body).toHaveProperty('languages');
    expect(Array.isArray(res.body.languages)).toBe(true);
    expect(res.body.languages.length).toBeGreaterThan(0);
  });

  it('should include all required fields for each language', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const language = res.body.languages[0];
    expect(language).toHaveProperty('code');
    expect(language).toHaveProperty('name');
    expect(language).toHaveProperty('nativeName');
    expect(language).toHaveProperty('rtl');
    expect(typeof language.rtl).toBe('boolean');
  });

  it('should include RTL flag for Arabic', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const arabic = res.body.languages.find((l: any) => l.code === 'ar');
    expect(arabic).toBeDefined();
    expect(arabic.rtl).toBe(true);
    expect(arabic.name).toBe('Arabic');
    expect(arabic.nativeName).toBe('العربية');
  });

  it('should include RTL flag for Urdu', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const urdu = res.body.languages.find((l: any) => l.code === 'ur');
    expect(urdu).toBeDefined();
    expect(urdu.rtl).toBe(true);
    expect(urdu.name).toBe('Urdu');
    expect(urdu.nativeName).toBe('اردو');
  });

  it('should not include RTL flag for non-RTL languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    const english = res.body.languages.find((l: any) => l.code === 'en');
    expect(english).toBeDefined();
    expect(english.rtl).toBe(false);

    const chinese = res.body.languages.find((l: any) => l.code === 'zh-CN');
    if (chinese) {
      expect(chinese.rtl).toBe(false);
    }
  });

  it('should include all 10 enabled languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);
    expect(res.body.languages).toHaveLength(10);

    const codes = res.body.languages.map((l: any) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('ar');
    expect(codes).toContain('zh-CN');
    expect(codes).toContain('zh-TW');
    expect(codes).toContain('vi');
    expect(codes).toContain('hi');
    expect(codes).toContain('ur');
    expect(codes).toContain('ko');
    expect(codes).toContain('el');
    expect(codes).toContain('it');
  });

  it('should cache the response', async () => {
    // First request
    const res1 = await request(app).get('/api/v1/languages');
    expect(res1.status).toBe(200);

    // Check cache
    const cached = await cacheService.get('platform:languages');
    expect(cached).toBeDefined();
    expect(cached).toEqual(res1.body);

    // Second request should use cache
    const res2 = await request(app).get('/api/v1/languages');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(res1.body);
  });

  it('should be a public endpoint (no auth required)', async () => {
    const res = await request(app).get('/api/v1/languages');

    // Should not return 401 Unauthorized
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });

  it('should return correct Content-Type', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should have consistent structure across all languages', async () => {
    const res = await request(app).get('/api/v1/languages');

    expect(res.status).toBe(200);

    res.body.languages.forEach((lang: any) => {
      expect(typeof lang.code).toBe('string');
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.nativeName).toBe('string');
      expect(typeof lang.rtl).toBe('boolean');
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
    });
  });
});
