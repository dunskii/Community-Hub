import React, { useState } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItem[];
  /** Allow multiple items to be open */
  allowMultiple?: boolean;
  /** Default open items (array of IDs) */
  defaultOpenItems?: string[];
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenItems = [],
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(defaultOpenItems)
  );

  const handleToggle = (itemId: string, disabled?: boolean) => {
    if (disabled) return;

    setOpenItems(prev => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(itemId)) {
        newOpenItems.delete(itemId);
      } else {
        if (!allowMultiple) {
          newOpenItems.clear();
        }
        newOpenItems.add(itemId);
      }
      return newOpenItems;
    });
  };

  return (
    <div className="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id} className="border-b last:border-b-0 border-gray-200">
            <button
              id={`accordion-header-${item.id}`}
              onClick={() => handleToggle(item.id, item.disabled)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              disabled={item.disabled}
              className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
              style={{ minHeight: '44px' }}
            >
              <span className="font-medium text-gray-900">{item.title}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isOpen}
              className={`px-4 py-3 text-gray-700 ${isOpen ? 'block' : 'hidden'}`}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
