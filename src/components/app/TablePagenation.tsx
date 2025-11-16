import React from "react";
import type { Table } from "@tanstack/react-table";

interface TablePagenationProps {
  table: Table<any>;
}

const TablePagenation: React.FC<TablePagenationProps> = ({ table }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-5">
      <div className="flex gap-3 md:gap-5">
        <div className="flex items-center text-neutral-600 gap-2">
          <div className="text-xs">Rows per page:</div>
          <select
            className="text-xs bg-neutral-100 shadow rounded-sm px-2 py-1 cursor-pointer"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <button
          className="text-neutral-600"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="text-neutral-600"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="text-neutral-600"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="text-neutral-600"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
      </div>
      <div>
        <span className="text-xs text-neutral-600">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
      </div>
    </div>
  );
};

export default TablePagenation;
