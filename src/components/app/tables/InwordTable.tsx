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

type InwardItem = {
  documentNumber: string;
  supplierName: string;
  poNumber: string;
  invoiceNumber: string;
  totalAmount: string;
  deliveryDate: string;
  inwardStatus: string;
  warehouseName: string;
};

const columns: ColumnDef<InwardItem>[] = [
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
    header: "Supplier Name",
    accessorKey: "supplierName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-[#7047EB]">
        {row.getValue("supplierName")}
      </div>
    ),
  },
  {
    header: "PO Number",
    accessorKey: "poNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 truncate flex text-[#7047EB] items-center gap-4">
        {row.getValue("poNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    header: "Invoice Number",
    accessorKey: "invoiceNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("invoiceNumber")}
      </div>
    ),
  },
  {
    header: "Total Amount",
    accessorKey: "totalAmount",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">₹{row.getValue("totalAmount")}</div>
    ),
  },
  {
    header: "Delivery Date",
    accessorKey: "deliveryDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("deliveryDate")}</div>
    ),
  },
  {
    header: "Status",
    accessorKey: "inwardStatus",
    cell: ({ row }) => {
      const status = row.getValue("inwardStatus") as string;
      const getStatusColor = (status: string) => {
        switch (status) {
          case "COMPLETED":
            return "text-[#0F5132] bg-[#D1E7DD]";
          case "PENDING":
            return "text-[#8A6100] bg-[#FFF9EB]";
          case "IN_PROGRESS":
            return "text-[#055160] bg-[#CFF4FC]";
          default:
            return "text-[#8A6100] bg-[#FFF9EB]";
        }
      };

      return (
        <div
          className={`font-normal text-xs px-3 py-1 rounded-full w-fit ${getStatusColor(status)}`}
        >
          {status.replace("_", " ")}
        </div>
      );
    },
  },
  {
    header: "Warehouse",
    accessorKey: "warehouseName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("warehouseName")}
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
import {get} from "../../../lib/apiService"
const InwordTable: React.FC = () => {
  const navigate = useNavigate();

  const handleContinueSupplier = () => {
    navigate(`/sales-purchase/purchase-inword`);
  };

  function handleCloseModal(): void {
    setIsModalOpen(false);
  }

  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<InwardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInwardDocuments = async () => {
      try {
        setIsLoading(true);
        
        const data = await get("/inventory/inward");

        if (!data.status){
          throw new Error("Failed to fetch inward")
        }
        console.log(data);
        setItems(
          (data?.data || []).map((item: any) => ({
            documentNumber: item.documentNumber || "--",
            supplierName: item.supplier?.name || "--",
            poNumber: item.purchaseOrder?.documentNumber || "--",
            invoiceNumber: item.invoice || "--",
            totalAmount: item.purchaseOrder?.totalAmount || "0.00",
            deliveryDate: item.deliveryDate
              ? new Date(item.deliveryDate).toLocaleDateString()
              : "--",
            inwardStatus: item.inwardStatus || "PENDING",
            warehouseName: item.warehouse?.name || "--",
          })),
        );
      } catch (error) {
        console.error("Error fetching inward documents:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInwardDocuments();
  }, []);

  // performance optimization
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply date filtering if both dates are present
    if (startDate && endDate) {
      filtered = items.filter((item) => {
        if (item.deliveryDate === "--") return false;

        const itemDate = new Date(item.deliveryDate);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Add one day to end date to include the end date in results
        end.setDate(end.getDate() + 1);

        // Check if item date is between start and end dates
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
                <FilterInput column={table.getColumn("supplierName")!} />
              </div>
            </div>
            <div>
              <Button
                className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                onClick={() => setIsModalOpen((prev) => !prev)}
              >
                <PlusIcon className="" />
                Create Document
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
                        <h4 className="font-bold text-lg">
                          No Inward Documents
                        </h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add an inward document to get started and
                          manage your inventory efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={() => setIsModalOpen((prev) => !prev)}
                          >
                            <PlusIcon className="" />
                            Create Document
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

export default InwordTable;
