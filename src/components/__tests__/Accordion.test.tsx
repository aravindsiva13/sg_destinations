import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Accordion, { type AccordionItemData } from '../Accordion';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: { div: (props: Record<string, unknown>) => React.createElement('div', null, props.children) },
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children),
  };
});

const items: AccordionItemData[] = [
  { title: 'Check-in time', content: 'Check-in is from 2 PM.' },
  { title: 'Cancellation', content: 'Free cancellation up to 24h before.' },
];

describe('Accordion', () => {
  it('renders all item titles', () => {
    render(<Accordion items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }
  });

  it('opens the first item by default', () => {
    render(<Accordion items={items} />);
    expect(screen.getByText(items[0].content)).toBeInTheDocument();
    expect(screen.queryByText(items[1].content)).not.toBeInTheDocument();
  });

  it('does not open any item when defaultOpen is null', () => {
    render(<Accordion items={items} defaultOpen={null} />);
    expect(screen.queryByText(items[0].content)).not.toBeInTheDocument();
    expect(screen.queryByText(items[1].content)).not.toBeInTheDocument();
  });

  it('opens a specific item when defaultOpen points to it', () => {
    render(<Accordion items={items} defaultOpen={1} />);
    expect(screen.getByText(items[1].content)).toBeInTheDocument();
    expect(screen.queryByText(items[0].content)).not.toBeInTheDocument();
  });

  it('toggles content when clicking a title', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);

    // First item is open by default; click to close it.
    await user.click(screen.getByRole('button', { name: items[0].title }));
    expect(screen.queryByText(items[0].content)).not.toBeInTheDocument();

    // Click again to reopen.
    await user.click(screen.getByRole('button', { name: items[0].title }));
    expect(screen.getByText(items[0].content)).toBeInTheDocument();
  });

  it('reflects open state via aria-expanded on each button', () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole('button', { name: items[0].title });
    const second = screen.getByRole('button', { name: items[1].title });
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');
  });
});
