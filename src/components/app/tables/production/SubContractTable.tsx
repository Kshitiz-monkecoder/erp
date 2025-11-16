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
import { Funnel, RotateCcw, Send } from "lucide-react";
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
import FilterSubContractTableModal from "../../modals/FilterSubContractTableModal";
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
export type SubContractTableData = {
  processNumber: string;
  jobWorkNumber: string;
  state: string;
  status: string;
  fgItemId: string;
  fgName: string;
  fgUom: string;
  targetQuantity: number;
  completedQuantity: number;
  creationDate: string;
  createdBy: string;
};

const columns: ColumnDef<SubContractTableData>[] = [
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
    header: () => <div className="min-w-32">Process Number</div>,
    accessorKey: "processNumber",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("processNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Job Work Number</div>,
    accessorKey: "jobWorkNumber",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("jobWorkNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">State</div>,
    accessorKey: "state",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("state")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Status</div>,
    accessorKey: "status",
    cell: ({ row }) => (
      <div
        className={`font-normal px-3 py-1 text-xs w-fit rounded-full ${
          row.getValue("status") === "Approved"
            ? "text-green-600 bg-green-100"
            : row.getValue("status") === "Rejected"
              ? "text-red-600 bg-red-100"
              : "text-yellow-600 bg-yellow-100"
        }`}
      >
        {row.getValue("status")}
      </div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Item Id</div>,
    accessorKey: "fgItemId",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("fgItemId")}</div>
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
    header: () => <div className="min-w-32">FG UOM</div>,
    accessorKey: "fgUom",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("fgUom")}</div>
    ),
  },
  {
    header: () => <div className="min-w-48">Target Quantity</div>,
    accessorKey: "targetQuantity",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("targetQuantity")}</div>
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
    header: () => <div className="min-w-48">Completed Quantity</div>,
    accessorKey: "completedQuantity",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">
        {row.getValue("completedQuantity")}
      </div>
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
    header: () => <div className="min-w-32">Creation Date</div>,
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Created By</div>,
    accessorKey: "createdBy",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("createdBy")}</div>
    ),
  },
];

const items: SubContractTableData[] = [
  {
    processNumber: "PRC-1001",
    jobWorkNumber: "JW-5678",
    state: "Maharashtra",
    status: "Pending",
    fgItemId: "FG-001",
    fgName: "Widget A",
    fgUom: "PCS",
    targetQuantity: 500,
    completedQuantity: 200,
    creationDate: "2025-04-01",
    createdBy: "Rohit",
  },
  {
    processNumber: "PRC-1002",
    jobWorkNumber: "JW-5680",
    state: "Karnataka",
    status: "Approved",
    fgItemId: "FG-002",
    fgName: "Gadget B",
    fgUom: "BOX",
    targetQuantity: 100,
    completedQuantity: 100,
    creationDate: "2025-04-02",
    createdBy: "Priya",
  },
  {
    processNumber: "PRC-1003",
    jobWorkNumber: "JW-5682",
    state: "Gujarat",
    status: "Rejected",
    fgItemId: "FG-003",
    fgName: "Part C",
    fgUom: "SET",
    targetQuantity: 50,
    completedQuantity: 10,
    creationDate: "2025-04-03",
    createdBy: "Amit",
  },
  {
    processNumber: "PRC-1004",
    jobWorkNumber: "JW-5684",
    state: "Tamil Nadu",
    status: "Pending",
    fgItemId: "FG-004",
    fgName: "Component D",
    fgUom: "PCS",
    targetQuantity: 250,
    completedQuantity: 150,
    creationDate: "2025-04-04",
    createdBy: "Sneha",
  },
  {
    processNumber: "PRC-1005",
    jobWorkNumber: "JW-5686",
    state: "Delhi",
    status: "Approved",
    fgItemId: "FG-005",
    fgName: "Module E",
    fgUom: "BOX",
    targetQuantity: 80,
    completedQuantity: 80,
    creationDate: "2025-04-05",
    createdBy: "Vikas",
  },
];

const SubContractTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterSubContractTableModal, setShowFilterSubContractTableModal] =
    useState<boolean>(false);

  const toggleShowFilterSubContractTableModal = () =>
    setShowFilterSubContractTableModal((prev) => !prev);

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
                  onClick={toggleShowFilterSubContractTableModal}
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
              Select Pending Sub Contracts to Send Order or Revert Sub Contract
            </p>
            <div className="flex sm:items-center gap-3">
              <Button
                disabled={!table.getIsSomePageRowsSelected()}
                className="flex items-center bg-neutral-300 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none  text-sm text-neutral-500"
              >
                <Send className="w-4" />
                Send Order
              </Button>
              <Button
                disabled={!table.getIsSomePageRowsSelected()}
                className="flex items-center bg-neutral-300 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none  text-sm text-neutral-500"
              >
                <RotateCcw className="w-4" />
                Revert Sub Contract
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
                      "jobWorkNumber",
                      "fgItemId",
                      "fgName",
                      "fgUom",
                      "processNumber",
                      "createdBy",
                    ].includes(header.id);
                    const showComparisonSearch = [
                      "completedQuantity",
                      "targetQuantity",
                    ].includes(header.id);
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
      <FilterSubContractTableModal
        table={table}
        isOpen={showFilterSubContractTableModal}
        onClose={toggleShowFilterSubContractTableModal}
      />
    </div>
  );
};
export default SubContractTable;
