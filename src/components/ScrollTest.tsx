import React from 'react';
import { SearchableMultiSelect } from '@/components/SearchableMultiSelect';

export function ScrollTest() {
  // Create many test options to ensure scrolling
  const testOptions = Array.from({ length: 100 }, (_, i) => ({
    value: `option-${i}`,
    label: `Option ${i + 1}`
  }));

  const [selected, setSelected] = React.useState<string[]>([]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Scroll Test</h1>
      <div className="w-80">
        <SearchableMultiSelect
          options={testOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Select options..."
        />
      </div>
      <div className="mt-4">
        <p>Selected: {selected.length > 0 ? selected.join(', ') : 'None'}</p>
      </div>
    </div>
  );
}