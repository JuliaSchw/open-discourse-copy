import React from "react";
import { ChangeEvent } from "react";
import SelectInput, { DataProps } from "./select-input";

export interface FormParams {
  contentQuery?: string | null;
  factionIdQuery?: string | null;
  politicianIdQuery?: string | null;
  positionShortQuery?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface DefaultDateInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
  prefix: string;
}

export const DefaultDateInput = ({
  onChange,
  value,
  prefix,
}: DefaultDateInputProps) => {
  return (
    <div className="flex items-center rounded border border-gray-300 bg-white px-3 py-2">
      <span className="mr-2 text-sm text-gray-700">{prefix}</span>
      <input
        value={value}
        placeholder="YYYY-MM-DD"
        type="date"
        className="w-full bg-transparent text-sm outline-none"
        onChange={onChange}
      />
    </div>
  );
};

export interface DefaultSelectInputProps {
  rawData: DataProps[];
  onSelect: (element: DataProps | undefined) => void;
  placeholder: string;
  initialValue?: DataProps;
}

export const DefaultSelectInput = ({
  rawData,
  onSelect,
  placeholder,
  initialValue,
}: DefaultSelectInputProps) => {
  return (
    <SelectInput
      width="100%"
      placeholder={placeholder}
      rawData={rawData}
      onSelect={onSelect}
      inputProps={{
        className:
          "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500",
      }}
      boxProps={{
        className: "rounded border border-gray-200 bg-white shadow-sm",
      }}
      buttonProps={{
        className:
          "w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-100",
      }}
      initialValue={initialValue}
    />
  );
};
