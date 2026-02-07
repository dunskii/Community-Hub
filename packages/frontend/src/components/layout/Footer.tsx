import React from 'react';

interface SocialLink {
  platform: string;
  url: string;
}

interface PartnerLogo {
  name: string;
  url: string;
  altText: string;
}

interface FooterProps {
  /** Platform name from config */
  platformName?: string;
  /** Partner logos from config */
  partnerLogos?: PartnerLogo[];
  /** Social media links */
  socialLinks?: SocialLink[];
}

export function Footer({
  platformName = 'Community Hub',
  partnerLogos = [],
  socialLinks = [],
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="bg-gray-900 text-white py-12"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Home</a></li>
              <li><a href="/businesses" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Businesses</a></li>
              <li><a href="/events" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Events</a></li>
              <li><a href="/community" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Community</a></li>
              <li><a href="/deals" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Deals</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">About</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">FAQ</a></li>
              <li><a href="/blog" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Blog</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Terms of Service</a></li>
              <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Privacy Policy</a></li>
              <li><a href="/cookies" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Partners & Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stay Connected</h3>

            {/* Newsletter Signup */}
            <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="newsletter-email"
                placeholder="Your email"
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-shade-10 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Subscribe
              </button>
            </form>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-4 mb-6">
                {socialLinks.map(link => (
                  <a
                    key={link.platform}
                    href={link.url}
                    aria-label={`Follow us on ${link.platform}`}
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{link.platform}</span>
                    {/* Icon would go here - using text for now */}
                    {link.platform.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            )}

            {/* Partner Logos */}
            {partnerLogos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Our Partners</h4>
                <div className="grid grid-cols-2 gap-4">
                  {partnerLogos.map(partner => (
                    <a
                      key={partner.name}
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    >
                      <img
                        src={partner.url}
                        alt={partner.altText}
                        className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>
            &copy; {currentYear} {platformName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
