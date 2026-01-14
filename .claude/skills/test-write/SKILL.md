---
name: test-write
description: Generates comprehensive tests for Community Hub features including unit tests, integration tests, and E2E tests. Use after implementing features to ensure code quality and >80% coverage target.
---

# Test Writing Skill

You are a testing expert for the Community Hub platform. Your role is to help write comprehensive tests that ensure code quality, catch regressions, and maintain the >80% coverage target.

## Testing Stack

- **Unit Tests:** Vitest (or Jest)
- **Component Tests:** React Testing Library
- **API Tests:** Supertest
- **E2E Tests:** Playwright
- **Coverage:** Istanbul/c8

## Test File Structure

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx      # Component tests
├── services/
│   └── business.service.ts
│       └── business.service.test.ts  # Unit tests
├── routes/
│   └── business.routes.ts
│       └── business.routes.test.ts   # Integration tests
└── __tests__/
    └── e2e/
        ├── auth.spec.ts          # E2E tests
        ├── business.spec.ts
        └── fixtures/
            └── test-data.ts
```

## Unit Testing Patterns

### Service Tests

```typescript
// services/business.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BusinessService } from './business.service';
import { prismaMock } from '../__mocks__/prisma';

describe('BusinessService', () => {
  let service: BusinessService;

  beforeEach(() => {
    service = new BusinessService(prismaMock);
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a business when found', async () => {
      const mockBusiness = {
        id: '123',
        name: 'Test Business',
        slug: 'test-business',
        status: 'ACTIVE',
      };

      prismaMock.business.findUnique.mockResolvedValue(mockBusiness);

      const result = await service.findById('123');

      expect(result).toEqual(mockBusiness);
      expect(prismaMock.business.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: expect.any(Object),
      });
    });

    it('should return null when business not found', async () => {
      prismaMock.business.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      prismaMock.business.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(service.findById('123')).rejects.toThrow('DB Error');
    });
  });

  describe('create', () => {
    it('should create a business with valid data', async () => {
      const input = {
        name: 'New Business',
        description: 'A great business',
        categoryId: 'cat-123',
        email: 'business@example.com',
      };

      const mockCreated = {
        id: 'new-123',
        ...input,
        slug: 'new-business',
        status: 'PENDING',
      };

      prismaMock.business.create.mockResolvedValue(mockCreated);

      const result = await service.create(input, 'user-123');

      expect(result).toEqual(mockCreated);
      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: input.name,
          slug: 'new-business',
        }),
      });
    });

    it('should generate unique slug if name already exists', async () => {
      // First call finds existing slug
      prismaMock.business.findUnique
        .mockResolvedValueOnce({ slug: 'test-business' })
        .mockResolvedValueOnce(null);

      const input = { name: 'Test Business', categoryId: 'cat-123' };

      await service.create(input, 'user-123');

      expect(prismaMock.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.stringMatching(/test-business-\d+/),
        }),
      });
    });
  });
});
```

### Utility Function Tests

```typescript
// utils/slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from './slug';

describe('generateSlug', () => {
  it('should convert spaces to hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateSlug("Bob's Café & Restaurant")).toBe('bobs-cafe-restaurant');
  });

  it('should handle unicode characters', () => {
    expect(generateSlug('Café résumé')).toBe('cafe-resume');
  });

  it('should trim and collapse multiple hyphens', () => {
    expect(generateSlug('  Hello   World  ')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});

describe('isValidSlug', () => {
  it.each([
    ['valid-slug', true],
    ['also-valid-123', true],
    ['Invalid Slug', false],
    ['invalid_slug', false],
    ['invalid--slug', false],
    ['-invalid', false],
    ['invalid-', false],
  ])('isValidSlug("%s") should return %s', (slug, expected) => {
    expect(isValidSlug(slug)).toBe(expected);
  });
});
```

## Component Testing Patterns

### Basic Component Test

```tsx
// components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Form Component Tests

```tsx
// components/Input/Input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input label="Email" id="email-input" />);

    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays hint text', () => {
    render(<Input label="Email" hint="We'll never share your email" />);

    expect(screen.getByText(/never share/i)).toBeInTheDocument();
  });

  it('does not show hint when error is present', () => {
    render(
      <Input label="Email" hint="Hint text" error="Error text" />
    );

    expect(screen.queryByText(/hint text/i)).not.toBeInTheDocument();
    expect(screen.getByText(/error text/i)).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);

    const input = screen.getByLabelText(/email/i);
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });
});
```

### Accessibility Tests

```tsx
// components/Modal/Modal.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Modal } from './Modal';

expect.extend(toHaveNoViolations);

describe('Modal accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Modal open onOpenChange={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal open onOpenChange={() => {}} title="Test Modal">
        <input data-testid="input-1" />
        <button>Button 1</button>
        <button>Button 2</button>
      </Modal>
    );

    // Tab through all focusable elements
    await user.tab();
    expect(screen.getByTestId('input-1')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /button 1/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /button 2/i })).toHaveFocus();

    // Should cycle back to first element
    await user.tab();
    expect(screen.getByTestId('input-1')).toHaveFocus();
  });

  it('closes on Escape key', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal open onOpenChange={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledWith(false);
  });
});
```

## API Integration Tests

```typescript
// routes/business.routes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../lib/prisma';
import { createTestUser, generateAuthToken } from '../__tests__/helpers';

describe('Business Routes', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    testUser = await createTestUser({ role: 'BusinessOwner' });
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  describe('GET /api/v1/businesses', () => {
    it('returns paginated list of businesses', async () => {
      const response = await request(app)
        .get('/api/v1/businesses')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      });
    });

    it('filters by category', async () => {
      const response = await request(app)
        .get('/api/v1/businesses')
        .query({ category: 'restaurant' });

      expect(response.status).toBe(200);
      response.body.data.forEach((business: any) => {
        expect(business.categorySlug).toBe('restaurant');
      });
    });

    it('searches by name', async () => {
      const response = await request(app)
        .get('/api/v1/businesses')
        .query({ search: 'cafe' });

      expect(response.status).toBe(200);
      // All results should contain 'cafe' in name or description
    });
  });

  describe('GET /api/v1/businesses/:id', () => {
    it('returns business details', async () => {
      const business = await prisma.business.findFirst();

      const response = await request(app)
        .get(`/api/v1/businesses/${business?.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: business?.id,
        name: expect.any(String),
      });
    });

    it('returns 404 for non-existent business', async () => {
      const response = await request(app)
        .get('/api/v1/businesses/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });
  });

  describe('POST /api/v1/businesses', () => {
    it('requires authentication', async () => {
      const response = await request(app)
        .post('/api/v1/businesses')
        .send({ name: 'Test Business' });

      expect(response.status).toBe(401);
    });

    it('creates business with valid data', async () => {
      const businessData = {
        name: 'Test Business',
        description: 'A test business',
        categoryId: 'cat-123',
        email: 'test@business.com',
        phone: '+61 2 1234 5678',
        address: {
          street: '123 Test St',
          suburb: 'Test Suburb',
          postcode: '2000',
          state: 'NSW',
        },
      };

      const response = await request(app)
        .post('/api/v1/businesses')
        .set('Cookie', `token=${authToken}`)
        .send(businessData);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        name: businessData.name,
        slug: 'test-business',
      });

      // Cleanup
      await prisma.business.delete({ where: { id: response.body.data.id } });
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/v1/businesses')
        .set('Cookie', `token=${authToken}`)
        .send({ description: 'Missing name' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'name' })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits', async () => {
      // Make 101 requests (limit is 100/minute)
      const requests = Array(101).fill(null).map(() =>
        request(app).get('/api/v1/businesses')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

## E2E Tests with Playwright

```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register a new account', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.fill('[name="confirmPassword"]', 'SecurePass123');
    await page.fill('[name="displayName"]', 'New User');

    await page.click('button[type="submit"]');

    // Should redirect to email verification page
    await expect(page).toHaveURL(/verify-email/);
    await expect(page.locator('h1')).toContainText('Verify Your Email');
  });

  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'testuser@example.com');
    await page.fill('[name="password"]', 'TestPass123');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid email or password');
    await expect(page).toHaveURL('/login');
  });

  test('enforces login rate limiting', async ({ page }) => {
    await page.goto('/login');

    // Attempt 6 failed logins (limit is 5)
    for (let i = 0; i < 6; i++) {
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
    }

    await expect(page.locator('[role="alert"]')).toContainText('Too many attempts');
  });
});
```

```typescript
// __tests__/e2e/business.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers';

test.describe('Business Discovery', () => {
  test('user can search for businesses', async ({ page }) => {
    await page.goto('/');

    await page.fill('[data-testid="search-input"]', 'coffee');
    await page.click('[data-testid="search-button"]');

    await expect(page).toHaveURL(/search\?q=coffee/);
    await expect(page.locator('[data-testid="business-card"]')).toHaveCount.greaterThan(0);
  });

  test('user can filter search results', async ({ page }) => {
    await page.goto('/search?q=restaurant');

    // Apply "Open Now" filter
    await page.click('[data-testid="filter-open-now"]');

    // Apply category filter
    await page.click('[data-testid="filter-category"]');
    await page.click('text=Cafe');

    // URL should reflect filters
    await expect(page).toHaveURL(/openNow=true/);
    await expect(page).toHaveURL(/category=cafe/);
  });

  test('user can save a business', async ({ page }) => {
    await loginAsUser(page, 'testuser@example.com', 'TestPass123');

    await page.goto('/business/test-cafe');

    await page.click('[data-testid="save-button"]');

    await expect(page.locator('[data-testid="save-button"]')).toContainText('Saved');

    // Verify in saved list
    await page.goto('/saved');
    await expect(page.locator('text=Test Cafe')).toBeVisible();
  });
});
```

## Test Coverage Requirements

Target: **>80% coverage** across the codebase.

```bash
# Run tests with coverage
npm run test:coverage

# Coverage thresholds in vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## What to Test

### Must Test
- All business logic in services
- All API endpoints
- All form validations
- Authentication flows
- Authorization checks
- Error handling
- Edge cases

### Should Test
- Component rendering
- User interactions
- Accessibility compliance
- RTL layout
- Loading states

### Skip Testing
- Third-party library internals
- Generated code
- Simple getters/setters
- Static configuration
