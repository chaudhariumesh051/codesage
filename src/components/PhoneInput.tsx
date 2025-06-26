import React from 'react';
import { CountryCodeSelector } from './CountryCodeSelector';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = "Enter phone number",
  className = '',
  error,
  required = false
}) => {
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Format based on country code
    if (countryCode === '+1') {
      // US/Canada format: (123) 456-7890
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (countryCode === '+44') {
      // UK format: 020 1234 5678
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
    } else {
      // Generic format with spaces every 3-4 digits
      return digits.replace(/(\d{3,4})(?=\d)/g, '$1 ');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    onChange(formatted);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <CountryCodeSelector
          selectedCode={countryCode}
          onSelect={onCountryCodeChange}
        />
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};