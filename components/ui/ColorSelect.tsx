'use client';

import Select, {
  components,
  OptionProps,
  SingleValueProps,
  StylesConfig,
  GroupBase
} from 'react-select';
import { forwardRef } from 'react';

export interface ColorOption {
  value: string;
  label: string;
  color?: string;
}

interface ColorSelectProps {
  options: ColorOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  isSearchable?: boolean;
  name?: string;
  id?: string;
}

// Кастомный Option с цветным индикатором
const CustomOption = (props: OptionProps<ColorOption, false, GroupBase<ColorOption>>) => {
  const { data, isSelected, isFocused } = props;

  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        {data.color && (
          <span
            className="w-4 h-4 rounded-full flex-shrink-0 border border-zinc-300 dark:border-zinc-600"
            style={{ backgroundColor: data.color }}
          />
        )}
        <span>{data.label}</span>
      </div>
    </components.Option>
  );
};

// Кастомный SingleValue (выбранное значение)
const CustomSingleValue = (props: SingleValueProps<ColorOption, false, GroupBase<ColorOption>>) => {
  const { data } = props;

  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        {data.color && (
          <span
            className="w-4 h-4 rounded-full flex-shrink-0 border border-zinc-300 dark:border-zinc-600"
            style={{ backgroundColor: data.color }}
          />
        )}
        <span>{data.label}</span>
      </div>
    </components.SingleValue>
  );
};

// Стили для темной/светлой темы
const getStyles = (): StylesConfig<ColorOption, false, GroupBase<ColorOption>> => ({
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--select-bg, white)',
    borderColor: state.isFocused ? '#3b82f6' : 'var(--select-border, #d4d4d8)',
    borderRadius: '0.375rem',
    minHeight: '42px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : 'var(--select-border-hover, #a1a1aa)',
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--select-bg, white)',
    border: '1px solid var(--select-border, #d4d4d8)',
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
        ? 'var(--select-option-hover, #f4f4f5)'
        : 'transparent',
    color: state.isSelected ? 'white' : 'var(--select-text, #18181b)',
    cursor: 'pointer',
    padding: '8px 12px',
    '&:active': {
      backgroundColor: state.isSelected ? '#3b82f6' : 'var(--select-option-active, #e4e4e7)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--select-text, #18181b)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--select-placeholder, #a1a1aa)',
  }),
  input: (base) => ({
    ...base,
    color: 'var(--select-text, #18181b)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: 'var(--select-indicator, #71717a)',
    '&:hover': {
      color: 'var(--select-indicator-hover, #52525b)',
    },
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : undefined,
    transition: 'transform 0.2s',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--select-indicator, #71717a)',
    '&:hover': {
      color: '#ef4444',
    },
  }),
});

export const ColorSelect = forwardRef<HTMLDivElement, ColorSelectProps>(
  function ColorSelect(
    {
      options,
      value,
      onChange,
      placeholder = 'Выберите...',
      isClearable = true,
      isDisabled = false,
      isSearchable = true,
      name,
      id,
    },
    ref
  ) {
    const selectedOption = options.find(opt => opt.value === value) || null;

    return (
      <div ref={ref}>
        <Select<ColorOption, false>
          inputId={id}
          name={name}
          options={options}
          value={selectedOption}
          onChange={(option) => onChange(option?.value || '')}
          placeholder={placeholder}
          isClearable={isClearable}
          isDisabled={isDisabled}
          isSearchable={isSearchable}
          components={{
            Option: CustomOption,
            SingleValue: CustomSingleValue,
          }}
          styles={getStyles()}
          noOptionsMessage={() => 'Нет вариантов'}
          classNamePrefix="color-select"
        />
      </div>
    );
  }
);

export default ColorSelect;
