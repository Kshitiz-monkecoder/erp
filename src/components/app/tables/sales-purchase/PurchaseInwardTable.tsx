import React, { useCallback, useId, useMemo, useState } from "react";
import {
  Column,
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
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
// import { useDebounce } from "@/lib/useDebounce";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import moment from "moment";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// type Item = {
//   itemId: number;
//   quantity: number;
//   deliveryDate: string;
//   delivered: number;
//   remarks: string;
// };

type PurchaseInwardItem = {
  quantity: number;
  delivered?: number;
  deliveryDate?: string;
  remarks?: string;
  unitPrice: string;
  tax: string;
  totalPrice: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  item: {
    sku: string;
    name: string;
    isProduct: boolean;
    type: string;
    defaultPrice: string;
    hsnCode: string;
    id: number;
    regularBuyingPrice: string;
    regularSellingPrice: string;
    wholesaleBuyingPrice: string;
    mrp: string;
    dealerPrice: string;
    distributorPrice: string;
  };
};

interface PurchaseInwardTableProps {
  items: PurchaseInwardItem[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  readonly?: boolean;
}

// const RemarksInput = React.memo(
//   ({
//     value,
//     onChange,
//     index,
//   }: {
//     value?: string;
//     onChange: (index: number, value: string) => void;
//     index: number;
//   }) => {
//     const [localValue, setLocalValue] = useState(value);

//     // Update local value when prop changes
//     useEffect(() => {
//       setLocalValue(value);
//     }, [value]);

//     // Debounced update to parent
//     const debouncedValue = useDebounce(localValue, 300);

//     useEffect(() => {
//       if (debouncedValue !== value) {
//         onChange(index, debouncedValue);
//       }
//     }, [debouncedValue, onChange, index, value]);

//     return (
//       <Input
//         type="text"
//         className="font-normal min-w-40 text-sm shadow-none"
//         value={localValue}
//         onChange={(e) => setLocalValue(e.target.value)}
//         placeholder="Add remarks..."
//       />
//     );
//   }
// );

const PurchaseInwardTable: React.FC<PurchaseInwardTableProps> = ({
  items,
  setItems,
  readonly = false,
}) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const updateItem = useCallback(
    (index: number, field: keyof PurchaseInwardItem, value: string) => {
      setItems((prevItems) => {
        // Only update if the value actually changed
        // if (prevItems[index]?.[field] === value) {
        //   return prevItems;
        // }

        const newItems = [...prevItems];

        console.log("newItems", newItems);

        newItems[index] = {
          ...newItems[index],
          [field]: value,
          updatedAt: new Date().toISOString(),
        };

        console.log("newItems", newItems);
        return JSON.parse(JSON.stringify(newItems)); // Deep copy to avoid reference issues
      });
    },
    [setItems]
  );

  const columns: ColumnDef<PurchaseInwardItem>[] = useMemo(
    () => [
      {
        header: "Item",
        accessorKey: "id",
        cell: ({ row }) => {
          return (
            <div className="font-normal min-w-20 text-sm">
              {row.original.item.name}
            </div>
          );
        },
      },
      {
        header: "Expected Quantity",
        accessorKey: "quantity",
        cell: ({ row }) => {
          const idx = row.index;
          return readonly ? (
            <div className="font-normal min-w-32 text-sm">
              {parseInt(row.original.quantity.toString() || "0").toFixed(2)}
            </div>
          ) : (
            <Input
              type="number"
              step="0.01"
              className="font-normal min-w-32 text-sm shadow-none"
              value={parseInt(row.original.quantity.toString() || "0").toFixed(
                2
              )}
              disabled
              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
            />
          );
        },
      },
      {
        header: "Delivered Quantity",
        accessorKey: "delivered",
        cell: ({ row }) => {
          const idx = row.index;

          return readonly ? (
            <div className={`font-normal min-w-32 text-sm `}>
              {parseInt(row.original.quantity.toString() || "0").toFixed(2)}
              {/* {deliveredQty.toFixed(2)}
              {isOverDelivered && " (Over)"} */}
            </div>
          ) : (
            <Input
              type="number"
              step="1"
              className={`font-normal min-w-32 shadow-none text-sm `}
              value={parseInt(
                row.original.delivered?.toString() || "0"
              ).toFixed(2)}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value < 0) {
                  return; // Prevent negative values
                }
                if (value > row.original.quantity) {
                  alert("Delivered quantity cannot exceed expected quantity");
                  return; // Prevent over-delivery
                }
                updateItem(idx, "delivered", e.target.value);
              }}
            />
          );
        },
      },
      {
        header: "Pending",
        accessorKey: "pending",
        cell: ({ row }) => {
          // const expectedQty = parseFloat(
          //   row.getValue<string>("quantity") || "0"
          // );
          // const deliveredQty = parseFloat(items[row.index]?.delivered || "0");
          // const pending = Math.max(0, expectedQty - deliveredQty);

          return (
            <div className={`font-normal min-w-24 text-sm text-amber-600 `}>
              {parseInt(
                (
                  row.original.quantity - (row.original.delivered ?? 0)
                ).toString() || "0"
              ).toFixed(2)}
            </div>
          );
        },
      },
      {
        header: "Delivery Date",
        accessorKey: "deliveryDate",
        cell: ({ row }) => {
          const idx = row.index;
          // const deliveryDate = row.getValue<string>("deliveryDate");
          // console.log("deliveryDate", deliveryDate);
          return readonly ? (
            <div className="font-normal min-w-32 text-sm">
              {moment().format("YYYY-MM-DD")}
            </div>
          ) : (
            <Input
              type="date"
              className="font-normal min-w-32 shadow-none text-sm"
              value={moment(row.original.deliveryDate).format("YYYY-MM-DD")}
              onChange={(e) => {
                console.log("e.target.value", e.target.value);
                updateItem(
                  idx,
                  "deliveryDate",
                  moment(e.target.value).format("YYYY-MM-DD")
                );
              }}
            />
          );
        },
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        cell: ({ row }) => {
          const idx = row.index;

          return (
            <Input
              type="text"
              value={row.original.remarks}
              onChange={(e) => updateItem(idx, "remarks", e.target.value)}
            />
          );
        },
      },
    ],
    [items, readonly, updateItem]
  );

  const table = useReactTable({
    data: items,
    columns,
    initialState: {
      pagination: {
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
    <div className="space-y-6 p-3 border rounded-lg py-5">
      {/* Summary Section */}
      {/* <section className="px-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalExpected.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Expected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.totalDelivered.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{summary.pendingDelivery.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Pending Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.deliveryPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>
      </section> */}

      {/* Filter Section */}
      <section className="">
        <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
          <div className="w-full flex justify-start max-w-[13rem]">
            <div className="w-44">
              <Filter column={table.getColumn("id")!} />
            </div>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <div className="">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 border">
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
                  className="h-24 text-center"
                >
                  <div className="w-full flex flex-col gap-3 justify-center items-center">
                    <img src="/folder.svg" alt="" />
                    <h4 className="font-bold text-lg">No Inward Records</h4>
                    <p className="text-sm text-gray-500">
                      Add items to track purchase inward deliveries
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {/* <div className="flex items-center justify-end space-x-2 py-4 px-5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div> */}

      {/* Add Item Button */}
      {/* {!readonly && (
        <div className="px-3">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleAddItem}
              className="bg-[#7047EB] h-8 font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Inward Record
            </Button>
          </div>
        </div>
      )} */}
    </div>
  );
};

function Filter({ column }: { column: Column<any, unknown> }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();
  const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";

  return (
    <div className="*:not-first:mt-2">
      <div className="relative">
        <Input
          id={`${id}-input`}
          className={`${inputClasses} pe-9`}
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder="Search..."
          type="text"
        />
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 pr-3"
          aria-label="Search"
        >
          <Search size={16} aria-hidden="true" className="text-neutral-500" />
        </button>
      </div>
    </div>
  );
}

export default PurchaseInwardTable;
