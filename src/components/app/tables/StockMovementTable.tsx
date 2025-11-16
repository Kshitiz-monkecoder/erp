import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpRight, PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import SelectFilter, { OptionType } from "../SelectFilter";

import CreateStockTransferModal from "../modals/CreateStockTransferModal";
import TableLoading from "../TableLoading";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import TablePagenation from "../TablePagenation";
import {get} from "../../../lib/apiService"
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
type Item = {
  documentNumber: string;
  fromStore: string;
  toStore: string;
  numberOfItems: string;
  date: string;
  user: string;
  movementType: string;
  status: string;
};

const StockMovementTable: React.FC = () => {
  // const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<any[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const navigate = useNavigate();
  const columns: ColumnDef<Item>[] = [
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <div
          onClick={() => {
            localStorage.setItem(
              "selectedStockMovement",
              JSON.stringify(row.original),
            );

            navigate(`/inventory/manual-adjustment`);
          }}
          className="font-normal min-w-32 flex text-blue-500 items-center cursor-pointer gap-4"
        >
          {row.getValue("documentNumber")}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
    },
    {
      header: "From Store",
      accessorKey: "fromStore",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("fromStore")}</div>
      ),
    },
    {
      header: "To Store",
      accessorKey: "toStore",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 truncate flex text-[#7047EB] items-center gap-4">
          {row.getValue("toStore")}
          {/* <ArrowUpRight className="text-[#8A8AA3] w-5" /> */}
        </div>
      ),
    },
    {
      header: "Number of Items",
      accessorKey: "numberOfItems",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("numberOfItems")}
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => (
        // Change this according to slug values
        <div className="font-normal min-w-32">{row.getValue("date")}</div>
      ),
    },
    {
      header: "User",
      accessorKey: "user",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("user")}</div>
      ),
    },
    {
      header: "Movement Type",
      accessorKey: "movementType",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("movementType")}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        const isApproved = status === "APPROVED";
        const isRejected = status === "REJECTED";

        const baseClasses =
          "font-normal px-3 py-1 truncate text-xs w-fit rounded-full";

        const statusClasses = isApproved
          ? "text-green-600 bg-green-100"
          : isRejected
            ? "text-red-600 bg-red-100"
            : "text-yellow-600 bg-yellow-100"; // For PENDING or other

        return (
          <div className={`${baseClasses} ${statusClasses}`}>
            {String(status)}
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const data = await get("/inventory/transfer");
        const mappedItems =
          data?.data.map((item: any) => {
            const {
              id,
              fromWarehouse,
              toWarehouse,
              quantity,
              createdAt,
              createdBy,
              movementType,
              approvedBy,
              status,
              ...rest
            } = item;
            return {
              documentNumber: id,
              fromStore: fromWarehouse?.name ?? "",
              toStore: toWarehouse?.name ?? "",
              numberOfItems: quantity?.toString() ?? "",
              date: createdAt ? createdAt.slice(0, 10) : "",
              user: createdBy?.name ?? "",
              movementType: movementType ?? "",
              status: status,
              approvedBy: approvedBy?.name,
              ...rest,
            };
          }) ?? [];
        setItems(mappedItems);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showCreateModal]);
  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with category filtering
    let filtered;

    // Then apply date filtering if both dates are present
    if (startDate && endDate) {
      filtered = items.filter((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Add one day to end date to include the end date in results
        end.setDate(end.getDate() + 1);

        // Check if item date is between start and end dates
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [startDate, endDate]);

  const table = useReactTable({
    data: filteredItems ?? items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 7,
      },
      columnVisibility: {
        documentNumber: true,
        fromStore: true,
        toStore: true,
        numberOfItems: true,
        date: true,
        user: true,
        movementType: true,
        status: true,
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

  const movementType: OptionType[] = [
    { label: "All", value: "All" },
    { label: "Manual", value: "Manual" },
    { label: "Adjustment", value: "Adjustment" },
    { label: "Stock Transfer", value: "Stock Transfer" },
    {
      label: "Physical Stock Reconciliation",
      value: "Physical Stock Reconciliation",
    },
  ];
  const status: OptionType[] = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];
  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Create onValueChange to pass through these for filtering logic */}
              <SelectFilter
                label="Movement Type"
                items={movementType}
                onValueChange={(value) => {
                  table.getColumn("movementType")?.setFilterValue(value);
                }}
              />
              {/* <SelectFilter label="Status" items={status} /> */}
              <SelectFilter
                label="Status"
                items={status}
                onValueChange={(value) => {
                  table.getColumn("status")?.setFilterValue(value);
                }}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
            </div>
            <Button
              className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="" />
              Create Document
            </Button>
            <CreateStockTransferModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
            />
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
                      className="hover:bg-muted/80"
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
                        <h4 className="font-bold text-lg">
                          No Item Added With Selected Filters
                        </h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a document to get started and manage your
                          operations efficiently.
                        </p>
                        {/* <div className="flex items-center gap-4">
                          <Button className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                            <PlusIcon className="" />
                            Add Item
                          </Button>
                        </div> */}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        {table.getVisibleLeafColumns().length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default StockMovementTable;
