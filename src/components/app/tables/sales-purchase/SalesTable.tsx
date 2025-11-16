import React, { useEffect, useId, useMemo, useState } from "react";
import SelectSupplierModal from "@/components/app/modals/SelectSupplierModal";
import SelectBuyerModal from "../../modals/SelectBuyerModal";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import TableLoading from "../../TableLoading";
import TablePagenation from "../../TablePagenation";
import { get } from "@/lib/apiService";
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

enum ModalType {
  Supplier = "supplier",
  Buyer = "buyer",
  None = "none",
}

interface Props {
  toggleSelectSupplierModal: () => void;
}

const SalesTable: React.FC<Props> = () => {
  const navigate = useNavigate();
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<any>([]);

  const columns: ColumnDef<any>[] = [
    {
      header: "Company Name",
      accessorKey: "buyer.companyName",
      id: "companyName",
      cell: ({ row }) => (
        <div
          onClick={() => {
            localStorage.setItem("purchaseOrder", JSON.stringify(row.original));
            navigate("/sales-purchase/order-preview");
          }}
          className="font-normal min-w-32 flex cursor-pointer text-blue-500 items-center gap-4"
        >
          {row.original.buyer?.companyName || "N/A"}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      id: "documentNumber",
      cell: ({ row }) => (
        <div className="font-normal min-w-32 truncate flex text-[#7047EB] items-center gap-4">
          {row.getValue("documentNumber")}
          <ArrowUpRight className="text-[#8A8AA3] w-5" />
        </div>
      ),
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      id: "totalAmount",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          ₹
          {parseFloat(row.getValue("totalAmount") || "0").toLocaleString(
            "en-IN",
            { minimumFractionDigits: 2 },
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      id: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors = {
          PENDING: "bg-yellow-100 text-yellow-800",
          APPROVED: "bg-green-100 text-green-800",
          REJECTED: "bg-red-100 text-red-800",
          DRAFT: "bg-gray-100 text-gray-800",
        };

        return (
          <div
            className={`font-normal min-w-32 px-2 py-1 rounded-full text-xs text-center ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
          >
            {status}
          </div>
        );
      },
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Warehouse",
      accessorKey: "warehouse.name",
      id: "warehouse",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.original.warehouse?.name || "N/A"}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Customer Enquiry",
      accessorKey: "customerEnquiryNumber",
      id: "customerEnquiryNumber",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("customerEnquiryNumber") || "N/A"}
        </div>
      ),
    },
    {
      header: "Document Date",
      accessorKey: "documentDate",
      id: "documentDate",
      cell: ({ row }) => {
        const date = row.getValue("documentDate") as string;
        return (
          <div className="font-normal min-w-32">
            {date ? new Date(date).toLocaleDateString("en-IN") : "N/A"}
          </div>
        );
      },
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Created By",
      accessorKey: "createdBy.name",
      id: "createdBy",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.original.createdBy?.name || "N/A"}
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Last Modified",
      accessorKey: "updatedAt",
      id: "updatedAt",
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as string;
        return (
          <div className="font-normal min-w-32">
            {date ? new Date(date).toLocaleDateString("en-IN") : "N/A"}
          </div>
        );
      },
      meta: {
        filterVariant: "select",
      },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await get("/inventory/sales-inquiry");
        setItems(data?.data || []);
        setIsLoading(false);
        console.log(data?.data);
      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (startDate && endDate) {
      filtered = items.filter((item: any) => {
        const itemDate = new Date(item.updatedAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [items, startDate, endDate]);

  const table = useReactTable({
    data: filteredItems ?? items,
    columns,
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
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

  const createDocumentOptions = [
    { label: "Sales Order", link: "sales-order", type: "supplier" },
  ];

  const handleCreateClick = (opt: any) => {
    if (opt.type === ModalType.None) {
      navigate(`/sales-purchase/${opt.link}`);
      return;
    }
    setPendingLink(opt.link);
    setModalType(
      opt.type === ModalType.Supplier ? ModalType.Supplier : ModalType.Buyer,
    );
  };

  const handleContinueSupplier = (supplierId: string) => {
    if (pendingLink)
      navigate(`/sales-purchase/${pendingLink}?supplier=${supplierId}`);
    setPendingLink(null);
    setModalType(null);
  };

  const handleContinueBuyer = (buyerId: string) => {
    if (pendingLink)
      navigate(`/sales-purchase/${pendingLink}?buyer=${buyerId}`);
    setPendingLink(null);
    setModalType(null);
  };

  function handleCloseModal(): void {
    setPendingLink(null);
    setModalType(null);
  }

  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-5">
          <div className="flex md:items-center flex-col md:flex-row gap-2 justify-between">
            <div className="w-full flex flex-col xl:flex-row gap-3">
              <div className="xl:flex grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 items-center md:gap-16">
                <div className="group relative max-w-32 md:max-w-44">
                  <Filter
                    columns={[table.getColumn("companyName")!].filter(Boolean)}
                    label="Company Name"
                  />
                </div>
                <div className="group relative max-w-32 md:max-w-44">
                  <Filter
                    columns={[table.getColumn("status")!].filter(Boolean)}
                    label="Status"
                  />
                </div>
                <div className="group relative max-w-32 md:max-w-44">
                  <Filter
                    columns={[table.getColumn("warehouse")!].filter(Boolean)}
                    label="Warehouse"
                  />
                </div>
                <div className="group relative sm:mt-3 md:mt-0 max-w-32 md:max-w-44">
                  <Filter
                    columns={[table.getColumn("createdBy")!].filter(Boolean)}
                    label="Created By"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 w-full">
                <div className="flex xl:justify-end xl:flex-1">
                  <div className="flex flex-col sm:flex-row gap-3 md:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="focus-visible:ring-0"
                            >
                              <Button className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                                <PlusIcon className="" />
                                Create Document
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="shadow-none"
                            >
                              <DropdownMenuGroup className="space-y-1">
                                {createDocumentOptions.map((option) => (
                                  <DropdownMenuItem
                                    key={option.link}
                                    onClick={() => handleCreateClick(option)}
                                    className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                                  >
                                    {option.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
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
            </TableHeader>
            {isLoading ? (
              <TableLoading columnLength={columns.length} />
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/20"
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
                        <h4 className="font-bold text-lg">No Item Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a document to get started and manage your
                          operations efficiently.
                        </p>
                        <div className="flex items-center gap-4">
                          <Button
                            className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
                            onClick={() => setModalType(ModalType.Supplier)}
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
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}

        {modalType === ModalType.Supplier && (
          <SelectSupplierModal
            isOpen
            onClose={handleCloseModal}
            onContinue={handleContinueSupplier}
          />
        )}
        {modalType === ModalType.Buyer && (
          <SelectBuyerModal
            isOpen
            onClose={handleCloseModal}
            onContinue={handleContinueBuyer}
          />
        )}
      </div>
    </div>
  );
};

type FilterProps = {
  columns: Column<any, unknown>[];
  label?: string;
};

export function Filter({ columns, label }: FilterProps) {
  const id = useId();
  const [filterValue, setFilterValue] = useState("");

  // Safety check for columns
  if (!columns || columns.length === 0 || !columns[0]) {
    return null;
  }

  const primaryColumn = columns[0];
  const columnHeader =
    typeof primaryColumn.columnDef.header === "string"
      ? primaryColumn.columnDef.header
      : "";
  const { filterVariant } = primaryColumn.columnDef.meta ?? {};

  const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return [];

    const uniqueValues = new Set<string>();

    columns.forEach((column) => {
      if (column && column.getFacetedUniqueValues) {
        const values = Array.from(column.getFacetedUniqueValues().keys());
        values.forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach((v) => uniqueValues.add(String(v)));
          } else {
            uniqueValues.add(String(value));
          }
        });
      }
    });

    return Array.from(uniqueValues).sort();
  }, [columns, filterVariant]);

  if (filterVariant === "range") {
    const primaryFilterValue = primaryColumn.getFilterValue() as
      | [number, number]
      | undefined;

    return (
      <div className="*:not-first:mt-2">
        <Label>{columnHeader}</Label>
        <div className="flex">
          <Input
            id={`${id}-range-1`}
            className="flex-1 rounded-e-none [-moz-appearance:_textfield] focus:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
            value={primaryFilterValue?.[0] ?? ""}
            onChange={(e) =>
              primaryColumn.setFilterValue((old: [number, number]) => [
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
            value={primaryFilterValue?.[1] ?? ""}
            onChange={(e) =>
              primaryColumn.setFilterValue((old: [number, number]) => [
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
      <div className="*:not-first:mt-2 group relative max-w-32">
        <Label
          htmlFor={`${id}-select`}
          className="absolute rounded-full text-neutral-400 font-normal bg-neutral-50 start-1 top-0 z-1 block -translate-y-1/2 px-2 text-xs"
        >
          {label || columnHeader}
        </Label>
        <Select
          value={filterValue || "all"}
          onValueChange={(value) => {
            setFilterValue(value === "all" ? "" : value);
            columns.forEach((column) => {
              if (column && column.setFilterValue) {
                column.setFilterValue(value === "all" ? undefined : value);
              }
            });
          }}
        >
          <SelectTrigger
            id={`${id}-select`}
            className="min-w-32 text-xs sm:text-sm md:min-w-44 focus-visible:ring-0 text-neutral-700 rounded-full shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-neutral-700 text-xs sm:text-sm">
            <SelectItem value="all" className="text-xs sm:text-sm">
              All
            </SelectItem>
            {sortedUniqueValues
              .filter((v) => v !== "")
              .map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-xs sm:text-sm"
                >
                  {value}
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
        <Input
          id={`${id}-input`}
          className={`${inputClasses} pe-9`}
          value={filterValue}
          onChange={(e) => {
            const val = e.target.value;
            setFilterValue(val);
            columns.forEach((column) => {
              if (column && column.setFilterValue) {
                column.setFilterValue(val);
              }
            });
          }}
          placeholder={`Search...`}
          type="text"
        />
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 pr-3"
          aria-label="Search"
        >
          <Search size={16} aria-hidden="true" className="text-neutral-500" />
        </button>
      </div>
    </div>
  );
}

export default SalesTable;
