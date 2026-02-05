import { describe, it, expect } from 'vitest';

import { sanitizeRichText, stripHtml, sanitizeUrl } from '../../utils/sanitizer.js';

describe('sanitizeRichText', () => {
  it('should allow permitted tags', () => {
    const input = '<p>Hello <strong>world</strong> and <em>everyone</em></p>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('should allow list tags', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('should allow ordered lists', () => {
    const input = '<ol><li>First</li><li>Second</li></ol>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
  });

  it('should allow br tags', () => {
    const input = 'Line 1<br>Line 2';
    const result = sanitizeRichText(input);
    expect(result).toContain('<br>');
  });

  it('should allow anchor tags with href', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Link');
  });

  it('should add rel="nofollow noopener" to anchor tags', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('rel="nofollow noopener"');
  });

  it('should strip script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should strip iframe tags', () => {
    const input = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<iframe');
  });

  it('should strip object tags', () => {
    const input = '<object data="https://evil.com"></object>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<object');
  });

  it('should strip embed tags', () => {
    const input = '<embed src="https://evil.com">';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<embed');
  });

  it('should strip style tags', () => {
    const input = '<style>body { display: none; }</style><p>Content</p>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<style');
    expect(result).toContain('<p>Content</p>');
  });

  it('should strip event handler attributes', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('onclick');
  });

  it('should strip onerror attributes', () => {
    const input = '<p onerror="alert(1)">Text</p>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('onerror');
  });

  it('should strip data attributes', () => {
    const input = '<p data-custom="value">Text</p>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('data-custom');
  });

  it('should handle empty string', () => {
    expect(sanitizeRichText('')).toBe('');
  });

  it('should handle plain text without HTML', () => {
    const input = 'Just plain text';
    expect(sanitizeRichText(input)).toBe('Just plain text');
  });

  it('should strip div tags (not in allowlist)', () => {
    const input = '<div>Content</div>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain('<div');
    expect(result).toContain('Content');
  });
});

describe('stripHtml', () => {
  it('should remove all HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    expect(stripHtml(input)).toBe('Hello world');
  });

  it('should handle nested tags', () => {
    const input = '<div><p><strong>Deep</strong></p></div>';
    expect(stripHtml(input)).toBe('Deep');
  });

  it('should handle empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should preserve plain text', () => {
    const input = 'No HTML here';
    expect(stripHtml(input)).toBe('No HTML here');
  });

  it('should strip all tags including safe ones', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = stripHtml(input);
    expect(result).not.toContain('<a');
    expect(result).toBe('Link');
  });

  it('should strip script content', () => {
    const input = '<script>alert(1)</script>Safe text';
    const result = stripHtml(input);
    expect(result).not.toContain('alert');
  });
});

describe('sanitizeUrl', () => {
  it('should accept http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should accept https URLs', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('should accept mailto URLs', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('should reject javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('should reject data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('should reject vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBeNull();
  });

  it('should return null for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('should preserve query parameters', () => {
    const url = 'https://example.com/search?q=test&page=1';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should preserve hash fragments', () => {
    const url = 'https://example.com/page#section';
    expect(sanitizeUrl(url)).toBe(url);
  });
});
