import React, { useState } from "react";
import { SearchResultRow } from "../hooks/use-manage-data";
import { ResultBox } from "./result-box";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "react-feather";
import { convertPosition } from "../result-table/index";

interface ResultMobileProps {
  data: SearchResultRow[];
  pageSize?: number;
}

interface PageState {
  pageIndex: number;
  pageSize: number;
}

type TableIconButtonProps = {
  icon: React.ReactElement;
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isDisabled: boolean;
  children?: React.ReactNode;
};
export const TableIconButton: React.FC<TableIconButtonProps> = ({
  icon,
  onClick,
  isDisabled,
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Table Icon button"
      className="ml-1 rounded border border-gray-300 bg-white p-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
};

export const ResultMobile = ({
  data,
  pageSize: initialPageSize,
}: ResultMobileProps) => {
  const [pageState, setPageState] = useState<PageState>({
    pageIndex: 0,
    pageSize: initialPageSize || 10,
  });
  const pageCount = Math.ceil(data.length / pageState.pageSize);
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        {data
          .slice(
            pageState.pageIndex * pageState.pageSize,
            pageState.pageIndex * pageState.pageSize + pageState.pageSize,
          )
          .map((row) => (
            <ResultBox
              data={{
                ...row,
                abbreviation:
                  row.abbreviation == "not found"
                    ? "Ohne Zurodnung"
                    : row.abbreviation,
                positionShort: convertPosition(row.positionShort),
              }}
              key={row.id}
            />
          ))}
      </div>
      <div className="flex flex-row justify-between overflow-hidden py-8">
        <div className="flex flex-row">
          <TableIconButton
            onClick={() => setPageState({ ...pageState, pageIndex: 0 })}
            isDisabled={pageState.pageIndex <= 0 || pageCount == 0}
            icon={<ChevronsLeft size={20} />}
          />
          <TableIconButton
            isDisabled={pageState.pageIndex <= 0 || pageCount == 0}
            onClick={() =>
              setPageState({
                ...pageState,
                pageIndex: pageState.pageIndex - 1,
              })
            }
            icon={<ChevronLeft size={20} />}
          />
        </div>
        <div className="flex items-center justify-center">
          <span className="mr-4">
            Page{" "}
            <strong>
              {pageState.pageIndex + 1} of {pageCount}
            </strong>{" "}
          </span>
          {isDesktop && (
            <select
              value={pageState.pageSize}
              onChange={(e) => {
                setPageState({
                  ...pageState,
                  pageSize: Number(e.target.value),
                });
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-row">
          <TableIconButton
            isDisabled={pageState.pageIndex >= pageCount - 1}
            onClick={() =>
              setPageState({ ...pageState, pageIndex: pageState.pageIndex + 1 })
            }
            icon={<ChevronRight size={20} />}
          />
          <TableIconButton
            onClick={() =>
              setPageState({
                ...pageState,
                pageIndex: pageCount ? pageCount - 1 : 1,
              })
            }
            isDisabled={pageState.pageIndex >= pageCount - 1}
            icon={<ChevronsRight size={20} />}
          />
        </div>
      </div>
    </div>
  );
};
