import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SelectDropdown, { type SelectOption } from '../SelectDropdown';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: {
      ul: ({ children, ...props }: Record<string, unknown>) =>
        React.createElement('ul', props, children),
    },
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children),
  };
});

const options: SelectOption[] = [
  { value: '1', label: 'Garden Villa' },
  { value: '2', label: 'Pool Cottage' },
  { value: '3', label: 'Treehouse' },
];

describe('SelectDropdown', () => {
  it('shows the placeholder when no value is selected', () => {
    render(<SelectDropdown value="" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.queryByText('Pool Cottage')).not.toBeInTheDocument();
  });

  it('displays a custom placeholder', () => {
    render(
      <SelectDropdown value="" onChange={vi.fn()} options={options} placeholder="Pick a stay" />
    );
    expect(screen.getByText('Pick a stay')).toBeInTheDocument();
  });

  it('shows the selected option label', () => {
    render(<SelectDropdown value="2" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Pool Cottage')).toBeInTheDocument();
  });

  it('opens the listbox on click', async () => {
    const user = userEvent.setup();
    render(<SelectDropdown value="" onChange={vi.fn()} options={options} />);

    const trigger = screen.getByRole('button', { name: /select an option/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
  });

  it('calls onChange with the selected value and closes the menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectDropdown value="" onChange={onChange} options={options} />);

    await user.click(screen.getByRole('button', { name: /select an option/i }));
    await user.click(screen.getByRole('option', { name: 'Treehouse' }));

    expect(onChange).toHaveBeenCalledWith('3');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks the current value as selected in the listbox', async () => {
    const user = userEvent.setup();
    render(<SelectDropdown value="1" onChange={vi.fn()} options={options} />);

    await user.click(screen.getByRole('button', { name: 'Garden Villa' }));
    const selectedOption = screen.getByRole('option', { name: 'Garden Villa' });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(screen.getByRole('option', { name: 'Pool Cottage' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('closes the menu when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SelectDropdown value="" onChange={vi.fn()} options={options} />
        <button>outside</button>
      </div>
    );

    await user.click(screen.getByRole('button', { name: /select an option/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders a message when there are no options', async () => {
    const user = userEvent.setup();
    render(<SelectDropdown value="" onChange={vi.fn()} options={[]} />);

    await user.click(screen.getByRole('button', { name: /select an option/i }));
    expect(screen.getByText('No options available')).toBeInTheDocument();
  });
});