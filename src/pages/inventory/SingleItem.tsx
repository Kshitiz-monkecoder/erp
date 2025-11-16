import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import EditInventoryItemModal from "@/components/app/modals/EditInventoryItemModal";
import UniversalTable from "@/components/app/tables";
import { get } from "@/lib/apiService";
import { Pencil } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";

// Types for stock movement data

type StockMovementData = {
  id: number;
  transactionType: "IN" | "OUT";
  quantity: string;
  purchasePrice: string;
  sellingPrice: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

const SingleItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // const [selectedNavigationTab, setSelectedNavigationTab] =
  //   useState<string>("Items Details");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [itemdetails, setItemDetails] = useState<any>(null);
  const [stockMovementData, setStockMovementData] = useState<
    StockMovementData[]
  >([]);
  const [loadingStockData] = useState<boolean>(false);
  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] =
    useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] =
    useState<boolean>(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] =
    useState<boolean>(false);

  useEffect(() => {
    getSingleItemDetails();
  }, []);

  const getSingleItemDetails = async () => {
    try {
      const response = await get(`/inventory/item/${id}`);
      if (!response) {
        throw new Error(`Error: ${response} ${response}`);
      }
      setItemDetails(response.data);
      console.log("response.data.stockData", response.data.stockData)
      setStockMovementData(response.data.stockData || []);
    } catch (error) {
      console.error("Error fetching item details:", error);
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  const handleShowAddUnitOfMeasurementModal = () => {
    setShowAddUnitOfMeasurementModal(true);
  };

  const handleCloseAddUnitOfMeasurementModal = () => {
    setShowAddUnitOfMeasurementModal(false);
  };

  const handleShowAddWarehouseModal = () => {
    setShowAddWarehouseModal(true);
  };

  const handleCloseAddWarehouseModal = () => {
    setShowAddWarehouseModal(false);
  };

  const handleShowAddCategoriesModal = () => {
    setShowAddCategoriesModal(true);
  };

  const handleCloseAddCategoriesModal = () => {
    setShowAddCategoriesModal(false);
  };

  // Define columns for stock movement table
  const stockMovementColumns: ColumnDef<StockMovementData>[] = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => (
          <div className="font-normal text-xs">{moment(row.original.createdAt).format("YYYY-MM-DD hh:mm A")}</div>
        ),
      },
      {
        header: "Change Quantity",
        accessorKey: "changeQuantity",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-right">
            {row.original.transactionType === "IN" ? "+" : "-"}
            {row.original.quantity}
          </div>
        ),
      },
      {
        header: "Price",
        accessorKey: "price",
        cell: ({ row }) => (
          <div className="font-normal text-xs text-right">
            ₹{Number(row.original.purchasePrice).toFixed(2)}
          </div>
        ),
      },
      {
        header: "Comment",
        accessorKey: "comment",
        cell: ({ row }) => (
          <div className="font-normal text-xs max-w-32 truncate">
            {row.original.remarks || "-"}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      {itemdetails ? (
        <div>
          <div className="bg-gray-100 flex items-center justify-between gap-2 h-18 px-8 py-4">
            <div className="flex text-xs sm:text-sm items-center gap-2">
              <div className="rounded-full cursor-pointer shadow-none">
                {itemdetails?.name}
              </div>
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
                <div>
                  ₹
                  {(itemdetails?.defaultPrice || 0) *
                    (itemdetails?.currentStock || 0)}
                </div>
              </div>
              {/* <EllipsisVertical className="w-5 h-5 cursor-pointer" /> */}
            </div>
          </div>
          <div className="grid md:grid-cols-5 gap-5 px-8 pb-10">
            <div className="p-4 md:col-span-5">
              <div className="bg-neutral-100 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                <div>PRIMARY ITEM DETAILS</div>
                <div
                  className="text-[#7047EB] flex items-center gap-2 underline underline-offset-2 text-xs cursor-pointer"
                  onClick={handleEditClick}
                >
                  <Pencil className="w-3" />
                  Edit Details
                </div>
              </div>
              <div className="mt-4 font-medium text-xs md:text-sm space-y-4">
                <h4>Basic item Details</h4>
                <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <div>Item Id:</div>
                    <div className="font-light">{itemdetails?.id}</div>
                  </div>
                  <div>
                    <div>Item Name:</div>
                    <div className="font-light">{itemdetails?.name}</div>
                  </div>
                  <div>
                    <div>Type:</div>
                    <div className="font-light">{itemdetails?.type}</div>
                  </div>
                  <div>
                    <div>Item Category:</div>
                    <div className="font-light">
                      {itemdetails?.category?.name}
                    </div>
                  </div>
                  <div>
                    <div>Base Unit:</div>
                    <div className="font-light">{itemdetails?.unit?.name}</div>
                  </div>
                  <div>
                    <div>Tax:</div>
                    <div className="font-light">{itemdetails?.tax?.name}</div>
                  </div>
                  <div>
                    <div>Hsn Code:</div>
                    <div className="font-light">{itemdetails?.hsnCode}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 font-medium text-xs md:text-sm space-y-4">
                <h4>Item Prices</h4>
                <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <div>Default Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.defaultPrice}
                    </div>
                  </div>
                  <div>
                    <div>Regular Buying Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.regularBuyingPrice}
                    </div>
                  </div>
                  <div>
                    <div>Wholesale Buying Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.wholesaleBuyingPrice}
                    </div>
                  </div>
                  <div>
                    <div>Regular Selling Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.regularSellingPrice}
                    </div>
                  </div>
                  <div>
                    <div>MRP:</div>
                    <div className="font-light">₹{itemdetails?.mrp}</div>
                  </div>
                  <div>
                    <div>Dealer Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.dealerPrice}
                    </div>
                  </div>
                  <div>
                    <div>Distributor Price:</div>
                    <div className="font-light">
                      ₹{itemdetails?.distributorPrice}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                <div>STOCK IN ALL UNITS</div>
                {/* <div className="text-[#7047EB] flex items-center gap-2 underline underline-offset-2 text-xs cursor-pointer">
                  <Pencil className="w-3" />
                  Edit Details
                </div> */}
              </div>
              <div className="mt-4 px-4 flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-xs md:text-sm">
                    Base Unit
                  </div>
                  <div className="text-xs">
                    {itemdetails?.unit?.name || "Kg"}
                  </div>
                </div>
                <div className="border flex items-center gap-2 text-xs border-neutral-200 rounded-md px-2 py-1 ">
                  <div className="flex items-center gap-2 pr-2 border-r">
                    <div>Stock:</div>
                    <div className="font-medium text-xs md:text-sm ">
                      {itemdetails?.currentStock || 0} {itemdetails?.unit?.name}
                    </div>
                  </div>
                  <div className="border-r" />
                  <div className="flex items-center gap-2">
                    <div>Price Per Unit:</div>
                    <div className="font-medium text-xs md:text-sm">
                      ₹{itemdetails?.defaultPrice || 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                <div>MIN/MAX STOCK LEVELS</div>
                {/* <div className="text-[#7047EB] flex items-center gap-2 underline underline-offset-2 text-xs cursor-pointer">
                  <Pencil className="w-3" />
                  Edit Details
                </div> */}
              </div>
              <div className="px-4 text-xs md:text-sm mt-6 grid grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <div className="font-medium text-xs md:text-sm">
                    Minimum Stock Level:
                  </div>
                  <div className="font-light">
                    {itemdetails?.minimumStockLevel || 0}{" "}
                    {itemdetails?.unit?.name}
                  </div>
                </div>
                <div>
                  <div>Maximum Stock Level:</div>
                  <div className="font-light">
                    {itemdetails?.maximumStockLevel || 0}{" "}
                    {itemdetails?.unit?.name}
                  </div>
                </div>
                <div>
                  <div>Total Stock:</div>
                  <div className="font-light">
                    {itemdetails?.currentStock || 0} {itemdetails?.unit?.name}
                  </div>
                </div>
              </div>

              {/* Stock Movement Table */}
              <div className="bg-neutral-100 mt-6 px-3 py-1 text-[#8A8AA3] w-full flex justify-between items-center">
                <div>STOCK MOVEMENT HISTORY</div>
              </div>
              <div className="mt-4">
                <UniversalTable
                  data={stockMovementData}
                  columns={stockMovementColumns}
                  isLoading={loadingStockData}
                  enablePagination={true}
                  initialPageSize={10}
                  enableFiltering={false}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditInventoryItemModal
          isAnyModalOpen={
            showAddCategoriesModal ||
            showAddUnitOfMeasurementModal ||
            showAddWarehouseModal
          }
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          item={itemdetails}
          showAddUnitOfMeasurementModal={handleShowAddUnitOfMeasurementModal}
          showAddWarehouseModal={handleShowAddWarehouseModal}
          showShowCategoriesModal={handleShowAddCategoriesModal}
        />
      )}

      {/* Add Unit of Measurement Modal */}
      {showAddUnitOfMeasurementModal && (
        <AddUnitOfMeasurementModal
          isOpen={showAddUnitOfMeasurementModal}
          onClose={handleCloseAddUnitOfMeasurementModal}
        />
      )}

      {/* Add Warehouse Modal */}
      {showAddWarehouseModal && (
        <AddWarehouseModal
          isOpen={showAddWarehouseModal}
          onClose={handleCloseAddWarehouseModal}
        />
      )}

      {/* Add Categories Modal */}
      {showAddCategoriesModal && (
        <AddCategoriesModal
          isOpen={showAddCategoriesModal}
          onClose={handleCloseAddCategoriesModal}
        />
      )}
    </>
  );
};

export default SingleItem;
