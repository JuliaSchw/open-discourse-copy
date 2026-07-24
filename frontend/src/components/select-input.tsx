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
          className={`input input-bordered w-full pr-10 ${inputProps?.className || ""}`}
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
          className={`absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 shadow ${boxProps?.className || ""}`}
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
                className={`btn btn-ghost btn-sm h-auto w-full justify-start px-3 py-2 text-left normal-case ${buttonProps?.className || ""}`}
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
