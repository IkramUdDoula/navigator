import { ColorPicker } from '@/components/ColorPicker';

interface LabelColorSettingsProps {
  labels: string[];
  labelColors: Record<string, string>;
  onColorChange: (label: string, color: string) => void;
}

export function LabelColorSettings({ labels, labelColors, onColorChange }: LabelColorSettingsProps) {
  const defaultColor = '#6c757d'; // Gray color as default

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {labels.map((label) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <ColorPicker
            color={labelColors[label] || defaultColor}
            onChange={(color) => onColorChange(label, color)}
          />
        </div>
      ))}
    </div>
  );
}