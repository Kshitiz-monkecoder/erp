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
import { Funnel, PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FilterProductionTableModal from "../../modals/FilterProductionTableModal";
import { Input } from "@/components/ui/input";
import TablePagenation from "../../TablePagenation";
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
export type AllProductionTableDataType = {
  refrenceNumber: string;
  processNumber: string;
  stage: string;
  status: string;
  bomNumber: string;
  fgItemId: string;
  fgName: string;
  date: string;
  typeOfProcess: string;
  fgUom: string;
  targetQuantity: number;
  completedQuantity: number;
  creationDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
};

const columns: ColumnDef<AllProductionTableDataType>[] = [
  {
    header: () => <div className="min-w-32">Reference Number</div>,
    accessorKey: "refrenceNumber",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("refrenceNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Process Number</div>,
    accessorKey: "processNumber",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("processNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Stage</div>,
    accessorKey: "stage",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("stage")}</div>,
  },
  {
    header: () => <div className="min-w-32">Status</div>,
    accessorKey: "status",
    cell: ({ row }) => (
      <div className="flex items-center justify-center min-w-32">
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
      </div>
    ),
  },
  {
    header: () => <div className="min-w-32">Bom Number</div>,
    accessorKey: "bomNumber",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("bomNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Item Id</div>,
    accessorKey: "fgItemId",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("fgItemId")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Name</div>,
    accessorKey: "fgName",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("fgName")}</div>,
  },
  {
    header: () => <div className="min-w-32">Date</div>,
    accessorKey: "date",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("date")}</div>,
  },
  {
    header: () => <div className="min-w-32">Type of Process</div>,
    accessorKey: "typeOfProcess",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("typeOfProcess")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG UOM</div>,
    accessorKey: "fgUom",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("fgUom")}</div>,
  },
  {
    header: () => <div className="min-w-32">Target Quantity</div>,
    accessorKey: "targetQuantity",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("targetQuantity")}</div>
    ),
  },
  {
    header: () => <div className="min-w-44">Completed Quantity</div>,
    accessorKey: "completedQuantity",
    cell: ({ row }) => (
      <div className="min-w-44">{row.getValue("completedQuantity")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Creation Date</div>,
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Last Modified By</div>,
    accessorKey: "lastModifiedBy",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("lastModifiedBy")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Last Modified Date</div>,
    accessorKey: "lastModifiedDate",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("lastModifiedDate")}</div>
    ),
  },
];

const items: AllProductionTableDataType[] = [
  {
    refrenceNumber: "IJUBR208",
    processNumber: "QWZYF9",
    stage: "Completed",
    status: "Pending",
    bomNumber: "4NYOZ",
    fgItemId: "7P3HYKD",
    fgName: "ItemD",
    date: "2023-09-10",
    typeOfProcess: "Assembly", // Added field
    fgUom: "pcs", // Added field
    targetQuantity: 100, // Added field
    completedQuantity: 90, // Added field
    creationDate: "2023-09-01", // Added field
    lastModifiedBy: "user1", // Added field
    lastModifiedDate: "2023-09-10", // Added field
  },
  {
    refrenceNumber: "KX85ANX5",
    processNumber: "AYAXX7",
    stage: "Initiation",
    status: "Pending",
    bomNumber: "JEP29",
    fgItemId: "T5JBZ16",
    fgName: "ItemA",
    date: "2025-01-06",
    typeOfProcess: "Packaging", // Added field
    fgUom: "box", // Added field
    targetQuantity: 200, // Added field
    completedQuantity: 50, // Added field
    creationDate: "2025-01-01", // Added field
    lastModifiedBy: "user2", // Added field
    lastModifiedDate: "2025-01-06", // Added field
  },
  {
    refrenceNumber: "MP9DQNF5",
    processNumber: "7WRVJO",
    stage: "Review",
    status: "Rejected",
    bomNumber: "AIWBT",
    fgItemId: "XOLQ3YU",
    fgName: "ItemD",
    date: "2025-10-04",
    typeOfProcess: "Inspection", // Added field
    fgUom: "pcs", // Added field
    targetQuantity: 150, // Added field
    completedQuantity: 0, // Added field
    creationDate: "2025-10-01", // Added field
    lastModifiedBy: "user3", // Added field
    lastModifiedDate: "2025-10-04", // Added field
  },
];

const AllProductionTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterProductionTableModal, setShowFilterProductionTableModal] =
    useState<boolean>(false);

  const toggleFilterProductionTableModal = () =>
    setShowFilterProductionTableModal((prev) => !prev);

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
                  onClick={toggleFilterProductionTableModal}
                  className="text-neutral-500 px-5 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none w-full"
                >
                  Filter
                  <Funnel className="h-4 w-4 " />
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-4">
                <div>
                  <Button className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                    <PlusIcon className="" />
                    Add Item
                  </Button>
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => {
                    const shouldShowSearch = [
                      "refrenceNumber",
                      "processNumber",
                      "bomNumber",
                      "fgItemId",
                      "fgName",
                      "fgUom",
                      "targetQuantity",
                      "completedQuantity",
                      "lastModifiedBy",
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
      <FilterProductionTableModal
        table={table}
        isOpen={showFilterProductionTableModal}
        onClose={toggleFilterProductionTableModal}
      />
    </div>
  );
};

export default AllProductionTable;
