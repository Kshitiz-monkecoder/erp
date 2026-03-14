import React, { useEffect, useState } from "react";
import { get } from "@/lib/apiService";
import ErrorToast from "@/components/app/toasts/ErrorToast";

const FinancialReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  console.log("Financial Report Data:", data);
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await get("/reports/sales");
        setData(res.data);
      } catch (err) {
        ErrorToast({
          title: "Failed to load sales report",
          description: "Something went wrong",
        });
      }
    };
    fetchSales();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Sales Report</h1>
      {/* Add table / KPI cards here */}
    </div>
  );
};

export default FinancialReport;