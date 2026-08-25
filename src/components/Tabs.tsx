import { useId } from 'react';
import { motion } from 'framer-motion';

export interface TabOption {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  const baseId = useId();
  const focusedIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      e.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
    onChange(tabs[next].id);
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      aria-label="Categories"
      className={`flex overflow-x-auto border-b border-line/60 hide-scrollbar ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isFocused = focusedIndex === index;
        return (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={isFocused ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`relative whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
              isActive ? 'text-forest' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
