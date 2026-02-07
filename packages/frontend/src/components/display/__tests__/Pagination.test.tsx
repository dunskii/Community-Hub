import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Pagination } from '../Pagination';

expect.extend(toHaveNoViolations);

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders page numbers', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to page 5')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);
    const currentPage = screen.getByLabelText('Go to page 3');
    expect(currentPage).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange when page number is clicked', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    const page3 = screen.getByLabelText('Go to page 3');
    fireEvent.click(page3);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when next button is clicked', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);
    const nextButton = screen.getByLabelText('Go to next page');
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when previous button is clicked', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);
    const prevButton = screen.getByLabelText('Go to previous page');
    fireEvent.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    const prevButton = screen.getByLabelText('Go to previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);
    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeDisabled();
  });

  it('has minimum touch target size of 44px', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    const page1 = screen.getByLabelText('Go to page 1');
    const styles = window.getComputedStyle(page1);
    expect(styles.minWidth).toBe('44px');
    expect(styles.minHeight).toBe('44px');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
