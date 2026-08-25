import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Pill from '../Pill';

describe('Pill', () => {
  it('renders children correctly', () => {
    render(<Pill>Featured</Pill>);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('applies the default dark tone classes', () => {
    const { container } = render(<Pill>Dark Pill</Pill>);
    const pillElement = container.firstChild as HTMLElement;
    expect(pillElement.className).toContain('bg-black/55');
    expect(pillElement.className).toContain('text-cream');
  });

  it('applies the correct light tone classes', () => {
    const { container } = render(<Pill tone="light">Light Pill</Pill>);
    const pillElement = container.firstChild as HTMLElement;
    expect(pillElement.className).toContain('bg-cream/90');
    expect(pillElement.className).toContain('text-ink');
  });
});
