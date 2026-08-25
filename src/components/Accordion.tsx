import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';

export interface AccordionItemData {
  title: string;
  content: string;
}

function Item({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItemData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink">{item.title}</span>
        <Icon
          name="chevron"
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-muted">
              {item.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: AccordionItemData[];
  defaultOpen?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  return (
    <div>
      {items.map((item, i) => (
        <Item
          key={item.title}
          item={item}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
