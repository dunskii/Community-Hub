import { describe, it, expect, beforeEach } from 'vitest';
import {
  isDocumentRTL,
  getInlineStart,
  getInlineEnd,
  mirrorIcon,
} from '../rtl';

describe('RTL Utils', () => {
  beforeEach(() => {
    // Reset to LTR before each test
    document.documentElement.setAttribute('dir', 'ltr');
  });

  describe('isDocumentRTL', () => {
    it('should return false when dir is ltr', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(isDocumentRTL()).toBe(false);
    });

    it('should return true when dir is rtl', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(isDocumentRTL()).toBe(true);
    });

    it('should return false when dir attribute is not set', () => {
      document.documentElement.removeAttribute('dir');
      expect(isDocumentRTL()).toBe(false);
    });
  });

  describe('getInlineStart', () => {
    it('should return left for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(getInlineStart()).toBe('left');
    });

    it('should return right for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(getInlineStart()).toBe('right');
    });
  });

  describe('getInlineEnd', () => {
    it('should return right for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(getInlineEnd()).toBe('right');
    });

    it('should return left for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(getInlineEnd()).toBe('left');
    });
  });

  describe('mirrorIcon', () => {
    it('should return none for LTR', () => {
      document.documentElement.setAttribute('dir', 'ltr');
      expect(mirrorIcon()).toBe('none');
    });

    it('should return scaleX(-1) for RTL', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      expect(mirrorIcon()).toBe('scaleX(-1)');
    });
  });

  describe('RTL utility consistency', () => {
    it('should provide consistent values for LTR mode', () => {
      document.documentElement.setAttribute('dir', 'ltr');

      expect(isDocumentRTL()).toBe(false);
      expect(getInlineStart()).toBe('left');
      expect(getInlineEnd()).toBe('right');
      expect(mirrorIcon()).toBe('none');
    });

    it('should provide consistent values for RTL mode', () => {
      document.documentElement.setAttribute('dir', 'rtl');

      expect(isDocumentRTL()).toBe(true);
      expect(getInlineStart()).toBe('right');
      expect(getInlineEnd()).toBe('left');
      expect(mirrorIcon()).toBe('scaleX(-1)');
    });
  });
});
