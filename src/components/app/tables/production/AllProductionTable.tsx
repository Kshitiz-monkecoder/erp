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
import { Funnel, PlusIcon, ArrowRight } from "lucide-react";
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
import { useNavigate } from "react-router";
import { get } from "@/lib/apiService";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

export type AllProductionTableDataType = {
  refrenceNumber: string;
  processNumber: string;
  stage: string;
  status: string;
  bomNumber: string;
  fgItemId: string;
  fgName: string;
  typeOfProcess: string;
  fgUom: string;
  targetQuantity: number;
  completedQuantity: number;
  orderDeliveryDate: string;
  creationDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
};

// API Response Interfaces
interface ApiStore {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
}

interface ApiUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  userType: string;
}

interface ApiBom {
  id: number;
  docNumber: string;
  docDate: string;
  docName: string;
  docDescription: string | null;
  docComment: string | null;
  docBomDescription: string | null;
  docDraftDate: string | null;
  status: string;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiBomItem {
  id: number;
}

interface ApiBomFinishedGoods {
  id: number;
  quantity: number;
  costAlloc: number;
  comment: string;
  hasAlternate: boolean;
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
  unit: {
    name: string;
    description: string;
    uom: string;
    status: boolean;
    id: number;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface ApiFinishedGood {
  id: number;
  req_quantity: number;
  total_mfg_quantity: number;
  tested_quantity: number;
  accept_quantity: number;
  reject_quantity: number;
  actual_used_quantity: number;
  comment: string | null;
  bomFinishedGoods: ApiBomFinishedGoods;
}

interface ApiOtherCharge {
  id: number;
  charges_estimate: number;
  comment: string | null;
  bomOtherCharge: {
    id: number;
    charges: number;
    classification: string;
    comment: string | null;
  };
}

interface ApiProductionItemDetail {
  id: number;
  bomItem: ApiBomItem;
  finishedGoods: ApiFinishedGood[];
  other_charges: ApiOtherCharge[];
}

interface ApiProductionItem {
  id: number;
  docNumber: string;
  orderDeliveryDate: string | null;
  expectedCompletionDate: string | null;
  status: string;
  attachments: any;
  createdAt: string;
  updatedAt: string;
  rmStore: ApiStore;
  fgStore: ApiStore;
  scrapStore: ApiStore;
  createdBy: ApiUser;
  bom: ApiBom;
  productionItems: ApiProductionItemDetail[];
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: {
    list: ApiProductionItem[];
    pagination: {
      page: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
  };
}

const productionAPI = {
  getProductionList: async (page = 1, limit = 20, status?: string): Promise<ApiResponse> => {
    let url = `/production/proccess?page=${page}&limit=${limit}`;
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    return await get(url);
  },
};

const columns: ColumnDef<AllProductionTableDataType>[] = [
  {
    header: () => <div className="min-w-44 whitespace-nowrap">Process Number</div>,
    accessorKey: "processNumber",
    cell: ({ row }) => {
      const docNumber = row.original.refrenceNumber || "";
      return (
        <div className="min-w-44 flex items-center gap-2">
          <span className="text-blue-600 font-medium">{docNumber}</span>
          <ArrowRight className="w-4 h-4 text-blue-600 transform -rotate-45" />
        </div>
      );
    },
  },
  // Stage column removed here
  {
    header: () => <div className="min-w-32 whitespace-nowrap">Status</div>,
    accessorKey: "status",
    cell: ({ row }) => {
      const statusValue = row.getValue("status") as string;
      const statusLower = statusValue.toLowerCase();
      return (
        <div className="flex items-center min-w-32">
          <div
            className={`font-normal px-3 py-1 text-xs w-fit rounded-full ${
              statusLower === "complete" || statusLower === "completed"
                ? "text-green-600 bg-green-100" // Green for complete/completed
                : statusLower === "planned"
                ? "text-yellow-600 bg-yellow-100"
                : statusLower === "publish"
                ? "text-blue-600 bg-blue-100"
                : "text-gray-600 bg-gray-100"
            }`}
          >
            {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
          </div>
        </div>
      );
    },
  },
  {
    header: () => <div className="min-w-28 whitespace-nowrap">Bom Number</div>,
    accessorKey: "bomNumber",
    cell: ({ row }) => (
      <div className="min-w-28 text-sm">
        <span className="font-medium">{row.getValue("bomNumber")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-28 whitespace-nowrap">FG Item Id</div>,
    accessorKey: "fgItemId",
    cell: ({ row }) => (
      <div className="min-w-28 text-sm">
        <span className="text-gray-600">{row.getValue("fgItemId")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-40 whitespace-nowrap">FG Name</div>,
    accessorKey: "fgName",
    cell: ({ row }) => (
      <div className="min-w-40 text-sm">
        <span className="text-gray-700">{row.getValue("fgName")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-36 whitespace-nowrap">Type of Process</div>,
    accessorKey: "typeOfProcess",
    cell: ({ row }) => {
      const typeOfProcess = row.getValue("typeOfProcess") as string;
      return (
        <div className="min-w-36 text-sm">
          <span className="text-gray-700">{typeOfProcess || "Master Process"}</span>
        </div>
      );
    },
  },
  {
    header: () => <div className="min-w-24 whitespace-nowrap">FG UOM</div>,
    accessorKey: "fgUom",
    cell: ({ row }) => {
      const uomValue = row.getValue("fgUom") as string;
      return <div className="min-w-24 text-sm">{uomValue || "KG"}</div>;
    },
  },
  {
    header: () => <div className="min-w-32 whitespace-nowrap">Target Quantity</div>,
    accessorKey: "targetQuantity",
    cell: ({ row }) => (
      <div className="min-w-32 text-sm">
        <span className="font-medium">{row.getValue("targetQuantity")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-44 whitespace-nowrap">Completed Quantity</div>,
    accessorKey: "completedQuantity",
    cell: ({ row }) => (
      <div className="min-w-44 text-sm">
        <span className="font-medium">{row.getValue("completedQuantity")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-40 whitespace-nowrap">Order Delivery Date</div>,
    accessorKey: "orderDeliveryDate",
    cell: ({ row }) => {
      const deliveryDate = row.getValue("orderDeliveryDate") as string;
      return (
        <div className="min-w-40 text-sm">
          <span className="text-gray-700">{deliveryDate || "-"}</span>
        </div>
      );
    },
  },
  {
    header: () => <div className="min-w-36 whitespace-nowrap">Creation Date</div>,
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="min-w-36 text-sm">
        <span className="text-gray-700">{row.getValue("creationDate")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-40 whitespace-nowrap">Last Modified By</div>,
    accessorKey: "lastModifiedBy",
    cell: ({ row }) => (
      <div className="min-w-40 text-sm">
        <span className="text-gray-700">{row.getValue("lastModifiedBy")}</span>
      </div>
    ),
  },
  {
    header: () => <div className="min-w-40 whitespace-nowrap">Last Modified Date</div>,
    accessorKey: "lastModifiedDate",
    cell: ({ row }) => (
      <div className="min-w-40 text-sm">
        <span className="text-gray-700">{row.getValue("lastModifiedDate")}</span>
      </div>
    ),
  },
];

const AllProductionTable: React.FC = () => {
  const [data, setData] = useState<AllProductionTableDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterProductionTableModal, setShowFilterProductionTableModal] =
    useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();
  
  const toggleFilterProductionTableModal = () =>
    setShowFilterProductionTableModal((prev) => !prev);

  // Helper function to get target and completed quantities
  const getQuantitiesFromProductionItems = (productionItems: ApiProductionItemDetail[]) => {
    let targetQuantity = 0;
    let completedQuantity = 0;
    let fgItemId = "-";
    let fgName = "-";
    let fgUom = "KG";

    if (productionItems && productionItems.length > 0) {
      // Get the first production item
      const firstItem = productionItems[0];
      
      if (firstItem.finishedGoods && firstItem.finishedGoods.length > 0) {
        // Get the first finished good
        const firstFinishedGood = firstItem.finishedGoods[0];
        
        // Get target quantity from req_quantity
        targetQuantity = firstFinishedGood.req_quantity || 0;
        
        // Get completed quantity from total_mfg_quantity
        completedQuantity = firstFinishedGood.accept_quantity || 0;
        
        // Get item details
        if (firstFinishedGood.bomFinishedGoods?.item) {
          fgItemId = firstFinishedGood.bomFinishedGoods.item.id?.toString() || "-";
          fgName = firstFinishedGood.bomFinishedGoods.item.name || "-";
        }
        
        // Get unit
        if (firstFinishedGood.bomFinishedGoods?.unit) {
          fgUom = firstFinishedGood.bomFinishedGoods.unit.name || "KG";
        }
      }
    }
    
    return { targetQuantity, completedQuantity, fgItemId, fgName, fgUom };
  };

  useEffect(() => {
    const loadProduction = async () => {
      try {
        setLoading(true);
        const res = await productionAPI.getProductionList(1, 20, statusFilter);

        if (res?.status && res.data?.list && Array.isArray(res.data.list)) {
          const mapped = res.data.list.map((item: ApiProductionItem) => {
            // Get quantities from productionItems
            const { targetQuantity, completedQuantity, fgItemId, fgName, fgUom } = 
              getQuantitiesFromProductionItems(item.productionItems || []);
            
            return {
              refrenceNumber: item.docNumber,
              processNumber: item.id.toString(),
              stage: item.status || "-", // Still mapped but not displayed
              status: item.status || "-",
              bomNumber: item.bom?.docNumber || "-",
              fgItemId: fgItemId,
              fgName: fgName,
              typeOfProcess: "Master Process",
              fgUom: fgUom,
              targetQuantity: targetQuantity,
              completedQuantity: completedQuantity,
              orderDeliveryDate: item.orderDeliveryDate 
                ? new Date(item.orderDeliveryDate).toLocaleDateString() 
                : "-",
              creationDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
              lastModifiedBy: item.createdBy?.name ?? "-",
              lastModifiedDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-",
            };
          });

          setData(mapped);
        }
      } catch (err) {
        console.log("Error loading production list:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduction();
  }, [statusFilter]);

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
                  <Button 
                    className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                    onClick={() => navigate("/production/create-order")}
                  >
                    <PlusIcon className="" />
                    Create New
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Table Section with horizontal scroll */}
        <div className="px-5">
          <div className="overflow-x-auto border rounded-lg">
            <Table className="min-w-full">
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
                        "refrenceNumber",
                        "bomNumber", // Removed "stage" from search
                        "fgItemId",
                        "fgName",
                        "fgUom",
                        "targetQuantity",
                        "completedQuantity",
                        "orderDeliveryDate",
                        "lastModifiedBy",
                      ].includes(header.id);
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
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-gray-600">Loading production data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const processId = row.getValue("processNumber") as string;
                         navigate(`/production/process-details?processId=${processId}`);
                      }}
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
                        <h4 className="font-bold text-lg">No Production Orders</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          No production orders found. Create a new production order to get started.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button 
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={() => navigate("/production/create-order")}
                          >
                            <PlusIcon className="" />
                            Create Production Order
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {!loading && table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
      <FilterProductionTableModal
        table={table}
        isOpen={showFilterProductionTableModal}
        onClose={toggleFilterProductionTableModal}
        onStatusFilterChange={setStatusFilter}
        currentStatusFilter={statusFilter}
      />
    </div>
  );
};

export default AllProductionTable;