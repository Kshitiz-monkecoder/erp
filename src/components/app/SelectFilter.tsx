import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";

export type OptionType = {
  label: string;
  value: string;
};

interface ISelectFilterProps {
  items: OptionType[];
  onValueChange?: (value: string) => void; // change the optional condition here in future
  defaultValue?: string;
  label?: string;
}
const SelectFilter: React.FC<ISelectFilterProps> = ({
  items,
  defaultValue,
  label,
  onValueChange,
}) => {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <Label className="text-xs text-neutral-600">{label}</Label>}
      <Select
        {...(defaultValue ? { defaultValue } : {})}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="min-w-32 w-full bg-white text-xs sm:text-sm md:min-w-44 focus-visible:ring-0 text-neutral-700 rounded-md shadow-none">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent className="text-neutral-700 text-xs sm:text-sm">
          {items.map((value) => (
            <SelectItem
              key={value.label}
              value={value.value}
              className="text-xs sm:text-sm"
            >
              {value.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default SelectFilter;
