import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const mockData = [
  { date: "15 Dec", Production: 5, inwards: 4.5, qc: 15 },
  { date: "22 Dec", Production: 6, inwards: 5, qc: 2 },
  { date: "29 Dec", Production: 7.5, inwards: 6.5, qc: 3.5 },
  { date: "5 Jan", Production: 10, inwards: 9, qc: 6.5 },
  { date: "12 Jan", Production: 7.5, inwards: 7.5, qc: 6.5 },
  { date: "19 Jan", Production: 7, inwards: 6, qc: 5 },
  { date: "26 Jan", Production: 9, inwards: 9, qc: 8.5 },
  { date: "2 Feb", Production: 10, inwards: 9, qc: 8.5 },
  { date: "9 Feb", Production: 11, inwards: 10, qc: 7.5 },
  { date: "16 Feb", Production: 12.5, inwards: 11.5, qc: 10 },
  { date: "23 Feb", Production: 14, inwards: 12.5, qc: 12 },
  { date: "2 Mar", Production: 15, inwards: 15, qc: 15 },
];

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium transition-all border
        ${
          active
            ? "bg-green-600 text-white border-green-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
        }
      `}
    >
      {label}
    </button>
  );
}

function Tabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = ["Week on Week", "Month on Month", "Quarter on Quarter"];

  return (
    <div className="flex rounded-md overflow-hidden border border-gray-300">
      {tabs.map((tab) => (
        <TabButton
          key={tab}
          label={tab}
          active={activeTab === tab}
          onClick={() => setActiveTab(tab)}
        />
      ))}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <span
        className="w-5 h-[2px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="flex gap-6 mt-4">
      <LegendItem color="#2F855A" label="Production Orders" />
      <LegendItem color="#D69E2E" label="Inwards" />
      <LegendItem color="#2B6CB0" label="QC Accepted" />
    </div>
  );
}

function ChartView({ data }: { data: typeof mockData }) {
  return (
    <div className="w-full h-[320px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[0, 20]}
            tickFormatter={(value) => `₹${value}.00 L`}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            formatter={(value) => [`₹${value} L`]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          <Line
            type="monotone"
            dataKey="Production"
            stroke="#2F855A"
            strokeWidth={2.5}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="inwards"
            stroke="#D69E2E"
            strokeWidth={2.5}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="qc"
            stroke="#2B6CB0"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Header({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Production Performance
        </h2>

        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-600 text-white text-xs cursor-pointer hover:opacity-80">
          ?
        </div>
      </div>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function ProductionPerformance() {
  const [activeTab, setActiveTab] = useState("Week on Week");

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <ChartView data={mockData} />

      <ChartLegend />
    </div>
  );
}