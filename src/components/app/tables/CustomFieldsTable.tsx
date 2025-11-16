import React from "react";
import {
  // Column,
  ColumnDef,
  // ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  // RowData,
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IItem {
  fieldName: string;
  description: string;
  dataType: string;
  defaultValue: string;
  customFieldId: string;
  createdBy: string;
  creationDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  addedAs: string;
}

const columns: ColumnDef<IItem>[] = [
  {
    accessorKey: "fieldName",
    cell: (info) => info.getValue(),
    header: () => <span className="truncate text-sm">Name</span>,
  },
  {
    header: () => <span className="truncate text-sm">Description</span>,
    accessorKey: "description",
  },
  {
    header: () => <span className="truncate text-sm">Data Type</span>,
    accessorKey: "dataType",
  },
  {
    header: () => <span className="truncate text-sm">Default Value</span>,
    accessorKey: "defaultValue",
  },
  {
    header: () => <span className="truncate text-sm">Custom Field Id</span>,
    accessorKey: "customFieldId",
  },
  {
    header: () => <span className="truncate text-sm">Created By</span>,
    accessorKey: "createdBy",
  },
  {
    header: () => <span className="truncate text-sm">Creation Date</span>,
    accessorKey: "creationDate",
  },
  {
    header: () => <span className="truncate text-sm">Last Modified By</span>,
    accessorKey: "lastModifiedBy",
  },
  {
    header: () => <span className="truncate text-sm">Last Modified Date</span>,
    accessorKey: "lastModifiedDate",
  },
  {
    header: () => <span className="truncate text-sm">Added As</span>,
    accessorKey: "addedAs",
  },
];

interface CustomFieldsTableProps {
  items: IItem[];
}

const CustomFieldsTable: React.FC<CustomFieldsTableProps> = ({ items }) => {
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });
  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="relative h-10 border-t select-none w-32"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
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
                className="text-xs"
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-96 text-center">
                <div className="w-full flex flex-col gap-3 justify-center items-center">
                  <img src="/folder.svg" alt="" />
                  <h4 className="font-bold text-lg">No Field Added</h4>
                  <p className="max-w-xs text-[#121217] text-sm">
                    Please add a Field to get started and manage your operations
                    efficiently.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomFieldsTable;
