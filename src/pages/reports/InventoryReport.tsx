import React from "react";
import InventoryOverview from "./Inventory/InventoryOverview";
import StockLevelDashboard from "./Inventory/StockLevelDashboard";
import StockValuationDashboard from "./Inventory/StockValuationDashboard";
import InventoryPerformance from "./Inventory/InventoryPerformance";

const InventoryReport: React.FC = () => {

  // useEffect(() => {
  //   const fetchSales = async () => {
  //     try {
  //       const res = await get("/reports/sales");
  //       setData(res.data);
  //     } catch (err) {
  //       ErrorToast({
  //         title: "Failed to load sales report",
  //         description: "Something went wrong",
  //       });
  //     }
  //   };
  //   fetchSales();
  // }, []);

  return (
     <div className="p-6 space-y-10">
      <InventoryOverview />
      <StockLevelDashboard />
      <InventoryPerformance  />
      <StockValuationDashboard />
    </div>
  );
};

export default InventoryReport;