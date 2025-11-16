import React from "react";
import {
  // Column,
  ColumnDef,
  // ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  // RowData,
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IItem {
  srNo: number;
  itemId: string;
  description: string;
  productCategory: string;
  action: string;
  fromStore: string;
  toStore: string;
  documentQuantity: number;
  approvedQuantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  currentStock: number;
  comment: string;
}

const columns: ColumnDef<IItem>[] = [
  {
    accessorKey: "srNo",
    cell: (info) => info.getValue(),
    header: () => <span className="truncate text-sm">Sr. No.</span>,
  },
  {
    header: () => <span className="truncate text-sm">Item Id</span>,
    accessorKey: "itemId",
  },
  {
    header: () => <span className="truncate text-sm">Description</span>,
    accessorKey: "description",
  },
  {
    header: () => <span className="truncate text-sm">Product Category</span>,
    accessorKey: "productCategory",
  },
  {
    header: () => <span className="truncate text-sm">Action</span>,
    accessorKey: "action",
    cell: ({ row }) => (
      <div className="font-normal w-fit max-w-32  truncate">
        {row.getValue("action")}
      </div>
    ),
  },
  {
    header: () => <span className="truncate text-sm">From Store</span>,
    accessorKey: "fromStore",
  },
  {
    header: () => <span className="truncate text-sm">To Store</span>,
    accessorKey: "toStore",
    cell: ({ row }) => (
      <div className="font-normal w-fit max-w-32  truncate">
        {row.getValue("toStore")}
      </div>
    ),
  },
  {
    header: () => <span className="truncate text-sm">Document Quantity</span>,
    accessorKey: "documentQuantity",
  },
  {
    header: () => <span className="truncate text-sm">Approved Quantity</span>,
    accessorKey: "approvedQuantity",
  },
  {
    header: () => <span className="truncate text-sm">Unit</span>,
    accessorKey: "unit",
  },
  {
    header: () => <span className="truncate text-sm">Base Quantity</span>,
    accessorKey: "baseQuantity",
  },
  {
    header: () => <span className="truncate text-sm">Base Unit</span>,
    accessorKey: "baseUnit",
  },
  {
    header: () => <span className="truncate text-sm">Current Stock</span>,
    accessorKey: "currentStock",
  },
  {
    header: () => <span className="truncate text-sm">Comment</span>,
    accessorKey: "comment",
    cell: ({ row }) => (
      <div className="font-normal w-fit max-w-32  truncate">
        {row.getValue("comment")}
      </div>
    ),
  },
];

const items: IItem[] = [
  {
    srNo: 1,
    itemId: "SKUJ0009",
    description: "Laptop",
    productCategory: "Consumables",
    action: "Add to Store",
    fromStore: "",
    toStore: "Default Stock Store",
    documentQuantity: 30,
    approvedQuantity: 30,
    unit: "Nos",
    baseQuantity: 30,
    baseUnit: "Nos",
    currentStock: 30,
    comment: "Stock at time",
  },
  {
    srNo: 2,
    itemId: "SKUJ0009",
    description: "Laptop",
    productCategory: "Consumables",
    action: "Add to Store",
    fromStore: "",
    toStore: "Default Stock Store",
    documentQuantity: 30,
    approvedQuantity: 30,
    unit: "Nos",
    baseQuantity: 30,
    baseUnit: "Nos",
    currentStock: 30,
    comment: "Stock at time",
  },
  {
    srNo: 3,
    itemId: "SKUJ0009",
    description: "Laptop",
    productCategory: "Consumables",
    action: "Add to Store",
    fromStore: "",
    toStore: "Default Stock Store",
    documentQuantity: 30,
    approvedQuantity: 30,
    unit: "Nos",
    baseQuantity: 30,
    baseUnit: "Nos",
    currentStock: 30,
    comment: "Stock at time",
  },
];

const StoreApprovalTable: React.FC = () => {
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client-side filtering
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
    enableSortingRemoval: false,
  });
  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50 border">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="relative h-10 border-t border select-none w-32"
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
                className="text-xs border"
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-xs border">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-96 text-center">
                <div className="w-full flex flex-col gap-3 justify-center items-center">
                  <img src="/folder.svg" alt="" />
                  <h4 className="font-bold text-lg">No Company Added</h4>
                  <p className="max-w-xs text-[#121217] text-sm">
                    Please add a company to get started and manage your
                    operations efficiently.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StoreApprovalTable;
