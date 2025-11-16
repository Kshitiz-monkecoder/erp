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
import { Button } from "../../ui/button";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Updated type based on the API schema
type Item = {
  id: number;
  documentNumber: string;
  documentDate: string;
  deliveryDate: string;
  grnStatus: string;
  supplier: {
    id: number;
    name: string;
    companyName: string;
    email: string;
  };
  purchaseOrder: {
    totalAmount: string;
    status: string;
    documentNumber: string;
    documentDate: string;
    ocDetails: string;
    enquiryNumber: string | null;
  };
  warehouse: {
    id: number;
    name: string;
    city: string;
  };
  purchaseInword: {
    documentNumber: string;
    inwardStatus: string;
    invoice: string;
    invoiceDate: string;
  } | null;
  amendment: string;
  remarks: string | null;
};

const columns: ColumnDef<Item>[] = [
  {
    header: "Document Number",
    accessorKey: "documentNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex items-center gap-4">
        {row.getValue("documentNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    id: "supplierName", // Add explicit id
    header: "Supplier Name",
    accessorFn: (row) => row.supplier?.name || "",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-[#7047EB]">
        {row.original.supplier?.name || "N/A"}
      </div>
    ),
  },
  {
    id: "companyName", // Add explicit id
    header: "Company Name",
    accessorFn: (row) => row.supplier?.companyName || "",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.original.supplier?.companyName || "N/A"}
      </div>
    ),
  },
  {
    id: "poNumber", // Add explicit id
    header: "PO Number",
    accessorFn: (row) => row.purchaseOrder?.documentNumber || "",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex text-[#7047EB] items-center gap-4">
        {row.original.purchaseOrder?.documentNumber || "N/A"}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    id: "totalAmount", // Add explicit id
    header: "Total Amount",
    accessorFn: (row) => row.purchaseOrder?.totalAmount || "",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        ₹{row.original.purchaseOrder?.totalAmount || "0.00"}
      </div>
    ),
  },
  {
    header: "GRN Status",
    accessorKey: "grnStatus",
    cell: ({ row }) => {
      const status = row.getValue("grnStatus") as string;
      const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
          case "completed":
            return "text-[#006100] bg-[#EBFFF0]";
          case "pending":
            return "text-[#8A6100] bg-[#FFF9EB]";
          case "cancelled":
            return "text-[#D32F2F] bg-[#FFEBEE]";
          default:
            return "text-[#8A6100] bg-[#FFF9EB]";
        }
      };

      return (
        <div
          className={`font-normal text-xs px-3 py-1 rounded-full w-fit ${getStatusStyles(
            status
          )}`}
        >
          {status || "N/A"}
        </div>
      );
    },
  },
  {
    header: "Document Date",
    accessorKey: "documentDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {new Date(row.getValue("documentDate")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "warehouseName", // Add explicit id
    header: "Warehouse",
    accessorFn: (row) => row.warehouse?.name || "",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.original.warehouse?.name || "N/A"}
      </div>
    ),
  },
];

import SelectSupplierModal from "../modals/SelectSupplierModal";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";
import { get } from "../../../lib/apiService";
const GRNTable: React.FC = () => {
  const navigate = useNavigate();

  const handleContinueSupplier = () => {
    navigate(`/sales-purchase/purchase-grn`);
  };

  function handleCloseModal(): void {
    setIsModalOpen(false);
  }

  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchGRNs = async () => {
      try {
        setIsLoading(true);

        const data = await get("/inventory/grn");

        if (!data.status) {
          throw new Error("Failed to fetch GRNs");
        }
        console.log(data.data);
        // Map the API response to match our Item type
        setItems(
          (data?.data || []).map((item: any) => ({
            id: item.id,
            documentNumber: item.documentNumber,
            documentDate: item.documentDate,
            deliveryDate: item.deliveryDate,
            grnStatus: item.grnStatus,
            supplier: {
              id: item.supplier?.id || 0,
              name: item.supplier?.name || "",
              companyName: item.supplier?.companyName || "",
              email: item.supplier?.email || "",
            },
            purchaseOrder: {
              totalAmount: item.purchaseOrder?.totalAmount || "0.00",
              status: item.purchaseOrder?.status || "",
              documentNumber: item.purchaseOrder?.documentNumber || "",
              documentDate: item.purchaseOrder?.documentDate || "",
              ocDetails: item.purchaseOrder?.ocDetails || "",
              enquiryNumber: item.purchaseOrder?.enquiryNumber || null,
            },
            warehouse: {
              id: item.warehouse?.id || 0,
              name: item.warehouse?.name || "",
              city: item.warehouse?.city || "",
            },
            purchaseInword: item.purchaseInword
              ? {
                  documentNumber: item.purchaseInword.documentNumber,
                  inwardStatus: item.purchaseInword.inwardStatus,
                  invoice: item.purchaseInword.invoice,
                  invoiceDate: item.purchaseInword.invoiceDate,
                }
              : null,
            amendment: item.amendment || "0.00",
            remarks: item.remarks,
          }))
        );
      } catch (error) {
        console.error("Error fetching GRNs:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGRNs();
  }, []);

  // Date filtering logic
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (startDate && endDate) {
      filtered = items.filter((item) => {
        const itemDate = new Date(item.documentDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [items, startDate, endDate]);

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
        <section className="mt-4 px-5">
          <div className="flex md:items-center flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-36 sm:w-44">
                <FilterInput column={table.getColumn("documentNumber")!} />
              </div>
            </div>
            <div>
              <Button
                className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                onClick={() => setIsModalOpen((prev) => !prev)}
              >
                <PlusIcon className="" />
                Create GRN
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
                          header.getContext()
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
                            cell.getContext()
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
                        <h4 className="font-bold text-lg">No GRN Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a GRN document to get started and manage
                          your operations efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={() => setIsModalOpen((prev) => !prev)}
                          >
                            <PlusIcon className="" />
                            Create GRN
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
            <SelectSupplierModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onContinue={handleContinueSupplier}
            />
          </Table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default GRNTable;
