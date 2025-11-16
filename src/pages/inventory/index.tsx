import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { InventorySubLinks } from "@/lib/subnavLinks";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import ItemMaster from "./ItemMaster";
import ItemApprovalTable from "@/components/app/tables/ItemApprovalTable";
import StockMovementTable from "@/components/app/tables/StockMovementTable";
import BarcodeTable from "@/components/app/tables/BarcodeTable";
import CategoriesMasterTable from "@/components/app/tables/CategoriesMasterTable";
import WarehouseMasterTable from "@/components/app/tables/WarehouseMasterTable";
import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import EditCategoriesModal from "@/components/app/modals/EditCategoriesModal";
import EditWarehouseModal from "@/components/app/modals/EditWarehouseModal";
import DeleteCategoryModal from "@/components/app/modals/DeleteCategoryModal";

export type categoryType = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
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

const Inventory: React.FC = () => {
  const location = useLocation();
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab"); // extracting tab value here to highlight current nested value

  // Modal states
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState<boolean>(false);
  const [showEditCategoriesModal, setShowEditCategoriesModal] = useState<boolean>(false);
  const [showEditWarehouseModal, setShowEditWarehouseModal] = useState<boolean>(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState<boolean>(false);

  // Selected items for editing
  const [selectedCategory, setSelectedCategory] = useState<categoryType | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<warehouseType | null>(null);

  // Refresh triggers
  const [refreshCategoriesTrigger, setRefreshCategoriesTrigger] = useState<number>(0);
  const [refreshWarehouseTrigger, setRefreshWarehouseTrigger] = useState<number>(0);

  // by default set this inventory tab to item-master if no searchParam is provided
  useEffect(() => {
    if (searchParams.size === 0) {
      navigateTo("/inventory?tab=item-master");
    }
  }, [searchParams]);

  // Modal toggle functions
  const toggleAddCategoriesModal = () => setShowAddCategoriesModal((prev) => !prev);
  const toggleAddWarehouseModal = () => setShowAddWarehouseModal((prev) => !prev);
  const toggleDeleteCategoryModal = () => setShowDeleteCategoryModal((prev) => !prev);

  const toggleEditWarehouseModal = (warehouse?: warehouseType) => {
    setShowEditWarehouseModal((prev) => !prev);
    setSelectedWarehouse(warehouse || null);
  };

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
          <ItemMaster />
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
      <DeleteCategoryModal
        isOpen={showDeleteCategoryModal}
        onClose={toggleDeleteCategoryModal}
      />
    </div>
  );
};

export default Inventory;
