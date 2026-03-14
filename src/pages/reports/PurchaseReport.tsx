import React, { useEffect, useState } from "react";
import { post } from "@/lib/apiService";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import PurchasePerformance from "./Purchase/PurchasePerformance";
import ApprovedRejectedPOs from "./Purchase/ApprovedRejectedPOs";
import PendingOrdersDashboard from "./Purchase/PendingOrdersDashboard";

const PurchaseReport: React.FC = () => {
  // const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  // const [startDate, setStartDate] = useState<string>("");
  // const [endDate, setEndDate] = useState<string>("");


// const getWeekDates = () => {
//   const start = new Date("2026-03-02"); // Monday
//   const days = [];

//   for (let i = 0; i < 7; i++) {
//     const d = new Date(start);
//     d.setDate(start.getDate() + i);
//     days.push(d);
//   }

//   return days;
// };


  useEffect(() => {
  fetchPurchaseOverview();
}, []);

  const fetchPurchaseOverview = async () => {
  try {
    const res = await post("/bi/purchase/overview", {
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      isComplete: true,
    });

    if (res?.status) {
      setOverviewData(res.data);
    }
  } catch (err) {
    ErrorToast({
      title: "Failed to fetch purchase overview",
      description: "Something went wrong",
    });
  }
};


  return (
    <div className="p-6 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Purchase BI</h1>
        <p className="text-gray-500 text-sm">
          Track procurement performance and purchase order analytics
        </p>
      </div>

      {/* PURCHASE OVERVIEW */}
      {/* PURCHASE OVERVIEW */}
<section className="bg-white rounded-xl border p-6">
  <div className="flex justify-between mb-6">
    <h2 className="text-lg font-semibold">Purchase Overview</h2>

    <button
      className="text-sm text-blue-600"
    >
      Generate Report
    </button>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full border text-sm">

      {/* HEADER */}
      <thead className="bg-gray-50">
        <tr>
          <th className="border p-3 text-left"></th>

          <th colSpan={2} className="border p-3 text-center font-medium">
            Created POs
          </th>

          <th colSpan={3} className="border p-3 text-center font-medium">
            Delivered POs
          </th>
        </tr>

        <tr className="bg-gray-50 text-gray-600">
          <th className="border p-3 text-left"></th>

          <th className="border p-3 text-center">Value</th>
          <th className="border p-3 text-center">Count</th>

          <th className="border p-3 text-center">Value</th>
          <th className="border p-3 text-center">Count</th>
          <th className="border p-3 text-center">%</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody>

        {[
          "Today",
          "Yesterday",
          "Month to Date",
          "Quarter to Date",
          "Last 30 Days",
          "Financial Year to Date",
          "Previous Financial Year",
          "Last Month",
          "Last Quarter",
        ].map((label, index) => (
          <tr key={index} className="border-t hover:bg-gray-50">

            <td className="border p-3 font-medium">{label}</td>

            <td className="border p-3 text-center">
  ₹{overviewData?.totalPurchaseValue ?? 0}
</td>

<td className="border p-3 text-center">
  {overviewData?.totalPurchaseOrders ?? 0}
</td>

            <td className="border p-3 text-center">₹0.00</td>
            <td className="border p-3 text-center">0</td>
            <td className="border p-3 text-center">0.00%</td>

          </tr>
        ))}

      </tbody>

    </table>
  </div>
</section>

     <PendingOrdersDashboard />
      <PurchasePerformance />

      {/* APPROVED VS REJECTED */}
      <ApprovedRejectedPOs />

    </div>
  );
};

export default PurchaseReport;