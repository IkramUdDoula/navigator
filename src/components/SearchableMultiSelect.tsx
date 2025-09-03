import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  color?: string; // Optional color for labels
}

interface SearchableMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  icon,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const prevOpenRef = React.useRef(open);

  // Reset search term when popover closes
  React.useEffect(() => {
    if (prevOpenRef.current && !open) {
      setSearchTerm("");
    }
    prevOpenRef.current = open;
  }, [open]);

  // Memoize the options to prevent unnecessary recalculations
  const optionsMap = React.useMemo(() => {
    return new Map(options.map(option => [option.value, option]));
  }, [options]);

  // Filter options based on search term - memoized with useMemo
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeSelection = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(selected.filter((item) => item !== value));
  };

  // Memoize the selected options to prevent unnecessary re-renders
  const selectedOptions = React.useMemo(() => {
    return selected.map(value => optionsMap.get(value)).filter(Boolean) as Option[];
  }, [selected, optionsMap]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="truncate">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : selected.length === 1 && selectedOptions[0] ? (
                <div className="flex items-center gap-2">
                  {selectedOptions[0].color && (
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: selectedOptions[0].color }}
                    />
                  )}
                  <span>{selectedOptions[0].label}</span>
                </div>
              ) : (
                <span>{selected.length} selected</span>
              )}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" sideOffset={5} avoidCollisions={true}>
        <Command>
          <CommandInput 
            placeholder="Search..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={`option-${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    )}>
                      <Check className={cn("h-4 w-4", selected.includes(option.value) ? "opacity-100" : "opacity-0")} />
                    </div>
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}