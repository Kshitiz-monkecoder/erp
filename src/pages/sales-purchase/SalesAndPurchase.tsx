import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { SalesAndPurchaseSubLinks } from "@/lib/subnavLinks";
import PurchaseTable from "@/components/app/tables/sales-purchase/PurchaseTable";
import QuotationsTable from "@/components/app/tables/QuotationsTable";
import AllDocumentsTable from "@/components/app/tables/AllDocumentsTable";
import InwordTable from "@/components/app/tables/InwordTable";
import GRNTable from "@/components/app/tables/GRNTable";
import SelectSupplierModal from "@/components/app/modals/SelectSupplierModal";
import SalesTable from "@/components/app/tables/sales-purchase/SalesTable";
import SalesEnquiryTable from "@/components/app/tables/SalesEnquiryTable";
import OrderConfirmationTable from "@/components/app/tables/sales-purchase/OrderConfirmationTable";
import DeliveryChallanTable from "@/components/app/tables/DeliveryChallanTable";
import SalesQuotationsTable from "@/components/app/tables/SalesQuotationsTable";

const SalesAndPurchase: React.FC = () => {
  const location = useLocation();
  const [showSelectSupplierModal, setShowSelectSupplierModal] =
    useState<boolean>(false);
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab"); // extracting tab value here to highlight current nested value

  // by default set this inventory tab to item-master if no searchParam is provided
  useEffect(() => {
    if (searchParams.size === 0) {
      navigateTo("/sales-purchase?tab=purchase");
    }
  }, [searchParams]);

  const toggleSelectSupplierModal = () =>
    setShowSelectSupplierModal((prev) => !prev);

  return (
    <div className="min-h-screen bg-neutral-50 pl-5 pt-7">
      <div className="flex flex-wrap items-center gap-2 px-5">
        {SalesAndPurchaseSubLinks.map((tabLink) => {
          return (
            <Link to={`${tabLink.link}`} key={tabLink.name}>
              <Button
                key={tabLink.name}
                className={clsx(
                  "bg-neutral-100 duration-150 hover:bg-neutral-200 shadow-none text-neutral-700",
                  {
                    "bg-neutral-200":
                      new URLSearchParams(tabLink.link.split("?")[1]).get(
                        "tab"
                      ) === tab, // Highlight the active tab
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
        {tab === "purchase" ? (
          <PurchaseTable
            toggleSelectSupplierModal={toggleSelectSupplierModal}
          />
        ) : tab === "sales" ? (
          <SalesTable toggleSelectSupplierModal={toggleSelectSupplierModal} />
        ) : tab === "purchase-quotations" ? (
          <QuotationsTable />
        ) : tab === "sales-quotations" ? (
          <SalesQuotationsTable />
        ) : tab === "all-documents" ? (
          <AllDocumentsTable />
        ) : tab === "inword" ? (
          <InwordTable />
        ) : tab === "grn" ? (
          <GRNTable />
        ) : tab === "sales-enquiry" ? (
          <SalesEnquiryTable />
        ) : tab === "order-confirmation" ? (
          <OrderConfirmationTable />
        ) : tab === "delivery-challan" ? (
          <DeliveryChallanTable />
        ) : (
          ""
        )}
      </div>
      <SelectSupplierModal
        isOpen={showSelectSupplierModal}
        onClose={toggleSelectSupplierModal}
        onContinue={() => {}}
      />
    </div>
  );
};

export default SalesAndPurchase;
