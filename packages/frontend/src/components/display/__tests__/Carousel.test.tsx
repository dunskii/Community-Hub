import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Carousel } from '../Carousel';

expect.extend(toHaveNoViolations);

const mockSlides = [
  <div key="1">Slide 1</div>,
  <div key="2">Slide 2</div>,
  <div key="3">Slide 3</div>,
];

describe('Carousel', () => {
  it('renders all slides', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('shows first slide by default', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const slide1 = screen.getByText('Slide 1').parentElement;
    expect(slide1).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('navigates to next slide', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const nextButton = screen.getByLabelText('Next slide');
    fireEvent.click(nextButton);

    const slide2 = screen.getByText('Slide 2').parentElement;
    expect(slide2).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('navigates to previous slide', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const prevButton = screen.getByLabelText('Previous slide');
    fireEvent.click(prevButton);

    const slide3 = screen.getByText('Slide 3').parentElement;
    expect(slide3).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('shows indicators', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 3')).toBeInTheDocument();
  });

  it('navigates to specific slide via indicators', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const indicator2 = screen.getByLabelText('Go to slide 2');
    fireEvent.click(indicator2);

    const slide2 = screen.getByText('Slide 2').parentElement;
    expect(slide2).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('has minimum touch target size of 44px for navigation', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const nextButton = screen.getByLabelText('Next slide');
    const styles = window.getComputedStyle(nextButton);
    expect(styles.minWidth).toBe('44px');
    expect(styles.minHeight).toBe('44px');
  });

  it('has proper ARIA attributes', () => {
    render(<Carousel>{mockSlides}</Carousel>);
    const region = screen.getByRole('region', { name: 'Carousel' });
    expect(region).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Carousel>{mockSlides}</Carousel>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('hides navigation when showNavigation is false', () => {
    render(<Carousel showNavigation={false}>{mockSlides}</Carousel>);
    expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
  });

  it('hides indicators when showIndicators is false', () => {
    render(<Carousel showIndicators={false}>{mockSlides}</Carousel>);
    expect(screen.queryByLabelText('Go to slide 1')).not.toBeInTheDocument();
  });
});
