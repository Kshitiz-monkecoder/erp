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
import { get } from "@/lib/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import SelectBuyerModal from "../modals/SelectBuyerModal";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Type based on the delivery challan API response
type DeliveryChallanItem = {
  id: number;
  documentNumber: string;
  documentDate: string;
  status: string;
  totalAmount: string;
  tax: string;
  amendment: number;
  buyer: {
    id: number;
    name: string;
    email: string;
    clientType: string;
    companyName: string;
    companyEmail: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    gstVerified: boolean;
    phoneNo: string;
    gstNumber: string;
    gstType: string;
    addressLine2: string;
    pincode: string;
    companyReferenceCode: string;
    createdAt: string;
    updatedAt: string;
  };
  warehouse: {
    id: number;
    name: string;
    address1?: string;
    address2?: string;
    city: string;
    postalCode?: string;
  };
  items: Array<{
    item: {
      sku: string;
      name: string;
      isProduct: boolean;
      type: string;
      currentStock: string;
      defaultPrice: string;
      hsnCode: string;
      minimumStockLevel: string;
      maximumStockLevel: string;
      id: number;
      regularBuyingPrice: string;
      regularSellingPrice: string;
      wholesaleBuyingPrice: string;
      mrp: string;
      dealerPrice: string;
      distributorPrice: string;
      lastTransactionAt: string;
    };
    quantity: string;
    unitPrice: string;
    tax: string;
    totalAmount: string;
    id: number;
    remark: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  placeOfSupplyCity: string;
  transporterName: string;
  transporterGstNumber: string;
  transportationDocumentNumber: string;
  vehicleNumber: string;
  payToTransporter: string;
  transportationDocumentDate: string;
  deliveryNote: string;
  kindAttention: string;
  attachments: any[];
  signature: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

const DeliveryChallanTable: React.FC = () => {
  const navigate = useNavigate();

  const columns: ColumnDef<DeliveryChallanItem>[] = [
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 flex items-center gap-4">
          {row.original.documentNumber}
          <ArrowUpRight
            className="text-[#8A8AA3] w-5 cursor-pointer"
            onClick={() =>
              navigate(
                `/sales-purchase/delivery-challan-preview/${row.original.id}`
              )
            }
          />
        </div>
      ),
    },
    {
      id: "buyerName",
      header: "Buyer Name",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 text-[#7047EB]">
          {row.original.buyer?.name || "N/A"}
        </div>
      ),
    },
    {
      id: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.original.buyer?.companyName || "N/A"}
        </div>
      ),
    },
    {
      id: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          ₹{row.original.totalAmount || "0.00"}
        </div>
      ),
    },
    {
      header: "Delivery Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status as string;
        const getStatusStyles = (status: string) => {
          switch (status?.toLowerCase()) {
            case "delivered":
              return "text-[#006100] bg-[#EBFFF0]";
            case "pending":
              return "text-[#8A6100] bg-[#FFF9EB]";
            case "cancelled":
              return "text-[#D32F2F] bg-[#FFEBEE]";
            case "in-transit":
              return "text-[#0066CC] bg-[#E6F3FF]";
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
      id: "warehouseName",
      header: "Warehouse",
      accessorFn: (row) => row.warehouse?.name || "",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.original.warehouse?.name || "N/A"}
        </div>
      ),
    },
    {
      id: "vehicleNumber",
      header: "Vehicle Number",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.original.vehicleNumber || "N/A"}
        </div>
      ),
    },
  ];

  const handleContinueBuyer = () => {
    navigate(`/sales-purchase/delivery-challan`);
  };

  function handleCloseModal(): void {
    setIsModalOpen(false);
  }

  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<DeliveryChallanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDeliveryChallans = async () => {
      try {
        setIsLoading(true);
        
        const data = await get("/inventory/delivery-challan");
        console.log(data.data);
        setItems(data?.data);
      } catch (error) {
        console.error("Error fetching Delivery Challans:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveryChallans();
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
                Create Delivery Challan
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
                        <h4 className="font-bold text-lg">No Delivery Challan Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a Delivery Challan document to get started and manage
                          your deliveries efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={() => setIsModalOpen((prev) => !prev)}
                          >
                            <PlusIcon className="" />
                            Create Delivery Challan
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
            <SelectBuyerModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onContinue={handleContinueBuyer}
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

export default DeliveryChallanTable;