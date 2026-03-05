import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, HelpCircle, Search } from "lucide-react";

type TabType = "all" | "due" | "overdue";

type Stage =
  | "Production Not Planned"
  | "0% Completed"
  | "<50% Completed"
  | ">50% Completed"
  | "Delivery Ready";

interface Order {
  id: string;
  buyer: string;
  ocAmount: string;
  pendingAmount: string;
  type: TabType;
  stage: Stage;
}

const stages: Stage[] = [
  "Production Not Planned",
  "0% Completed",
  "<50% Completed",
  ">50% Completed",
  "Delivery Ready",
];

const chartData = [
  { stage: "Production Not Planned", value: 100 },
  { stage: "0% Completed", value: 50 },
  { stage: "<50% Completed", value: 250 },
  { stage: ">50% Completed", value: 150 },
  { stage: "Delivery Ready", value: 50 },
];

const orders: Order[] = [
  {
    id: "OC20001",
    buyer: "Ms Dhoni and Co.",
    ocAmount: "₹2.00 L",
    pendingAmount: "NA",
    type: "all",
    stage: "Production Not Planned",
  },
  {
    id: "OC20002",
    buyer: "Pandya and Sons",
    ocAmount: "₹1.50 L",
    pendingAmount: "NA",
    type: "due",
    stage: "Production Not Planned",
  },
  {
    id: "OC20003",
    buyer: "Kohli Group",
    ocAmount: "₹1.00 L",
    pendingAmount: "NA",
    type: "overdue",
    stage: "Production Not Planned",
  },
  {
    id: "OC20004",
    buyer: "Tendulkar Pvt. Ltd.",
    ocAmount: "₹30,000.00",
    pendingAmount: "NA",
    type: "due",
    stage: "Production Not Planned",
  },
  {
    id: "OC20005",
    buyer: "Dravid LLP",
    ocAmount: "₹20,000.00",
    pendingAmount: "NA",
    type: "all",
    stage: "Production Not Planned",
  },
];

const PendingOrdersProduction: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [stageIndex, setStageIndex] = useState(0);
  const [search, setSearch] = useState("");

  const activeStage = stages[stageIndex];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchTab = activeTab === "all" || o.type === activeTab;
      const matchStage = o.stage === activeStage;

      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.buyer.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchStage && matchSearch;
    });
  }, [activeTab, activeStage, search]);

  const nextStage = () =>
    setStageIndex((i) => (i === stages.length - 1 ? 0 : i + 1));

  const prevStage = () =>
    setStageIndex((i) => (i === 0 ? stages.length - 1 : i - 1));

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Pending Orders (OCs) in Production
        </h2>

        <HelpCircle className="text-green-600 cursor-pointer" size={20} />
      </div>

      <div className="grid grid-cols-2 gap-10 mt-6">
        {/* LEFT CHART */}
        <div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />

                <XAxis
                  dataKey="stage"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  label={{
                    value: "Number of Orders",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }}
                  domain={[0, 300]}
                  ticks={[0, 50, 100, 150, 200, 250, 300]}
                />

                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.stage === activeStage
                          ? "#2f855a"
                          : "#a7d3c0"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500 mt-6 italic">
            The above data is based on the number of process completed
            for a given Order (OC)
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Pending Order Type</p>

          {/* Tabs */}
          <div className="flex border rounded-md overflow-hidden w-fit mb-4">
            {[
              { key: "all", label: "All Pending" },
              { key: "due", label: "Due Orders" },
              { key: "overdue", label: "Overdue Orders" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-5 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stage Switcher */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">
              Top 5 pending orders of
            </span>

            <button
              onClick={prevStage}
              className="border rounded px-2 py-1 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-green-700 font-medium">
              {activeStage}
            </span>

            <button
              onClick={nextStage}
              className="border rounded px-2 py-1 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              className="border rounded-md pl-8 pr-3 py-2 w-full text-sm focus:ring-2 focus:ring-green-500"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Buyer Name</th>
                  <th className="p-3">OC Amount</th>
                  <th className="p-3">Pending Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 text-blue-700">{o.id}</td>
                    <td className="p-3">{o.buyer}</td>
                    <td className="p-3">{o.ocAmount}</td>
                    <td className="p-3">{o.pendingAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right mt-4 text-sm text-gray-700 cursor-pointer hover:underline">
            View Work Orders
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingOrdersProduction;