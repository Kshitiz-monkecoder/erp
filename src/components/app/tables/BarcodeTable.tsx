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
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { Download, List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import SelectFilter, { OptionType } from "../SelectFilter";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import TablePagenation from "../TablePagenation";
import { get } from "@/lib/apiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Define types for the API response
type ApiBarcodeItem = {
  id?: number | string;
  barcodeNumber?: string;
  mainQuantity?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  info?: string | null;
  comment?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  grn?: {
    id?: number | string;
    documentNumber?: string;
    supplier?: {
      companyName?: string;
      name?: string;
    };
    warehouse?: {
      name?: string;
    };
  };
  item?: {
    id?: number | string;
    name?: string;
    sku?: string;
  };
  createdBy?: {
    name?: string;
  };
  company?: {
    name?: string;
  };
};

type BarcodeItem = {
  id: string;
  barcodeNumber: string;
  approvalNumber: string;
  toStore: string;
  itemId: string;
  itemName: string;
  quantityIn: number;
  quantityOut: number;
  quantityConsumed: number;
  balanceQuantity: number;
  returnQuantity: number;
  createdBy: string;
  creationDate: string;
  manufacturingDate: string;
  expiryDate: string;
  info1: string;
  info2: string;
  fromStore: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  status: string;
  grnDocumentNumber: string;
  itemSku: string;
  mainQuantity: string;
  companyName: string;
  // New fields for grouping
  grnId: string;
  totalBarcodes: number;
  allBarcodes: Array<{
    barcodeNumber: string;
    mainQuantity: string;
    id: string;
    createdAt: string;
    isActive: boolean;
  }>;
};

// Dialog component to show all barcodes for a GRN
const AllBarcodesDialog: React.FC<{
  grnId: string;
  grnDocumentNumber: string;
  barcodes: Array<{
    barcodeNumber: string;
    mainQuantity: string;
    id: string;
    createdAt: string;
    isActive: boolean;
  }>;
}> = ({ grnDocumentNumber, barcodes }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <List className="h-3 w-3 mr-1" />
          See All Barcodes ({barcodes.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            All Barcodes for GRN: {grnDocumentNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barcodes.map((barcode) => (
                <TableRow key={barcode.id}>
                  <TableCell>
                    <span className="bg-blue-50 px-2 py-1 rounded text-sm font-mono">
                      {barcode.barcodeNumber}
                    </span>
                  </TableCell>
                  <TableCell>{barcode.mainQuantity}</TableCell>
                  <TableCell>
                    {new Date(barcode.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        barcode.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {barcode.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintBarcode(barcode)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const columns: ColumnDef<BarcodeItem>[] = [
  {
    header: "GRN Document",
    accessorKey: "grnDocumentNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-blue-600">
        {row.getValue("grnDocumentNumber")}
      </div>
    ),
  },
  {
    header: "Barcodes",
    id: "barcodes",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 px-2 py-1 rounded text-sm font-mono">
            {row.original.barcodeNumber}
          </span>
          <span className="text-xs text-gray-500">
            + {row.original.totalBarcodes - 1} more
          </span>
        </div>
        <div className="mt-1">
          <AllBarcodesDialog
            grnId={row.original.grnId}
            grnDocumentNumber={row.original.grnDocumentNumber}
            barcodes={row.original.allBarcodes}
          />
        </div>
      </div>
    ),
  },
  {
    header: "Item SKU",
    accessorKey: "itemSku",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 font-mono text-sm">
        {row.getValue("itemSku")}
      </div>
    ),
  },
  {
    header: "Item Name",
    accessorKey: "itemName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("itemName")}</div>
    ),
  },
  {
    header: "Total Quantity",
    id: "totalQuantity",
    cell: ({ row }) => {
      const totalQuantity = row.original.allBarcodes.reduce(
        (sum, barcode) => sum + parseFloat(barcode.mainQuantity || "0"),
        0
      );
      return (
        <div className="font-normal min-w-32 font-medium">
          {totalQuantity.toFixed(2)}
        </div>
      );
    },
  },
  {
    header: "Manufacturing Date",
    accessorKey: "manufacturingDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("manufacturingDate") || "N/A"}
      </div>
    ),
  },
  {
    header: "Expiry Date",
    accessorKey: "expiryDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("expiryDate") || "N/A"}
      </div>
    ),
  },
  {
    header: "Company",
    accessorKey: "companyName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("companyName")}</div>
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
    header: "Creation Date",
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Inactive"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrintBarcode(row.original.allBarcodes[0])}
        >
          <Download className="h-3 w-3 mr-1" />
          Print
        </Button>
      </div>
    ),
  },
];

// Handle printing barcode
const handlePrintBarcode = (barcode: any) => {
  console.log("Print barcode:", barcode);
  // Implement barcode printing logic here
};

// Function to group barcodes by GRN ID with proper typing
const groupBarcodesByGRN = (barcodeData: ApiBarcodeItem[]): BarcodeItem[] => {
  const groupedByGRN: Record<string, BarcodeItem> = {};
  
  barcodeData.forEach((current) => {
    const grnId = current.grn?.id?.toString() || "unknown";
    
    if (!groupedByGRN[grnId]) {
      // Create new group for this GRN with proper typing
      const newGroup: BarcodeItem = {
        id: grnId,
        barcodeNumber: current.barcodeNumber || "",
        approvalNumber: current.grn?.documentNumber || "",
        toStore: current.grn?.supplier?.companyName || "",
        itemId: current.item?.id?.toString() || "",
        itemName: current.item?.name || "",
        quantityIn: 0,
        quantityOut: 0,
        quantityConsumed: 0,
        balanceQuantity: 0,
        returnQuantity: 0,
        createdBy: current.createdBy?.name || "System",
        creationDate: new Date(current.createdAt || Date.now()).toLocaleDateString(),
        manufacturingDate: current.manufacturingDate || "",
        expiryDate: current.expiryDate || "",
        info1: current.info || "",
        info2: current.comment || "",
        fromStore: current.grn?.warehouse?.name || "",
        lastModifiedBy: current.createdBy?.name || "System",
        lastModifiedDate: new Date(current.updatedAt || Date.now()).toLocaleDateString(),
        status: current.isActive ? "Active" : "Inactive",
        grnDocumentNumber: current.grn?.documentNumber || "",
        itemSku: current.item?.sku || "",
        mainQuantity: current.mainQuantity || "0",
        companyName: current.grn?.supplier?.companyName || "",
        grnId: grnId,
        totalBarcodes: 0,
        allBarcodes: []
      };
      
      groupedByGRN[grnId] = newGroup;
    }
    
    // Add this barcode to the group
    groupedByGRN[grnId].allBarcodes.push({
      barcodeNumber: current.barcodeNumber || "",
      mainQuantity: current.mainQuantity || "0",
      id: current.id?.toString() || "",
      createdAt: current.createdAt || "",
      isActive: current.isActive || false
    });
  });
  
  // Convert to array and set totalBarcodes count
  return Object.values(groupedByGRN).map(group => ({
    ...group,
    totalBarcodes: group.allBarcodes.length,
    // Use the first barcode number as the display barcode
    barcodeNumber: group.allBarcodes[0]?.barcodeNumber || ""
  }));
};

// Function to export all barcodes to Excel
const exportBarcodesToExcel = (barcodeData: BarcodeItem[]) => {
  try {
    // Flatten all barcodes from grouped data
    const allBarcodes: any[] = [];
    
    barcodeData.forEach(group => {
      group.allBarcodes.forEach(barcode => {
        allBarcodes.push({
          'GRN Document Number': group.grnDocumentNumber,
          'Barcode Number': barcode.barcodeNumber,
          'Item SKU': group.itemSku,
          'Item Name': group.itemName,
          'Quantity': barcode.mainQuantity,
          'Manufacturing Date': group.manufacturingDate || 'N/A',
          'Expiry Date': group.expiryDate || 'N/A',
          'Company': group.companyName,
          'Created By': group.createdBy,
          'Creation Date': group.creationDate,
          'Status': group.status,
          'GRN ID': group.grnId,
          'Barcode ID': barcode.id,
          'Created At': new Date(barcode.createdAt).toLocaleDateString(),
          'Barcode Status': barcode.isActive ? 'Active' : 'Inactive'
        });
      });
    });
    
    if (allBarcodes.length === 0) {
      alert('No barcodes to export');
      return;
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(allBarcodes);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barcodes');
    
    // Generate Excel file
    const fileName = `Barcodes_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    console.log(`Exported ${allBarcodes.length} barcodes to ${fileName}`);
  } catch (error) {
    console.error('Error exporting barcodes:', error);
    alert('Error exporting barcodes. Please try again.');
  }
};

const BarcodeTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawBarcodeData, setRawBarcodeData] = useState<ApiBarcodeItem[]>([]);

  // Fetch barcodes from API
  useEffect(() => {
    const fetchBarcodes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all barcodes - adjust API endpoint as needed
        const response = await get("/inventory/grn/barcodes/list");
        
        let apiData: ApiBarcodeItem[] = [];
        
        if (response?.data?.data) {
          // Group barcodes by GRN ID
          apiData = response.data.data;
          const groupedBarcodes = groupBarcodesByGRN(apiData);
          setBarcodes(groupedBarcodes);
          setRawBarcodeData(apiData);
        } else if (response?.data) {
          // If data is not nested under .data property
          apiData = response.data;
          const groupedBarcodes = groupBarcodesByGRN(apiData);
          setBarcodes(groupedBarcodes);
          setRawBarcodeData(apiData);
        } else {
          // Use mock data if API doesn't return data
          const mockData = transformMockData();
          setBarcodes(mockData);
          setRawBarcodeData(transformMockDataToRaw());
        }
      } catch (err) {
        console.error("Error fetching barcodes:", err);
        setError("Failed to load barcodes");
        // Fallback to mock data
        const mockData = transformMockData();
        setBarcodes(mockData);
        setRawBarcodeData(transformMockDataToRaw());
      } finally {
        setLoading(false);
      }
    };

    fetchBarcodes();
  }, []);

  // Transform the barcode response you provided into table format
  const transformMockData = (): BarcodeItem[] => {
    // Mock data based on your response structure
    const barcodeData: ApiBarcodeItem[] = [
      {
        id: 1,
        barcodeNumber: "Bill001",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "11.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 2,
        barcodeNumber: "Bill002",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      // Add more items as needed...
      {
        id: 3,
        barcodeNumber: "Bill003",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
    ];

    return groupBarcodesByGRN(barcodeData);
  };

  const transformMockDataToRaw = (): ApiBarcodeItem[] => {
    return [
      {
        id: 1,
        barcodeNumber: "Bill001",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "11.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 2,
        barcodeNumber: "Bill002",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 3,
        barcodeNumber: "Bill003",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
    ];
  };

  const table = useReactTable({
    data: barcodes,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        grnDocumentNumber: true,
        barcodes: true,
        itemSku: true,
        itemName: true,
        totalQuantity: true,
        manufacturingDate: true,
        expiryDate: true,
        companyName: true,
        createdBy: false,
        creationDate: false,
        status: true,
        actions: true,
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

  const itemStatusOptions: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];

  const handleStatusFilter = (value: string) => {
    if (value === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    // Flatten all barcodes from raw data for export
    if (rawBarcodeData.length === 0) {
      alert('No barcode data available to export');
      return;
    }
    
    // Export using the raw barcode data
    exportBarcodesToExcel(groupBarcodesByGRN(rawBarcodeData));
  };

  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <SelectFilter
                label="Barcode Status"
                items={itemStatusOptions}
                onValueChange={handleStatusFilter}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleExport}
                disabled={rawBarcodeData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({rawBarcodeData.length})
              </Button>
            </div>
          </div>
        </section>
        
        {loading ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7047EB] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading barcodes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        ) : barcodes.length === 0 ? (
          <div className="px-5">
            <div className="border rounded-lg h-96 flex flex-col items-center justify-center">
              <img src="/folder.svg" alt="No data" className="w-24 h-24 mb-4" />
              <h4 className="font-bold text-lg mb-2">No Barcodes Generated</h4>
              <p className="max-w-xs text-gray-600 text-sm text-center mb-6">
                Generate barcodes from inward documents to track your inventory efficiently.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5">
              <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="h-10 border-r last:border-r-0"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="border-b">
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
                            <h4 className="font-bold text-lg">No Barcodes Found</h4>
                            <p className="max-w-xs text-gray-600 text-sm">
                              No barcodes match your current filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {table.getRowModel().rows.length > 0 && (
              <TablePagenation table={table} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BarcodeTable;