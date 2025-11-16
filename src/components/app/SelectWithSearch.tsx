import { useId, useState } from "react";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AddPurchaseItemModal from "./modals/AddPurchaseItemModal";

interface SelectWithSearchProps {
  items: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  toggleAddItemModal: () => void;
  disabled?: boolean;
}

const SelectWithSearch = ({
  items,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  label,
  toggleAddItemModal,
  disabled = false,
}: SelectWithSearchProps) => {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);

  return (
    <div className="*:not-first:mt-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={disabled ? false : open} onOpenChange={disabled ? () => {} : setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value
                ? items.find((item) => item.value === value)?.label || value
                : placeholder}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
            />
            <CommandList>
              <CommandEmpty>
                <Button
                  onClick={toggleAddItemModal}
                  className="bg-[#7047EB] h-8 font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                >
                  <PlusIcon className="" />
                  Add Item
                </Button>
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                    {value === item.value && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
                <div className="flex justify-center">
                  <Button
                    onClick={toggleAddItemModal}
                    className="bg-[#7047EB] w-full h-8 font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                  >
                    <PlusIcon className="" />
                    Add Item
                  </Button>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <AddPurchaseItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal((prev) => !prev)}
      />
    </div>
  );
};

export default SelectWithSearch;
