import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Grid, GridItem } from '../Grid';

expect.extend(toHaveNoViolations);

describe('Grid', () => {
  it('renders children', () => {
    render(
      <Grid>
        <GridItem>
          <div>Item 1</div>
        </GridItem>
        <GridItem>
          <div>Item 2</div>
        </GridItem>
      </Grid>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies gap classes', () => {
    const { container } = render(
      <Grid gap="lg">
        <GridItem>Item</GridItem>
      </Grid>
    );
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-6');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Grid>
        <GridItem>
          <div>Item 1</div>
        </GridItem>
      </Grid>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('GridItem', () => {
  it('applies default span of 12 columns', () => {
    const { container } = render(
      <Grid>
        <GridItem>Item</GridItem>
      </Grid>
    );
    const item = container.querySelector('.col-span-12');
    expect(item).toBeInTheDocument();
  });

  it('applies custom span', () => {
    const { container } = render(
      <Grid>
        <GridItem span={6}>Item</GridItem>
      </Grid>
    );
    const item = container.querySelector('.col-span-6');
    expect(item).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Grid>
        <GridItem>
          <div>Test Content</div>
        </GridItem>
      </Grid>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
