import { describe, it, expect, vi, beforeEach } from 'vitest';

import { sanitize } from '../../middleware/sanitize.js';

function mockReqRes(body: unknown = {}) {
  const req = { body } as unknown as import('express').Request;
  const res = {} as unknown as import('express').Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('sanitize middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('richTextFields', () => {
    it('should sanitize rich text fields in body', () => {
      const { req, res, next } = mockReqRes({
        content: '<p>Hello</p><script>alert(1)</script>',
      });

      sanitize({ richTextFields: ['content'] })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.content).toContain('<p>Hello</p>');
      expect(req.body.content).not.toContain('<script>');
    });

    it('should preserve allowed HTML tags in rich text', () => {
      const { req, res, next } = mockReqRes({
        content: '<p>Hello <strong>world</strong></p>',
      });

      sanitize({ richTextFields: ['content'] })(req, res, next);

      expect(req.body.content).toContain('<strong>');
    });
  });

  describe('plainTextFields', () => {
    it('should strip all HTML from plain text fields', () => {
      const { req, res, next } = mockReqRes({
        title: '<p>Hello <strong>world</strong></p>',
      });

      sanitize({ plainTextFields: ['title'] })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.title).toBe('Hello world');
    });
  });

  describe('mixed fields', () => {
    it('should handle both rich text and plain text fields', () => {
      const { req, res, next } = mockReqRes({
        title: '<b>Bold title</b>',
        content: '<p>Rich <em>content</em></p><script>bad</script>',
      });

      sanitize({
        richTextFields: ['content'],
        plainTextFields: ['title'],
      })(req, res, next);

      expect(req.body.title).toBe('Bold title');
      expect(req.body.content).toContain('<em>content</em>');
      expect(req.body.content).not.toContain('<script>');
    });
  });

  describe('edge cases', () => {
    it('should skip non-string fields', () => {
      const { req, res, next } = mockReqRes({
        count: 42,
        tags: ['a', 'b'],
      });

      sanitize({ plainTextFields: ['count', 'tags'] })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.count).toBe(42);
      expect(req.body.tags).toEqual(['a', 'b']);
    });

    it('should skip missing fields without error', () => {
      const { req, res, next } = mockReqRes({ name: 'Test' });

      sanitize({ richTextFields: ['nonexistent'], plainTextFields: ['missing'] })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('Test');
    });

    it('should handle empty body', () => {
      const { req, res, next } = mockReqRes({});

      sanitize({ richTextFields: ['content'] })(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle null body', () => {
      const { req, res, next } = mockReqRes(null);

      sanitize({ richTextFields: ['content'] })(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next with no options', () => {
      const { req, res, next } = mockReqRes({ content: '<p>Test</p>' });

      sanitize({})(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
