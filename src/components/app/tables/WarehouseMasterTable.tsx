import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { PlusIcon, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import { IModalProps } from "@/lib/types";
import TableLoading from "../TableLoading";
import {get} from "../../../lib/apiService"
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Updated type to match actual API response
type WarehouseItem = {
  id: number;
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
};

interface WarehouseMasterTableProps extends Omit<IModalProps, "isOpen"> {
  toggleEditWarehouseModal?: any
  refreshTrigger?: number;
}

const WarehouseMasterTable: React.FC<WarehouseMasterTableProps> = ({
  onClose,
  toggleEditWarehouseModal,
  refreshTrigger,
}) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fixed the fetchWarehouses function - moved useMemo inside useEffect
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoading(true);
        
        const result = await get("/inventory/warehouse");
        console.log(result.data);
        // Fixed: API returns data directly in 'data' field, not nested
        setItems(result.data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouses();
  }, [refreshTrigger]);

  // Updated columns to match actual API data structure
  const columns: ColumnDef<WarehouseItem>[] = [
    {
      header: "Id",
      accessorKey: "id",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 flex items-center gap-4">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("name")}</div>
      ),
    },
    {
      header: "Address 1",
      accessorKey: "address1",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("address1")}</div>
      ),
    },
    {
      header: "Address 2",
      accessorKey: "address2",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("address2") || "-"}
        </div>
      ),
    },
    {
      header: "City",
      accessorKey: "city",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("city")}</div>
      ),
    },
    {
      header: "Postal Code",
      accessorKey: "postalCode",
      cell: ({ row }) => (
        <div className="font-normal min-w-24">{row.getValue("postalCode")}</div>
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: ({ row }) => {
        const warehouse = row.original;

        return (
          <div className="font-normal flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                toggleEditWarehouseModal?.(warehouse);
              }}
            >
              <Edit2 size={16} />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        id: true,
        name: true,
        address1: true,
        address2: true,
        city: true,
        postalCode: true,
      },
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });

  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={onClose}
                className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
              >
                <PlusIcon className="" />
                Add Warehouse
              </Button>
            </div>
          </div>
        </section>
        <div className="px-5">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="relative h-10 border-t select-none border-r"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {isLoading ? (
              <TableLoading columnLength={columns.length} />
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-96 text-center"
                    >
                      <div className="w-full flex flex-col gap-3 justify-center items-center">
                        <img src="/folder.svg" alt="" />
                        <h4 className="font-bold text-lg">No Warehouse Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a warehouse to get started and manage your
                          operations efficiently.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        {table.getVisibleLeafColumns().length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default WarehouseMasterTable;