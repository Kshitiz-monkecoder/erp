import React, { useEffect, useId, useState, useCallback, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/lib/useDebounce";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

type PurchaseInwardItem = {
  itemId: number;
  accepted: number;
  remarks: string;
};

type Item = {
  poItem: {
    quantity: number;
    unitPrice: string;
    tax: string;
    totalPrice: string;
    id: string;
    createdAt: string;
    updatedAt: string;
  };
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
  quantity: string;
  deliveryDate: string;
  delivered: string;
  remarks?: string;
  accepted?: string;
  id: number;
  createdAt: string;
  updatedAt: string;
};

interface PurchaseGRNTableProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  readonly?: boolean;
}

// Optimized remarks input component
const RemarksInput = React.memo(
  ({
    value,
    onChange,
    index,
  }: {
    value: string;
    onChange: (index: number, value: string) => void;
    index: number;
  }) => {
    const [localValue, setLocalValue] = useState(value || "");

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    // Debounced update to parent
    const debouncedValue = useDebounce(localValue, 300);

    useEffect(() => {
      if (debouncedValue !== value) {
        onChange(index, debouncedValue);
      }
    }, [debouncedValue, onChange, index, value]);

    return (
      <Input
        type="text"
        className="font-normal min-w-40 text-sm shadow-none"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Add remarks..."
      />
    );
  }
);

RemarksInput.displayName = "RemarksInput";

// Optimized accepted input component
const AcceptedInput = React.memo(
  ({
    value,
    onChange,
    index,
  }: {
    value: string;
    onChange: (index: number, value: string) => void;
    index: number;
  }) => {
    const [localValue, setLocalValue] = useState(value || "0");

    // Update local value when prop changes
    useEffect(() => {
      setLocalValue(value || "0");
    }, [value]);

    // Debounced update to parent
    const debouncedValue = useDebounce(localValue, 300);

    useEffect(() => {
      // Only update if it's a valid number and different from current value
      const numericValue = Number(debouncedValue);
      if (
        !isNaN(numericValue) &&
        numericValue >= 0 &&
        debouncedValue !== value
      ) {
        onChange(index, debouncedValue);
      }
    }, [debouncedValue, onChange, index, value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue === "") {
        setLocalValue('0');
        return;
      }
      // Allow empty string or valid numbers (including decimal input)
      if (!isNaN(Number(newValue)) && Number(newValue) >= 0) {
        setLocalValue(newValue);
      }
      // If invalid input, don't update local state (prevents the error)
    };

    return (
      <Input
        type="number"
        step="1"
        className="font-normal min-w-32 shadow-none text-sm"
        value={localValue}
        onChange={handleChange}
        min="0"
      />
    );
  }
);

AcceptedInput.displayName = "AcceptedInput";

const PurchaseGRNTable: React.FC<PurchaseGRNTableProps> = React.memo(
  ({ items, setItems, readonly = false }) => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Memoized and optimized update function
    const updateItem = useCallback(
      (index: number, field: keyof PurchaseInwardItem, value: string) => {
        setItems((prevItems) => {
          // Only update if the value actually changed
          // if (prevItems[index]?.[field] === value) {
          //   return prevItems;
          // }

          const newItems = [...prevItems];
          newItems[index] = {
            ...newItems[index],
            [field]: value,
            updatedAt: new Date().toISOString(),
          };
          return newItems;
        });
      },
      [setItems]
    );

    // Memoized columns definition - removed items dependency to prevent re-creation
    const columns: ColumnDef<Item>[] = useMemo(
      () => [
        {
          header: "Item",
          accessorKey: "itemId",
          cell: ({ row }) => {
            return (
              <div className="font-normal min-w-20 text-sm">
                {row.original.item.name}
              </div>
            );
          },
        },
        {
          header: "Accepted",
          accessorKey: "accepted",
          cell: ({ row }) => {
            const idx = row.index;
            const acceptedValue = row.original.accepted?.toString() || "0";

            return (
              <AcceptedInput
                key={`accepted-${row.original.id}`}
                value={acceptedValue}
                onChange={(index, value) =>
                  updateItem(index, "accepted", value)
                }
                index={idx}
              />
            );
          },
        },
        {
          header: "Remarks",
          accessorKey: "remarks",
          cell: ({ row }) => {
            const idx = row.index;
            const remarksValue = row.original.remarks || "";

            return readonly ? (
              <div className="font-normal min-w-40 text-sm">
                {remarksValue || "-"}
              </div>
            ) : (
              <RemarksInput
                key={`remarks-${row.original.id}`}
                value={remarksValue}
                onChange={(index, value) => updateItem(index, "remarks", value)}
                index={idx}
              />
            );
          },
        },
      ],
      [readonly, updateItem] // Removed 'items' dependency
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
      <div className="space-y-6 px-3 py-5">
        {/* Filter Section */}
        <section className="">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <Filter column={table.getColumn("itemId")!} />
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
      </div>
    );
  }
);

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: PurchaseGRNTableProps,
  nextProps: PurchaseGRNTableProps
) => {
  // Check if readonly prop changed
  if (prevProps.readonly !== nextProps.readonly) {
    return false;
  }

  // Check if setItems function reference changed
  if (prevProps.setItems !== nextProps.setItems) {
    return false;
  }

  // Check if items array length changed
  if (prevProps.items.length !== nextProps.items.length) {
    return false;
  }

  // Shallow comparison of items - only check if the array reference changed
  // This allows React Table to handle the internal updates efficiently
  return prevProps.items === nextProps.items;
};

PurchaseGRNTable.displayName = "PurchaseGRNTable";

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

export default React.memo(PurchaseGRNTable, arePropsEqual);
