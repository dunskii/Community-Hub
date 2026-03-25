/**
 * Footer Component
 * Global site footer with navigation, legal links, and copyright.
 * WCAG 2.1 AA compliant
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  platformName?: string;
}

export function Footer({ platformName = 'Community Hub' }: FooterProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="bg-slate-900 dark:bg-slate-950 text-slate-300"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t('footer.platform', 'Platform')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.home', 'Home')}
                </Link>
              </li>
              <li>
                <Link to="/businesses" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.businesses', 'Businesses')}
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.events', 'Events')}
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.deals', 'Deals')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t('footer.resources', 'Resources')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.about', 'About')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.faq', 'FAQ')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.contact', 'Contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t('footer.legal', 'Legal')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.privacyPolicy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.termsOfService', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t('footer.cookiePolicy', 'Cookie Policy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* About Platform */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {platformName}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.description', 'Connecting local businesses with the community. Discover, engage, and support your neighbourhood.')}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} {platformName}. {t('footer.allRightsReserved', 'All rights reserved.')}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              {t('footer.privacy', 'Privacy')}
            </Link>
            <span className="text-slate-700">|</span>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              {t('footer.terms', 'Terms')}
            </Link>
            <span className="text-slate-700">|</span>
            <Link to="/cookies" className="hover:text-slate-300 transition-colors">
              {t('footer.cookies', 'Cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
