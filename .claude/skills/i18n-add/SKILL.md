---
name: i18n-add
description: Adds internationalization support to components and features. Use when adding new translatable strings, supporting RTL layouts, implementing language switching, or ensuring multilingual compliance.
---

# Internationalization (i18n) Skill

You are an internationalization expert for the Community Hub platform. Your role is to ensure all user-facing content is properly internationalized for the 10 supported languages, including RTL support.

## Supported Languages (Spec §8)

| Code | Language | Direction | Priority |
|------|----------|-----------|----------|
| en | English | LTR | High (Primary) |
| ar | Arabic | RTL | High |
| zh-CN | Chinese (Simplified) | LTR | High |
| vi | Vietnamese | LTR | High |
| zh-TW | Chinese (Traditional) | LTR | Medium |
| hi | Hindi | LTR | Medium |
| ur | Urdu | RTL | Medium |
| ko | Korean | LTR | Lower |
| el | Greek | LTR | Lower |
| it | Italian | LTR | Lower |

## Translation File Structure

```
locales/
├── en/
│   ├── common.json      # Shared strings (buttons, labels, errors)
│   ├── auth.json        # Authentication pages
│   ├── business.json    # Business-related strings
│   ├── events.json      # Events system
│   ├── deals.json       # Deals & promotions
│   ├── messaging.json   # Messaging system
│   ├── community.json   # Community features
│   ├── emergency.json   # Emergency alerts
│   └── admin.json       # Admin panel
├── ar/
│   └── ... (same structure)
├── zh-CN/
│   └── ...
└── ... (other languages)
```

## Translation Key Conventions

### Naming Pattern
```
{namespace}.{section}.{element}
```

### Examples
```json
// locales/en/common.json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "submit": "Submit",
      "delete": "Delete",
      "edit": "Edit",
      "close": "Close",
      "back": "Back",
      "next": "Next",
      "seeAll": "See All"
    },
    "labels": {
      "required": "Required",
      "optional": "Optional",
      "loading": "Loading...",
      "noResults": "No results found",
      "error": "An error occurred"
    },
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email address",
      "minLength": "Must be at least {{min}} characters",
      "maxLength": "Must be no more than {{max}} characters"
    },
    "time": {
      "justNow": "Just now",
      "minutesAgo": "{{count}} minute ago",
      "minutesAgo_plural": "{{count}} minutes ago",
      "hoursAgo": "{{count}} hour ago",
      "hoursAgo_plural": "{{count}} hours ago",
      "daysAgo": "{{count}} day ago",
      "daysAgo_plural": "{{count}} days ago"
    }
  }
}
```

```json
// locales/en/business.json
{
  "business": {
    "profile": {
      "title": "Business Profile",
      "about": "About",
      "hours": "Opening Hours",
      "contact": "Contact Information",
      "location": "Location",
      "reviews": "Reviews",
      "photos": "Photos"
    },
    "hours": {
      "open": "Open",
      "closed": "Closed",
      "openNow": "Open Now",
      "closedNow": "Closed Now",
      "opensAt": "Opens at {{time}}",
      "closesAt": "Closes at {{time}}"
    },
    "actions": {
      "save": "Save Business",
      "saved": "Saved",
      "share": "Share",
      "getDirections": "Get Directions",
      "call": "Call",
      "message": "Send Message",
      "writeReview": "Write a Review"
    },
    "claim": {
      "title": "Claim This Business",
      "description": "Are you the owner? Claim this business to manage your listing.",
      "button": "Claim Business"
    }
  }
}
```

## Using Translations in Code

### React with react-i18next

```tsx
import { useTranslation } from 'react-i18next';

function BusinessCard({ business }) {
  const { t } = useTranslation('business');

  return (
    <div className="business-card">
      <h2>{business.name}</h2>

      {/* Simple key */}
      <span>{t('hours.openNow')}</span>

      {/* With interpolation */}
      <span>{t('hours.opensAt', { time: '9:00 AM' })}</span>

      {/* Pluralization */}
      <span>{t('common:time.minutesAgo', { count: 5 })}</span>

      {/* Namespace prefix for cross-namespace */}
      <button>{t('common:buttons.save')}</button>
    </div>
  );
}
```

### Handling Pluralization

```json
// English
{
  "reviews": {
    "count": "{{count}} review",
    "count_plural": "{{count}} reviews",
    "count_zero": "No reviews yet"
  }
}

// Arabic (has different plural forms)
{
  "reviews": {
    "count_zero": "لا توجد تقييمات",
    "count_one": "تقييم واحد",
    "count_two": "تقييمان",
    "count_few": "{{count}} تقييمات",
    "count_many": "{{count}} تقييمًا",
    "count_other": "{{count}} تقييم"
  }
}
```

### Date/Time Formatting

```tsx
import { useTranslation } from 'react-i18next';
import { format, formatRelative } from 'date-fns';
import { ar, zhCN, vi } from 'date-fns/locale';

const locales = {
  en: undefined, // default
  ar,
  'zh-CN': zhCN,
  vi,
  // ... other locales
};

function FormattedDate({ date }) {
  const { i18n } = useTranslation();
  const locale = locales[i18n.language];

  return (
    <time dateTime={date.toISOString()}>
      {format(date, 'PPP', { locale })}
    </time>
  );
}
```

### Number/Currency Formatting

```tsx
function FormattedPrice({ amount, currency = 'AUD' }) {
  const { i18n } = useTranslation();

  const formatted = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency,
  }).format(amount);

  return <span>{formatted}</span>;
}

// Usage
<FormattedPrice amount={29.99} /> // "$29.99" in en, "٢٩٫٩٩ AU$" in ar
```

## RTL (Right-to-Left) Support

### HTML Direction Attribute

```tsx
// Set on html element based on language
function App() {
  const { i18n } = useTranslation();
  const isRtl = ['ar', 'ur'].includes(i18n.language);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRtl]);

  return <RouterProvider router={router} />;
}
```

### CSS Logical Properties

Always use logical properties instead of physical:

```css
/* Physical (breaks in RTL) */
.card {
  margin-left: 16px;
  padding-right: 8px;
  text-align: left;
  border-left: 2px solid blue;
}

/* Logical (works in both directions) */
.card {
  margin-inline-start: 16px;
  padding-inline-end: 8px;
  text-align: start;
  border-inline-start: 2px solid blue;
}
```

### Tailwind CSS Logical Utilities

```tsx
// Physical utilities (avoid)
<div className="ml-4 pr-2 text-left pl-8">

// Logical utilities (use these)
<div className="ms-4 pe-2 text-start ps-8">

// Direction-aware flexbox
<div className="flex flex-row">  {/* Already RTL-aware */}

// Icons that indicate direction
<ChevronRightIcon className="rtl:rotate-180" />
```

### Bidirectional Text

```tsx
// For mixed LTR/RTL content
<p dir="auto">{userGeneratedContent}</p>

// Force direction for specific content
<span dir="ltr">+61 2 1234 5678</span>  {/* Phone numbers always LTR */}
<span dir="ltr">user@email.com</span>    {/* Emails always LTR */}
```

## Language Switching

### Language Selector Component

```tsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
];

function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = async (code: string) => {
    await i18n.changeLanguage(code);
    // Optionally save preference to user profile
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### Language Detection Priority

1. URL parameter (`?lang=ar`)
2. User preference (stored in profile/localStorage)
3. Browser language (`navigator.language`)
4. Default (`en`)

## Adding New Translatable Content

### Checklist for New Features

1. **Identify all user-facing strings**
   - Labels, buttons, headings
   - Error messages
   - Placeholder text
   - Tooltips and hints
   - Success/confirmation messages

2. **Create translation keys**
   - Use descriptive, hierarchical keys
   - Group by feature/section
   - Include context in key names

3. **Add to English file first**
   - This is the source of truth
   - Include comments for translators if context needed

4. **Add placeholder keys for other languages**
   - Can use English as fallback initially
   - Mark for translation

5. **Test RTL layout**
   - Switch to Arabic/Urdu
   - Check layout doesn't break
   - Verify icons flip correctly

### Example: Adding a New Feature

```json
// locales/en/deals.json - Add new flash deals section
{
  "deals": {
    "flash": {
      "title": "Flash Deals",
      "subtitle": "Limited time offers",
      "endsIn": "Ends in {{time}}",
      "remaining": "{{count}} remaining",
      "remaining_plural": "{{count}} remaining",
      "soldOut": "Sold Out",
      "claimDeal": "Claim Deal",
      "termsApply": "Terms and conditions apply"
    }
  }
}
```

```tsx
// Component using the translations
function FlashDealCard({ deal }) {
  const { t } = useTranslation('deals');

  return (
    <Card>
      <Badge>{t('flash.title')}</Badge>
      <h3>{deal.title}</h3>
      <CountdownTimer
        endTime={deal.endTime}
        label={t('flash.endsIn', { time: '{{time}}' })}
      />
      <span>{t('flash.remaining', { count: deal.remaining })}</span>
      <Button>{t('flash.claimDeal')}</Button>
      <small>{t('flash.termsApply')}</small>
    </Card>
  );
}
```

## Auto-Translation (User Content)

For user-generated content (reviews, messages), the platform uses Google Translate API:

```tsx
import { useTranslation } from 'react-i18next';

function TranslatableContent({ content, originalLanguage }) {
  const { i18n, t } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const needsTranslation = originalLanguage !== i18n.language;

  const handleTranslate = async () => {
    setIsTranslating(true);
    const result = await translateContent(content, i18n.language);
    setTranslated(result);
    setIsTranslating(false);
  };

  return (
    <div>
      <p>{translated || content}</p>
      {needsTranslation && !translated && (
        <button onClick={handleTranslate} disabled={isTranslating}>
          {isTranslating ? t('common:labels.loading') : t('common:buttons.translate')}
        </button>
      )}
      {translated && (
        <small>{t('common:labels.translatedFrom', { language: originalLanguage })}</small>
      )}
    </div>
  );
}
```

## Testing i18n

- [ ] All hardcoded strings extracted to translation files
- [ ] Translation keys follow naming convention
- [ ] Pluralization works correctly
- [ ] Date/time formatting respects locale
- [ ] Number/currency formatting respects locale
- [ ] RTL layout works (Arabic, Urdu)
- [ ] Language switching works smoothly
- [ ] Fallback to English works if translation missing
- [ ] Long translations don't break layouts (German is often longer)
