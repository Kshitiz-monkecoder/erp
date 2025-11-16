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
import FilterWorkOrderTableModal from "../../modals/FilterWorkOrderTableModal";
import TablePagenation from "../../TablePagenation";
import { Checkbox } from "@/components/ui/checkbox";
import TableComparisonFilterSearch, {
  FilterValue,
} from "./TableComparisonFilterSearch";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
export type WorkOrderTableData = {
  itemId: string;
  itemName: string;
  Uom: string;
  quantity: string;
  buyer: string;
  documentNumber: string;
  orderType: string;
  processNumber: string;
  processStage: string;
  documentDate: string;
  deliveryDate: string;
  createdBy: string;
};

const columns: ColumnDef<WorkOrderTableData>[] = [
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
    header: () => <div className="min-w-32">Item ID</div>,
    accessorKey: "itemId",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("itemId")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Item Name</div>,
    accessorKey: "itemName",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("itemName")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">UOM</div>,
    accessorKey: "Uom",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("Uom")}</div>
    ),
  },
  {
    header: () => <div className="min-w-48">Quantity</div>,
    accessorKey: "quantity",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("quantity")}</div>
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
    header: () => <div className="min-w-32">Buyer</div>,
    accessorKey: "buyer",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("buyer")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Document Number</div>,
    accessorKey: "documentNumber",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("documentNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Order Type</div>,
    accessorKey: "orderType",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("orderType")}</div>
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
    header: () => <div className="min-w-32">Process Stage</div>,
    accessorKey: "processStage",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("processStage")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Document Date</div>,
    accessorKey: "documentDate",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("documentDate")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Delivery Date</div>,
    accessorKey: "deliveryDate",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">{row.getValue("deliveryDate")}</div>
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

const items: WorkOrderTableData[] = [
  {
    itemId: "ITM001",
    itemName: "Widget X",
    Uom: "PCS",
    quantity: "150",
    buyer: "Acme Corp",
    documentNumber: "DOC1001",
    orderType: "Standard",
    processNumber: "PRC-001",
    processStage: "Initiation",
    documentDate: "2025-04-10",
    deliveryDate: "2025-04-20",
    createdBy: "Rohit",
  },
  {
    itemId: "ITM002",
    itemName: "Gadget Y",
    Uom: "BOX",
    quantity: "20",
    buyer: "Beta Ltd",
    documentNumber: "DOC1002",
    orderType: "Express",
    processNumber: "PRC-002",
    processStage: "Processing",
    documentDate: "2025-04-11",
    deliveryDate: "2025-04-21",
    createdBy: "Priya",
  },
  {
    itemId: "ITM003",
    itemName: "Component Z",
    Uom: "SET",
    quantity: "10",
    buyer: "Gamma Inc",
    documentNumber: "DOC1003",
    orderType: "Bulk",
    processNumber: "PRC-003",
    processStage: "Completed",
    documentDate: "2025-04-12",
    deliveryDate: "2025-04-22",
    createdBy: "Amit",
  },
  {
    itemId: "ITM004",
    itemName: "Part A",
    Uom: "PCS",
    quantity: "300",
    buyer: "Delta LLC",
    documentNumber: "DOC1004",
    orderType: "Standard",
    processNumber: "PRC-004",
    processStage: "Review",
    documentDate: "2025-04-13",
    deliveryDate: "2025-04-23",
    createdBy: "Sneha",
  },
  {
    itemId: "ITM005",
    itemName: "Module B",
    Uom: "BOX",
    quantity: "50",
    buyer: "Epsilon Pvt",
    documentNumber: "DOC1005",
    orderType: "Express",
    processNumber: "PRC-005",
    processStage: "Initiation",
    documentDate: "2025-04-14",
    deliveryDate: "2025-04-24",
    createdBy: "Vikas",
  },
];

const WorkOrdersTable: React.FC = () => {
  // const navigateTo = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterWorkOrdersTable, setShowFilterWorkOrdersTable] =
    useState<boolean>(false);
  const toggleShowFilterWorkOrderTable = () =>
    setShowFilterWorkOrdersTable((prev) => !prev);

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
                  onClick={toggleShowFilterWorkOrderTable}
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
              Select Open Work Orders to Start Production Processes or Delete
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
                      "itemId",
                      "itemName",
                      "Uom",
                      "buyer",
                      "documentNumber",
                      "orderType",
                      "processNumber",
                      "createdBy",
                    ].includes(header.id);
                    const showComparisonSearch = ["quantity"].includes(
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
      <FilterWorkOrderTableModal
        table={table}
        isOpen={showFilterWorkOrdersTable}
        onClose={toggleShowFilterWorkOrderTable}
      />
    </div>
  );
};

export default WorkOrdersTable;
