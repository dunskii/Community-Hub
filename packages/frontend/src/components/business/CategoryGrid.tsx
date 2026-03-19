/**
 * CategoryGrid Component
 * Displays categories in a responsive grid
 * WCAG 2.1 AA compliant, mobile-first
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Category } from '../../services/business-api';
import { Skeleton } from '../display/Skeleton';
import { EmptyState } from '../display/EmptyState';
import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  TicketIcon,
  TruckIcon,
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
  MusicalNoteIcon,
  BriefcaseIcon,
  HeartIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import './CategoryGrid.css';

// Map icon names from database to Heroicon components
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'utensils': BuildingStorefrontIcon,
  'food': BuildingStorefrontIcon,
  'restaurant': BuildingStorefrontIcon,
  'store': BuildingStorefrontIcon,
  'shopping-bag': ShoppingBagIcon,
  'retail': ShoppingBagIcon,
  'shopping': ShoppingBagIcon,
  'wrench': WrenchScrewdriverIcon,
  'services': WrenchScrewdriverIcon,
  'hammer': WrenchScrewdriverIcon,
  'tools': WrenchScrewdriverIcon,
  'heart-pulse': PlusCircleIcon,
  'health': PlusCircleIcon,
  'medical': PlusCircleIcon,
  'plus': PlusCircleIcon,
  'graduation-cap': AcademicCapIcon,
  'education': AcademicCapIcon,
  'ticket': TicketIcon,
  'entertainment': TicketIcon,
  'music': MusicalNoteIcon,
  'truck': TruckIcon,
  'automotive': TruckIcon,
  'car': TruckIcon,
  'home': HomeIcon,
  'house': HomeIcon,
  'users': UserGroupIcon,
  'community': UserGroupIcon,
  'trophy': TrophyIcon,
  'sports': TrophyIcon,
  'briefcase': BriefcaseIcon,
  'professional': BriefcaseIcon,
  'heart': HeartIcon,
  'fitness': HeartIcon,
};

interface CategoryGridProps {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
}

export function CategoryGrid({ categories, loading = false, error = null }: CategoryGridProps) {
  const { t, i18n } = useTranslation('category');

  // Error state
  if (error) {
    return (
      <EmptyState
        title={t('errorTitle', 'Error Loading Categories')}
        description={error}
        icon="⚠️"
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="category-grid" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading...</span>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="category-card category-card--skeleton">
            <Skeleton variant="circular" width="48px" height="48px" />
            <Skeleton variant="text" width="80%" height="20px" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <EmptyState
        title={t('noCategoriesTitle', 'No Categories Available')}
        description={t('noCategoriesDescription', 'Categories will appear here once they are created.')}
        icon="📂"
      />
    );
  }

  return (
    <div className="category-grid">
      {categories.map(category => {
        const name = typeof category.name === 'string'
          ? category.name
          : category.name[i18n.language] || category.name.en;

        // Get the icon component from the map, or use TagIcon as fallback
        const IconComponent = category.icon ? (iconMap[category.icon.toLowerCase()] || TagIcon) : TagIcon;

        return (
          <Link
            key={category.id}
            to={`/businesses?category=${category.id}`}
            className="category-card"
          >
            <div className="category-card__icon-wrapper">
              <IconComponent className="category-card__icon text-primary" aria-hidden="true" />
              {category.businessCount !== undefined && category.businessCount > 0 && (
                <span className="category-card__count" aria-label={t('businessCount', 'businesses')}>
                  {category.businessCount}
                </span>
              )}
            </div>
            <span className="category-card__name">{name}</span>
          </Link>
        );
      })}
    </div>
  );
}
