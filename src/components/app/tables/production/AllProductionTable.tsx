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

// TODO: change the types here according to values
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

interface ApiProductionItem {
  id: number;
  docNumber: string;
  orderDeliveryDate: string | null;
  expectedCompletionDate: string | null;
  status: string;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
  rmStore: ApiStore;
  fgStore: ApiStore;
  scrapStore: ApiStore;
  createdBy: ApiUser;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: ApiProductionItem[];
}

// API Function
const productionAPI = {
  getProductionList: async (page = 1, limit = 20, status = "planned"): Promise<ApiResponse> => {
    return await get(`/production/proccess?page=${page}&limit=${limit}&status=${status}`);
  },
};

const columns: ColumnDef<AllProductionTableDataType>[] = [
  {
    header: () => <div className="min-w-44">Process Number</div>,
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
  {
    header: () => <div className="min-w-32">Stage</div>,
    accessorKey: "stage",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("stage")}</div>,
  },
  {
    header: () => <div className="min-w-32">Status</div>,
    accessorKey: "status",
    cell: ({ row }) => {
      const statusValue = row.getValue("status") as string;
      return (
        <div className="flex items-center justify-center min-w-32">
          <div
            className={`font-normal px-3 py-1 text-xs w-fit rounded-full ${
              statusValue === "approved" || statusValue === "Approved"
                ? "text-green-600 bg-green-100"
                : statusValue === "rejected" || statusValue === "Rejected"
                  ? "text-red-600 bg-red-100"
                  : statusValue === "completed" || statusValue === "Completed"
                  ? "text-blue-600 bg-blue-100"
                  : "text-yellow-600 bg-yellow-100"
            }`}
          >
            {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
          </div>
        </div>
      );
    },
  },
  {
    header: () => <div className="min-w-32">Bom Number</div>,
    accessorKey: "bomNumber",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("bomNumber")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Item Id</div>,
    accessorKey: "fgItemId",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("fgItemId")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG Name</div>,
    accessorKey: "fgName",
    cell: ({ row }) => <div className="min-w-32">{row.getValue("fgName")}</div>,
  },
  {
    header: () => <div className="min-w-32">Type of Process</div>,
    accessorKey: "typeOfProcess",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("typeOfProcess")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">FG UOM</div>,
    accessorKey: "fgUom",
    cell: ({ row }) => {
      const uomValue = row.getValue("fgUom") as string;
      return <div className="min-w-32">{uomValue || "KG"}</div>;
    },
  },
  {
    header: () => <div className="min-w-32">Target Quantity</div>,
    accessorKey: "targetQuantity",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("targetQuantity")}</div>
    ),
  },
  {
    header: () => <div className="min-w-44">Completed Quantity</div>,
    accessorKey: "completedQuantity",
    cell: ({ row }) => (
      <div className="min-w-44">{row.getValue("completedQuantity")}</div>
    ),
  },
  {
    header: () => <div className="min-w-44">Order Delivery Date</div>,
    accessorKey: "orderDeliveryDate",
    cell: ({ row }) => {
      const deliveryDate = row.getValue("orderDeliveryDate") as string;
      return <div className="min-w-44">{deliveryDate || "-"}</div>;
    },
  },
  {
    header: () => <div className="min-w-32">Creation Date</div>,
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Last Modified By</div>,
    accessorKey: "lastModifiedBy",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("lastModifiedBy")}</div>
    ),
  },
  {
    header: () => <div className="min-w-32">Last Modified Date</div>,
    accessorKey: "lastModifiedDate",
    cell: ({ row }) => (
      <div className="min-w-32">{row.getValue("lastModifiedDate")}</div>
    ),
  },
];

const AllProductionTable: React.FC = () => {
  const [data, setData] = useState<AllProductionTableDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilterProductionTableModal, setShowFilterProductionTableModal] =
    useState<boolean>(false);
  const navigate = useNavigate();
  
  const toggleFilterProductionTableModal = () =>
    setShowFilterProductionTableModal((prev) => !prev);

  // Fetch data from API
  useEffect(() => {
    const loadProduction = async () => {
      try {
        setLoading(true);
        const res = await productionAPI.getProductionList();

        if (res?.status && Array.isArray(res.data)) {
          const mapped = res.data.map((item: ApiProductionItem) => ({
            refrenceNumber: item.docNumber,
            processNumber: item.id.toString(),
            stage: item.status || "-",
            status: item.status || "-",
            bomNumber: "-", // API does not send BOM
            fgItemId: item.fgStore?.id?.toString() ?? "-",
            fgName: item.fgStore?.name ?? "-",
            typeOfProcess: "-", // API missing
            fgUom: "KG", // Default to KG as requested
            targetQuantity: 0, // API missing
            completedQuantity: 0, // API missing
            orderDeliveryDate: item.orderDeliveryDate 
              ? new Date(item.orderDeliveryDate).toLocaleDateString() 
              : "-",
            creationDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
            lastModifiedBy: item.createdBy?.name ?? "-",
            lastModifiedDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-",
          }));

          setData(mapped);
        }
      } catch (err) {
        console.log("Error loading production list:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduction();
  }, []);

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
                      "refrenceNumber",
                      "stage",
                      "bomNumber",
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
                      navigate(`/production/process/${processId}`);
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
        {!loading && table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
      <FilterProductionTableModal
        table={table}
        isOpen={showFilterProductionTableModal}
        onClose={toggleFilterProductionTableModal}
      />
    </div>
  );
};

export default AllProductionTable;