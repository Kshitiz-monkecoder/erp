import React, { useMemo, useState } from "react";
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
import { ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SelectFilter, { OptionType } from "../SelectFilter";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import TablePagenation from "../TablePagenation";
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
type Item = {
  id: string;
  approvalId: string;
  documentType: string;
  documentNumber: string;
  documentAction: string;
  approvalStatus: string;
  createdBy: string;
  date: string;
};

const columns: ColumnDef<Item>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //       className="mr-2 "
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //       className="mr-2 "
  //     />
  //   ),
  // },
  {
    header: "Approval Id",
    accessorKey: "approvalId",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex items-center gap-4">
        {row.getValue("approvalId")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    header: "Document Type",
    accessorKey: "documentType",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("documentType")}</div>
    ),
  },
  {
    header: "Document Number",
    accessorKey: "documentNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex text-[#7047EB] items-center gap-4">
        {row.getValue("documentNumber")}
      </div>
    ),
  },
  {
    header: "Document Action",
    accessorKey: "documentAction",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("documentAction")}
      </div>
    ),
  },
  {
    header: "Approval Status",
    accessorKey: "approvalStatus",
    cell: ({ row }) => (
      // Change this according to slug values
      <div className="font-normal px-3 py-1 text-green-600 text-xs bg-green-100 w-fit rounded-full">
        {row.getValue("approvalStatus")}
      </div>
    ),
  },
  {
    header: "Created By",
    accessorKey: "createdBy",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("createdBy")}</div>
    ),
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("date")}</div>
    ),
  },
];

const items: Item[] = [
  {
    id: "1",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "2",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "3",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "4",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "5",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "6",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "7",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "8",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
  {
    id: "9",
    approvalId: "IAP00001",
    documentType: "Manual Adjustment",
    documentNumber: "MAJ00003",
    documentAction: "Document Created",
    approvalStatus: "Approved",
    createdBy: "Rohit",
    date: "2025-02-12",
  },
];

// interface IItemApprovalTable {
//   tab: string | null;
//   toggleAddInventoryModal: () => void;
// }

const ItemApprovalTable: React.FC = () => {
  // const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with category filtering
    let filtered;

    // Then apply date filtering if both dates are present
    if (startDate && endDate) {
      filtered = items.filter((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Add one day to end date to include the end date in results
        end.setDate(end.getDate() + 1);

        // Check if item date is between start and end dates
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [startDate, endDate]);

  const table = useReactTable({
    data: filteredItems ?? items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        approvalId: false,
        documentType: true,
        documentNumber: true,
        documentAction: true,
        approvalStatus: true,
        createdBy: true,
        date: true,
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

  const approvalStatus: OptionType[] = [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];
  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Create onValueChange to pass through these for filtering logic */}
              <SelectFilter
                label="Approval Status"
                items={approvalStatus}
                onValueChange={(value) => {
                  table.getColumn("approvalStatus")?.setFilterValue(value);
                }}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
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
        {table.getVisibleLeafColumns().length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default ItemApprovalTable;
