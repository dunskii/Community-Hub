/**
 * CheckboxGroup
 *
 * Reusable checkbox grid for multi-select lists (languages, payment methods, etc.).
 */

interface CheckboxGroupItem {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  items: CheckboxGroupItem[];
  selectedItems: string[];
  onChange: (value: string) => void;
  columns?: number;
}

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
};

export function CheckboxGroup({ items, selectedItems, onChange, columns = 3 }: CheckboxGroupProps) {
  const gridClass = COLUMN_CLASSES[columns] || COLUMN_CLASSES[3];

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {items.map(item => (
        <label key={item.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedItems.includes(item.value)}
            onChange={() => onChange(item.value)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
        </label>
      ))}
    </div>
  );
}
