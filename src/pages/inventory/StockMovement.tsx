import UniversalTable from "@/components/app/tables";
import React, { useEffect, useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, CheckCircle, PauseCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectFilter, { OptionType } from "@/components/app/SelectFilter";
import MultiSelectWithSearch from "@/components/app/MultiSelectWithSearch";
import CreateStockTransferModal from "@/components/app/modals/CreateStockTransferModal";
import { stockTransferAPI } from "@/services/stockTransferService";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";

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
  [key: string]: any;
};

type ActionType = "approve" | "reject" | "hold";

const movementTypeOptions: OptionType[] = [
  { label: "All", value: "All" },
  { label: "Manual", value: "Manual" },
  { label: "Adjustment", value: "Adjustment" },
  { label: "Stock Transfer", value: "Stock Transfer" },
  { label: "Physical Stock Reconciliation", value: "Physical Stock Reconciliation" },
];

const statusOptions: OptionType[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const StockMovement: React.FC = () => {
  const [stockMovementData, setStockMovementData] = React.useState<StockMovementItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showCreateStockTransferModal, setShowCreateStockTransferModal] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const toggleCreateStockTransferModal = () => setShowCreateStockTransferModal((prev) => !prev);
  const navigateTo = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  useEffect(() => {
    fetchStockMovements();
  }, [showCreateStockTransferModal]);

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const response = await stockTransferAPI.getAll();
      if (!response) throw new Error("Empty response");

      const mappedItems = response.data.map((item: any) => {
        const { id, fromWarehouse, toWarehouse, quantity, createdAt, createdBy, movementType, approvedBy, status, ...rest } = item;
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

  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return stockMovementData;
    return stockMovementData.filter((item) => {
      const itemDate = new Date(item.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return itemDate >= start && itemDate < end;
    });
  }, [stockMovementData, startDate, endDate]);

  // ── Action handler ───────────────────────────────────────────────────────────
  const handleAction = async (id: string, action: ActionType) => {
    try {
      setActionLoadingId(`${id}-${action}`);
      let result;
      if (action === "approve") result = await stockTransferAPI.approve(id);
      else if (action === "hold")    result = await stockTransferAPI.hold(id);
      else                           result = await stockTransferAPI.reject(id);

      if (result?.status) {
        SuccessToast({
          title: "Success",
          description: `Transfer ${action === "approve" ? "approved" : action === "hold" ? "put on hold" : "rejected"} successfully`,
        });
        await fetchStockMovements();
      } else {
        ErrorToast({ title: "Action Failed", description: result?.message || `Failed to ${action} transfer` });
      }
    } catch (err: any) {
      ErrorToast({ title: "Error", description: err?.message || `Failed to ${action} transfer` });
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns: ColumnDef<StockMovementItem>[] = [
    {
      header: "Document Number",
      accessorKey: "documentNumber",
      cell: ({ row }) => (
        <div
          onClick={() => {
            localStorage.setItem("selectedStockMovement", JSON.stringify(row.original));
            navigateTo(`/inventory/manual-adjustment`);
          }}
          className="font-normal text-blue-500 gap-2 min-w-32 flex items-center cursor-pointer"
        >
          {row.original.documentNumber}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: { filterVariant: "select" },
    },
    {
      header: "From Store",
      accessorKey: "fromStore",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.fromStore}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "To Store",
      accessorKey: "toStore",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.toStore}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Number of Items",
      accessorKey: "numberOfItems",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.numberOfItems}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.date}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "User",
      accessorKey: "user",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.user}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Movement Type",
      accessorKey: "movementType",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.movementType}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isApproved = status === "APPROVED";
        const isRejected = status === "REJECTED";
        const baseClasses = "font-normal px-3 py-1 truncate text-xs w-fit rounded-full";
        const statusClasses = isApproved
          ? "text-green-600 bg-green-100"
          : isRejected
          ? "text-red-600 bg-red-100"
          : "text-yellow-600 bg-yellow-100";
        return <div className={`${baseClasses} ${statusClasses}`}>{String(status)}</div>;
      },
      meta: { filterVariant: "select" },
    },
    {
      header: "Actions",
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const id = String(row.original.documentNumber);
        const status = row.original.status;
        const isPending = status === "PENDING" || status === "ON_HOLD";

        const ActionBtn: React.FC<{
          action: ActionType;
          icon: React.ReactNode;
          label: string;
          colorClass: string;
        }> = ({ action, icon, label, colorClass }) => {
          const key = `${id}-${action}`;
          const busy = actionLoadingId === key;
          return (
            <button
              title={label}
              disabled={!!actionLoadingId}
              onClick={() => handleAction(id, action)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                ${colorClass} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        };

        return (
          <div className="flex items-center gap-1.5 min-w-[200px]">
            {/* Edit — always visible */}
            <button
              title="Edit"
              disabled={!!actionLoadingId}
              onClick={() => {
                localStorage.setItem("selectedStockMovement", JSON.stringify(row.original));
                navigateTo(`/inventory/manual-adjustment`);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Approve — only when pending/on hold */}
            {isPending && (
              <ActionBtn
                action="approve"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                label="Approve"
                colorClass="text-green-700 bg-green-100 hover:bg-green-200"
              />
            )}

            {/* Hold — only when pending */}
            {status === "PENDING" && (
              <ActionBtn
                action="hold"
                icon={<PauseCircle className="w-3.5 h-3.5" />}
                label="Hold"
                colorClass="text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
              />
            )}

            {/* Reject — only when pending/on hold */}
            {isPending && (
              <ActionBtn
                action="reject"
                icon={<XCircle className="w-3.5 h-3.5" />}
                label="Reject"
                colorClass="text-red-700 bg-red-100 hover:bg-red-200"
              />
            )}
          </div>
        );
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
            <MultiSelectWithSearch columns={table.getAllColumns()} label="Show/Hide Columns" />
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