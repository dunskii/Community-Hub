import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Sidebar } from '../Sidebar';

expect.extend(toHaveNoViolations);

describe('Sidebar', () => {
  it('renders children when not collapsed', () => {
    render(
      <Sidebar title="Test Sidebar">
        <div>Test Content</div>
      </Sidebar>
    );
    expect(screen.getByText('Test Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('toggles collapse state', () => {
    render(
      <Sidebar title="Test Sidebar">
        <div>Test Content</div>
      </Sidebar>
    );

    const toggleButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleButton);

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('starts collapsed when initiallyCollapsed is true', () => {
    render(
      <Sidebar title="Test Sidebar" initiallyCollapsed={true}>
        <div>Test Content</div>
      </Sidebar>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Sidebar title="Test Sidebar">
        <div>Test Content</div>
      </Sidebar>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Sidebar title="Test Sidebar">
        <div>Test Content</div>
      </Sidebar>
    );

    const toggleButton = screen.getByLabelText('Collapse sidebar');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });
});
