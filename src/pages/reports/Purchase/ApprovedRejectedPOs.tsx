import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

const ApprovedRejectedPOs: React.FC = () => {
  const categories = [
    "All POs",
    "Sent for Approval",
    "Approved POs",
    "Rejected POs",
    "Approval Pending",
  ];

  const [timeFilter, setTimeFilter] = useState<"7" | "30">("7");
  const [categoryIndex, setCategoryIndex] = useState(0);

  const selectedCategory = categories[categoryIndex];

  const nextCategory = () => {
    setCategoryIndex((prev) =>
      prev === categories.length - 1 ? 0 : prev + 1
    );
  };

  const prevCategory = () => {
    setCategoryIndex((prev) =>
      prev === 0 ? categories.length - 1 : prev - 1
    );
  };

  const chartData = [
    { name: "All POs", value: 120 },
    { name: "Sent for Approval", value: 90 },
    { name: "Approved POs", value: 45 },
    { name: "Rejected POs", value: 20 },
    { name: "Approval Pending", value: 15 },
  ];

  const tableData = [
    {
      po: "PO0016",
      supplier: "Shami Industries",
      amount: "₹1.00 L",
      delivery: "12 Mar, 2026",
      permission: "Ravi Shastri",
    },
    {
      po: "PO0017",
      supplier: "Kumble & Kumble",
      amount: "₹60,000.00",
      delivery: "15 Mar, 2026",
      permission: "Kapil Dev",
    },
    {
      po: "PO0018",
      supplier: "Ashwin Engg. Co.",
      amount: "₹40,000.00",
      delivery: "20 Mar, 2026",
      permission: "Rahul Dravid",
    },
    {
      po: "PO0019",
      supplier: "Bumrah Works",
      amount: "₹30,000.00",
      delivery: "30 Mar, 2026",
      permission: "Ravi Shastri",
    },
    {
      po: "PO0020",
      supplier: "Kumar Ltd",
      amount: "₹20,000.00",
      delivery: "4 Apr, 2026",
      permission: "Kapil Dev",
    },
  ];

  const isApprovalCategory = selectedCategory === "Sent for Approval";

  return (
    <section className="bg-white border rounded-xl p-6 shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Approved vs Rejected POs
        </h2>

        <HelpCircle size={18} className="text-green-600 cursor-pointer" />
      </div>

      {/* FILTER */}
      <div className="flex justify-end mt-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">PO created in</p>

          <div className="flex border rounded-lg overflow-hidden">

            <button
              onClick={() => setTimeFilter("7")}
              className={`px-4 py-2 text-sm font-medium ${
                timeFilter === "7"
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              Last 7 Days
            </button>

            <button
              onClick={() => setTimeFilter("30")}
              className={`px-4 py-2 text-sm font-medium ${
                timeFilter === "30"
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              Last 30 Days
            </button>

          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-2 gap-10 mt-6">

        {/* CHART */}
        <div className="h-[260px]">

          <ResponsiveContainer>

            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 30 }}
            >

              <CartesianGrid strokeDasharray="3 3" horizontal={false} />

              <XAxis type="number" hide />

              <YAxis
                type="category"
                dataKey="name"
                width={140}
              />

              <Bar dataKey="value" radius={[0, 0, 0, 0]}>

                {chartData.map((__entry, index) => (

                  <Cell
                    key={index}
                    fill={
                      index === categoryIndex
                        ? "#2f855a"     // active dark green
                        : "#a7d3bf"     // inactive light green
                    }
                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* RIGHT SIDE */}
        <div>

          {/* CATEGORY NAVIGATION */}
          <div className="mb-4">

            <p className="text-sm text-gray-600 mb-2">
              Top 5 POs in
            </p>

            <div className="flex items-center border rounded-lg overflow-hidden">

              <button
                onClick={prevCategory}
                className="px-3 py-2 hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex-1 text-center py-2 text-green-700 font-medium">
                {selectedCategory}
              </div>

              <button
                onClick={nextCategory}
                className="px-3 py-2 hover:bg-gray-100"
              >
                <ChevronRight size={18} />
              </button>

            </div>

          </div>

          {/* TABLE */}
          <div className="border rounded-lg overflow-hidden">

            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left">PO Number</th>
                  <th className="p-3 text-left">Supplier Name</th>
                  <th className="p-3 text-left">Amount</th>

                  {isApprovalCategory ? (
                    <th className="p-3 text-left">Permission To</th>
                  ) : (
                    <th className="p-3 text-left">Delivery Date</th>
                  )}

                </tr>
              </thead>

              <tbody>

                {tableData.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">

                    <td className="p-3">{row.po}</td>
                    <td className="p-3">{row.supplier}</td>
                    <td className="p-3">{row.amount}</td>

                    {isApprovalCategory ? (
                      <td className="p-3">{row.permission}</td>
                    ) : (
                      <td className="p-3">{row.delivery}</td>
                    )}

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* FOOTNOTE */}
      <p className="text-xs text-gray-500 mt-6">
        Above graph is for PO approval request raised by your team.
      </p>

    </section>
  );
};

export default ApprovedRejectedPOs;