import React, { useMemo, useState } from "react";
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
import { PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import { OptionType } from "../SelectFilter";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Universal table configuration interface
export interface UniversalTableConfig<T = any> {
  // Data and loading
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;

  // Pagination
  initialPageSize?: number;
  enablePagination?: boolean;

  // Filtering
  enableFiltering?: boolean;
  searchColumn?: string; // Column key for main search
  filterOptions?: {
    label: string;
    column: string;
    options: OptionType[];
  }[];

  // Date filtering
  enableDateFiltering?: boolean;
  dateColumn?: string;

  // Actions
  enableCreate?: boolean;
  createButtonText?: string;
  onCreateClick?: () => void;
  createModal?: React.ReactNode;

  // Empty state
  emptyStateConfig?: {
    icon?: string;
    title: string;
    description: string;
    showCreateButton?: boolean;
  };

  // Column visibility
  enableColumnVisibility?: boolean;
  initialColumnVisibility?: Record<string, boolean>;

  // Row actions
  onRowClick?: (row: T) => void;

  // Table instance callback
  onTableReady?: (table: any) => void;

  // Custom styling
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string;

  // Custom filtering section
  customFilterSection?: (table: any) => React.ReactNode;
  hideDefaultFilters?: boolean;
}

interface UniversalTableProps<T = any> extends UniversalTableConfig<T> {
  className?: string;
}

function UniversalTable<T = any>({
  data,
  columns,
  isLoading = false,
  initialPageSize = 10,
  enablePagination = true,
  enableDateFiltering = false,
  dateColumn,
  enableCreate = false,
  createButtonText = "Create",
  onCreateClick,
  createModal,
  emptyStateConfig,
  initialColumnVisibility = {},
  onRowClick,
  tableClassName,
  headerClassName,
  rowClassName,
  className,
  customFilterSection,
  onTableReady,
}: UniversalTableProps<T>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date filtering from URL params
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Apply date filtering
  const filteredData = useMemo(() => {
    if (!enableDateFiltering || !dateColumn || !startDate || !endDate) {
      return data;
    }

    return data.filter((item: any) => {
      const itemDate = new Date(item[dateColumn]);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return itemDate >= start && itemDate < end;
    });
  }, [data, enableDateFiltering, dateColumn, startDate, endDate]);

  const table = useReactTable({
    data: filteredData,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
      columnVisibility: initialColumnVisibility,
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });

  // Expose table instance to parent component
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const defaultEmptyState = {
    icon: "/folder.svg",
    title: "No Data Available",
    description:
      "Please add some data to get started and manage your operations efficiently.",
    showCreateButton: enableCreate,
  };

  const emptyState = { ...defaultEmptyState, ...emptyStateConfig };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Filters and Actions Section */}
        {customFilterSection && (
          <section className="mt-4 px-5">
            <div className="flex justify-between">
              <div className="flex items-center w-full gap-2">
                {customFilterSection(table)}

                {enableCreate && (
                  <div className="flex w-full xl:mt-5 xl:justify-end items-end gap-4">
                    <Button
                      className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                      onClick={handleCreateClick}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      {createButtonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Table Section */}
        <div className="px-5">
          <Table className={tableClassName}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className={`bg-muted/50 border ${headerClassName}`}
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="relative h-10 border-t select-none border-r"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
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
                      className={`${rowClassName} ${
                        onRowClick ? "cursor-pointer hover:bg-muted/30" : ""
                      }`}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
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
                        <img src={emptyState.icon} alt="" />
                        <h4 className="font-bold text-lg">
                          {emptyState.title}
                        </h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          {emptyState.description}
                        </p>
                        {emptyState.showCreateButton && (
                          <Button
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={handleCreateClick}
                          >
                            <PlusIcon className="w-4 h-4 mr-1" />
                            {createButtonText}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>

        {/* Pagination */}
        {enablePagination && table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}

        {/* Modal */}
        {createModal &&
          React.isValidElement(createModal) &&
          React.cloneElement(createModal as React.ReactElement<any>, {
            isOpen: isModalOpen,
            onClose: handleCloseModal,
          })}
      </div>
    </div>
  );
}

export default UniversalTable;
