// @ts-nocheck
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";
import { labelClasses } from "@/lib/constants";
import { Column } from "@tanstack/react-table";
import { table } from "console";

export interface MultiSelectWithSearchProps {
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label: string;
  columns: Column<any>[];
}

const MultiSelectWithSearch: React.FC<MultiSelectWithSearchProps> = ({
  placeholder = "Select...",
  className = "",
  disabled = false,
  label,
  columns,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="space-y-1">
        <Label className={labelClasses}>{label}</Label>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-w-32 shadow-none",
            className,
          )}
          disabled={disabled}
        >
          <div className="text-neutral-700 flex items-center gap-2">
            {(() => {
              const visibleCount = columns.filter((col) =>
                col.getIsVisible(),
              ).length;
              return <div>{visibleCount} selected</div>;
            })()}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => {
                return (
                  <CommandItem
                    key={column.id}
                    className="flex items-center gap-2"
                    onSelect={() => column.toggleVisibility()}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      disabled={!column.getCanHide()}
                      className="mr-2"
                      onCheckedChange={column.getToggleVisibilityHandler()}
                    />
                    {column.columnDef.header}
                    {/* {isSelected && <Check className="h-4 w-4 ml-auto" />} */}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
export default MultiSelectWithSearch;
