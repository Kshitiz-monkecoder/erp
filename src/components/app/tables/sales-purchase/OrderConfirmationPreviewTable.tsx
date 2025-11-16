import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
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
import clsx from "clsx";

interface IItem {
  id?: number;
  item?: {
    sku?: string;
    name?: string;
    isProduct?: boolean;
    type?: string;
    currentStock?: string;
    defaultPrice?: string;
    hsnCode?: string;
    minimumStockLevel?: string;
    maximumStockLevel?: string;
    id?: number;
    regularBuyingPrice?: string;
    regularSellingPrice?: string;
    wholesaleBuyingPrice?: string;
    mrp?: string;
    dealerPrice?: string;
    distributorPrice?: string;
    lastTransactionAt?: string;
  };
  hsn?: string;
  quantity?: string;
  unitPrice?: string;
  totalPrice?: string;
  tax?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface IOrderConfirmationPreviewTable {
  inModal: boolean;
  items?: IItem[];
}

const OrderConfirmationPreviewTable: React.FC<IOrderConfirmationPreviewTable> = ({
  inModal,
  items = [],
}) => {
    console.log("items", items)
  const columns: ColumnDef<IItem>[] = [
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Item Name
        </span>
      ),
      accessorKey: "item.name",
      cell: ({ row }) => row.original.item?.name,
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          HSN/SAC Code
        </span>
      ),
      accessorKey: "hsn",
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Quantity
        </span>
      ),
      accessorKey: "quantity",
      cell: ({ getValue }) => getValue() || "1",
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Unit Price
        </span>
      ),
      accessorKey: "unitPrice",
      cell: ({ getValue }) => {
        const value = getValue();
        return value !== undefined ? `₹${value}` : "₹0";
      },
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Tax
        </span>
      ),
      accessorKey: "tax",
      cell: ({ getValue }) => {
        const value = getValue();
        return value !== undefined ? `${value}%` : "0%";
      },
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Total Price
        </span>
      ),
      accessorKey: "totalPrice",
      cell: ({ getValue }) => {
        const value = getValue();
        return value !== undefined ? `₹${value}` : "₹0.00";
      },
    },
  ];

  // Create sample data if no items are provided
  const tableData = items.length > 0 ? items : [
    {
      item: {
        name: "",
        sku: "",
        isProduct: false,
        type: "",
        currentStock: "",
        defaultPrice: "",
        hsnCode: "",
        minimumStockLevel: "",
        maximumStockLevel: "",
        id: 0,
        regularBuyingPrice: "",
        regularSellingPrice: "",
        wholesaleBuyingPrice: "",
        mrp: "",
        dealerPrice: "",
        distributorPrice: "",
        lastTransactionAt: "",
      },
      hsn: "",
      quantity: "1",
      unitPrice: "0",
      tax: "0%",
      totalPrice: "0.00"
    }
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });

  return (
    <div className="w-full overflow-auto">
      <Table className="border-collapse">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="relative h-10 border border-gray-200 px-3 py-2 text-left font-medium text-gray-700"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={clsx("border-b", {
                  "text-sm": !inModal,
                  "text-[8px]": inModal,
                })}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="border border-gray-200 px-3 py-2"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="w-full flex flex-col gap-3 justify-center items-center">
                  <img src="/folder.svg" alt="" />
                  <h4 className="font-bold text-lg">No Items Added</h4>
                  <p className="max-w-xs text-[#121217] text-xs">
                    Please add items to get started and manage your order efficiently.
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

export default OrderConfirmationPreviewTable;
