import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tabs, Tab } from '../Tabs';

expect.extend(toHaveNoViolations);

const mockTabs: Tab[] = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div>, disabled: true },
];

describe('Tabs', () => {
  it('renders all tabs', () => {
    render(<Tabs tabs={mockTabs} />);
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<Tabs tabs={mockTabs} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tab on click', () => {
    render(<Tabs tabs={mockTabs} />);
    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    fireEvent.click(tab2);
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<Tabs tabs={mockTabs} defaultActiveTab="tab2" />);
    const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
    expect(tab2).toHaveAttribute('aria-selected', 'true');
  });

  it('disables disabled tabs', () => {
    render(<Tabs tabs={mockTabs} />);
    const tab3 = screen.getByRole('tab', { name: 'Tab 3' });
    expect(tab3).toBeDisabled();
  });

  it('supports keyboard navigation with arrow keys', () => {
    render(<Tabs tabs={mockTabs} />);
    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    tab1.focus();
    fireEvent.keyDown(tab1, { key: 'ArrowRight' });
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<Tabs tabs={mockTabs} />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1).toHaveAttribute('aria-controls', 'panel-tab1');

    const panel1 = screen.getByRole('tabpanel', { hidden: false });
    expect(panel1).toHaveAttribute('id', 'panel-tab1');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Tabs tabs={mockTabs} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
