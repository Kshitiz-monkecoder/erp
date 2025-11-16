import React, { useState } from "react";
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
import { Funnel, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FilterBillsofMaterialModal from "../../modals/FilterBillsofMaterialTableModal";
import TablePagenation from "../../TablePagenation";
import { Checkbox } from "@/components/ui/checkbox";
import TableComparisonFilterSearch, {
  FilterValue,
} from "./TableComparisonFilterSearch";
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
export type BillsOfMaterialData = {
  bomId: string;
  bomName: string;
  status: string;
  fgName: string;
  numberOfRm: number;
  lastModifiedDate: string;
  lastModifiedBy: string;
};

const columns: ColumnDef<BillsOfMaterialData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="mr-2 "
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="mr-2 "
      />
    ),
  },
  {
    header: () => <div className="min-w-32">BOM ID</div>,
    accessorKey: "bomId",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("bomId")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">BOM Name</div>,
    accessorKey: "bomName",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("bomName")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Status</div>,
    accessorKey: "status",
    cell: ({ row }) => (
      <div
        className={`font-normal px-3 py-1 text-xs w-fit rounded-full ${
          row.getValue("status") === "Active"
            ? "text-green-600 bg-green-100"
            : row.getValue("status") === "Inactive"
              ? "text-red-600 bg-red-100"
              : "text-yellow-600 bg-yellow-100"
        }`}
      >
        {row.getValue("status")}
      </div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Name</div>,
    accessorKey: "fgName",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("fgName")}</div>
    ),
  },
  {
    header: () => <div className="min-w-48">No. of RM</div>,
    accessorKey: "numberOfRm",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("numberOfRm")}</div>
    ),
    filterFn: (row, columnId, filterValue: FilterValue) => {
      if (!filterValue?.value) return true; // No filter, show all
      const rowValue = Number(row.getValue(columnId));
      const filterNum = Number(filterValue.value);
      switch (filterValue.operator) {
        case ">":
          return rowValue > filterNum;
        case "<":
          return rowValue < filterNum;
        case ">=":
          return rowValue >= filterNum;
        case "<=":
          return rowValue <= filterNum;
        default:
          return true;
      }
    },
  },
  {
    header: () => <div className="min-w-32">Last Modified By</div>,
    accessorKey: "lastModifiedBy",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("lastModifiedBy")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Last Modified Date</div>,
    accessorKey: "lastModifiedDate",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("lastModifiedDate")}</div>
    ),
  },
];

const items: BillsOfMaterialData[] = [
  {
    bomId: "BOM001",
    bomName: "Assembly Alpha",
    status: "Active",
    fgName: "Widget X",
    numberOfRm: 5,
    lastModifiedDate: "2025-04-15",
    lastModifiedBy: "Ani",
  },
  {
    bomId: "BOM002",
    bomName: "Assembly Beta",
    status: "Inactive",
    fgName: "Gadget Y",
    numberOfRm: 3,
    lastModifiedDate: "2025-04-10",
    lastModifiedBy: "Ani",
  },
  {
    bomId: "BOM003",
    bomName: "Assembly Gamma",
    status: "Pending",
    fgName: "Component Z",
    numberOfRm: 7,
    lastModifiedDate: "2025-03-28",
    lastModifiedBy: "Ani",
  },
  {
    bomId: "BOM004",
    bomName: "Assembly Delta",
    status: "Active",
    fgName: "Part A",
    numberOfRm: 4,
    lastModifiedDate: "2025-04-01",
    lastModifiedBy: "Ani",
  },
  {
    bomId: "BOM005",
    bomName: "Assembly Epsilon",
    status: "Active",
    fgName: "Module B",
    numberOfRm: 6,
    lastModifiedDate: "2025-04-12",
    lastModifiedBy: "Ani",
  },
];

const BillOfMaterialTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterBillsOfMaterialModal, setShowBillsOfMaterialModal] =
    useState<boolean>(false);
  const toggleShowFilterBillsOfMaterialModal = () =>
    setShowBillsOfMaterialModal((prev) => !prev);

  const table = useReactTable({
    data: items,
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

  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-5">
          <div className="flex md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="max-w-44">
                <Button
                  onClick={toggleShowFilterBillsOfMaterialModal}
                  className="text-neutral-500 px-5 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none w-full"
                >
                  Filter
                  <Funnel className="h-4 w-4 " />
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className=" px-5 w-full">
          <div className="sm:flex-row flex flex-col gap-3 pt-3 md:justify-between sm:items-center border-t">
            <p className="text-xs sm:text-sm">
              Select BOMs to Start Process or Delete
            </p>
            <div className="flex sm:items-center gap-3">
              <Button
                disabled={!table.getIsSomePageRowsSelected()}
                className="flex items-center bg-neutral-300 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none  text-sm text-neutral-500"
              >
                <Plus className="w-4" />
                Start Process
              </Button>
              <Button
                disabled={!table.getIsSomePageRowsSelected()}
                className="flex items-center bg-neutral-300 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none  text-sm text-neutral-500"
              >
                <Trash className="w-4" />
                Delete
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => {
                    const shouldShowSearch = [
                      "bomId",
                      "bomName",
                      "fgName",
                      "lastModifiedBy",
                    ].includes(header.id);
                    const showComparisonSearch = ["numberOfRm"].includes(
                      header.id,
                    );
                    return (
                      <TableHead
                        key={header.id}
                        className="relative border-t select-none border-r"
                      >
                        {shouldShowSearch && (
                          <Input
                            placeholder={`Search...`}
                            value={
                              (header.column.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                              header.column.setFilterValue(event.target.value)
                            }
                            className="h-8 w-full border-b border-t-0 border-l-0 border-r-0 my-2 focus-visible:ring-0 rounded-none shadow-none"
                          />
                        )}
                        {showComparisonSearch && (
                          <TableComparisonFilterSearch header={header} />
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
                    data-state={row.getIsSelected() && "selected"}
                    // TODO : add sidebar hovering effect for current page
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
                        Please add a document to get started and manage your
                        operations efficiently.
                      </p>
                      {/* <div className="flex items-center gap-4">
                        <Button className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                          <PlusIcon className="" />
                          Add Item
                        </Button>
                      </div> */}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
      <FilterBillsofMaterialModal
        table={table}
        isOpen={showFilterBillsOfMaterialModal}
        onClose={toggleShowFilterBillsOfMaterialModal}
      />
    </div>
  );
};

export default BillOfMaterialTable;
