'use client';

import { useId } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';

interface DateFieldProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

const isoString = (date: Date | null) =>
  date ? date.toISOString().split('T')[0] : '';

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  required,
  minDate,
  maxDate,
  disabled,
  helperText,
  className,
}: DateFieldProps) {
  const id = useId();
  const selectedDate = value ? new Date(value) : null;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <DatePicker
          id={id}
          selected={selectedDate}
          onChange={(date) => onChange(isoString(date))}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          required={required}
          disabled={disabled}
          dateFormat="PPP"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          fixedHeight
        />
        <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
