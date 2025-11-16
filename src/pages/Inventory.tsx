import AddInventoryItemModal from "@/components/app/modals/AddInventoryItemModal";
import BarcodeTable from "@/components/app/tables/BarcodeTable";
import ItemApprovalTable from "@/components/app/tables/ItemApprovalTable";
import ItemMasterTable from "@/components/app/tables/ItemMasterTable";
import StockMovementTable from "@/components/app/tables/StockMovementTable";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { InventorySubLinks } from "@/lib/subnavLinks";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import EditInventoryItemModal from "@/components/app/modals/EditInventoryItemModal";
import CategoriesMasterTable from "@/components/app/tables/CategoriesMasterTable";
import DeleteCategoryModal from "@/components/app/modals/DeleteCategoryModal";
import EditCategoriesModal from "@/components/app/modals/EditCategoriesModal";
import WarehouseMasterTable from "@/components/app/tables/WarehouseMasterTable";
import EditWarehouseModal from "@/components/app/modals/EditWarehouseModal";
import {get} from "@/lib/apiService";
export type categoryType = {
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

type warehouseType = {
  id: number;
  name: string;
  location: string;
  description?: string;
  address?: string;
  capacity?: number;
  manager?: string;
  createdAt: string;
  updatedAt: string;
};

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

const Inventory: React.FC = () => {
  const location = useLocation();
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab"); // extracting tab value here to highlight current nested value

  const [showAddInventoryItemModal, setShowAddInventoryItemModal] =
    useState<boolean>(false);
  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] =
    useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] =
    useState<boolean>(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] =
    useState<boolean>(false);
  const [showEditCategoriesModal, setShowEditCategoriesModal] =
    useState<boolean>(false);
  const [showEditWarehouseModal, setShowEditWarehouseModal] =
    useState<boolean>(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] =
    useState<boolean>(false);
  
  const [rawItemMasterTableData, setRawItemMasterTableData] = useState<
    rawItemMasterTableDataType[]
  >([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<rawItemMasterTableDataType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<categoryType | null>(
    null
  );

  const [selectedWarehouse, setSelectedWarehouse] = useState<warehouseType | null>(null);
  
  // New loading state for items (avoid generic "isLoading")
  const [itemsLoading, setItemsLoading] = useState<boolean>(true);

  const [maxID, setMaxID] = useState<number>(0);
  const [refreshCategoriesTrigger, setRefreshCategoriesTrigger] =
    useState<number>(0);
  const [refreshWarehouseTrigger, setRefreshWarehouseTrigger] =
    useState<number>(0);

  // by default set this inventory tab to item-master if no searchParam is provided
  useEffect(() => {
    if (searchParams.size === 0) {
      navigateTo("/inventory?tab=item-master");
    }
  }, [searchParams]);

  const fetchTableData = async () => {
    try {
      setItemsLoading(true);
      const response = await get<{ data: rawItemMasterTableDataType[] }>('/inventory/item');
    
      if (!response) {
        throw new Error(`Error: ${response} ${response}`);
      }
      setRawItemMasterTableData(response.data);
      setMaxID(
        response.data.reduce((max: number, item: rawItemMasterTableDataType) => {
          return Math.max(max, item.id);
        }, 0)
      );
    } catch (error) {
      console.error("Failed to fetch table data:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  useEffect(() => {
    if (!showAddInventoryItemModal) {
      fetchTableData();
    }
  }, [showAddInventoryItemModal]);

  const toggleAddUnitOfMeasurementModal = () =>
    setShowAddUnitOfMeasurementModal((prev) => !prev);
  const toggleAddInventoryItemModal = () =>
    setShowAddInventoryItemModal((prev) => !prev);
  const toggleAddWarehouseModal = () =>
    setShowAddWarehouseModal((prev) => !prev);
  const toggleAddCategoriesModal = () =>
    setShowAddCategoriesModal((prev) => !prev);
  const toggleDeleteCategoryModal = () =>
    setShowDeleteCategoryModal((prev) => !prev);

  const toggleEditWarehouseModal = (warehouse?: warehouseType) => {
    setShowEditWarehouseModal((prev) => !prev);
    setSelectedWarehouse(warehouse || null);
  };

  const handleShowEditInventoryItemModal = (
    item: rawItemMasterTableDataType
  ) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  // Fixed function to handle showing edit category modal with category data
  const handleShowEditCategoryModal = (category: categoryType) => {
    setSelectedCategory(category);
    setShowEditCategoriesModal(true);
  };

  const handleCloseEditCategoryModal = () => {
    setShowEditCategoriesModal(false);
    setSelectedCategory(null);
  };

  const handleRefreshCategoriesTable = () => {
    setRefreshCategoriesTrigger((prev) => prev + 1);
  };

  const handleRefreshWarehouseTable = () => {
    setRefreshWarehouseTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pl-5 py-7">
      <div className="flex flex-wrap items-center gap-2 px-5">
        {InventorySubLinks.map((tabLink) => {
          return (
            <Link to={`${tabLink.link}`} key={tabLink.name}>
              <Button
                className={clsx(
                  "bg-neutral-100 duration-150 hover:bg-neutral-200 shadow-none text-neutral-700",
                  {
                    "bg-neutral-200":
                      new URLSearchParams(tabLink.link.split("?")[1]).get(
                        "tab"
                      ) === tab,
                  }
                )}
              >
                {tabLink.name}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="mt-6">
        {tab === "item-master" ? (
          <ItemMasterTable
            isLoading={itemsLoading}
            toggleAddInventoryModal={toggleAddInventoryItemModal}
            itemMasterTableData={rawItemMasterTableData}
            showEditInventoryItemModal={handleShowEditInventoryItemModal}
          />
        ) : tab === "approvals" ? (
          <ItemApprovalTable />
        ) : tab === "stock-movement" ? (
          <StockMovementTable />
        ) : tab === "barcode" ? (
          <BarcodeTable />
        ) : tab === "categories-master" ? (
          <CategoriesMasterTable
            onClose={toggleAddCategoriesModal}
            toggleDeleteCategoryModal={toggleDeleteCategoryModal}
            toggleEditCategoryModal={handleShowEditCategoryModal}
            refreshTrigger={refreshCategoriesTrigger}
          />
        ) : tab === "warehouse-master" ? (
          <WarehouseMasterTable
            onClose={toggleAddWarehouseModal}
            toggleEditWarehouseModal={toggleEditWarehouseModal}
            refreshTrigger={refreshWarehouseTrigger}
          />
        ) : (
          ""
        )}
      </div>

      {/* Modals */}
      <AddInventoryItemModal
        isAnyModalOpen={
          showAddCategoriesModal ||
          showAddWarehouseModal ||
          showAddUnitOfMeasurementModal
        }
        isOpen={showAddInventoryItemModal}
        onClose={toggleAddInventoryItemModal}
        showAddUnitOfMeasurementModal={toggleAddUnitOfMeasurementModal}
        showAddWarehouseModal={toggleAddWarehouseModal}
        showShowCategoriesModal={toggleAddCategoriesModal}
        currentItemNo={maxID + 1}
      />
      <AddUnitOfMeasurementModal
        isOpen={showAddUnitOfMeasurementModal}
        onClose={toggleAddUnitOfMeasurementModal}
      />
      <AddWarehouseModal
        isOpen={showAddWarehouseModal}
        onClose={toggleAddWarehouseModal}
        onSuccess={handleRefreshWarehouseTable}
      />

      <EditWarehouseModal
        isOpen={showEditWarehouseModal}
        onClose={() => toggleEditWarehouseModal()}
        onSuccess={handleRefreshWarehouseTable}
        data={selectedWarehouse}
      />

      <AddCategoriesModal
        isOpen={showAddCategoriesModal}
        onClose={toggleAddCategoriesModal}
        onSuccess={handleRefreshCategoriesTable}
      />
      <EditCategoriesModal
        isOpen={showEditCategoriesModal}
        onClose={handleCloseEditCategoryModal}
        category={selectedCategory}
        onSuccess={handleRefreshCategoriesTable}
      />
      <EditInventoryItemModal
        isAnyModalOpen={
          showAddCategoriesModal ||
          showAddWarehouseModal ||
          showAddUnitOfMeasurementModal
        }
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        showAddWarehouseModal={toggleAddWarehouseModal}
        showAddUnitOfMeasurementModal={toggleAddUnitOfMeasurementModal}
        showShowCategoriesModal={toggleAddCategoriesModal}
        item={selectedItem}
      />
      <DeleteCategoryModal
        isOpen={showDeleteCategoryModal}
        onClose={toggleDeleteCategoryModal}
      />
    </div>
  );
};

export default Inventory;