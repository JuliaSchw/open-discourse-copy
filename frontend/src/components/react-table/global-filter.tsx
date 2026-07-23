import React from "react";
import { Row } from "react-table";
import { Search } from "react-feather";

interface GlobalFilterProps {
  preGlobalFilteredRows: Row<Record<string, unknown>>[];
  globalFilter: unknown;
  setGlobalFilter: (value: unknown) => void;
}
export const GlobalFilter: React.FC<GlobalFilterProps> = ({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) => {
  const count = preGlobalFilteredRows.length;
  const inputValue = typeof globalFilter === "string" ? globalFilter : "";

  return (
    <div className="relative max-w-md">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
        placeholder={`Search ${count} records...`}
        value={inputValue}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setGlobalFilter(event.target.value);
        }}
      />
    </div>
  );
};
