import React, { useState, useEffect } from "react";
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
import { Funnel, Plus, XCircle, FileText, Play } from "lucide-react";
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
import FilterWorkOrderTableModal from "@/components/app/modals/FilterWorkOrderTableModal";
import TablePagenation from "@/components/app/TablePagenation";
import { Checkbox } from "@/components/ui/checkbox";
import TableComparisonFilterSearch, {
  FilterValue,
} from "./TableComparisonFilterSearch";
import { get, put } from "@/lib/apiService"; // Removed del import, added put
import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import { useNavigate } from "react-router";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Define types based on your API response
interface Buyer {
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
}

interface Item {
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
}

interface OrderItem {
  hsn: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  tax: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  item?: Item;
}

interface Warehouse {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
}

interface OrderConfirmation {
  buyer: Buyer;
  totalAmount: string;
  tax: string;
  status: string;
  items: OrderItem[];
  placeOfSupplyCity: string;
  title: string;
  documentNumber: string;
  deliveryDate: string;
  warehouse: Warehouse;
  documentDate: string;
  amendment: any;
  poNumber: string;
  poDate: string;
  quotationNumber: string;
  quotationDate: string;
  paymentType: string;
  customerEnquiryNumber: string;
  customerEnquiryDate: string;
  kindAttention: string;
  attachments: any;
  signature: any;
  remark: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: OrderConfirmation[];
}

// Define table data type
export interface WorkOrderTableData {
  id: number;
  quantity: string;
  buyerName: string;
  documentNumber: string;
  orderType: string;
  processNumber: string;
  processStage: string;
  warehouseName: string;
  deliveryDate: string;
  createdBy: string;
}

const WorkOrdersTable: React.FC = () => {
  const [data, setData] = useState<WorkOrderTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterWorkOrdersTable, setShowFilterWorkOrdersTable] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null); // Track which row is being updated

  const navigate = useNavigate();

  // Direct API call to fetch data
  useEffect(() => {
    fetchOrderConfirmations();
  }, []);

  // Function to fetch data (reusable)
  const fetchOrderConfirmations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get<ApiResponse>(
        "/inventory/order-confirmation"
      );

      if (response.status && response.data) {
        // Transform API data to table format
        const tableData = response.data.map((order: OrderConfirmation) => {
          // Calculate total quantity from all items
          const itemQuantity = order.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
          
          return {
            id: order.id,
            quantity: itemQuantity.toFixed(2),
            buyerName: order.buyer.name,
            documentNumber: order.documentNumber,
            orderType: order.paymentType || "-",
            processNumber: `PROC-${String(order.id).padStart(3, '0')}`,
            processStage: order.status,
            deliveryDate: new Date(order.deliveryDate).toLocaleDateString('en-GB'),
            createdBy: "System",
            warehouseName: order.warehouse.name,
          };
        });
        setData(tableData);
      } else {
        setError("Failed to fetch work orders");
        ErrorToast({
          title: "Error",
          description: response.message || "Failed to fetch work orders",
        });
      }
    } catch (err) {
      const errorMessage = "Error fetching data: " +
        (err instanceof Error ? err.message : "Unknown error");
      setError(errorMessage);
      ErrorToast({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler functions
  const handleStartProcess = () => {
    if (selectedRows.length !== 1) return;
    
    const selectedId = selectedRows[0];
    const selectedOrder = data.find(order => order.id === selectedId);
    
    if (!selectedOrder) return;
    
    // Check if order is cancelled
    if (selectedOrder.processStage.toUpperCase().includes("CANCELLED")) {
      ErrorToast({
        title: "Cannot Start Process",
        description: "This work order has been cancelled and cannot be processed.",
      });
      return;
    }
    
    // Get the original order data from API response
    const fetchOrderDetails = async () => {
      try {
        const response = await get<ApiResponse>(
          "/inventory/order-confirmation"
        );
        
        if (response.status && response.data) {
          const fullOrderData = response.data.find((order: OrderConfirmation) => order.id === selectedId);
          
          if (fullOrderData) {
            // Navigate to create production order with data
            navigate('/production/create-order', {
              state: {
                workOrderData: fullOrderData,
                summaryData: selectedOrder
              }
            });
          }
        }
      } catch (error) {
        ErrorToast({
          title: "Error",
          description: "Failed to fetch order details",
        });
      }
    };
    
    fetchOrderDetails();
  };

  // Function to cancel an order (update status to CANCELLED)
  const handleCancelOrder = async (id: number) => {
    try {
      setUpdatingStatus(id);
      
      // Prepare the data for the PUT request
      const updateData = {
        status: "CANCELLED"
      };
      
      // Make PUT request to update the order status
      const response = await put<any>(
        `/inventory/order-confirmation/${id}`,
        updateData
      );
      
      if (response.status) {
        SuccessToast({
          title: "Success",
          description: response.message || "Order cancelled successfully",
        });
        
        // Update the local state to reflect the status change
        setData(prevData => 
          prevData.map(order => 
            order.id === id 
              ? { ...order, processStage: "CANCELLED" }
              : order
          )
        );
      } else {
        ErrorToast({
          title: "Error",
          description: response.message || "Failed to cancel order",
        });
      }
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: "Failed to cancel order",
      });
    } finally {
      setUpdatingStatus(null);
    }
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
          className="mr-2"
        />
      ),
      cell: ({ row }) => {
        const isCancelled = row.original.processStage.toUpperCase().includes("CANCELLED");
        
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              // Don't allow selection if order is cancelled
              if (isCancelled) {
                ErrorToast({
                  title: "Cannot Select",
                  description: "Cancelled orders cannot be selected for processing.",
                });
                return;
              }
              
              row.toggleSelected(!!value);
              
              // Update selected rows state
              const rowId = row.original.id;
              if (value) {
                // Only allow selecting one row at a time
                table.toggleAllPageRowsSelected(false);
                row.toggleSelected(true);
                setSelectedRows([rowId]);
              } else {
                setSelectedRows(prev => prev.filter(id => id !== rowId));
              }
            }}
            aria-label="Select row"
            className="mr-2"
            disabled={isCancelled}
          />
        );
      },
      size: 40,
    },
    {
      header: () => <div className="min-w-32">DOCUMENT NUMBER</div>,
      accessorKey: "documentNumber",
      cell: ({ row }) => {
        const handleClick = () => {
          const rowId = row.original.id;
          console.log("Starting process for work order:", rowId);
          alert(`Starting process for work order #${rowId} (${row.original.documentNumber})`);
        };

        return (
          <div className="min-w-32">
            <button
              onClick={handleClick}
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors focus:outline-none"
            >
              {row.getValue("documentNumber")}
            </button>
          </div>
        );
      },
    },
    {
      header: () => <div className="min-w-32">BUYER NAME</div>,
      accessorKey: "buyerName",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("buyerName")}</div>
      ),
    },
    {
      header: () => <div className="min-w-48">QUANTITY</div>,
      accessorKey: "quantity",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("quantity")}</div>
      ),
      filterFn: (row, columnId, filterValue: FilterValue) => {
        if (!filterValue?.value) return true;
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
      header: () => <div className="min-w-32">ORDER TYPE</div>,
      accessorKey: "orderType",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("orderType")}</div>
      ),
    },
    {
      header: () => <div className="min-w-32">PROCESS NUMBER</div>,
      accessorKey: "processNumber",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("processNumber")}</div>
      ),
    },
    {
      header: () => <div className="min-w-32">WAREHOUSE NAME</div>,
      accessorKey: "warehouseName",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("warehouseName")}</div>
      ),
    },
    {
      header: () => <div className="min-w-32">STATUS</div>,
      accessorKey: "processStage",
      cell: ({ row }) => {
        const processStage = row.getValue("processStage") as string;
        const getStageColor = (stage: string) => {
          const stageLower = stage.toLowerCase();
          if (stageLower.includes("pending")) {
            return "bg-blue-100 text-blue-800";
          } else if (stageLower.includes("planned")) {
            return "bg-yellow-100 text-yellow-800";
          } else if (stageLower.includes("published") || stageLower.includes("approved")) {
            return "bg-green-100 text-green-800";
          } else if (stageLower.includes("completed")) {
            return "bg-gray-100 text-gray-800";
          } else if (stageLower.includes("cancelled")) {
            return "bg-red-100 text-red-800";
          } else {
            return "bg-gray-100 text-gray-800";
          }
        };

        return (
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs ${getStageColor(processStage)}`}>
            <span>{processStage}</span>
          </div>
        );
      },
    },
    {
      header: () => <div className="min-w-32">DELIVERY DATE</div>,
      accessorKey: "deliveryDate",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("deliveryDate")}</div>
      ),
    },
    {
      header: () => <div className="min-w-32">CREATED BY</div>,
      accessorKey: "createdBy",
      cell: ({ row }) => (
        <div className="min-w-32 text-sm">{row.getValue("createdBy")}</div>
      ),
    },
    // Action column with Cancel button
    {
      header: () => <div className="min-w-24">ACTION</div>,
      id: "actions",
      cell: ({ row }) => {
        const orderId = row.original.id;
        const processStage = row.original.processStage;
        const isUpdating = updatingStatus === orderId;
        
        // Only show cancel button if order is not already cancelled
        const canCancel = !processStage.toUpperCase().includes("CANCELLED");
        
        return (
          <div className="min-w-24">
            {canCancel ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to cancel order "${row.original.documentNumber}"?`)) {
                    handleCancelOrder(orderId);
                  }
                }}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <span className="text-gray-400 text-sm">Cancelled</span>
            )}
          </div>
        );
      },
    },
  ];

  const toggleShowFilterWorkOrderTable = () =>
    setShowFilterWorkOrdersTable((prev) => !prev);

  const table = useReactTable({
    data,
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

  const selectedRowCount = selectedRows.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7047EB] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading work orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 text-red-500 mx-auto">⚠️</div>
          <p className="mt-4 text-red-600">{error}</p>
          <Button 
            onClick={fetchOrderConfirmations}
            className="mt-4 bg-[#7047EB] hover:bg-[#7047EB]/90"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Filter Section */}
        <section className="mt-4 px-5">
          <div className="w-full flex justify-start max-w-[13rem]">
            <div className="max-w-44">
              <Button
                onClick={toggleShowFilterWorkOrderTable}
                className="text-neutral-500 px-5 bg-neutral-200/70 hover:bg-neutral-200/70 hover:opacity-80 shadow-none w-full"
              >
                Filter
                <Funnel className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="px-5 w-full">
          <div className="sm:flex-row flex flex-col gap-3 pt-3 md:justify-between sm:items-center border-t">
            <p className="text-xs sm:text-sm">
              {selectedRowCount === 1 ? "1 Work Order selected" : `${selectedRowCount} Work Orders selected`}
            </p>
            <div className="flex sm:items-center gap-3">
              <Button
                disabled={selectedRowCount !== 1 || 
                  (selectedRowCount === 1 && data.find(order => order.id === selectedRows[0])?.processStage.toUpperCase().includes("CANCELLED"))}
                onClick={handleStartProcess}
                className="flex items-center bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedRowCount === 1 && data.find(order => order.id === selectedRows[0])?.processStage.toUpperCase().includes("CANCELLED") ? 
                  "Cannot start process for cancelled order" : 
                  selectedRowCount !== 1 ? "Select exactly 1 work order to start process" : ""}
              >
                <Play className="w-4 mr-2" />
                Start Process
              </Button>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <div className="px-5">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="relative h-10 border-t select-none border-r"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => {
                    const shouldShowSearch = [
                      "buyerName",
                      "documentNumber",
                      "orderType",
                      "processNumber",
                      "createdBy",
                      "warehouseName",
                    ].includes(header.id);
                    const showComparisonSearch = ["quantity"].includes(header.id);
                    
                    return (
                      <TableHead
                        key={header.id}
                        className="relative border-t select-none border-r"
                      >
                        {shouldShowSearch && (
                          <Input
                            placeholder="Search..."
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
                    className="hover:bg-gray-50"
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
                      <FileText className="w-16 h-16 text-gray-300" />
                      <h4 className="font-bold text-lg">No Work Orders Found</h4>
                      <p className="max-w-xs text-[#121217] text-sm">
                        No work orders available. Create your first work order to get started.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/production/work-order/new'}
                        className="bg-[#7047EB] hover:bg-[#7047EB]/90 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Work Order
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
      
      {/* Filter Modal */}
      <FilterWorkOrderTableModal
        table={table}
        isOpen={showFilterWorkOrdersTable}
        onClose={toggleShowFilterWorkOrderTable}
      />
    </div>
  );
};

export default WorkOrdersTable;