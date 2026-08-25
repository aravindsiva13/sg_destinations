import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Stepper from '../Stepper';

describe('Stepper', () => {
  it('renders the label and current value', () => {
    render(<Stepper value={3} onChange={vi.fn()} />);
    expect(screen.getByText('Guests')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onChange with an incremented value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={3} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Increase guests' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with a decremented value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={3} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Decrease guests' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('never increments above max', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={5} max={5} onChange={onChange} />);

    const inc = screen.getByRole('button', { name: 'Increase guests' });
    expect(inc).toBeDisabled();
    await user.click(inc);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('never decrements below min', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={1} min={1} onChange={onChange} />);

    const dec = screen.getByRole('button', { name: 'Decrease guests' });
    expect(dec).toBeDisabled();
    await user.click(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses a custom label in the button aria-labels', () => {
    render(<Stepper value={2} onChange={vi.fn()} label="Adults" />);
    expect(
      screen.getByRole('button', { name: 'Increase adults' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Decrease adults' })
    ).toBeInTheDocument();
  });
});
