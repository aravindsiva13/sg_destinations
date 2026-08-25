import Icon from './Icon';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label?: string;
}

/** Numeric stepper used for guest counts in the booking widgets. */
export default function Stepper({
  value,
  min = 1,
  max = 12,
  onChange,
  label = 'Guests',
}: StepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-forest hover:text-forest disabled:opacity-40"
        >
          <Icon name="minus" className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-forest hover:text-forest disabled:opacity-40"
        >
          <Icon name="plus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
