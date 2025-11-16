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
  id: number;
  quantity: number;
  unitPrice: string;
  tax: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
}

interface IPurchaseOrderPreviewTable {
  inModal: boolean;
  items?: IItem[];
}

const PurchaseOrderPreviewTable: React.FC<IPurchaseOrderPreviewTable> = ({
  inModal,
  items,
}) => {
  const columns: ColumnDef<IItem>[] = [
    {
      id: "srNo",
      cell: ({ row }) => row.index + 1,
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Sr. No.
        </span>
      ),
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Item ID
        </span>
      ),
      accessorKey: "id",
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
      cell: ({ getValue }) => `₹${getValue()}`,
    },
    {
      header: () => (
        <span
          className={clsx("truncate", {
            "text-sm": !inModal,
            "text-[8px]": inModal,
          })}
        >
          Tax (%)
        </span>
      ),
      accessorKey: "tax",
      cell: ({ getValue }) => `${getValue()}%`,
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
      cell: ({ getValue }) => `₹${getValue()}`,
    },
  ];

  const table = useReactTable({
    data: items ? items : [],
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
                className={clsx("text-xs border", {
                  "text-sm": !inModal,
                  "text-[8px]": inModal,
                })}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={clsx("text-xs border", {
                      "text-sm": !inModal,
                      "text-[8px]": inModal,
                    })}
                  >
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
                  <h4 className="font-bold text-lg">No Items Added</h4>
                  <p className="max-w-xs text-[#121217] text-xs">
                    Please add items to get started and manage your purchase
                    order efficiently.
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

export default PurchaseOrderPreviewTable;
