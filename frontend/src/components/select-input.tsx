import React, { useState } from "react";
import { Search, X } from "react-feather";

export interface DataProps {
  label: string;
  key: string;
}

export interface SelectInputProps {
  placeholder: string;
  rawData: DataProps[];
  width?: string;
  first?: number;
  onSelect?: (element: DataProps | undefined) => void;
  boxProps?: { className?: string };
  inputProps?: { className?: string };
  buttonProps?: { className?: string };
  initialValue?: DataProps;
}

export const SelectInput = ({
  width,
  placeholder,
  rawData,
  onSelect,
  boxProps,
  buttonProps,
  inputProps,
  initialValue,
  first = 50,
}: SelectInputProps): JSX.Element => {
  const [focusedInput, setFocusedInput] = useState(false);
  const [focusedButton, setFocusedButton] = useState(false);
  const [selected, setSelected] = useState<DataProps | null>(
    initialValue || null,
  );
  const [input, setInput] = useState(initialValue?.label || "");

  return (
    <div className="relative inline-block" style={{ width }}>
      <div
        className="relative"
        onFocus={() => setFocusedInput(true)}
        onBlur={() => {
          setTimeout(() => {
            if (!selected) setInput("");
            setFocusedInput(false);
          }, 150);
        }}
      >
        <input
          placeholder={placeholder}
          onChange={(e) => {
            setInput(e.target.value);
            setSelected(null);
          }}
          value={selected ? selected.label : input}
          className={`w-full rounded border border-gray-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-pink-500 ${inputProps?.className || ""}`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {selected ? (
            <X size={18} className="text-gray-500" />
          ) : (
            <Search size={18} className="text-pink-500" />
          )}
        </div>
      </div>
      {focusedInput || focusedButton ? (
        <div
          className={`absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-sm ${boxProps?.className || ""}`}
          onFocus={() => setFocusedButton(true)}
          onBlur={() => setFocusedButton(false)}
        >
          {rawData
            .filter(
              (element) =>
                input &&
                element.label.toLowerCase().includes(input?.toLowerCase()),
            )
            .slice(0, first)
            .map((element) => (
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${buttonProps?.className || ""}`}
                onClick={() => {
                  setInput(element.label);
                  setSelected(element);
                  setFocusedButton(false);
                  setFocusedInput(false);
                  if (onSelect) onSelect(element);
                }}
                key={element.key}
              >
                {element.label}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
};

export default SelectInput;
