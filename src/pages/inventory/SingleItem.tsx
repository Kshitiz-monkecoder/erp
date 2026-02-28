import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import EditInventoryItemModal from "@/components/app/modals/EditInventoryItemModal";
import UniversalTable from "@/components/app/tables";
import { Pencil, Loader2 } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import {
  itemAPI,
  ItemDetails,
  ItemHistoryRecord,
  ItemHistoryFilters,
} from "@/services/itemService";
import { get } from "@/lib/apiService";

type Tab = "Item Details" | "Item History";

// ─── History Filters State ────────────────────────────────────────────────────

interface HistoryFiltersState {
  storeIds: number[];
  conversion: number;
  page: number;
  itemsPerPage: number;
}

// ─── Store type (for dropdown) ────────────────────────────────────────────────

interface StoreOption {
  id: number;
  name: string;
}

const SingleItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("Item Details");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [itemdetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] = useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState<boolean>(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState<boolean>(false);

  // ── History state
  const [historyData, setHistoryData] = useState<ItemHistoryRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [historyFilters, setHistoryFilters] = useState<HistoryFiltersState>({
    storeIds: [],
    conversion: 1,
    page: 1,
    itemsPerPage: 20,
  });

  // ─── Fetch item details ───────────────────────────────────────────────────

  const getSingleItemDetails = useCallback(async () => {
    if (!id) return;
    try {
      const response = await itemAPI.getItem(id);
      if (!response) throw new Error("No response");
      setItemDetails(response.data);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  }, [id]);

  useEffect(() => {
    getSingleItemDetails();
  }, [getSingleItemDetails]);

  // ─── Fetch stores (warehouses) for dropdown ───────────────────────────────

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const result = await get("/inventory/warehouse");
        setStores(result.data ?? []);
      } catch (e) {
        console.error("Failed to fetch stores:", e);
      }
    };
    fetchStores();
  }, []);

  // ─── Fetch item history ───────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    if (!id || !itemdetails) return;
    setLoadingHistory(true);
    try {
      const payload = {
        filters: {
          product_id: Number(id),
          ...(historyFilters.storeIds.length > 0 && { store: historyFilters.storeIds }),
          conversion: historyFilters.conversion,
        } as ItemHistoryFilters,
        search: {},
        pagination: {
          page: historyFilters.page,
          items_per_page: historyFilters.itemsPerPage,
          sort_by: ["creation_date"],
          sort_desc: [true],
        },
      };
      const response = await itemAPI.getItemHistory(payload);
      if (response.status === 1) {
        setHistoryData(response.data.data ?? []);
        setHistoryTotal(response.data.total_length ?? 0);
      }
    } catch (error) {
      console.error("Error fetching item history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, itemdetails, historyFilters]);

  // Fetch history when tab becomes active or filters change
  useEffect(() => {
    if (activeTab === "Item History") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // ─── History columns ──────────────────────────────────────────────────────

  const stockMovementColumns: ColumnDef<ItemHistoryRecord>[] = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "creation_date",
        cell: ({ row }) => (
          <div className="font-normal text-xs">
            {moment(row.original.creation_date).format("DD/MM/YYYY HH:mm")}
          </div>
        ),
      },
      {
        header: "Item ID",
        accessorKey: "itemid",
        cell: ({ row }) => (
          <div className="font-normal text-xs font-mono text-gray-500">{row.original.itemid}</div>
        ),
      },
      {
        header: "Source",
        accessorKey: "source_object_type",
        cell: ({ row }) => (
          <div className="font-normal text-xs">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              row.original.source_object_type === "Manual Adjustment"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}>
              {row.original.source_object_type || "—"}
            </span>
          </div>
        ),
      },
      {
        header: "Document",
        accessorKey: "source_object_name",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-gray-600 max-w-28 truncate">
            {row.original.source_object_name || "—"}
          </div>
        ),
      },
      {
        header: "Store",
        accessorKey: "store",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-gray-600">{row.original.store || "—"}</div>
        ),
      },
      {
        header: "Prev Qty",
        accessorKey: "old_amount",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-right tabular-nums">{row.original.old_amount ?? "—"}</div>
        ),
      },
      {
        header: "Change",
        accessorKey: "change_amount",
        cell: ({ row }) => {
          const isIn = row.original.change_type === "1";
          return (
            <div className={`font-semibold text-xs text-right tabular-nums ${isIn ? "text-green-600" : "text-red-500"}`}>
              {row.original.change_amount}
            </div>
          );
        },
      },
      {
        header: "New Qty",
        accessorKey: "new_amount",
        cell: ({ row }) => (
          <div className="font-medium text-xs text-right tabular-nums">{row.original.new_amount ?? "—"}</div>
        ),
      },
      {
        header: "Txn Price",
        accessorKey: "transaction_price",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-right tabular-nums">
            {Number(row.original.transaction_price) > 0
              ? `₹${Number(row.original.transaction_price).toFixed(2)}`
              : "—"}
          </div>
        ),
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-gray-500">{row.original.created_by || "—"}</div>
        ),
      },
      {
        header: "Comment",
        accessorKey: "comment",
        cell: ({ row }) => (
          <div className="font-normal text-xs max-w-36 truncate text-gray-500" title={row.original.comment}>
            {row.original.comment || "—"}
          </div>
        ),
      },
    ],
    []
  );

  const tabs: Tab[] = ["Item Details", "Item History"];

  const totalPages = Math.ceil(historyTotal / historyFilters.itemsPerPage);

  return (
    <>
      {itemdetails ? (
        <div>
          {/* Header */}
          <div className="bg-gray-100 flex items-center justify-between gap-2 h-18 px-8 py-4">
            <div className="flex text-xs sm:text-sm items-center gap-2">
              <div className="rounded-full cursor-pointer shadow-none">{itemdetails?.name}</div>
              <div className="text-xs text-green-500 border border-green-200 bg-green-50 px-2 rounded-full">
                {itemdetails?.isProduct ? "Product" : "Service"}
              </div>
            </div>
            <div className="flex text-xs sm:text-sm items-center gap-2">
              Total Stock
              <div className="p-2 gap-3 bg-white border border-neutral-100 rounded-md flex items-center">
                <div>
                  {itemdetails?.currentStock || 0} {itemdetails?.unit?.name}
                </div>
                |
                <div>₹{(itemdetails?.defaultPrice || 0) * (itemdetails?.currentStock || 0)}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 border-b border-neutral-200 bg-white flex items-center gap-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#7047EB] text-[#7047EB]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "Item Details" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {tab === "Item History" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {tab}
              </button>
            ))}
          </div>

          {/* ── Item Details Tab ───────────────────────────────────────────── */}
          {activeTab === "Item Details" && (
            <div className="grid md:grid-cols-5 gap-5 px-8 pb-10">
              <div className="p-4 md:col-span-5">
                <div className="bg-neutral-100 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                  <div>PRIMARY ITEM DETAILS</div>
                  <div
                    className="text-[#7047EB] flex items-center gap-2 underline underline-offset-2 text-xs cursor-pointer"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Pencil className="w-3" />
                    Edit Details
                  </div>
                </div>
                <div className="mt-4 font-medium text-xs md:text-sm space-y-4">
                  <h4>Basic item Details</h4>
                  <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-5">
                    <div><div>Item Id:</div><div className="font-light">{itemdetails?.id}</div></div>
                    <div><div>Item Name:</div><div className="font-light">{itemdetails?.name}</div></div>
                    <div><div>Type:</div><div className="font-light">{itemdetails?.type}</div></div>
                    <div><div>Item Category:</div><div className="font-light">{itemdetails?.category?.name}</div></div>
                    <div><div>Base Unit:</div><div className="font-light">{itemdetails?.unit?.name}</div></div>
                    <div><div>Tax:</div><div className="font-light">{itemdetails?.tax?.name}</div></div>
                    <div><div>Hsn Code:</div><div className="font-light">{itemdetails?.hsnCode}</div></div>
                  </div>
                </div>
                <div className="mt-6 font-medium text-xs md:text-sm space-y-4">
                  <h4>Item Prices</h4>
                  <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-5">
                    <div><div>Default Price:</div><div className="font-light">₹{itemdetails?.defaultPrice}</div></div>
                    <div><div>Regular Buying Price:</div><div className="font-light">₹{itemdetails?.regularBuyingPrice}</div></div>
                    <div><div>Wholesale Buying Price:</div><div className="font-light">₹{itemdetails?.wholesaleBuyingPrice}</div></div>
                    <div><div>Regular Selling Price:</div><div className="font-light">₹{itemdetails?.regularSellingPrice}</div></div>
                    <div><div>MRP:</div><div className="font-light">₹{itemdetails?.mrp}</div></div>
                    <div><div>Dealer Price:</div><div className="font-light">₹{itemdetails?.dealerPrice}</div></div>
                    <div><div>Distributor Price:</div><div className="font-light">₹{itemdetails?.distributorPrice}</div></div>
                    <div>
                      <div>Weighted Avg. Price:</div>
                      <div className="font-light">
                        {Number(itemdetails?.weightedAveragePrice) > 0
                          ? `₹${Number(itemdetails?.weightedAveragePrice).toFixed(2)}`
                          : "₹0.00"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                  <div>STOCK IN ALL UNITS</div>
                </div>
                <div className="mt-4 px-4 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="font-medium text-xs md:text-sm">Base Unit</div>
                    <div className="text-xs">{itemdetails?.unit?.name || "Kg"}</div>
                  </div>
                  <div className="border flex items-center gap-2 text-xs border-neutral-200 rounded-md px-2 py-1">
                    <div className="flex items-center gap-2 pr-2 border-r">
                      <div>Stock:</div>
                      <div className="font-medium text-xs md:text-sm">
                        {itemdetails?.currentStock || 0} {itemdetails?.unit?.name}
                      </div>
                    </div>
                    <div className="border-r" />
                    <div className="flex items-center gap-2">
                      <div>Price Per Unit:</div>
                      <div className="font-medium text-xs md:text-sm">₹{itemdetails?.defaultPrice || 0}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                  <div>MIN/MAX STOCK LEVELS</div>
                </div>
                <div className="px-4 text-xs md:text-sm mt-6 grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <div className="font-medium text-xs md:text-sm">Minimum Stock Level:</div>
                    <div className="font-light">{itemdetails?.minimumStockLevel || 0} {itemdetails?.unit?.name}</div>
                  </div>
                  <div>
                    <div>Maximum Stock Level:</div>
                    <div className="font-light">{itemdetails?.maximumStockLevel || 0} {itemdetails?.unit?.name}</div>
                  </div>
                  <div>
                    <div>Total Stock:</div>
                    <div className="font-light">{itemdetails?.currentStock || 0} {itemdetails?.unit?.name}</div>
                  </div>
                </div>

                {/* ── Vendor Lead Times ─────────────────────────────── */}
                {(itemdetails as any)?.vendorLeadTimes?.length > 0 && (
                  <>
                    <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                      <div>VENDOR LEAD TIMES</div>
                    </div>
                    <div className="mt-4 px-4 space-y-3">
                      {(itemdetails as any).vendorLeadTimes.map((vlt: any) => (
                        <div
                          key={vlt.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#7047EB]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-[#7047EB]">
                                {vlt.vendor?.name?.charAt(0)?.toUpperCase() || "V"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {vlt.vendor?.name}
                                {vlt.isDefault && (
                                  <span className="ml-2 text-xs text-[#7047EB] bg-[#7047EB]/10 px-1.5 py-0.5 rounded-full font-normal">Default</span>
                                )}
                              </div>
                              {vlt.vendor?.companyName && (
                                <div className="text-xs text-gray-400 truncate">{vlt.vendor.companyName}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-400">Lead Time: </span>
                              <span className="font-semibold text-gray-800">{vlt.leadTimeDays} days</span>
                            </div>
                            {vlt.lastDeliveryDate && (
                              <div>
                                <span className="text-gray-400">Last Delivery: </span>
                                <span className="font-medium">{vlt.lastDeliveryDate}</span>
                              </div>
                            )}
                            {vlt.vendor?.phoneNo && (
                              <div>
                                <span className="text-gray-400">Phone: </span>
                                <span className="font-medium">{vlt.vendor.phoneNo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Item History Tab ───────────────────────────────────────────── */}
          {activeTab === "Item History" && (
            <div className="px-8 pb-10">
              <div className="p-4">

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 mb-4 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {/* Store filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Store</label>
                    <select
                      className="border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-gray-700 bg-white min-w-36"
                      value={historyFilters.storeIds[0] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHistoryFilters((prev) => ({
                          ...prev,
                          page: 1,
                          storeIds: val ? [Number(val)] : [],
                        }));
                      }}
                    >
                      <option value="">All Stores</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* UoM / Conversion filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500 whitespace-nowrap">UoM</label>
                    <select
                      className="border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-gray-700 bg-white"
                      value={historyFilters.conversion}
                      onChange={(e) =>
                        setHistoryFilters((prev) => ({
                          ...prev,
                          page: 1,
                          conversion: Number(e.target.value),
                        }))
                      }
                    >
                      <option value={1}>{itemdetails?.unit?.name || "Base Unit"}</option>
                    </select>
                  </div>

                  {/* Items per page */}
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Per page</label>
                    <select
                      className="border border-neutral-200 rounded-md px-3 py-1.5 text-xs text-gray-700 bg-white"
                      value={historyFilters.itemsPerPage}
                      onChange={(e) =>
                        setHistoryFilters((prev) => ({
                          ...prev,
                          page: 1,
                          itemsPerPage: Number(e.target.value),
                        }))
                      }
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loading indicator */}
                  {loadingHistory && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#7047EB]/50" />
                  )}
                </div>

                {/* Summary strip */}
                {!loadingHistory && historyData.length > 0 && (
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                    <span>Showing <span className="font-semibold text-gray-700">{historyData.length}</span> of <span className="font-semibold text-gray-700">{historyTotal}</span> records</span>
                  </div>
                )}

                <UniversalTable
                  data={historyData}
                  columns={stockMovementColumns}
                  isLoading={loadingHistory}
                  enablePagination={false}
                  enableFiltering={false}
                />

                {/* Manual pagination */}
                {historyTotal > historyFilters.itemsPerPage && (
                  <div className="flex justify-center items-center gap-3 mt-4">
                    <button
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={historyFilters.page <= 1}
                      onClick={() => setHistoryFilters((p) => ({ ...p, page: p.page - 1 }))}
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page <span className="font-semibold">{historyFilters.page}</span> of <span className="font-semibold">{totalPages}</span>
                    </span>
                    <button
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={historyFilters.page >= totalPages}
                      onClick={() => setHistoryFilters((p) => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      ) : (
        ""
      )}

      {isEditModalOpen && (
        <EditInventoryItemModal
          isAnyModalOpen={showAddCategoriesModal || showAddUnitOfMeasurementModal || showAddWarehouseModal}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={itemdetails as any}
          showAddUnitOfMeasurementModal={() => setShowAddUnitOfMeasurementModal(true)}
          showAddWarehouseModal={() => setShowAddWarehouseModal(true)}
          showShowCategoriesModal={() => setShowAddCategoriesModal(true)}
        />
      )}

      {showAddUnitOfMeasurementModal && (
        <AddUnitOfMeasurementModal
          isOpen={showAddUnitOfMeasurementModal}
          onClose={() => setShowAddUnitOfMeasurementModal(false)}
        />
      )}

      {showAddWarehouseModal && (
        <AddWarehouseModal
          isOpen={showAddWarehouseModal}
          onClose={() => setShowAddWarehouseModal(false)}
        />
      )}

      {showAddCategoriesModal && (
        <AddCategoriesModal
          isOpen={showAddCategoriesModal}
          onClose={() => setShowAddCategoriesModal(false)}
        />
      )}
    </>
  );
};

export default SingleItem;