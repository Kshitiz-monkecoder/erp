import React, { useState } from "react";
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
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import TablePagenation from "../TablePagenation";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
type Item = {
  barcodeNumber: string;
  approvalNumber: string;
  toStore: string;
  itemId: string;
  itemName: string;
  quantityIn: number;
  quantityOut: number;
  quantityConsumed: number;
  balanceQuantity: number;
  returnQuantity: number;
  createdBy: string;
  creationDate: string;
  manufractingDate: string;
  expiryDate: string;
  info1: string;
  info2: string;
  fromStore: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
};

const columns: ColumnDef<Item>[] = [
  {
    header: "Barcode Number",
    accessorKey: "barcodeNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex items-center gap-4">
        {row.getValue("barcodeNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
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
    header: "Approval Document Number",
    accessorKey: "approvalNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-56 truncate flex text-[#7047EB] items-center gap-4">
        {row.getValue("approvalNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    header: "Item Id",
    accessorKey: "itemId",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("itemId")}</div>
    ),
  },
  {
    header: "Item Name",
    accessorKey: "itemName",
    cell: ({ row }) => (
      // Change this according to slug values
      <div className="font-normal min-w-32">{row.getValue("itemName")}</div>
    ),
  },
  {
    header: "Quantity In",
    accessorKey: "quantityIn",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("quantityIn")}</div>
    ),
  },
  {
    header: "Quantity Out",
    accessorKey: "quantityOut",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("quantityOut")}</div>
    ),
  },
  {
    header: "Quantity Consumed",
    accessorKey: "quantityConsumed",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("quantityConsumed")}
      </div>
    ),
  },
  {
    header: "Balance Quantity",
    accessorKey: "balanceQuantity",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("balanceQuantity")}
      </div>
    ),
  },
  {
    header: "Return Quantity",
    accessorKey: "returnQuantity",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("returnQuantity")}
      </div>
    ),
  },
  {
    header: "Created By",
    accessorKey: "createdBy",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("createdBy")}</div>
    ),
  },
  {
    header: "Creation Date",
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: "Manufacturing Date",
    accessorKey: "manufractingDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("manufractingDate")}
      </div>
    ),
  },
  {
    header: "Expiry Date",
    accessorKey: "expiryDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("expiryDate")}</div>
    ),
  },
  {
    header: "Info 1",
    accessorKey: "info1",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("info1")}</div>
    ),
  },
  {
    header: "Info 2",
    accessorKey: "info1",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("info2")}</div>
    ),
  },
  {
    header: "To Store",
    accessorKey: "toStore",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("toStore")}</div>
    ),
  },
  {
    header: "Last Modified By",
    accessorKey: "lastModifiedBy",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("lastModifiedBy")}
      </div>
    ),
  },
  {
    header: "Last Modified Date",
    accessorKey: "lastModifiedDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("lastModifiedDate")}
      </div>
    ),
  },
];

const items: Item[] = [
  {
    barcodeNumber: "BCN1234567890",
    approvalNumber: "APV20250416001",
    toStore: "Central Warehouse",
    itemId: "ITM00001",
    itemName: "Premium Wheat Flour",
    quantityIn: 50,
    quantityOut: 0,
    quantityConsumed: 10,
    balanceQuantity: 40,
    returnQuantity: 0,
    createdBy: "Rohit Sharma",
    creationDate: "2025-04-16",
    manufractingDate: "2025-03-01",
    expiryDate: "2026-03-01",
    info1: "Batch A1",
    info2: "Organic",
    fromStore: "Supplier A",
    lastModifiedBy: "Rohit Sharma",
    lastModifiedDate: "2025-04-16",
  },
  {
    barcodeNumber: "BCN0987654321",
    approvalNumber: "APV20250416002",
    toStore: "Bekaner Store",
    itemId: "ITM00002",
    itemName: "Refined Sugar",
    quantityIn: 30,
    quantityOut: 5,
    quantityConsumed: 20,
    balanceQuantity: 5,
    returnQuantity: 2,
    createdBy: "Priya Mehta",
    creationDate: "2025-04-16",
    manufractingDate: "2025-02-15",
    expiryDate: "2027-02-15",
    info1: "Batch B2",
    info2: "Fine Grain",
    fromStore: "Supplier B",
    lastModifiedBy: "Priya Mehta",
    lastModifiedDate: "2025-04-16",
  },
  {
    barcodeNumber: "BCN1122334455",
    approvalNumber: "APV20250416003",
    toStore: "Default Stock Store",
    itemId: "ITM00003",
    itemName: "Sunflower Oil",
    quantityIn: 100,
    quantityOut: 20,
    quantityConsumed: 50,
    balanceQuantity: 30,
    returnQuantity: 0,
    createdBy: "Aniket Chauhan",
    creationDate: "2025-04-16",
    manufractingDate: "2025-01-20",
    expiryDate: "2026-01-20",
    info1: "Batch C3",
    info2: "Cold Pressed",
    fromStore: "Supplier C",
    lastModifiedBy: "Aniket Chauhan",
    lastModifiedDate: "2025-04-16",
  },
  {
    barcodeNumber: "BCN5566778899",
    approvalNumber: "APV20250416004",
    toStore: "City Outlet",
    itemId: "ITM00004",
    itemName: "Basmati Rice",
    quantityIn: 75,
    quantityOut: 10,
    quantityConsumed: 55,
    balanceQuantity: 10,
    returnQuantity: 5,
    createdBy: "Sonal Gupta",
    creationDate: "2025-04-16",
    manufractingDate: "2024-12-10",
    expiryDate: "2026-12-10",
    info1: "Batch D4",
    info2: "Aged 2 Years",
    fromStore: "Supplier D",
    lastModifiedBy: "Sonal Gupta",
    lastModifiedDate: "2025-04-16",
  },
  {
    barcodeNumber: "BCN6677889900",
    approvalNumber: "APV20250416005",
    toStore: "Metro Store",
    itemId: "ITM00005",
    itemName: "Green Tea",
    quantityIn: 40,
    quantityOut: 0,
    quantityConsumed: 25,
    balanceQuantity: 15,
    returnQuantity: 0,
    createdBy: "Vikas Jain",
    creationDate: "2025-04-16",
    manufractingDate: "2025-03-10",
    expiryDate: "2027-03-10",
    info1: "Batch E5",
    info2: "Herbal",
    fromStore: "Supplier E",
    lastModifiedBy: "Vikas Jain",
    lastModifiedDate: "2025-04-16",
  },
];

const BarcodeTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        barcodeNumber: true,
        approvalNumber: true,
        toStore: true,
        itemId: true,
        itemName: true,
        quantityIn: true,
        quantityOut: true,
        quantityConsumed: true,
        balanceQuantity: true,
        returnQuantity: false,
        createdBy: false,
        creationDate: false,
        manufractingDate: false,
        expiryDate: false,
        info1: false,
        info2: false,
        fromStore: false,
        lastModifiedBy: false,
        lastModifiedDate: false,
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

  const itemStaus: OptionType[] = [
    { label: "All", value: "all" },
    { label: "All Items With Balance Qty", value: "all-in-with-balance" },
    { label: "All Items In", value: "all-in" },
    { label: "All Items Out", value: "all-out" },
  ];
  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Create onValueChange to pass through these for filtering logic */}
              <SelectFilter
                label="Item Status"
                items={itemStaus}
                onValueChange={(value) => {
                  table.getColumn("itemStatus")?.setFilterValue(value);
                }}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
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
                      <div className="flex items-center gap-4">
                        <Button className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                          <PlusIcon className="" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {table.getVisibleLeafColumns().length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default BarcodeTable;
