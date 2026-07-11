import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const OTHER_OPTION_VALUE = '__other__';

interface SelectWithOtherProps {
  label: string;
  options: string[];
  /** The resolved value that gets submitted — either a picked option or the typed "other" text. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  otherPlaceholder?: string;
  required?: boolean;
}

/**
 * A <select> populated from a known list, plus an "Other" option that reveals
 * a free-text input. Whichever the user lands on (a listed option or the
 * typed-in text) is what gets reported via onChange, so callers just see a
 * single resolved string value.
 */
export function SelectWithOther({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  otherPlaceholder = 'Type your own',
  required,
}: SelectWithOtherProps) {
  const [otherMode, setOtherMode] = useState(() => value !== '' && !options.includes(value));

  // Keeps otherMode in sync when `value` changes from outside (e.g. an async
  // prefill from an existing submission arriving after the options list loads).
  useEffect(() => {
    if (value === '') return;
    setOtherMode(!options.includes(value));
  }, [value, options]);

  const handleSelectChange = (selected: string) => {
    if (selected === OTHER_OPTION_VALUE) {
      setOtherMode(true);
      onChange('');
    } else {
      setOtherMode(false);
      onChange(selected);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={otherMode ? OTHER_OPTION_VALUE : value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-zinc-200 bg-white p-3 pr-10 focus:border-black focus:outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value={OTHER_OPTION_VALUE}>Other</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
      {otherMode && (
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
          className="mt-2 w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
        />
      )}
    </div>
  );
}
