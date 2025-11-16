import React from "react";
import type { Header } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

export interface FilterValue {
  operator: string;
  value: string;
}

interface TableComparisonFilterSearch {
  header: Header<any, any>;
}

const TableComparisonFilterSearch: React.FC<TableComparisonFilterSearch> = ({
  header,
}) => {
  return (
    <div className="w-full flex items-center gap-2">
      <select
        className="w-14 h-8 px-2 border-b rounded-none border-gray-300 text-sm focus:outline-none"
        value={(header.column.getFilterValue() as FilterValue)?.operator || ">"}
        onChange={(e) =>
          header.column.setFilterValue({
            operator: e.target.value,
            value: (header.column.getFilterValue() as FilterValue)?.value ?? "",
          })
        }
      >
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
        <option value=">=">&gt;=</option>
        <option value="<=">&lt;=</option>
      </select>
      <Input
        type="number"
        placeholder={`Search...`}
        value={(header.column.getFilterValue() as FilterValue)?.value ?? ""}
        onChange={(event) =>
          header.column.setFilterValue({
            operator:
              (header.column.getFilterValue() as FilterValue)?.operator ?? ">",
            value: event.target.value,
          })
        }
        className="h-8 w-full border-b border-t-0 border-l-0 border-r-0 my-2 focus-visible:ring-0 rounded-none shadow-none"
      />
    </div>
  );
};

export default TableComparisonFilterSearch;
