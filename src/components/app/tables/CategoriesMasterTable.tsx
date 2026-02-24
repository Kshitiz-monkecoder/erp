import React, { useEffect,  useState } from "react";
import {
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
  useReactTable,
} from "@tanstack/react-table";
import { Edit, PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import { IModalProps } from "@/lib/types";
import TableLoading from "../TableLoading";
import { categoryType } from "@/pages/Inventory";
import TablePagenation from "../TablePagenation";
import { get } from "../../../lib/apiService";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

type Item = {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

interface CategoriesMasterTableProps extends Omit<IModalProps, "isOpen"> {
  toggleDeleteCategoryModal: () => void;
  toggleEditCategoryModal: (category: categoryType) => void;
  refreshTrigger?: number; // Add this prop
  onSuccess?: () => void; // Add callback for success
}

const CategoriesMasterTable: React.FC<CategoriesMasterTableProps> = ({
  onClose,
  toggleEditCategoryModal,
  refreshTrigger = 0, // Default value
  onSuccess, // Callback for when data is refreshed
}) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create a proper fetch function that can be called from outside
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await get('/inventory/categories');
      console.log("Fetched categories:", response);
      
      // Handle different response structures
      const categories = response?.data || [];
      setItems(categories);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]); // Add refreshTrigger to dependency array

  const columns: ColumnDef<Item>[] = [
    {
      header: "Id",
      accessorKey: "id",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 flex items-center gap-4">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("name")}</div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => (
        <div className="font-normal min-w-56 max-w-56 flex items-center gap-4">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: ({ row }) => {
        const category = row.original;

        return (
          <div className="font-normal flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                toggleEditCategoryModal(category as categoryType);
              }}
            >
              <Edit size={16} />
            </Button>
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
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        id: true,
        name: true,
        description: true,
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

  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={onClose}
                className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
              >
                <PlusIcon className="" />
                Add Category
              </Button>
            </div>
          </div>
        </section>
        <div className="px-5">
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
                          header.getContext(),
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {isLoading ? (
              <TableLoading columnLength={columns.length} />
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-96 text-center"
                    >
                      <div className="w-full flex flex-col gap-3 justify-center items-center">
                        <img src="/folder.svg" alt="" />
                        <h4 className="font-bold text-lg">No Item Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a category to get started and manage your
                          operations efficiently.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        {table.getVisibleLeafColumns().length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default CategoriesMasterTable;