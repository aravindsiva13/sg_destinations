import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  searchText?: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openList() {
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setHighlight(idx);
    setIsOpen(true);
  }

  function select(valueToSelect: string) {
    onChange(valueToSelect);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openList();
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => (h + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => (h - 1 + options.length) % options.length);
        break;
      case 'Home':
        e.preventDefault();
        setHighlight(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[highlight]) select(options[highlight].value);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }

  useEffect(() => {
    if (isOpen && listRef.current) {
      const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlight]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-left text-sm text-ink outline-none transition-colors focus:border-forest hover:border-forest/50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && options[highlight] ? `${options[highlight].value}-opt` : undefined}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : <span className="text-muted">{placeholder}</span>}
        </span>
        <Icon
          name="chevron"
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onKeyDown={onListKeyDown}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-paper py-1 shadow-lg outline-none"
            role="listbox"
            aria-label={placeholder}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${option.value}-opt`}
                role="option"
                aria-selected={option.value === value}
                data-active={index === highlight}
                onClick={() => select(option.value)}
                onMouseEnter={() => setHighlight(index)}
                className={`cursor-pointer px-3.5 py-2 text-sm outline-none transition-colors hover:bg-forest/5 ${
                  index === highlight ? 'bg-forest/10 text-forest' : ''
                } ${
                  option.value === value && index !== highlight
                    ? 'font-medium text-forest'
                    : 'text-ink'
                }`}
              >
                {option.label}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3.5 py-2 text-sm text-muted" role="option" aria-disabled="true">
                No options available
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
