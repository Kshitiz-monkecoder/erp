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
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";
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
  poNumber: string;
  countryParty: string;
  deliveryStatus: string;
  dueDate: string;
  creationDate: string;
  amount: string;
  internalApprovalStatus: string;
};

const columns: ColumnDef<Item>[] = [
  {
    header: "PO Number",
    accessorKey: "poNumber",
    cell: ({ row }) => (
      <div className="font-normal text-blue-500 cursor-pointer min-w-32 flex items-center gap-4">
        {row.getValue("poNumber")}
        <ArrowUpRight className="text-blue-500 w-5" />
      </div>
    ),
  },
  {
    header: "Country Party",
    accessorKey: "countryParty",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-[#7047EB]">
        {row.getValue("countryParty")}
      </div>
    ),
  },
  {
    header: "Delivery Status",
    accessorKey: "deliveryStatus",
    cell: ({ row }) => (
      <div className="font-normal text-xs px-3 py-1 rounded-full border boder-[#B2EECC] text-[#17663A] bg-[#EEFBF4] w-fit">
        {row.getValue("deliveryStatus")}
      </div>
    ),
  },
  {
    header: "Due Date",
    accessorKey: "dueDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("dueDate")}</div>
    ),
  },
  {
    header: "Creation Date",
    accessorKey: "creationDate",
    cell: ({ row }) => (
      // Change this according to slug values
      <div className="font-normal min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => (
      // Change this according to slug values
      <div className="font-normal min-w-32">₹{row.getValue("amount")}</div>
    ),
  },
  {
    header: "Internal Approval Status",
    accessorKey: "internalApprovalStatus",
    cell: ({ row }) => (
      <div className="font-normal text-xs px-3 py-1 rounded-full text-[#8A6100] bg-[#FFF9EB] w-fit">
        {row.getValue("internalApprovalStatus")}
      </div>
    ),
  },
];

const items: Item[] = [
  {
    poNumber: "SEQ001",
    countryParty: "Jindal Cements",
    deliveryStatus: "Pending",
    dueDate: "--",
    creationDate: "2025-04-16",
    amount: "52,500.00",
    internalApprovalStatus: "Approved",
  },
  {
    poNumber: "SEQ001",
    countryParty: "Jindal Cements",
    deliveryStatus: "Pending",
    dueDate: "--",
    creationDate: "2025-04-16",
    amount: "52,500.00",
    internalApprovalStatus: "Approved",
  },
];

const AllDocumentsTable: React.FC = () => {
  // const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with category filtering
    let filtered;

    return filtered;
  }, [startDate, endDate]);

  const table = useReactTable({
    data: filteredItems ?? items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
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
        <section className="mt-4 px-5">
          <div className="flex md:items-center flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <FilterInput column={table.getColumn("poNumber")!} />
              </div>
            </div>
            <div>
              <Button className="bg-[#7047EB] font-light text-xs sm:text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                <PlusIcon className="" />
                Download
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    // TODO : add sidebar hovering effect for current page
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
                      <h4 className="font-bold text-lg">No Item Added</h4>
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
          </Table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};
export default AllDocumentsTable;
