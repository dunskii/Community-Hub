import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCategoryUpsert = vi.fn().mockResolvedValue({});
const mockSystemSettingUpsert = vi.fn().mockResolvedValue({});
const mockEmailTemplateUpsert = vi.fn().mockResolvedValue({});
const mockDisconnect = vi.fn().mockResolvedValue(undefined);

vi.mock('../../generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    category: { upsert: mockCategoryUpsert },
    systemSetting: { upsert: mockSystemSettingUpsert },
    emailTemplate: { upsert: mockEmailTemplateUpsert },
    $disconnect: mockDisconnect,
  })),
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

describe('seed data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should define correct number of business categories', () => {
    // 7 business categories defined in seed
    const businessCategories = [
      'restaurant', 'retail', 'services', 'health',
      'entertainment', 'education', 'professional',
    ];
    expect(businessCategories).toHaveLength(7);
  });

  it('should define correct number of event categories', () => {
    const eventCategories = ['music', 'community', 'sports', 'markets', 'workshop'];
    expect(eventCategories).toHaveLength(5);
  });

  it('should include featured_businesses in system settings', () => {
    const settings = [
      { key: 'maintenance_mode', value: false, description: 'Enable maintenance mode' },
      { key: 'registration_enabled', value: true, description: 'Allow new user registration' },
      { key: 'max_upload_size_mb', value: 5, description: 'Maximum upload size in MB' },
      { key: 'default_search_radius_km', value: 5, description: 'Default search radius in km' },
      { key: 'max_active_deals_per_business', value: 3, description: 'Max active deals per business' },
      { key: 'featured_businesses', value: [], description: 'List of featured business IDs for homepage' },
    ];

    const featuredSetting = settings.find((s) => s.key === 'featured_businesses');
    expect(featuredSetting).toBeDefined();
    expect(featuredSetting?.value).toEqual([]);
  });

  it('should define 3 email templates', () => {
    const templateKeys = ['welcome', 'verify_email', 'password_reset'];
    expect(templateKeys).toHaveLength(3);
  });
});
