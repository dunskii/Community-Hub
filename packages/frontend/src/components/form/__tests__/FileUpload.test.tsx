import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FileUpload } from '../FileUpload';

expect.extend(toHaveNoViolations);

describe('FileUpload', () => {
  it('renders with label', () => {
    render(<FileUpload label="Upload file" />);
    expect(screen.getByText('Upload file')).toBeInTheDocument();
  });

  it('renders drop zone text', () => {
    render(<FileUpload label="Upload file" />);
    expect(screen.getByText(/Drop files here or click to upload/i)).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<FileUpload label="Upload file" error="File is required" />);
    expect(screen.getByText('File is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows max file size when provided', () => {
    render(<FileUpload label="Upload file" maxSizeMB={5} />);
    expect(screen.getByText('Max file size: 5MB')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FileUpload label="Upload file" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<FileUpload label="Upload file" disabled />);
    const input = screen.getByLabelText('Upload file');
    expect(input).toBeDisabled();
  });
});
