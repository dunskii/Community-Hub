/**
 * GlobalShortcuts Component
 *
 * [UI/UX Spec v2.2 §3 - Keyboard Shortcuts]
 *
 * Registers global keyboard shortcuts for the application.
 * Must be rendered inside BrowserRouter to access navigation.
 *
 * Shortcuts:
 * - `/` : Focus search bar
 * - `Escape` : Close modals/overlays
 * - `?` : Show keyboard shortcuts help
 * - `g` then `h` : Go to Home
 * - `g` then `b` : Go to Businesses
 * - `g` then `e` : Go to Events
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '../ui/KeyboardShortcutsHelp';

interface GlobalShortcutsProps {
  children: React.ReactNode;
}

export function GlobalShortcuts({ children }: GlobalShortcutsProps) {
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Focus search bar
  const focusSearch = useCallback(() => {
    const searchInput = document.getElementById('search-bar-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  // Close any open modal or overlay
  const closeOverlay = useCallback(() => {
    // Close shortcuts help if open
    if (showShortcutsHelp) {
      setShowShortcutsHelp(false);
      return;
    }

    // Try to close any modal by dispatching escape to document
    // This will be caught by Modal component's keydown handler
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);
  }, [showShortcutsHelp]);

  // Show shortcuts help
  const showHelp = useCallback(() => {
    setShowShortcutsHelp(true);
  }, []);

  // Navigation shortcuts
  const goHome = useCallback(() => navigate('/'), [navigate]);
  const goBusinesses = useCallback(() => navigate('/businesses'), [navigate]);
  const goEvents = useCallback(() => navigate('/events'), [navigate]);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: focusSearch,
      description: 'Focus search bar',
      scope: 'global',
    },
    {
      key: 'Escape',
      action: closeOverlay,
      description: 'Close modal or overlay',
      scope: 'global',
      allowInInput: true, // Escape should always work
    },
    {
      key: '?',
      action: showHelp,
      description: 'Show keyboard shortcuts',
      scope: 'global',
      // No modifiers needed - the hook handles shifted keys like ? naturally
    },
    {
      key: 'h',
      sequence: 'g',
      action: goHome,
      description: 'Go to Home',
      scope: 'global',
    },
    {
      key: 'b',
      sequence: 'g',
      action: goBusinesses,
      description: 'Go to Businesses',
      scope: 'global',
    },
    {
      key: 'e',
      sequence: 'g',
      action: goEvents,
      description: 'Go to Events',
      scope: 'global',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </>
  );
}
