import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Button from '../Button';

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders an anchor element when href is provided', () => {
    render(<Button href="https://example.com">Link Button</Button>);
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders a React Router Link when to is provided', () => {
    render(
      <BrowserRouter>
        <Button to="/about">Router Link</Button>
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: /router link/i });
    expect(link).toHaveAttribute('href', '/about');
  });

  it('applies the correct variant classes', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button', { name: /ghost button/i });
    expect(button.className).toContain('bg-transparent');
    expect(button.className).toContain('text-ink');
  });
});
