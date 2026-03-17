/**
 * useKeyboardShortcuts Hook
 *
 * [UI/UX Spec v2.2 §3 - Keyboard Shortcuts]
 *
 * Registers and handles keyboard shortcuts with support for:
 * - Modifier keys (ctrl, alt, shift, meta)
 * - Key sequences (e.g., 'g' then 'h' for "go home")
 * - Scope isolation (global vs page-specific)
 * - Form input protection (shortcuts disabled when typing)
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: '/', action: () => searchRef.current?.focus(), description: 'Focus search' },
 *   { key: 'Escape', action: closeModal, description: 'Close modal' },
 *   { key: 'h', sequence: 'g', action: () => navigate('/'), description: 'Go home' },
 * ]);
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';

export interface KeyboardShortcut {
  /** The key to trigger the shortcut (e.g., '/', 'Escape', 'h') */
  key: string;
  /** Optional modifier keys */
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  /** Optional sequence prefix (e.g., 'g' for 'g then h') */
  sequence?: string;
  /** Action to execute when shortcut is triggered */
  action: () => void;
  /** Human-readable description for help modal */
  description: string;
  /** Scope - global shortcuts work everywhere, page shortcuts only on specific pages */
  scope?: 'global' | 'page';
  /** Whether shortcut should work even when in form inputs */
  allowInInput?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Timeout for key sequences in ms (default: 1000) */
  sequenceTimeout?: number;
}

// Track the sequence prefix key globally
let sequenceKey: string | null = null;
let sequenceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Check if the current focus is in an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isEditable = target.isContentEditable;

  return isInput || isEditable;
}

/**
 * Check if modifiers match
 */
function modifiersMatch(
  event: KeyboardEvent,
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[],
  key?: string
): boolean {
  const required = modifiers || [];

  const ctrlRequired = required.includes('ctrl');
  const altRequired = required.includes('alt');
  const shiftRequired = required.includes('shift');
  const metaRequired = required.includes('meta');

  // For Mac, we treat Cmd (meta) as equivalent to Ctrl
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  // For keys that naturally require shift (like ? = Shift+/), we ignore shift check
  const shiftProducedKey = ['?', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '~'].includes(key || '');

  return (
    (ctrlRequired ? ctrlOrMeta : !event.ctrlKey && !event.metaKey) &&
    (altRequired ? event.altKey : !event.altKey) &&
    (shiftRequired || shiftProducedKey ? true : !event.shiftKey) &&
    (metaRequired ? event.metaKey : true) // Meta is optional if not required
  );
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, sequenceTimeout = 1000 } = options;
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target;
      const key = event.key.toLowerCase();

      // Find matching shortcuts
      for (const shortcut of shortcutsRef.current) {
        const shortcutKey = shortcut.key.toLowerCase();

        // Skip if in input and not allowed
        if (isInputElement(target) && !shortcut.allowInInput) {
          // Exception: Escape should always work to close modals
          if (shortcutKey !== 'escape') {
            continue;
          }
        }

        // Check if this is a sequence shortcut
        if (shortcut.sequence) {
          // If we have a pending sequence and it matches
          if (sequenceKey === shortcut.sequence.toLowerCase() && key === shortcutKey) {
            // Check modifiers
            if (modifiersMatch(event, shortcut.modifiers)) {
              event.preventDefault();
              shortcut.action();
              // Clear sequence
              sequenceKey = null;
              if (sequenceTimer) clearTimeout(sequenceTimer);
              return;
            }
          }
        } else {
          // Non-sequence shortcut
          if (key === shortcutKey && modifiersMatch(event, shortcut.modifiers, shortcutKey)) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }

      // Check if this key starts a sequence
      const startsSequence = shortcutsRef.current.some(
        (s) => s.sequence?.toLowerCase() === key
      );

      if (startsSequence && !isInputElement(target)) {
        sequenceKey = key;
        // Clear any existing timer
        if (sequenceTimer) clearTimeout(sequenceTimer);
        // Set timeout to clear sequence
        sequenceTimer = setTimeout(() => {
          sequenceKey = null;
        }, sequenceTimeout);
      }
    },
    [enabled, sequenceTimeout]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Clear sequence on unmount
      if (sequenceTimer) clearTimeout(sequenceTimer);
      sequenceKey = null;
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.includes('ctrl')) {
    parts.push('Ctrl');
  }
  if (shortcut.modifiers?.includes('alt')) {
    parts.push('Alt');
  }
  if (shortcut.modifiers?.includes('shift')) {
    parts.push('Shift');
  }
  if (shortcut.modifiers?.includes('meta')) {
    parts.push('Cmd');
  }

  if (shortcut.sequence) {
    parts.push(shortcut.sequence.toUpperCase());
    parts.push('then');
  }

  // Format special keys
  const keyDisplay = shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return parts.join(' + ').replace(' + then + ', ' then ');
}

/**
 * Hook to get all registered shortcuts for display
 */
export function useShortcutsList(): KeyboardShortcut[] {
  // This is a simple implementation - in a more complex app,
  // you might want to use a context to collect shortcuts from all components
  return [];
}
