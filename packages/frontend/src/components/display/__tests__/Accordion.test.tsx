import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Accordion, AccordionItem } from '../Accordion';

expect.extend(toHaveNoViolations);

const mockItems: AccordionItem[] = [
  { id: 'item1', title: 'Item 1', content: <div>Content 1</div> },
  { id: 'item2', title: 'Item 2', content: <div>Content 2</div> },
  { id: 'item3', title: 'Item 3', content: <div>Content 3</div>, disabled: true },
];

describe('Accordion', () => {
  it('renders all accordion items', () => {
    render(<Accordion items={mockItems} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('expands item on click', () => {
    render(<Accordion items={mockItems} />);
    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);
    expect(screen.getByText('Content 1')).toBeVisible();
  });

  it('collapses item when clicked again', () => {
    render(<Accordion items={mockItems} />);
    const item1Button = screen.getByText('Item 1');
    fireEvent.click(item1Button);
    expect(screen.getByText('Content 1')).toBeVisible();
    fireEvent.click(item1Button);
    expect(screen.queryByText('Content 1')).not.toBeVisible();
  });

  it('closes other items when allowMultiple is false', () => {
    render(<Accordion items={mockItems} allowMultiple={false} />);
    const item1Button = screen.getByText('Item 1');
    const item2Button = screen.getByText('Item 2');

    fireEvent.click(item1Button);
    expect(screen.getByText('Content 1')).toBeVisible();

    fireEvent.click(item2Button);
    expect(screen.getByText('Content 2')).toBeVisible();
    expect(screen.queryByText('Content 1')).not.toBeVisible();
  });

  it('keeps multiple items open when allowMultiple is true', () => {
    render(<Accordion items={mockItems} allowMultiple={true} />);
    const item1Button = screen.getByText('Item 1');
    const item2Button = screen.getByText('Item 2');

    fireEvent.click(item1Button);
    fireEvent.click(item2Button);

    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('disables disabled items', () => {
    render(<Accordion items={mockItems} />);
    const item3Button = screen.getByText('Item 3').closest('button');
    expect(item3Button).toBeDisabled();
  });

  it('has proper ARIA attributes', () => {
    render(<Accordion items={mockItems} />);
    const item1Button = screen.getByText('Item 1').closest('button');
    expect(item1Button).toHaveAttribute('aria-expanded', 'false');
    expect(item1Button).toHaveAttribute('aria-controls', 'accordion-panel-item1');
  });

  it('updates aria-expanded when item is opened', () => {
    render(<Accordion items={mockItems} />);
    const item1Button = screen.getByText('Item 1').closest('button');
    fireEvent.click(item1Button!);
    expect(item1Button).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Accordion items={mockItems} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
