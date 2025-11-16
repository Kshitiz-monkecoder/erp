import { CalendarIcon } from "lucide-react";
import {
  Button,
  DatePicker,
  DateValue,
  Dialog,
  Group,
  Popover,
} from "react-aria-components";
import { Calendar } from "@/components/ui/calendar-rac";
import { DateInput } from "@/components/ui/datefield-rac";
import { inputClasses } from "@/lib/constants";
import React from "react";

interface IInputDatePicker {
  name: string;
  onChange: (date: string) => void;
  value?: DateValue | null;
  disabled?: boolean; // Add disabled prop
}

const InputDatePicker: React.FC<IInputDatePicker> = ({ 
  name, 
  onChange, 
  value,
  disabled = false // Default to false
}) => {
  // Convert string date to CalendarDate object if it exists

  return (
    <DatePicker
      className="*:not-first:mt-2"
      name={name}
      aria-label="Select date"
      value={value}
      isDisabled={disabled} // Apply disabled state
      onChange={(e) => {
        if (e) {
          const date = e.toDate("UTC");
          if (date) {
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            console.log("Formatted date:", formattedDate);
            onChange(formattedDate);
          }
        }
      }}
    >
      <div className="flex">
        <Group className="w-full">
          <DateInput 
            className={`pe-9 ${inputClasses} ${disabled ? "cursor-not-allowed opacity-70" : ""}`} 
          />
        </Group>
        <Button 
          className={`text-muted-foreground/80 hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 z-1 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px] ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <CalendarIcon size={16} />
        </Button>
      </div>
      <Popover
        className="bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-lg border shadow-lg outline-hidden"
        offset={4}
      >
        <Dialog className="max-h-[inherit] overflow-auto p-2">
          <Calendar />
        </Dialog>
      </Popover>
    </DatePicker>
  );
};

export default InputDatePicker;
