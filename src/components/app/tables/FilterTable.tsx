import React, { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column } from "@tanstack/react-table";
type FilterProps = {
  columns: Column<any, unknown>[];
  label?: string;
};

const FilterTable: React.FC<FilterProps> = ({ columns, label }) => {
  const id = useId();
  const [filterValue, setFilterValue] = useState("");

  // We use only the first column for metadata (like label or variant)
  const primaryColumn = columns[0];
  const columnHeader =
    typeof primaryColumn.columnDef.header === "string"
      ? primaryColumn.columnDef.header
      : "";
  const { filterVariant } = primaryColumn.columnDef.meta ?? {};

  const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return [];

    const uniqueValues = new Set<string>();

    columns.forEach((column) => {
      const values = Array.from(column.getFacetedUniqueValues().keys());
      values.forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((v) => uniqueValues.add(String(v)));
        } else {
          uniqueValues.add(String(value));
        }
      });
    });

    return Array.from(uniqueValues).sort();
  }, [columns, filterVariant]);

  if (filterVariant === "range") {
    const primaryFilterValue = primaryColumn.getFilterValue() as
      | [number, number]
      | undefined;

    return (
      <div className="*:not-first:mt-2">
        <Label>{columnHeader}</Label>
        <div className="flex">
          <Input
            id={`${id}-range-1`}
            className="flex-1 rounded-e-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={primaryFilterValue?.[0] ?? ""}
            onChange={(e) =>
              primaryColumn.setFilterValue((old: [number, number]) => [
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
            value={primaryFilterValue?.[1] ?? ""}
            onChange={(e) =>
              primaryColumn.setFilterValue((old: [number, number]) => [
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
      <div className="*:not-first:mt-2 group relative max-w-36">
        <Label
          htmlFor={`${id}-select`}
          className="absolute rounded-full text-neutral-400 font-normal bg-neutral-50 start-1 top-0 z-1 block -translate-y-1/2 px-2 text-xs"
        >
          {label || columnHeader}
        </Label>
        <Select
          value={filterValue || "all"}
          onValueChange={(value) => {
            setFilterValue(value === "all" ? "" : value);
            columns.forEach((column) => {
              column.setFilterValue(value === "all" ? undefined : value);
            });
          }}
        >
          <SelectTrigger
            id={`${id}-select`}
            className="min-w-32 text-xs sm:text-sm md:min-w-44 focus-visible:ring-0 text-neutral-700 rounded-full shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-neutral-700 text-xs sm:text-sm">
            <SelectItem value="all" className="text-xs sm:text-sm">
              All
            </SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem
                key={value}
                value={value}
                className="text-xs sm:text-sm"
              >
                {value}
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
        <Input
          id={`${id}-input`}
          className={`${inputClasses} pe-9`}
          value={filterValue}
          onChange={(e) => {
            const val = e.target.value;
            setFilterValue(val);
            columns.forEach((column) => {
              column.setFilterValue(val);
            });
          }}
          placeholder={`Search...`}
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
};

export default FilterTable;
