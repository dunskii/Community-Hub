import React from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
}

interface BottomNavigationProps {
  /** Current active path */
  currentPath?: string;
}

export function BottomNavigation({ currentPath = '/' }: BottomNavigationProps) {
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: 'home' },
    { label: 'Explore', href: '/businesses', icon: 'search' },
    { label: 'Messages', href: '/messages', icon: 'chat' },
    { label: 'Profile', href: '/profile', icon: 'person' },
    { label: 'Menu', href: '/menu', icon: 'menu' },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-primary'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {item.icon === 'home' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                )}
                {item.icon === 'search' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                )}
                {item.icon === 'chat' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                )}
                {item.icon === 'person' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                )}
                {item.icon === 'menu' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
