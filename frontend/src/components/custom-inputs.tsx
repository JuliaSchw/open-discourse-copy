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
    <div className="join w-full">
      <span className="join-item inline-flex min-w-[58px] items-center border border-base-300 bg-base-200 px-3 text-sm font-semibold text-base-content/80">
        {prefix}
      </span>
      <input
        value={value}
        placeholder="YYYY-MM-DD"
        type="date"
        className="input input-bordered join-item w-full"
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
        className: "input input-bordered w-full pr-10",
      }}
      boxProps={{
        className:
          "menu rounded-box border border-base-300 bg-base-100 p-1 shadow",
      }}
      buttonProps={{
        className:
          "rounded-btn w-full px-3 py-2 text-left text-sm hover:bg-base-200",
      }}
      initialValue={initialValue}
    />
  );
};
