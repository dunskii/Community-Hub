/**
 * Seed system settings.
 * Spec Appendix A.20: SystemSetting model.
 */

import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { logger } from '../../utils/logger.js';

interface SettingDef {
  key: string;
  value: Prisma.InputJsonValue;
  description: string;
}

const SETTINGS: SettingDef[] = [
  { key: 'maintenance_mode', value: false, description: 'Enable maintenance mode' },
  { key: 'registration_enabled', value: true, description: 'Allow new user registration' },
  { key: 'max_upload_size_mb', value: 5, description: 'Maximum upload size in MB' },
  { key: 'default_search_radius_km', value: 5, description: 'Default search radius in km' },
  { key: 'max_active_deals_per_business', value: 3, description: 'Max active deals per business' },
  { key: 'featured_businesses', value: [], description: 'List of featured business IDs for homepage' },
];

export async function seedSystemSettings(prisma: PrismaClient): Promise<void> {
  for (const setting of SETTINGS) {
    await prisma.system_settings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updated_at: new Date(),
      },
    });
  }

  logger.info('System settings seeded');
}
