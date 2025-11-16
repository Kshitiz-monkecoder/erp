import { CalendarIcon } from "lucide-react";
import {
  Button,
  DateRangePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from "react-aria-components";

import { cn } from "@/lib/utils";
import { RangeCalendar } from "@/components/ui/calendar-rac";
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac";
import React from "react";
import { useLocation, useNavigate } from "react-router";
import { parseDate } from "@internationalized/date";

const DatePicker: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Parse URL params into CalendarDate objects, if present
  const start = startDate ? parseDate(startDate) : undefined;
  const end = endDate ? parseDate(endDate) : undefined;
  const valueObj = start && end ? { start, end } : undefined;

  const updateSearchParams = (
    value: {
      start?: { year: number; month: number; day: number };
      end?: { year: number; month: number; day: number };
    } | null,
  ) => {
    if (value?.start && value?.end) {
      searchParams.set(
        "startDate",
        `${value.start.year}-${String(value.start.month).padStart(2, "0")}-${String(value.start.day).padStart(2, "0")}`,
      );
      searchParams.set(
        "endDate",
        `${value.end.year}-${String(value.end.month).padStart(2, "0")}-${String(value.end.day).padStart(2, "0")}`,
      );
      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString(),
        },
        { replace: true },
      );
    }
  };

  return (
    <div className="flex items-center">
      {/* Visible label for accessibility */}
      <Label htmlFor="inventory-date-range" className="sr-only">
        Filter items by date range
      </Label>

      <DateRangePicker
        aria-labelledby="inventory-date-range-label"
        id="inventory-date-range"
        value={valueObj}
        startName="startDate"
        endName="endDate"
        className="*:not-first:mt-2"
        onChange={updateSearchParams}
      >
        <div className="flex">
          <Group className={cn(dateInputStyle, "ps-9")}>
            <Button
              className={
                "text-muted-foreground/80 hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px]"
              }
            >
              <CalendarIcon size={16} />
            </Button>
            <DateInput slot="start" unstyled aria-label="Start date" />
            <span aria-hidden="true" className="text-muted-foreground/70 px-2">
              -
            </span>
            <DateInput slot="end" unstyled aria-label="End date" />
          </Group>
        </div>
        <Popover
          className="bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-md border shadow-lg outline-hidden"
          offset={4}
        >
          <Dialog className="max-h-[inherit] overflow-auto p-2">
            <RangeCalendar />
          </Dialog>
        </Popover>
      </DateRangePicker>
    </div>
  );
};

export default DatePicker;
