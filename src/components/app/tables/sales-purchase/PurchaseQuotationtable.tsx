import React, { useId, useMemo, useState, useRef, useCallback } from "react";
import { debounce } from "lodash";
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
import { PlusIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../../ui/button";
import { get } from "@/lib/apiService";
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

import { useEffect } from "react";
import SelectWithSearch from "../../SelectWithSearch";

type ItemAPIResponse = {
  sku: string;
  name: string;
  unit: {
    name: string;
  };
  defaultPrice: string;
  hsnCode: string;
  tax: {
    rate: string;
  };
  id: number;
};

type Item = {
  itemId: number;
  itemDescription: string;
  hsnSacCode: string;
  quantity: string;
  unit: string;
  price: number;
  tax: number;
  totalBeforeTax: number;
};

interface PurchaseOrderTableProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  onTotalsChange?: (totals: {
    totalBeforeTax: number;
    totalTax: number;
    totalAfterTax: number;
  }) => void;
  toggleAddItemModal?: () => void;
  isEdit?: boolean;
}

// SOLUTION 1: Memoized Input Components
const QuantityInput = React.memo(
  ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync with external changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Debounced external update
    const debouncedOnChange = useRef(debounce(onChange, 300)).current;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if(Number(newValue) < 0) return; // Prevent negative values
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    };

    return (
      <Input
        type="number"
        className="font-normal min-w-32 text-sm"
        value={localValue}
        onChange={handleChange}
      />
    );
  }
);

const PriceInput = React.memo(
  ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => {
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync with external changes
    useEffect(() => {
      setLocalValue(value.toString());
    }, [value]);

    // Debounced external update
    const debouncedOnChange = useRef(debounce(onChange, 300)).current;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(parseFloat(newValue) || 0);
    };

    return (
      <Input
        type="number"
        className="font-normal min-w-32 text-sm"
        value={localValue}
        onChange={handleChange}
      />
    );
  }
);

const PurchaseQuotationtable: React.FC<PurchaseOrderTableProps> = ({
  items,
  setItems,
  onTotalsChange,
  toggleAddItemModal,
}) => {
  // SOLUTION 2: Single source of truth with ref for immediate updates
  const itemsRef = useRef<Item[]>(items);
  const [, forceUpdate] = useState({});

  // Update ref when props change
  useEffect(() => {
    itemsRef.current = items;
    forceUpdate({});
  }, [items]);

  // Debounced function to update parent state
  const debouncedSetItems = useRef(
    debounce((newItems: Item[]) => {
      setItems(newItems);
    }, 500)
  ).current;

  // Debounced function to update totals
  const debouncedOnTotalsChange = useRef(
    debounce(
      (totals: {
        totalBeforeTax: number;
        totalTax: number;
        totalAfterTax: number;
      }) => {
        if (onTotalsChange) {
          onTotalsChange(totals);
        }
      },
      500
    )
  ).current;

  // Helper function to update items without causing re-renders
  const updateItem = useCallback(
    (index: number, updates: Partial<Item>) => {
      const currentItems = [...itemsRef.current];
      currentItems[index] = { ...currentItems[index], ...updates };

      // Calculate totals
      const quantity = parseFloat(currentItems[index].quantity || "0");
      const price = currentItems[index].price || 0;
      currentItems[index].totalBeforeTax = quantity * price;

      itemsRef.current = currentItems;

      // Debounced parent updates
      debouncedSetItems(currentItems);

      // Calculate and update totals
      const totals = calculateTotals(currentItems);
      debouncedOnTotalsChange(totals);
    },
    [debouncedSetItems, debouncedOnTotalsChange]
  );

  const calculateTotals = (items: Item[]) => {
    const totalBeforeTax = items.reduce(
      (sum, item) => sum + item.totalBeforeTax,
      0
    );
    const totalTax = items.reduce(
      (sum, item) => sum + (item.totalBeforeTax * item.tax) / 100,
      0
    );
    return {
      totalBeforeTax,
      totalTax,
      totalAfterTax: totalBeforeTax + totalTax,
    };
  };

  const emptyItem: Item = {
    itemId: -1,
    itemDescription: "",
    hsnSacCode: "",
    quantity: "0",
    unit: "",
    price: 0,
    tax: 0,
    totalBeforeTax: 0,
  };

  const handleAddItem = () => {
    const newItems = [...itemsRef.current, { ...emptyItem }];
    itemsRef.current = newItems;
    setItems(newItems); // Immediate update for adding items
    forceUpdate({});
  };

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [allItems, setAllItems] = useState<ItemAPIResponse[]>([]);

  // const { totalBeforeTax, totalTax, totalAfterTax } = useMemo(() => {
  //   return calculateTotals(itemsRef.current);
  // }, [itemsRef.current]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await get("/inventory/item");
        if (data?.status) {
          setAllItems(data.data);
          console.log("Fetched items:", data.data);
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
      }
    };
    fetchItems();
  }, []);

  // SOLUTION 3: Memoized columns to prevent recreation
  const columns: ColumnDef<Item>[] = useMemo(
    () => [
      {
        header: "Item Name",
        accessorKey: "itemDescription",
        cell: ({ row }) => {
          const idx = row.index;
          const currentItems = itemsRef.current;
          const selectedItem = allItems.find(
            (i) => i.name === currentItems[idx].itemDescription
          );
          return (
            <SelectWithSearch
              toggleAddItemModal={toggleAddItemModal || (() => {})}
              items={allItems
                .filter(
                  (item) =>
                    !currentItems.some(
                      (selected, selectedIdx) =>
                        selected.itemDescription === item.name &&
                        selectedIdx !== idx
                    )
                )
                .map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
              value={selectedItem?.name || ""}
              placeholder="Select Item"
              onChange={(name) => {
                const found = allItems.find((i) => i.name === name);
                if (!found) return;

                const updated: Item = {
                  itemId: found.id,
                  itemDescription: found.name,
                  hsnSacCode: found.hsnCode,
                  quantity: "0",
                  unit: found.unit.name,
                  price: Number(found.defaultPrice),
                  tax: Number(found.tax.rate),
                  totalBeforeTax: 0,
                };

                const newItems = [...itemsRef.current];
                newItems[idx] = updated;
                itemsRef.current = newItems;
                setItems(newItems); // Immediate update for item selection
                forceUpdate({});
              }}
              className="w-[200px]"
            />
          );
        },
      },
      {
        header: "HSN/SAC Code",
        accessorKey: "hsnSacCode",
        cell: ({ row }) => (
          <div className="font-normal min-w-32 text-sm truncate flex items-center gap-4">
            {row.getValue("hsnSacCode")}
          </div>
        ),
      },
      {
        header: "Quantity",
        accessorKey: "quantity",
        cell: ({ row }) => {
          const idx = row.index;
          return (
            <QuantityInput
              value={itemsRef.current[idx].quantity}
              onChange={(newQty) => {
                updateItem(idx, { quantity: newQty })
              }}
            />
          );
        },
      },
      {
        header: "Unit",
        accessorKey: "unit",
        cell: ({ row }) => (
          <div className="font-normal min-w-32 text-sm">
            {row.getValue("unit")}
          </div>
        ),
      },
      {
        header: "Price",
        accessorKey: "price",
        cell: ({ row }) => {
          const idx = row.index;
          return (
            <PriceInput
              value={itemsRef.current[idx].price}
              onChange={(newPrice) => updateItem(idx, { price: newPrice })}
            />
          );
        },
      },
      {
        header: "Tax",
        accessorKey: "tax",
        cell: ({ row }) => (
          <div className="font-normal min-w-32 text-sm">
            {row.getValue("tax")}%
          </div>
        ),
      },
      {
        header: "Total Before Tax",
        accessorKey: "totalBeforeTax",
        cell: ({ row }) => {
          return (
            <div className="font-normal min-w-32 text-sm">
              ₹{row.getValue<number>("totalBeforeTax").toFixed(2)}
            </div>
          );
        },
      },
    ],
    [allItems, toggleAddItemModal, updateItem]
  );

  const table = useReactTable({
    data: itemsRef.current,
    columns,
    initialState: {
      pagination: {
        pageSize: 7,
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
        <section className="mt-4 px-3">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <Filter column={table.getColumn("itemDescription")!} />
              </div>
            </div>
          </div>
        </section>
        <div className="px-3">
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
                          header.getContext()
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
                    className="h-10 text-center"
                  >
                    <div className="w-full flex flex-col gap-3 justify-center items-center">
                      <img src="/folder.svg" alt="" />
                      <h4 className="font-bold text-lg">No Item Added</h4>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-3">
          <div className="flex items-center gap-4">
            <div>
              <Button
                onClick={handleAddItem}
                className="bg-[#7047EB] h-8 font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
              >
                <PlusIcon className="" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Filter({ column }: { column: Column<any, unknown> }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};
  const columnHeader =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";
  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return [];

    const values = Array.from(column.getFacetedUniqueValues().keys());
    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr];
      }
      return [...acc, curr];
    }, []);

    return Array.from(new Set(flattenedValues)).sort();
  }, [column.getFacetedUniqueValues(), filterVariant]);
  const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";

  if (filterVariant === "range") {
    return (
      <div className="*:not-first:mt-2">
        <Label>{columnHeader}</Label>
        <div className="flex">
          <Input
            id={`${id}-range-1`}
            className={
              "flex-1 rounded-e-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            }
            value={(columnFilterValue as [number, number])?.[0] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old?.[1],
              ])
            }
            placeholder="Min"
            type="number"
            aria-label={`${columnHeader} min`}
          />
          <Input
            id={`${id}-range-2`}
            className="-ms-px flex-1 rounded-s-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={(columnFilterValue as [number, number])?.[1] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                e.target.value ? Number(e.target.value) : undefined,
              ])
            }
            placeholder="Max"
            type="number"
            aria-label={`${columnHeader} max`}
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "select") {
    return (
      <div className="*:not-first:mt-2">
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger id={`${id}-select`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="*:not-first:mt-2">
      <div className="relative">
        <div className="relative">
          <Input
            id={`${id}-input`}
            className={`${inputClasses} pe-9`}
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => column.setFilterValue(e.target.value)}
            placeholder={`Search..`}
            type="text"
          />
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 pr-3"
            aria-label="Subscribe"
          >
            <Search size={16} aria-hidden="true" className="text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseQuotationtable;
