import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { PlusIcon, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import SelectFilter, { OptionType } from "../../../app/SelectFilter";
import MultiSelectWithSearch from "../../MultiSelectWithSearch";
import TablePagenation from "../../TablePagenation";
import { get } from "@/lib/apiService";
import { useNavigate } from "react-router-dom";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

/**
 * Table row type used by the UI (normalized)
 */
type BOMRow = {
  id: number;
  docNumber: string;
  docName: string;
  status: string;
  fgName: string;
  numberOfRm: number;
  updatedAt: string; // ISO
  updatedAtLabel: string; // human readable
  createdBy: string;
};

export type { BOMRow };

const BillOfMaterialTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rows, setRows] = useState<BOMRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [rawResponse, setRawResponse] = useState<any[]>([]); // keep for future use if needed
  // const [showFilterModal, setShowFilterModal] = useState(false);

  const navigate = useNavigate();

  // Fetch BOMs from API
  const fetchBOMs = async (page = 1, limit = 20, status = "published", search = "BOM") => {
    try {
      setLoading(true);
      setError(null);

      // Use your api helper - axios interceptors will attach token
      const resp = await get(`/production/bom?page=${page}&limit=${limit}&status=${status}&search=${encodeURIComponent(search)}`);

      // API returns { status: true/false, message, data: [...] }
      const data = resp?.data ?? resp;
      if (!data) {
        setError("Invalid response from server");
        setRows([]);
        // setRawResponse([]);
        return;
      }

      // The API might come as { status: true, data: [...] } or directly as array
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

      // setRawResponse(list);

      // Transform to BOMRow
      const transformed: BOMRow[] = list.map((b: any) => {
        const bomItems = Array.isArray(b.bomItems) ? b.bomItems : [];
        const firstItem = bomItems[0];
        const fgName = firstItem?.finishedGoods?.item?.name || "—";
        const numberOfRm = firstItem?.rawMaterials?.length ?? 0;

        const updatedAtIso = b.updatedAt || b.docDate || new Date().toISOString();
        const updatedAtLabel = new Date(updatedAtIso).toLocaleString(undefined, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: b.id,
          docNumber: b.docNumber || `BOM${b.id}`,
          docName: b.docName || "—",
          status: b.status || "—",
          fgName,
          numberOfRm,
          updatedAt: updatedAtIso,
          updatedAtLabel,
          createdBy: b.createdBy?.name || "—",
        } as BOMRow;
      });

      setRows(transformed);
    } catch (err: any) {
      console.error("Error fetching BOMs:", err);
      if (err?.response?.data?.message) setError(err.response.data.message);
      else setError("Failed to fetch BOMs");
      setRows([]);
      // setRawResponse([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMs();
  }, []);

  // Columns
  const columns: ColumnDef<BOMRow>[] = [
    {
      header: "BOM ID",
      accessorKey: "docNumber",
      cell: ({ row }) => (
        <div
          className="min-w-32 text-sm text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/production/bom/${row.original.id}`)}
        >
          {row.original.docNumber}
        </div>
      ),
    },
    {
      header: "BOM Name",
      accessorKey: "docName",
      cell: ({ row }) => <div className="min-w-32 text-sm">{row.original.docName}</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <div className="min-w-24">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.status?.toUpperCase() === "PUBLISHED" ? "bg-green-100 text-green-700" :
              row.original.status?.toUpperCase() === "WIP" ? "bg-blue-100 text-blue-700" :
              row.original.status?.toUpperCase() === "COMPLETED" ? "bg-purple-100 text-purple-700" :
              "bg-yellow-100 text-yellow-700"
            }`}
          >
            {row.original.status?.toUpperCase() === "WIP" ? "WIP / In Progress" :
             row.original.status ? row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1).toLowerCase() : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "FG Name",
      accessorKey: "fgName",
      cell: ({ row }) => <div className="min-w-32 text-sm">{row.original.fgName}</div>,
    },
    {
      header: "No. of RM",
      accessorKey: "numberOfRm",
      cell: ({ row }) => <div className="min-w-20 text-sm">{row.original.numberOfRm}</div>,
    },
    {
      header: "Last Modified By",
      accessorKey: "createdBy",
      cell: ({ row }) => <div className="min-w-32 text-sm">{row.original.createdBy}</div>,
    },
    {
      header: "Last Modified Date",
      accessorKey: "updatedAtLabel",
      cell: ({ row }) => <div className="min-w-40 text-sm">{row.original.updatedAtLabel}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/production/bom/${row.original.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      columnVisibility: {
        docNumber: true,
        docName: true,
        status: true,
        fgName: true,
        numberOfRm: true,
        createdBy: true,
        updatedAtLabel: true,
        actions: true,
      },
    },
    state: { columnFilters },
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

  // Status filter options
  const statusOptions: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Planned", value: "PLANNED" },
    { label: "Published", value: "PUBLISHED" },
    { label: "WIP / In Progress", value: "WIP" },
    { label: "Completed", value: "COMPLETED" },
  ];

  const handleStatusFilter = (value: string) => {
    if (value === "all") table.getColumn("status")?.setFilterValue(undefined);
    else table.getColumn("status")?.setFilterValue(value);
  };

  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between items-center mb-4">
            {/* Left: filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <SelectFilter label="Status" items={statusOptions} onValueChange={handleStatusFilter} />
              <MultiSelectWithSearch columns={table.getAllColumns()} label="Show/Hide Columns" />
            </div>

            {/* Right: Create BOM button */}
            <div className="flex items-center">
              <Button
                onClick={() => navigate("/production/bom/create")}
                className="bg-[#7047EB] hover:bg-[#5f39cc] text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                CREATE BOM
              </Button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7047EB] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading BOMs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchBOMs()}>Retry</Button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5">
            <div className="border rounded-lg h-96 flex flex-col items-center justify-center">
              <img src="/folder.svg" alt="No data" className="w-24 h-24 mb-4" />
              <h4 className="font-bold text-lg mb-2">No BOMs Found</h4>
              <p className="max-w-xs text-gray-600 text-sm text-center mb-6">
                Create a BOM to see it listed here.
              </p>
              <Button onClick={() => navigate("/production/bom/create")}>Create BOM</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5">
              <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="bg-muted/50">
                        {hg.headers.map((header) => (
                          <TableHead key={header.id} className="h-10 border-r last:border-r-0">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-gray-50 transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="border-b">
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
                            <h4 className="font-bold text-lg">No BOM Found</h4>
                            <p className="max-w-xs text-gray-600 text-sm">
                              No BOMs match your current filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {table.getRowModel().rows.length > 0 && <TablePagenation table={table} />}
          </>
        )}
      </div>
    </div>
  );
};

export default BillOfMaterialTable;