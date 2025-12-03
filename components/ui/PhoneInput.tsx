'use client';

import { forwardRef } from 'react';
import {
  defaultCountries,
  parseCountry,
  FlagImage,
  usePhoneInput,
  CountryIso2,
} from 'react-international-phone';
import 'react-international-phone/style.css';

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: CountryIso2;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      onChange,
      defaultCountry = 'us',
      placeholder = '(201) 555-0123',
      disabled = false,
      id,
      name,
    },
    ref
  ) {
    const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } =
      usePhoneInput({
        defaultCountry,
        value: value || '',
        countries: defaultCountries,
        onChange: (data) => {
          onChange(data.phone);
        },
      });

    return (
      <div className="phone-input-wrapper flex">
        <div className="phone-input-country relative">
          <select
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={country.iso2}
            onChange={(e) => setCountry(e.target.value as CountryIso2)}
            disabled={disabled}
          >
            {defaultCountries.map((c) => {
              const parsedCountry = parseCountry(c);
              return (
                <option key={parsedCountry.iso2} value={parsedCountry.iso2}>
                  {parsedCountry.name} (+{parsedCountry.dialCode})
                </option>
              );
            })}
          </select>
          <div className="flex items-center gap-1 px-3 py-2 border border-r-0 border-zinc-300 dark:border-zinc-700 rounded-l-md bg-zinc-50 dark:bg-zinc-900 h-[42px]">
            <FlagImage iso2={country.iso2} size={20} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              +{country.dialCode}
            </span>
            <svg
              className="w-3 h-3 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <input
          ref={ref}
          id={id}
          name={name}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-r-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[42px]"
        />
      </div>
    );
  }
);

export default PhoneInput;

