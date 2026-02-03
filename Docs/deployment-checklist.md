# Deployment Checklist for New Suburbs

Use this checklist when deploying Community Hub to a new location.

## 1. Environment Setup

- [ ] Create new `.env` file from `.env.example`
- [ ] Configure database connection (`DATABASE_URL`)
- [ ] Set up Redis connection (`REDIS_URL`)
- [ ] Set up Elasticsearch connection (`ELASTICSEARCH_URL`)
- [ ] Generate `SESSION_SECRET` (64+ random characters)
- [ ] Generate `ENCRYPTION_KEY` (32-byte base64-encoded AES-256 key)
- [ ] Configure all API keys (Mapbox, Google Translate, Google OAuth, Mailgun, Twilio, Firebase, Google Business Profile)
- [ ] Configure media storage path on DigitalOcean Droplet (`STORAGE_PATH`)

## 2. Platform Configuration

- [ ] Copy `config/platform.json` from template
- [ ] Update `platform.id` to new suburb identifier
- [ ] Update all `location` fields (suburb name, coordinates, bounding box, timezone, postcode)
- [ ] Update all `branding` fields (platform name, tagline, description, colours)
- [ ] Update `branding.logos` paths and upload logo files
- [ ] Update `branding.socialHashtags` for the new location
- [ ] Configure `partners` information (council, chamber of commerce)
- [ ] Review and adjust `features` flags for local requirements
- [ ] Update `multilingual` settings for local demographics
- [ ] Configure `seo` fields (title, description, keywords, OG image)
- [ ] Set `contact` email addresses
- [ ] Update `legal` information including ABN
- [ ] Adjust `limits` if different from defaults

## 3. Assets

- [ ] Create logo variations (primary, light, dark)
- [ ] Create favicon and app icons (multiple sizes)
- [ ] Create Apple Touch Icon
- [ ] Create Open Graph image (1200x630px)
- [ ] Upload partner logos
- [ ] Create hero/banner images

## 4. Database Seeding

- [ ] Run database migrations
- [ ] Seed business categories
- [ ] Seed event categories
- [ ] Configure email templates
- [ ] Set initial system settings
- [ ] Create admin user accounts

## 5. Cloudflare, DNS & SSL

- [ ] Add domain to Cloudflare and update registrar nameservers
- [ ] Configure DNS records (A record to Droplet IP, CNAME for www)
- [ ] Enable Cloudflare SSL/TLS (Full Strict mode) with edge certificates
- [ ] Generate Cloudflare Origin Certificate and install on Nginx
- [ ] Configure Cloudflare caching rules (static assets, media)
- [ ] Enable Cloudflare WAF and DDoS protection
- [ ] Set up Cloudflare Page Rules (force HTTPS, cache levels)
- [ ] Configure Cloudflare API token for cache purge integration

## 6. Testing

- [ ] Verify all location references display correctly
- [ ] Test map functionality with new coordinates and bounding box
- [ ] Verify "Open Now" calculations with correct timezone
- [ ] Test email delivery (Mailgun)
- [ ] Test SMS delivery (Twilio, if enabled)
- [ ] Test WhatsApp delivery (Twilio, if enabled)
- [ ] Verify branding throughout platform (colours, logos, names)
- [ ] Test multilingual support with configured languages
- [ ] Verify PWA installation works
- [ ] Run Lighthouse audit (target score > 80)
- [ ] Run WCAG 2.1 AA accessibility audit
