import React, { useMemo, useState, useEffect } from "react";
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
  // SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpRight,
  // Filter,
  // LayoutDashboard,
  // ExternalLinkIcon,
  PlusIcon,
  // SearchIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import { useNavigate } from "react-router";
import SelectFilter from "../SelectFilter";
import TableLoading from "../TableLoading";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import { OptionType } from "../SelectFilter";
import TablePagenation from "../TablePagenation";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}
// TODO: change the types here according to values
type Item = {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  unit: string;
  defaultPrice: number;
  regularBuyingPrice: number;
  wholesaleBuyingPrice: number;
  regularSellingPrice: number;
};

type categoryType = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type taxType = {
  id: number;
  name: string;
  rate: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
};

type unitType = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isGlobal: boolean;
  status: boolean;
  uom: string;
};

interface IItemMasterTable {
  toggleAddInventoryModal: () => void;
  itemMasterTableData: rawItemMasterTableDataType[];
  showEditInventoryItemModal: (item: rawItemMasterTableDataType) => void;
}

type rawItemMasterTableDataType = {
  sku: string;
  name: string;
  isProduct: boolean;
  type: string;
  unit: unitType;
  category: categoryType;
  currentStock: number;
  warehouse: number;
  defaultPrice: number;
  hsnCode: string;
  tax: taxType;
  minimumStockLevel: number;
  maximumStockLevel: number;
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
  id: number;
};

interface IItemMasterTable {
  isLoading: boolean;
  toggleAddInventoryModal: () => void;
  itemMasterTableData: rawItemMasterTableDataType[];
  showEditInventoryItemModal: (item: rawItemMasterTableDataType) => void;
  
}

const ItemMasterTable: React.FC<IItemMasterTable> = ({
  isLoading,
  toggleAddInventoryModal,
  itemMasterTableData,
}) => {
  const navigateTo = useNavigate();

  const columns: ColumnDef<Item>[] = [
    {
      header: "Item Id",
      accessorKey: "itemId",
      cell: ({ row }) => (
        <div
          onClick={() => {
            const selectedItem = itemMasterTableData.find(
              (item) => item.id === Number(row.original.id),
            );
            console.log(selectedItem);
            localStorage.setItem("currentItem", JSON.stringify(selectedItem));
            if (selectedItem) {
              navigateTo(`/inventory/item-details/${selectedItem.sku}`);
            }
          }}
          className="font-normal text-blue-500 gap-2 min-w-56 flex items-center cursor-pointer"
        >
          {row.getValue("itemId")}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Item Name",
      accessorKey: "itemName",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("itemName")}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Item Category",
      accessorKey: "itemCategory",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("itemCategory")}
        </div>
      ),
      filterFn: "equals",
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Unit",
      accessorKey: "unit",
      cell: ({ row }) => (
        <div className="font-normal">{row.getValue("unit")}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Default Price",
      accessorKey: "defaultPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("defaultPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Regular Buying Price",
      accessorKey: "regularBuyingPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("regularBuyingPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Wholesale Buying Price",
      accessorKey: "wholesaleBuyingPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("wholesaleBuyingPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Regular Selling Price",
      accessorKey: "regularSellingPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("regularSellingPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "MRP (Maximum Retail Price)",
      accessorKey: "mrp",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("mrp")}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Dealer Price",
      accessorKey: "dealerPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("dealerPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Distributor Price",
      accessorKey: "distributorPrice",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("distributorPrice")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },

    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("type")}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Tax",
      accessorKey: "tax",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("tax")}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Minimum Stock Level",
      accessorKey: "minimumStockLevel",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("minimumStockLevel")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Maximum Stock Level",
      accessorKey: "maximumStockLevel",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("maximumStockLevel")}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
  ];
  // const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>();
  // const searchParams = new URLSearchParams(location.search);
  // const startDate = searchParams.get("startDate");
  // const endDate = searchParams.get("endDate");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // derive items directly from props
  const items = useMemo(
    () =>
      itemMasterTableData.map((data) => ({
        id: data.id.toString(),
        itemId: data.sku,
        itemName: data.name,
        itemCategory: data.category.name,
        unit: data.unit.name,
        defaultPrice: data.defaultPrice,
        regularBuyingPrice: data.regularBuyingPrice,
        wholesaleBuyingPrice: data.distributorPrice,
        regularSellingPrice: data.regularSellingPrice,
        mrp: data.mrp,
        dealerPrice: data.dealerPrice,
        distributorPrice: data.distributorPrice,
        type: data.isProduct ? "Product" : "Service",
        isProduct: data.isProduct,
        tax: data.tax.name,
        minimumStockLevel: data.minimumStockLevel || 0,
        maximumStockLevel: data.maximumStockLevel || 0,
        currentStock: data.currentStock || 0,
      })),
    [itemMasterTableData],
  );

  // DEBUG: log out what rows the table sees
  useEffect(() => {
    console.log("Table got items:", items);
  }, [items]);

  const table = useReactTable({
    data: items,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        itemId: true,
        itemName: true,
        itemCategory: true,
        unit: true,
        defaultPrice: true,
        regularBuyingPrice: true,
        wholesaleBuyingPrice: false,
        regularSellingPrice: false,
        mrp: false,
        dealerPrice: false,
        distributorPrice: false,
        type: false,
        tax: false,
        minimumStockLevel: false,
        maximumStockLevel: false,
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

  const productOptions: OptionType[] = [
    { label: "Products", value: "Product" },
    { label: "Service", value: "Service" },
  ];
  const storeOptions: OptionType[] = [
    { label: "Default Stock Store", value: "Default Stock Store" },
    { label: "Default Reject Store", value: "Default Reject Store" },
  ];

  const statusOptions: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Low Stock", value: "low" },
    { label: "Excess Stock", value: "excess" },
    { label: "Negative Stock", value: "negative" },
    { label: "Inactive Items", value: "inactive" },
  ];
  return (
    <div>
      <div className="space-y-6">
        {/* <section className="mt-4 px-5 ">
          <div className="flex py-3 flex-wrap gap-4 justify-between items-center w-full">
            <div className="px-3 text-sm w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] flex justify-between items-center gap-3 py-2 bg-white rounded-md border">
              <div className="text-green-800 font-medium">Stock Value</div>
              <div className="font-bold">₹ 1245</div>
            </div>
            <div className="px-3 text-sm w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] flex justify-between items-center gap-3 py-2 bg-white rounded-md border">
              <div className="text-yellow-600 font-medium">Low Stock</div>
              <div className="font-bold flex items-center gap-2">
                0 <Filter className="text-neutral-600 w-3.5" />
              </div>
            </div>
            <div className="px-3 text-sm w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] flex justify-between items-center gap-3 py-2 bg-white rounded-md border">
              <div className="text-green-800 font-medium">Excess Stock</div>
              <div className="font-bold flex items-center gap-2">
                0 <Filter className="text-neutral-600 w-3.5" />
              </div>
            </div>
            <div className="px-3 hover:cursor-pointer bg-green-200 text-sm w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] flex justify-between items-center gap-3 py-2 rounded-md border">
              <div className="font-medium">View Inventory Dashboard</div>
              <div className="font-bold flex items-center gap-2">
                <LayoutDashboard className="text-green-800 w-3.5" />
              </div>
            </div>
          </div>
        </section> */}
        <section className="px-5">
          <div className="flex justify-between">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 items-center w-full">
              {/* Create onValueChange to pass through these for filtering logic */}
              <SelectFilter
                label="Products/Services"
                items={productOptions}
                onValueChange={(value) => {
                  // Set column filter for the "type" column
                  table.getColumn("type")?.setFilterValue(value);
                }}
              />
              <SelectFilter
                label="Stores"
                items={storeOptions}
                onValueChange={() => {
                  // You need to add a corresponding column if you want to filter by store
                  // table.getColumn("store")?.setFilterValue(value);
                }}
              />
              <SelectFilter
                label="Status"
                items={statusOptions}
                defaultValue={statusOptions[0].value}
                onValueChange={() => {}}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
              {/* <SelectFilter
                label="Show/Hide Columns"
                items={showHideColumns}
                defaultValue={showHideColumns[0]}
              /> */}
              <div className="flex w-full xl:mt-5 xl:justify-end items-end gap-4">
                <Button
                  onClick={toggleAddInventoryModal}
                  disabled={isLoading}
                  className="bg-[#7047EB] text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                >
                  <PlusIcon className="" />
                  Add Item
                </Button>
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
                        className="relative py-2 border-t select-none border-r"
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
              <TableLoading columnLength={20} />
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="relative"
                      // TODO : add sidebar hovering effect for current page
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                      {/* Comment edit details */}
                      {/* <div
                          onClick={(e) => {
                            e.stopPropagation();
                            // find the full original item by SKU
                            const fullItem = itemMasterTableData.find(
                              (d) => d.sku === row.original.itemId,
                            );
                            if (fullItem) {
                              console.log("got fullitem", fullItem);
                              showEditInventoryItemModal(fullItem);
                            }
                          }}
                          className="absolute gap-1 text-xs h-full z-10 border-l backdrop-blur-sm border-r right-0 w-12 cursor-pointer bg-white/20 text-neutral-700 flex items-center justify-center"
                        >
                          <FilePen className="w-4" />
                        </div> */}
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
                        <h4 className="font-bold text-lg">No Item Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a document to get started and manage your
                          operations efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={toggleAddInventoryModal}
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                          >
                            <PlusIcon className="" />
                            Add Item
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
        {table.getVisibleLeafColumns().length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default ItemMasterTable;
