import { useMemo, useState } from "react";
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
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpRight, PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import DatePicker from "../DatePicker";
import { Button } from "../../ui/button";
import { Link, useNavigate } from "react-router";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

type Item = {
  id: string;
  tags: string[];
  companyName: string;
  companyAddress: string;
  category: string;
  contactNumber: string;
  addedDate: string;
};

const BuyersAndSuppliersTable = ({
  tab,
  updatedItems,
  isLoading,
  isEmpty,
}: {
  tab: string | null;
  updatedItems: Item[];
  isLoading: boolean;
  isEmpty: boolean;
}) => {
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const navigateTo = useNavigate();
  console.log("updatedItems", updatedItems, isEmpty);

  const columns: ColumnDef<Item>[] = [
    {
      header: "Company Name",
      accessorKey: "companyName",
      cell: ({ row }) => (
        <div
          onClick={() => {
            // 1. serialize and save the item
            localStorage.setItem("currentB&S", JSON.stringify(row.original));
            // 2. navigate
            navigateTo(`/buyers-suppliers/${row.getValue("companyName")}`);
          }}
          className="font-normal gap-2 text-blue-500 min-w-32 flex items-center cursor-pointer"
        >
          {row.getValue("companyName")}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
    },
    {
      header: "Company Address",
      accessorKey: "companyAddress",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("companyAddress")}
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("category")}</div>
      ),
      filterFn: "equals",
    },
    {
      header: "Contact Number",
      accessorKey: "contactNumber",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("contactNumber")}
        </div>
      ),
    },
    {
      header: "Added On",
      accessorKey: "addedDate",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("addedDate")}</div>
      ),
    },
    {
      header: "Tags",
      accessorKey: "tags",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {(row.getValue("tags") as { name: string }[])
            .map((tag) => tag.name)
            .join(", ")}
        </div>
      ),
    },
  ];
  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with category filtering
    let filtered =
      !tab || tab === "all"
        ? updatedItems
        : updatedItems.filter(
            (item) =>
              item.category.toLowerCase() === tab.toLowerCase() ||
              item.category.toLowerCase() === "both",
          );

    // Then apply date filtering if both dates are present
    if (startDate && endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.addedDate);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Add one day to end date to include the end date in results
        end.setDate(end.getDate() + 1);

        // Check if item date is between start and end dates
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [tab, startDate, endDate, updatedItems]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client-side filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
    enableSortingRemoval: false,
  });
  console.log("table", filteredItems.length);
  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-5">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <FilterInput column={table.getColumn("companyName")!} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-4"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4"></div>
                <div className="flex items-center gap-4">
                  <Link to="/add-company">
                    <Button className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                      <PlusIcon className="" />
                      Add Company
                    </Button>
                  </Link>
                </div>
              </div>
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
                      // change this slug here in future accordingly
                      className="border"
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
                        <h4 className="font-bold text-lg">No Results Found</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please shorten the search string to see more results.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};
export default BuyersAndSuppliersTable;
