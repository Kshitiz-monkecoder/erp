// src/components/tables/ItemApprovalTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
import { useNavigate } from "react-router-dom";
import { get } from "@/lib/apiService";

type Item = {
  id: string;
  approvalId: string; // documentNumber
  documentType: string;
  documentNumber: string; // PO number
  documentAction: string;
  approvalStatus: string;
  createdBy: string; // supplier name
  date: string;
  inwardDocumentId?: string; // optional doc number fallback
};

const ItemApprovalTable: React.FC = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGRNData = async () => {
      try {
        setLoading(true);
        // GET /inventory/grn -> returns { status, message, data: [...] }
        const response = await get("/inventory/grn");
        const apiData = response?.data || [];

        const formatted = apiData.map((item: any) => ({
          id: String(item.id),
          approvalId: item.documentNumber ?? `GRN-${item.id}`,
          documentType: "GRN Document",
          documentNumber: item.purchaseOrder?.documentNumber ?? "-",
          documentAction: item.remarks ?? "N/A",
          approvalStatus: item.grnStatus ?? "N/A",
          createdBy: item.supplier?.name ?? "-",
          date: item.documentDate ?? item.createdAt ?? "",
          inwardDocumentId: item.purchaseInword?.documentNumber ?? item.documentNumber,
        }));

        setItems(formatted);
      } catch (error) {
        console.error("Error fetching GRN data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGRNData();
  }, []);

  const filteredItems = useMemo(() => {
    if (!startDate || !endDate) return items;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    return items.filter((item) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate < end;
    });
  }, [startDate, endDate, items]);

  const columns: ColumnDef<Item>[] = [
    {
      header: "Approval Id",
      accessorKey: "approvalId",
      cell: ({ row }) => (
        <div
          onClick={() => {
            // navigate by numeric GRN id so preview fetches the correct document
            navigate(`/inventory/inward-document-preview/${row.original.id}`);
          }}
          className="font-normal min-w-32 flex items-center gap-2 cursor-pointer text-blue-600 hover:underline"
        >
          {row.getValue("approvalId")}
          <ArrowUpRight className="w-4 h-4 text-gray-500" />
        </div>
      ),
    },
    { header: "Document Type", accessorKey: "documentType", cell: ({ row }) => <div>{row.getValue("documentType")}</div> },
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => <div className="text-[#7047EB]">{row.getValue("documentNumber")}</div>,
    },
    { header: "Document Action", accessorKey: "documentAction" },
    {
      header: "Approval Status",
      accessorKey: "approvalStatus",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 text-xs rounded-full ${
            row.getValue("approvalStatus") === "Approved"
              ? "bg-green-100 text-green-700"
              : row.getValue("approvalStatus") === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : row.getValue("approvalStatus") === "COMPLETED"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.getValue("approvalStatus")}
        </span>
      ),
    },
    { header: "Created By", accessorKey: "createdBy" },
    { header: "Date", accessorKey: "date" },
  ];

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const approvalStatus: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <div className="space-y-6">
      <section className="px-5">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <SelectFilter
            label="Approval Status"
            items={approvalStatus}
            onValueChange={(value) =>
              table.getColumn("approvalStatus")?.setFilterValue(value === "all" ? undefined : value)
            }
          />

          <MultiSelectWithSearch columns={table.getAllColumns()} label="Show/Hide Columns" />
        </div>
      </section>

      <div className="px-5 border rounded-lg bg-white">
        {loading ? (
          <div className="h-96 flex items-center justify-center text-gray-500">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-96 text-center text-gray-500">
                    No approvals found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagenation table={table} />
    </div>
  );
};

export default ItemApprovalTable;
