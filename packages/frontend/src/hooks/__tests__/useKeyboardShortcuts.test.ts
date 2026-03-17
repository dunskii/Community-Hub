import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  formatShortcut,
  type KeyboardShortcut,
} from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const fireKeyDown = (
    key: string,
    options: Partial<{
      ctrlKey: boolean;
      altKey: boolean;
      shiftKey: boolean;
      metaKey: boolean;
      target: HTMLElement;
    }> = {}
  ) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ctrlKey: options.ctrlKey ?? false,
      altKey: options.altKey ?? false,
      shiftKey: options.shiftKey ?? false,
      metaKey: options.metaKey ?? false,
    });

    // Override target if provided
    if (options.target) {
      Object.defineProperty(event, 'target', {
        value: options.target,
        writable: false,
      });
    }

    document.dispatchEvent(event);
    return event;
  };

  describe('basic shortcuts', () => {
    it('should trigger action when shortcut key is pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Test shortcut' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('/');
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should handle Escape key', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'Escape', action, description: 'Close modal' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('Escape');
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when different key is pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Test shortcut' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('a');
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('should be case insensitive', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'H', action, description: 'Test shortcut' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('h');
      });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier keys', () => {
    it('should trigger with ctrl modifier', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', modifiers: ['ctrl'], action, description: 'Ctrl+K' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without ctrl - should not trigger
      act(() => {
        fireKeyDown('k');
      });
      expect(action).not.toHaveBeenCalled();

      // With ctrl - should trigger
      act(() => {
        fireKeyDown('k', { ctrlKey: true });
      });
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger with meta key (Mac Cmd) as ctrl equivalent', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', modifiers: ['ctrl'], action, description: 'Ctrl+K' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('k', { metaKey: true });
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should trigger with multiple modifiers', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 's', modifiers: ['ctrl', 'shift'], action, description: 'Ctrl+Shift+S' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // With both modifiers - should trigger
      act(() => {
        fireKeyDown('s', { ctrlKey: true, shiftKey: true });
      });
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should require all specified modifiers', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'p', modifiers: ['ctrl', 'alt'], action, description: 'Ctrl+Alt+P' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Missing alt - should not trigger
      act(() => {
        fireKeyDown('p', { ctrlKey: true });
      });
      expect(action).not.toHaveBeenCalled();

      // With both modifiers - should trigger
      act(() => {
        fireKeyDown('p', { ctrlKey: true, altKey: true });
      });
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('key sequences', () => {
    it('should trigger sequence shortcut', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'h', sequence: 'g', action, description: 'Go home' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // First key of sequence
      act(() => {
        fireKeyDown('g');
      });
      expect(action).not.toHaveBeenCalled();

      // Second key of sequence
      act(() => {
        fireKeyDown('h');
      });
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should timeout sequence after default timeout', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'h', sequence: 'g', action, description: 'Go home' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // First key of sequence
      act(() => {
        fireKeyDown('g');
      });

      // Wait for timeout
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Second key - too late
      act(() => {
        fireKeyDown('h');
      });
      expect(action).not.toHaveBeenCalled();
    });

    it('should respect custom sequence timeout', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'h', sequence: 'g', action, description: 'Go home' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, { sequenceTimeout: 500 }));

      // First key of sequence
      act(() => {
        fireKeyDown('g');
      });

      // Wait less than custom timeout
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Second key - still in time
      act(() => {
        fireKeyDown('h');
      });
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('input protection', () => {
    it('should not trigger when focus is in input element', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search' },
      ];

      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('/', { target: input });
      });

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger when focus is in textarea', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search' },
      ];

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('/', { target: textarea });
      });

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should allow Escape even in input elements', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'Escape', action, description: 'Close modal' },
      ];

      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('Escape', { target: input });
      });

      expect(action).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });

    it('should trigger when allowInInput is true', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search', allowInInput: true },
      ];

      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        fireKeyDown('/', { target: input });
      });

      expect(action).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('enabled option', () => {
    it('should not trigger when disabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search' },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

      act(() => {
        fireKeyDown('/');
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('should work when re-enabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search' },
      ];

      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts(shortcuts, { enabled }),
        { initialProps: { enabled: false } }
      );

      act(() => {
        fireKeyDown('/');
      });
      expect(action).not.toHaveBeenCalled();

      rerender({ enabled: true });

      act(() => {
        fireKeyDown('/');
      });
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '/', action, description: 'Search' },
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

      unmount();

      act(() => {
        fireKeyDown('/');
      });

      expect(action).not.toHaveBeenCalled();
    });
  });
});

describe('formatShortcut', () => {
  it('should format simple key', () => {
    const shortcut: KeyboardShortcut = {
      key: '/',
      action: vi.fn(),
      description: 'Search',
    };

    expect(formatShortcut(shortcut)).toBe('/');
  });

  it('should format key with ctrl modifier', () => {
    const shortcut: KeyboardShortcut = {
      key: 'k',
      modifiers: ['ctrl'],
      action: vi.fn(),
      description: 'Command palette',
    };

    expect(formatShortcut(shortcut)).toBe('Ctrl + K');
  });

  it('should format key with multiple modifiers', () => {
    const shortcut: KeyboardShortcut = {
      key: 's',
      modifiers: ['ctrl', 'shift'],
      action: vi.fn(),
      description: 'Save as',
    };

    expect(formatShortcut(shortcut)).toBe('Ctrl + Shift + S');
  });

  it('should format sequence shortcut', () => {
    const shortcut: KeyboardShortcut = {
      key: 'h',
      sequence: 'g',
      action: vi.fn(),
      description: 'Go home',
    };

    expect(formatShortcut(shortcut)).toBe('G then H');
  });

  it('should format Space key', () => {
    const shortcut: KeyboardShortcut = {
      key: ' ',
      action: vi.fn(),
      description: 'Toggle',
    };

    expect(formatShortcut(shortcut)).toBe('Space');
  });

  it('should format meta modifier as Cmd', () => {
    const shortcut: KeyboardShortcut = {
      key: 'p',
      modifiers: ['meta'],
      action: vi.fn(),
      description: 'Print',
    };

    expect(formatShortcut(shortcut)).toBe('Cmd + P');
  });
});
