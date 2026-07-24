/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
} from "react-feather";
import { useMediaQuery } from "react-responsive";
import {
  usePagination,
  useSortBy,
  useTable,
  useGlobalFilter,
} from "react-table";

import { TableIconButton } from "./table-icon-button";
import { UpdateDataProps } from "./use-inline-edit";
import { EditableCell } from "./editable-cell";
import { GlobalFilter } from "./global-filter";

type ReactTableProps<D extends object = {}> = {
  data: any[];
  columns: any[];
  pageSize?: number;
  tableHeading?: React.ReactNode;
  onRowClick?: (row: any) => void;
  selectedId?: string | undefined;
  enableSearch?: boolean;
  inLineEditConfig?: {
    updateData: ({ rowIndex, columnId, value }: UpdateDataProps) => void;
    skipPageReset: boolean;
  };
  searchBarColSpan?: number;
};

export const ReactTable = <D extends {}>({
  columns,
  data,
  tableHeading,
  pageSize: initialPageSize,
  onRowClick,
  selectedId,
  enableSearch,
  inLineEditConfig,
  searchBarColSpan,
}: ReactTableProps<D>) => {
  const tableColumns = React.useMemo(() => columns, [columns]);

  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 40em)" });

  const tableOptions: any = {
    columns: tableColumns,
    data,
    initialState: { pageIndex: 0, pageSize: initialPageSize },
    autoResetPage: !inLineEditConfig?.skipPageReset,
    ...(inLineEditConfig && {
      updateData: inLineEditConfig.updateData,
      defaultColumn: { Cell: EditableCell },
    }),
  };

  const {
    getTableProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,

    preGlobalFilteredRows,
    setGlobalFilter,

    state: { pageIndex, pageSize, globalFilter },
  } = useTable(tableOptions, useGlobalFilter, useSortBy, usePagination) as any;

  return (
    <div className="w-full">
      {tableHeading && (
        <div className="border-b border-gray-200">{tableHeading}</div>
      )}
      <div className="w-full overflow-x-auto">
        <table
          {...(getTableProps() as any)}
          data-testid="react-table"
          className="table table-zebra w-full"
        >
          <thead>
            {headerGroups.map((headerGroup: any, outerIndex: number) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={outerIndex}>
                {headerGroup.headers.map((column: any, innerIndex: number) => (
                  <th
                    className="bg-base-200 px-4 py-3 text-left"
                    {...column.getHeaderProps()}
                    {...column.getSortByToggleProps()}
                    key={innerIndex}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-base-content">
                        {column.render("Header")}
                      </span>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronUp size={20} />
                        )
                      ) : (
                        ""
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
            {enableSearch && (
              <tr>
                <th
                  colSpan={searchBarColSpan ? searchBarColSpan : columns.length}
                  className="border-b border-gray-200 p-3 text-left"
                >
                  <GlobalFilter
                    preGlobalFilteredRows={preGlobalFilteredRows}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                  />
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {page.map(
              (row: any, outerIndex: number) =>
                prepareRow(row) || (
                  <tr
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                    className={row.id === selectedId ? "bg-base-200" : ""}
                    onClick={() => onRowClick && onRowClick(row)}
                    {...row.getRowProps()}
                    data-testid="table-row"
                    key={outerIndex}
                  >
                    {row.cells.map((cell: any, innerIndex: number) => {
                      return (
                        <td
                          className="border-b border-base-300 px-4 py-3 align-top text-sm text-base-content"
                          {...cell.getCellProps()}
                          data-testid="react-table-cell"
                          key={innerIndex}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                ),
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-row items-center justify-between overflow-hidden border-t border-base-300 py-6">
        <div className="flex flex-row gap-2">
          <TableIconButton
            onClick={() => gotoPage(0)}
            isDisabled={!canPreviousPage}
            icon={<ChevronsLeft size={20} />}
          />
          <TableIconButton
            isDisabled={!canPreviousPage}
            onClick={() => previousPage()}
            icon={<ChevronLeft size={20} />}
          />
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-base-content">
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          {!isTabletOrMobile && (
            <select
              className="select select-bordered select-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSizeValue) => (
                <option key={pageSizeValue} value={pageSizeValue}>
                  Show {pageSizeValue}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <TableIconButton
            isDisabled={!canNextPage}
            onClick={() => nextPage()}
            icon={<ChevronRight size={20} />}
          />
          <TableIconButton
            onClick={() => gotoPage(pageCount ? pageCount - 1 : 1)}
            isDisabled={!canNextPage}
            icon={<ChevronsRight size={20} />}
          />
        </div>
      </div>
    </div>
  );
};
