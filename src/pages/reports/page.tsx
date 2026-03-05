import { useSearchParams } from "react-router-dom";

import SalesReport from "./SalesReport";
import PurchaseReport from "./PurchaseReport";
import InventoryReport from "./InventoryReport";
import ProductionReport from "./ProductionReport";
import AccountsReport from "./AccountsReport";
import FinancialReport from "./FinancialReport";
import ReportsCard from "./ReportsCard";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "report";

  const tabs = [
    { label: "Report", value: "report" },
    { label: "Sales", value: "sales" },
    { label: "Purchase", value: "purchase" },
    { label: "Inventory", value: "inventory" },
    { label: "Production", value: "production" },
    { label: "Accounts", value: "accounts" },
    { label: "Financial", value: "financial" },
  ];

  const renderTab = () => {
    switch (tab) {
      case "sales":
        return <SalesReport />;
      case "purchase":
        return <PurchaseReport />;
      case "inventory":
        return <InventoryReport />;
      case "production":
        return <ProductionReport />;
      case "accounts":
        return <AccountsReport />;
      case "financial":
        return <FinancialReport />;
      default:
        return (
          <div className="text-gray-600 text-lg">
            <ReportsCard />
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      
      {/* Header */}
      {/* Tabs */}
<div className="sticky top-12 bg-white border-b border-gray-200 z-40">
  <div className="flex gap-10 px-6 overflow-x-auto">
    {tabs.map((t) => {
      const active = tab === t.value;

      return (
        <button
          key={t.value}
          onClick={() => setSearchParams({ tab: t.value })}
          className={`relative pb-3 text-base font-medium transition-colors
          ${
            active
              ? "text-[#0b7f9d]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {t.label}

          {active && (
            <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#0b7f9d] rounded"></span>
          )}
        </button>
      );
    })}
  </div>
</div>

      {/* Content */}
      <div className="p-6 bg-gray-50 min-h-screen">{renderTab()}</div>
    </div>
  );
}