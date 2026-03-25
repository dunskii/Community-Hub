/**
 * Layout Component
 * Main layout wrapper with consistent Header across all pages
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { getPlatformConfig } from '../../config/platform-loader';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [platformName, setPlatformName] = useState('Guildford South Community Hub');
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/curator');

  useEffect(() => {
    try {
      const config = getPlatformConfig();
      if (config?.platform?.id === 'guildford-south') {
        setPlatformName('Guildford South Community Hub');
      } else if (config?.location?.suburbName) {
        setPlatformName(`${config.location.suburbName} Community Hub`);
      }
    } catch {
      // Use default
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <Header platformName={platformName} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {!isAdminPage && <Footer platformName={platformName} />}
    </div>
  );
}
