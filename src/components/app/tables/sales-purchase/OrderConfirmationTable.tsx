import React, { useId, useMemo, useState, useEffect } from "react";
import {
  Column,
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
import { ArrowUpRight, PlusIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../../ui/button";
import { get } from "@/lib/apiService";
import { useNavigate } from "react-router-dom";
import TablePagenation from "../../TablePagenation";
import TableLoading from "../../TableLoading";
import SelectBuyerModal from "../../modals/SelectBuyerModal";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// API Response Types
interface ApiItem {
  hsn: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  tax: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiBuyer {
  id: number;
  name: string;
  email: string;
  companyName: string;
  clientType: string;
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
}

interface ApiWarehouse {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
}

interface ApiOrderConfirmation {
  buyer: ApiBuyer;
  totalAmount: string;
  tax: string;
  status: string;
  items: ApiItem[];
  placeOfSupplyCity: string;
  title: string;
  documentNumber: string;
  deliveryDate: string;
  warehouse: ApiWarehouse;
  documentDate: string;
  amendment: string | null;
  poNumber: string;
  poDate: string;
  quotationNumber: string;
  quotationDate: string;
  paymentType: string;
  customerEnquiryNumber: string;
  customerEnquiryDate: string;
  kindAttention: string;
  attachments: string | null;
  signature: string | null;
  remark: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: ApiOrderConfirmation[];
}

const OrderConfirmationTable: React.FC = () => {
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [orderConfirmations, setOrderConfirmations] = useState<
    ApiOrderConfirmation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedBuyer, setSelectedBuyer] = useState<ApiBuyer | null>(null);

  const columns: ColumnDef<ApiOrderConfirmation>[] = [
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <div
          className="font-normal cursor-pointer min-w-32 text-blue-500 flex items-center gap-4"
          onClick={() =>
            navigate(`/sales-purchase/order-confirmation/${row.original.id}`, {
              state: {
                orderConfirmation: row.original,
              },
            })
          }
        >
          {row.getValue("documentNumber")}
          <ArrowUpRight
            className="text-[#8A8AA3] w-5"
            onClick={() =>
              navigate(
                `/sales-purchase/order-confirmation/${row.original.id}`,
                {
                  state: {
                    orderConfirmation: row.original,
                  },
                }
              )
            }
          />
        </div>
      ),
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => (
        <div
          className="font-normal cursor-pointer min-w-32 text-blue-500 flex items-center gap-4"
          onClick={() =>
            navigate(
              `/sales-purchase/order-confirmation-preview/${row.original.id}`
            )
          }
        >
          {row.getValue("title")}

          <ArrowUpRight
            className="text-[#8A8AA3] w-5"
            onClick={() =>
              navigate(
                `/sales-purchase/order-confirmation-preview/${row.original.id}`
              )
            }
          />
        </div>
      ),
    },
    {
      header: "Buyer",
      accessorKey: "buyer",
      cell: ({ row }) => {
        const buyer = row.getValue("buyer") as ApiBuyer;
        return (
          <div className="font-normal min-w-40 text-sm">{buyer?.companyName}</div>
        );
      },
    },
    {
      header: "Delivery Date",
      accessorKey: "deliveryDate",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 text-sm">
          {new Date(row.getValue("deliveryDate")).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Warehouse",
      accessorKey: "warehouse",
      cell: ({ row }) => {
        const warehouse = row.getValue("warehouse") as ApiWarehouse;
        return (
          <div className="font-normal min-w-40 text-sm">
            <div className="font-normal">{warehouse.name}</div>
          </div>
        );
      },
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 text-sm">
          ₹{parseFloat(row.getValue("totalAmount")).toFixed(2)}
        </div>
      ),
    },
    {
      header: "Tax",
      accessorKey: "tax",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 text-sm">
          ₹{parseFloat(row.getValue("tax")).toFixed(2)}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusClass =
          status === "PENDING"
            ? "bg-yellow-100 text-yellow-800"
            : status === "COMPLETED"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800";
        return (
          <div
            className={`font-normal min-w-24 text-xs px-2 py-1 text-center rounded-full ${statusClass}`}
          >
            {status}
          </div>
        );
      },
    },
  ];

  // Fetch data from API
  useEffect(() => {
    const fetchOrderConfirmations = async () => {
      try {
        setLoading(true);
        const response = await get<ApiResponse>(
          "/inventory/order-confirmation"
        );

        if (response.status && response.data) {
          setOrderConfirmations(response.data);
        } else {
          setError("Failed to fetch order confirmations");
        }
      } catch (err) {
        setError(
          "Error fetching data: " +
            (err instanceof Error ? err.message : "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderConfirmations();
  }, []);

  const table = useReactTable({
    data: orderConfirmations,
    columns,
    initialState: {
      pagination: {
        pageSize: 7,
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

  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleContinueBuyer = async (buyerId: string) => {
    console.log(`Selected Buyer ID: ${buyerId}`);
    navigate(`/sales-purchase/order-confirmation`);
    setIsModalOpen(false);
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-3">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex justify-start max-w-[13rem]">
              <div className="w-44">
                <Filter column={table.getColumn("documentNumber")!} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleCreateClick}
                    className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                  >
                    <PlusIcon className="" />
                    Create Document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="px-3">
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
            {loading ? (
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
                        <h4 className="font-bold text-lg">
                          No Order Confirmations Found
                        </h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please create a document to get started and manage
                          your operations efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleCreateClick}
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
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
          </Table>
        </div>

        {/* Updated Pagination using TablePagenation component */}
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>

      {/* Render the SelectBuyerModal */}
      <SelectBuyerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onContinue={handleContinueBuyer}
      />
    </div>
  );
};

function Filter({ column }: { column: Column<any, unknown> }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};
  const columnHeader =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";
  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return [];
    const values = Array.from(column.getFacetedUniqueValues().keys());
    const flattenedValues = values.reduce((acc: string[], curr) => {
      if (Array.isArray(curr)) {
        return [...acc, ...curr];
      }
      return [...acc, curr];
    }, []);
    return Array.from(new Set(flattenedValues)).sort();
  }, [column.getFacetedUniqueValues(), filterVariant]);

  const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";

  if (filterVariant === "range") {
    return (
      <div className="*:not-first:mt-2">
        <Label>{columnHeader}</Label>
        <div className="flex">
          <Input
            id={`${id}-range-1`}
            className={
              "flex-1 rounded-e-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            }
            value={(columnFilterValue as [number, number])?.[0] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old?.[1],
              ])
            }
            placeholder="Min"
            type="number"
            aria-label={`${columnHeader} min`}
          />
          <Input
            id={`${id}-range-2`}
            className="-ms-px flex-1 rounded-s-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={(columnFilterValue as [number, number])?.[1] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                e.target.value ? Number(e.target.value) : undefined,
              ])
            }
            placeholder="Max"
            type="number"
            aria-label={`${columnHeader} max`}
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "select") {
    return (
      <div className="*:not-first:mt-2">
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger id={`${id}-select`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="*:not-first:mt-2">
      <div className="relative">
        <div className="relative">
          <Input
            id={`${id}-input`}
            className={`${inputClasses} pe-9`}
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => column.setFilterValue(e.target.value)}
            placeholder={`Search..`}
            type="text"
          />
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 pr-3"
            aria-label="Subscribe"
          >
            <Search size={16} aria-hidden="true" className="text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationTable;
