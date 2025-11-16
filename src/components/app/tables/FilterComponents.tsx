import React from "react";
import { Table } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import { Button } from "../../ui/button";
import FilterInput from "../FilterInput";
import SelectFilter, { OptionType } from "../SelectFilter";
import MultiSelectWithSearch from "../MultiSelectWithSearch";

// Helper components for building custom filter sections

interface FilterSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${className}`}>
    {children}
  </div>
);

interface FiltersGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FiltersGroup: React.FC<FiltersGroupProps> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`flex flex-wrap gap-4 items-center ${className}`}>
    {children}
  </div>
);

interface ActionsGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionsGroup: React.FC<ActionsGroupProps> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {children}
  </div>
);

interface SearchFilterProps {
  table: Table<any>;
  searchColumn: string;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ 
  table, 
  searchColumn, 
  className = "w-36 sm:w-44" 
}) => (
  <div className={className}>
    <FilterInput 
      column={table.getColumn(searchColumn)!}
    />
  </div>
);

interface StatusFilterProps {
  table: Table<any>;
  column: string;
  label: string;
  options: OptionType[];
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ 
  table, 
  column, 
  label, 
  options 
}) => (
  <SelectFilter
    label={label}
    items={options}
    onValueChange={(value) => {
      table.getColumn(column)?.setFilterValue(value === "All" ? "" : value);
    }}
  />
);

interface ColumnVisibilityToggleProps {
  table: Table<any>;
  label?: string;
}

export const ColumnVisibilityToggle: React.FC<ColumnVisibilityToggleProps> = ({ 
  table, 
  label = "Show/Hide Columns" 
}) => (
  <MultiSelectWithSearch
    columns={table.getAllColumns()}
    label={label}
  />
);

interface CreateButtonProps {
  onClick: () => void;
  text?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const CreateButton: React.FC<CreateButtonProps> = ({ 
  onClick, 
  text = "Create", 
  icon,
  className = "bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
}) => {
  const defaultIcon = <PlusIcon className="w-4 h-4 mr-1" />;
  
  return (
    <Button className={className} onClick={onClick}>
      {icon || defaultIcon}
      {text}
    </Button>
  );
};

// Utility function to build filter sections easily
interface FilterSectionBuilder {
  table: Table<any>;
  searchColumn?: string;
  statusFilters?: {
    column: string;
    label: string;
    options: OptionType[];
  }[];
  enableColumnVisibility?: boolean;
  createButton?: {
    text: string;
    onClick: () => void;
  };
  customFilters?: React.ReactNode[];
  customActions?: React.ReactNode[];
}

export const buildFilterSection = ({
  table,
  searchColumn,
  statusFilters = [],
  enableColumnVisibility = false,
  createButton,
  customFilters = [],
  customActions = [],
}: FilterSectionBuilder): React.ReactNode => (
  <FilterSection>
    <FiltersGroup>
      {/* Search Filter */}
      {searchColumn && (
        <SearchFilter
          table={table}
          searchColumn={searchColumn}
        />
      )}
      
      {/* Status Filters */}
      {statusFilters.map((filter, index) => (
        <StatusFilter
          key={index}
          table={table}
          column={filter.column}
          label={filter.label}
          options={filter.options}
        />
      ))}
      
      {/* Column Visibility */}
      {enableColumnVisibility && (
        <ColumnVisibilityToggle table={table} />
      )}
      
      {/* Custom Filters */}
      {customFilters}
    </FiltersGroup>

    <ActionsGroup>
      {/* Create Button */}
      {createButton && (
        <CreateButton
          onClick={createButton.onClick}
          text={createButton.text}
        />
      )}
      
      {/* Custom Actions */}
      {customActions}
    </ActionsGroup>
  </FilterSection>
);
