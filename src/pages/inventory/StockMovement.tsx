import UniversalTable from "@/components/app/tables";
import React, { useEffect, useState, useMemo } from "react";
import { get } from "@/lib/apiService";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectFilter, { OptionType } from "@/components/app/SelectFilter";
import MultiSelectWithSearch from "@/components/app/MultiSelectWithSearch";
import CreateStockTransferModal from "@/components/app/modals/CreateStockTransferModal";

// Types for stock movement data
type StockMovementItem = {
  documentNumber: string;
  fromStore: string;
  toStore: string;
  numberOfItems: string;
  date: string;
  user: string;
  movementType: string;
  status: string;
  approvedBy?: string;
  [key: string]: any; // For additional properties from API
};

const movementTypeOptions: OptionType[] = [
  { label: "All", value: "All" },
  { label: "Manual", value: "Manual" },
  { label: "Adjustment", value: "Adjustment" },
  { label: "Stock Transfer", value: "Stock Transfer" },
  {
    label: "Physical Stock Reconciliation",
    value: "Physical Stock Reconciliation",
  },
];

const statusOptions: OptionType[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const StockMovement: React.FC = () => {
  const [stockMovementData, setStockMovementData] = React.useState<Array<StockMovementItem>>(
    new Array<StockMovementItem>()
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showCreateStockTransferModal, setShowCreateStockTransferModal] =
    useState<boolean>(false);

  const toggleCreateStockTransferModal = () =>
    setShowCreateStockTransferModal((prev) => !prev);

  const navigateTo = useNavigate();

  // Get date filters from URL params
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  useEffect(() => {
    fetchStockMovements();
  }, [showCreateStockTransferModal]);

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const response = await get("/inventory/transfer");
      if (!response) {
        throw new Error(`Error: ${response} ${response}`);
      }
      
      // Map the API response to match our component structure
      const mappedItems = response.data.map((item: any) => {
        const {
          id,
          fromWarehouse,
          toWarehouse,
          quantity,
          createdAt,
          createdBy,
          movementType,
          approvedBy,
          status,
          ...rest
        } = item;
        return {
          documentNumber: id,
          fromStore: fromWarehouse?.name ?? "",
          toStore: toWarehouse?.name ?? "",
          numberOfItems: quantity?.toString() ?? "",
          date: createdAt ? createdAt.slice(0, 10) : "",
          user: createdBy?.name ?? "",
          movementType: movementType ?? "",
          status: status,
          approvedBy: approvedBy?.name,
          ...rest,
        };
      });
      
      setStockMovementData(mappedItems);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!startDate || !endDate) {
      return stockMovementData;
    }

    return stockMovementData.filter((item) => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Add one day to end date to include the end date in results
      end.setDate(end.getDate() + 1);
      
      return itemDate >= start && itemDate < end;
    });
  }, [stockMovementData, startDate, endDate]);

  const columns: ColumnDef<StockMovementItem>[] = [
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <div
          onClick={() => {
            localStorage.setItem(
              "selectedStockMovement",
              JSON.stringify(row.original),
            );
            navigateTo(`/inventory/manual-adjustment`);
          }}
          className="font-normal text-blue-500 gap-2 min-w-32 flex items-center cursor-pointer"
        >
          {row.original.documentNumber}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "From Store",
      accessorKey: "fromStore",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.fromStore}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "To Store",
      accessorKey: "toStore",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.toStore}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Number of Items",
      accessorKey: "numberOfItems",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.numberOfItems}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.date}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "User",
      accessorKey: "user",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.user}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Movement Type",
      accessorKey: "movementType",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.original.movementType}</div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isApproved = status === "APPROVED";
        const isRejected = status === "REJECTED";

        const baseClasses =
          "font-normal px-3 py-1 truncate text-xs w-fit rounded-full";

        const statusClasses = isApproved
          ? "text-green-600 bg-green-100"
          : isRejected
            ? "text-red-600 bg-red-100"
            : "text-yellow-600 bg-yellow-100"; // For PENDING or other

        return (
          <div className={`${baseClasses} ${statusClasses}`}>
            {String(status)}
          </div>
        );
      },
      meta: {
        filterVariant: "select",
      },
    },
  ];

  return (
    <>
      <UniversalTable<StockMovementItem>
        data={filteredData}
        columns={columns}
        isLoading={loading}
        enableCreate={true}
        createButtonText="Create Document"
        onCreateClick={toggleCreateStockTransferModal}
        customFilterSection={(table) => (
          <>
            <SelectFilter
              label="Movement Type"
              items={movementTypeOptions}
              onValueChange={(value) => {
                table.getColumn("movementType")?.setFilterValue(value === "All" ? "" : value);
              }}
            />
            <SelectFilter
              label="Status"
              items={statusOptions}
              onValueChange={(value) => {
                table.getColumn("status")?.setFilterValue(value === "All" ? "" : value);
              }}
            />
            <MultiSelectWithSearch
              columns={table.getAllColumns()}
              label="Show/Hide Columns"
            />
          </>
        )}
      />

      <CreateStockTransferModal
        isOpen={showCreateStockTransferModal}
        onClose={toggleCreateStockTransferModal}
      />
    </>
  );
};

export default StockMovement;