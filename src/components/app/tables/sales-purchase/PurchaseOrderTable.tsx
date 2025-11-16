import React, { useId, useMemo, useState } from "react";
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
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { PlusIcon, Search } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { get } from "../../../../lib/apiService";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  // SelectGroup,
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
// import { inputClasses } from "@/lib/constants";
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values

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

// const items: Item[] = [
//   {
//     itemId: "ITM00001",
//     itemDescription: "Premium Wheat Flour",
//     hsnSacCode: "",
//     quantity: "50",
//     unit: "",
//     price: 0.0,
//     tax: 0.0,
//     totalBeforeTax: 0.0,
//   },
//   {
//     itemId: "ITM00002",
//     itemDescription: "Refined Sugar",
//     hsnSacCode: "",
//     quantity: "30",
//     unit: "",
//     price: 0.0,
//     tax: 0.0,
//     totalBeforeTax: 0.0,
//   },
// ];

interface PurchaseOrderTableProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  onTotalsChange?: (totals: {
    totalBeforeTax: number;
    totalTax: number;
    totalAfterTax: number;
  }) => void;
  toggleAddItemModal?: () => void;
}

const PurchaseOrdertable: React.FC<PurchaseOrderTableProps> = ({
  items,
  setItems,
  onTotalsChange,
  toggleAddItemModal,
}) => {
  // 1A. Define a blank item template
  const emptyItem: Item = {
    itemId: -1,
    itemDescription: "",
    hsnSacCode: "",
    quantity: "1",
    unit: "",
    price: 0,
    tax: 0,
    totalBeforeTax: 0,
  };

  // 1B. Handler to add one more row
  const handleAddItem = () => {
    setItems((old) => [...old, { ...emptyItem }]);
  };

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [allItems, setAllItems] = useState<ItemAPIResponse[]>([]);

  const { totalBeforeTax, totalTax, totalAfterTax } = useMemo(() => {
    const tb = items.reduce((sum, item) => sum + item.totalBeforeTax, 0);
    // assume item.tax is a percentage (e.g. 18 for 18%)
    const tx = items.reduce(
      (sum, item) => sum + (item.totalBeforeTax * item.tax) / 100,
      0
    );
    return {
      totalBeforeTax: tb,
      totalTax: tx,
      totalAfterTax: tb + tx,
    };
  }, [items]);

  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange({ totalBeforeTax, totalTax, totalAfterTax });
    }
  }, [totalBeforeTax, totalTax, totalAfterTax, onTotalsChange]);

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

  const columns: ColumnDef<Item>[] = [
    {
      header: "Item Id",
      accessorKey: "itemId",
      cell: ({ row }) => {
        const idx = row.index;
        // Show the selected SKU (from allItems) if available, else show the raw value
        const selectedItem = allItems.find((i) => i.id === items[idx].itemId);
        return (
          <div className="flex items-center gap-2">
            <SelectWithSearch
              toggleAddItemModal={
                toggleAddItemModal ? toggleAddItemModal : () => {}
              }
              items={allItems.map((item) => ({
                value: item.sku,
                label: item.sku,
              }))}
              value={selectedItem?.sku || ""}
              placeholder="Select ID"
              onChange={(sku) => {
                const found = allItems.find((i) => i.sku === sku);
                if (!found) return;
                const updated: Item = {
                  itemId: found.id,
                  itemDescription: found.name,
                  hsnSacCode: found.hsnCode,
                  quantity: "1",
                  unit: found.unit.name,
                  price: Number(found.defaultPrice),
                  tax: Number(found.tax.rate),
                  totalBeforeTax: Number(found.defaultPrice),
                };
                setItems((old) => {
                  const copy = [...old];
                  copy[idx] = updated;
                  return copy;
                });
              }}
              className="w-[150px]"
            />
          </div>
        );
      },
    },
    {
      header: "Item Description",
      accessorKey: "itemDescription",
      cell: ({ row }) => {
        const idx = row.index;
        const selectedItem = allItems.find(
          (i) => i.name === items[idx].itemDescription
        );
        return (
          <SelectWithSearch
            toggleAddItemModal={
              toggleAddItemModal ? toggleAddItemModal : () => {}
            }
            items={allItems.map((item) => ({
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
                quantity: "1",
                unit: found.unit.name,
                price: Number(found.defaultPrice),
                tax: Number(found.tax.rate),
                totalBeforeTax: Number(found.defaultPrice),
              };
              setItems((old) => {
                const copy = [...old];
                copy[idx] = updated;
                return copy;
              });
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
        <div className="font-normal min-w-32 text-sm truncate flex  items-center gap-4">
          {row.getValue("hsnSacCode")}
        </div>
      ),
    },
    // Editable Quantity column:
    {
      header: "Quantity",
      accessorKey: "quantity",
      cell: ({ row }) => {
        const idx = row.index;
        return (
          <Input
            type="number"
            className="font-normal min-w-32 text-sm"
            value={items[idx].quantity}
            onChange={(e) => {
              const newQty = e.target.value;
              if (Number(newQty) < 0) return; // Prevent negative quantities
              setItems((old) => {
                const copy = [...old];
                copy[idx].quantity = newQty;
                const price = copy[idx].price || 0;
                copy[idx].totalBeforeTax = parseFloat(newQty || "0") * price;
                return copy;
              });
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
      cell: ({ row }) => (
        <div className="font-normal min-w-32 text-sm">
          ₹{row.getValue("price")}
        </div>
      ),
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
    // Dynamic Total Before Tax column:
    {
      header: "Total Before Tax",
      accessorKey: "totalBeforeTax",
      cell: ({ row }) => {
        // row.getValue will always be in sync because you update it in state
        return (
          <div className="font-normal min-w-32 text-sm">
            ₹{row.getValue<number>("totalBeforeTax").toFixed(2)}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
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

  // const states = ["A", "a", "C"];
  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-3">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <Filter column={table.getColumn("itemId")!} />
              </div>
            </div>
            {/* <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Select name="regularBuyingPrice">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="Regular Buying Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {states.map((name) => (
                          <SelectItem value={name} key={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div> */}
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
                    // TODO : add sidebar hovering effect for current page
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
        <div className="px-3">
          <div className="flex items-center gap-4">
            {/* TODO: Add functionality for add item Modal */}
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

    // Get all unique values from the column
    const values = Array.from(column.getFacetedUniqueValues().keys());

    // If the values are arrays, flatten them and get unique items
    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr];
      }
      return [...acc, curr];
    }, []);

    // Get unique values and sort them
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
      {/* <Label htmlFor={`${id}-input`}>{columnHeader}</Label> */}
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

export default PurchaseOrdertable;
