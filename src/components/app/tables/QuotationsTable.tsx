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
  // SortingState,
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
// import { useNavigate } from "react-router";
// import { Link } from "react-router";

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// TODO: change the types here according to values
type Item = {
  quotationNumber: string;
  companyName: string;
  enquiryNumber: string;
  totalAmount: string;
  ocCreated: string;
  dealStatus: string;
  dealOwner: string;
};

const columns: ColumnDef<Item>[] = [
  {
    header: "Quotation Number",
    accessorKey: "quotationNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 flex items-center gap-4">
        {row.getValue("quotationNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    header: "Company Name",
    accessorKey: "companyName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-[#7047EB]">
        {row.getValue("companyName")}
      </div>
    ),
  },
  {
    header: "Enquiry Number",
    accessorKey: "enquiryNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 truncate flex text-[#7047EB] items-center gap-4">
        {row.getValue("enquiryNumber")}
        <ArrowUpRight className="text-[#8A8AA3] w-5" />
      </div>
    ),
  },
  {
    header: "Total Amount",
    accessorKey: "totalAmount",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("totalAmount")}</div>
    ),
  },
  {
    header: "OC Created",
    accessorKey: "ocCreated",
    cell: ({ row }) => (
      // Change this according to slug values
      <div className="font-normal min-w-32">{row.getValue("ocCreated")}</div>
    ),
  },
  {
    header: "Deal Status",
    accessorKey: "dealStatus",
    cell: ({ row }) => (
      <div className="font-normal text-xs px-3 py-1 rounded-full text-[#8A6100] bg-[#FFF9EB] w-fit">
        {row.getValue("dealStatus")}
      </div>
    ),
  },
  {
    header: "Deal Owner",
    accessorKey: "dealOwner",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("dealOwner")}</div>
    ),
  },
];

// const items: Item[] = [
// {
//   quotationNumber: "SEQ001",
//   companyName: "Jindal Cements",
//   enquiryNumber: "--",
//   totalAmount: "₹52,500.00",
//   ocCreated: "--",
//   dealStatus: "Pending",
//   dealOwner: "Rahul Singh",
// },
// {
//   quotationNumber: "SEQ001",
//   companyName: "Jindal Cements",
//   enquiryNumber: "--",
//   totalAmount: "₹52,500.00",
//   ocCreated: "--",
//   dealStatus: "Pending",
//   dealOwner: "Rahul Singh",
// },
// ];

import SelectSupplierModal from "../modals/SelectSupplierModal";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";
import { get } from "../../../lib/apiService";
const QuotationsTable: React.FC = () => {
  const navigate = useNavigate();

  const handleContinueSupplier = () => {
    navigate(`/sales-purchase/purchase-quotation`);
  };

  function handleCloseModal(): void {
    setIsModalOpen(false);
  }

  // const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setIsLoading(true);
        // const response = await fetch(
        //   `${import.meta.env.VITE_BASE_URL}/inventory/purchase-quotation`,
        //   {
        //     method: "GET",
        //     headers: {
        //       "Content-Type": "application/json",
        //       Authorization: `${localStorage.getItem("token")}`,
        //     },
        //   },
        // );
        // if (!response.ok) {
        //   throw new Error("Failed to fetch quotations");
        // }
        const data = await get("/inventory/purchase-quotation");
        setItems(
          (data?.data || []).map((item: any) => ({
            quotationNumber: item.documentNumber,
            companyName: item.supplier?.companyName || "",
            enquiryNumber: item.enquiryNumber,
            totalAmount: item.totalAmount,
            ocCreated: item.ocDetails,
            dealStatus: item.status,
            dealOwner: item.supplier.name,
          })),
        );
      } catch (error) {
        console.error("Error fetching quotations:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotations();
  }, []);
  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with category filtering
    let filtered;

    // Then apply date filtering if both dates are present
    // if (startDate && endDate) {
    //   filtered = items.filter((item) => {
    //     const itemDate = new Date(item.lastModified);
    //     const start = new Date(startDate);
    //     const end = new Date(endDate);

    //     // Add one day to end date to include the end date in results
    //     end.setDate(end.getDate() + 1);

    //     // Check if item date is between start and end dates
    //     return itemDate >= start && itemDate < end;
    //   });
    // }

    return filtered;
  }, [startDate, endDate]);

  const table = useReactTable({
    data: filteredItems ?? items,
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
                <FilterInput column={table.getColumn("companyName")!} />
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
export default QuotationsTable;
