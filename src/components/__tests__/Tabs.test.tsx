import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Tabs, { type TabOption } from '../Tabs';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: { div: (props: Record<string, unknown>) => React.createElement('div', null, props.children) },
  };
});

const tabs: TabOption[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'stays', label: 'Stays' },
];

describe('Tabs', () => {
  it('renders every tab label', () => {
    render(<Tabs tabs={tabs} activeTab="overview" onChange={vi.fn()} />);
    for (const tab of tabs) {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
    }
  });

  it('calls onChange with the tab id when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="overview" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Amenities' }));
    expect(onChange).toHaveBeenCalledWith('amenities');
  });

  it('moves focus with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="stays" onChange={onChange} />);

    const stays = screen.getByRole('tab', { name: 'Stays' });
    stays.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('amenities');
  });

  it('indicates only the active tab as active', () => {
    render(<Tabs tabs={tabs} activeTab="stays" onChange={vi.fn()} />);
    const active = screen.getByRole('tab', { name: 'Stays' });
    const inactive = screen.getByRole('tab', { name: 'Overview' });

    expect(active.className).toContain('text-forest');
    expect(inactive.className).not.toContain('text-forest');
    expect(inactive.className).toContain('text-muted');
  });
});