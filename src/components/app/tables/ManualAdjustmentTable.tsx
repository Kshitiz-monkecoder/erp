import React, { useEffect } from "react";
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
  item: string;
  hsnSacCode: string;
  productCategory: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
}
import {get} from "../../../lib/apiService"
const columns: ColumnDef<IItem>[] = [
  {
    accessorKey: "srNo",
    cell: (info) => info.getValue(),
    header: () => <span className="truncate text-sm">Sr. No.</span>,
  },
  {
    header: () => <span className="truncate text-sm">Item</span>,
    accessorKey: "item",
  },
  {
    header: () => <span className="truncate text-sm">HSN/SAC Code</span>,
    accessorKey: "hsnSacCode",
  },
  {
    header: () => <span className="truncate text-sm">Product Category</span>,
    accessorKey: "productCategory",
  },
  {
    header: () => <span className="truncate text-sm">Quantity</span>,
    accessorKey: "quantity",
  },
  {
    header: () => <span className="truncate text-sm">Price/Unit</span>,
    accessorKey: "pricePerUnit",
  },
  {
    header: () => <span className="truncate text-sm">Total Cost</span>,
    accessorKey: "totalCost",
  },
];

interface ManualAdjustmentTableProps {
  itemid: any;
}

const ManualAdjustmentTable: React.FC<ManualAdjustmentTableProps> = ({
  itemid,
}) => {
  const [items, setItems] = React.useState<IItem[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        
        const data = await get(`/inventory/item/${itemid}`);
        const d = data.data;
        if (d) {
          setItems([
            {
              srNo: 1,
              item: d.name,
              hsnSacCode: d.hsnCode,
              productCategory: d.category?.name ?? "",
              quantity: (() => {
                const selectedStockMovement = localStorage.getItem(
                  "selectedStockMovement",
                );
                if (selectedStockMovement) {
                  try {
                    return JSON.parse(selectedStockMovement)?.numberOfItems;
                  } catch {
                    return 0;
                  }
                }
                return 0;
              })(),
              pricePerUnit: Number(d.defaultPrice) || 0,
              totalCost: Number(d.defaultPrice) || 0,
            },
          ]);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.log(error);
        setItems([]);
      }
    };

    if (itemid) {
      fetchItems();
    }
  }, [itemid]);

  const table = useReactTable({
    data: items,
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
                  <h4 className="font-bold text-lg">Loading...</h4>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ManualAdjustmentTable;
