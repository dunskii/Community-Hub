import React, { useState } from 'react';

interface SidebarProps {
  /** Sidebar title */
  title?: string;
  /** Child content */
  children: React.ReactNode;
  /** Initially collapsed state */
  initiallyCollapsed?: boolean;
  /** Position: left or right */
  position?: 'left' | 'right';
}

export function Sidebar({
  title,
  children,
  initiallyCollapsed = false,
  position = 'right',
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

  return (
    <aside
      className={`bg-white border-gray-200 p-4 transition-all duration-300 ${
        position === 'left' ? 'border-r' : 'border-l'
      } ${isCollapsed ? 'w-12' : 'w-full md:w-80'}`}
      aria-label={title || 'Sidebar'}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center justify-center w-8 h-8 mb-4 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          )}
        </svg>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {title}
            </h2>
          )}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      )}
    </aside>
  );
}
