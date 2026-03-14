import  { JSX, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

/* ---------------- TYPES ---------------- */

type TabType = "age" | "category" | "store";

interface ChartItem {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface TableItem {
  id: string;
  name: string;
  stock: number;
  value: string;
}

/* ---------------- MOCK DATA ---------------- */

const chartData: Record<TabType, ChartItem[]> = {
  age: [
    { name: "0-30 Days", value: 20, percent: 20, color: "#22c55e" },
    { name: "30-90 Days", value: 30, percent: 30, color: "#6366f1" },
    { name: "90-180 Days", value: 25, percent: 25, color: "#e11d48" },
    { name: "180+ Days", value: 25, percent: 25, color: "#f59e0b" }
  ],

  category: [
    { name: "Electronics", value: 40, percent: 40, color: "#7c3aed" },
    { name: "Sensors", value: 20, percent: 20, color: "#2563eb" },
    { name: "Accessories", value: 25, percent: 25, color: "#e11d48" },
    { name: "Components", value: 15, percent: 15, color: "#14b8a6" }
  ],

  store: [
    { name: "Delhi Warehouse", value: 70, percent: 70, color: "#6b3fa0" },
    { name: "Kolkata Warehouse", value: 10, percent: 10, color: "#2f6f73" },
    { name: "Mumbai Warehouse", value: 10, percent: 10, color: "#4c6fa9" },
    { name: "Bangalore Warehouse", value: 10, percent: 10, color: "#d61f6a" }
  ]
};

const tableData: Record<TabType, Record<string, TableItem[]>> = {
  age: {
    "0-30 Days": [
      { id: "ITM001", name: "RAM", stock: 9000, value: "₹9.0 Cr" },
      { id: "ITM002", name: "SSD", stock: 8700, value: "₹8.7 Cr" },
      { id: "ITM003", name: "GPU", stock: 7600, value: "₹7.6 Cr" },
      { id: "ITM004", name: "CPU", stock: 7000, value: "₹7.0 Cr" },
      { id: "ITM005", name: "Motherboard", stock: 6500, value: "₹6.5 Cr" }
    ],

    "30-90 Days": [
      { id: "ITM006", name: "Keyboard", stock: 4500, value: "₹4.5 Cr" },
      { id: "ITM007", name: "Mouse", stock: 4200, value: "₹4.2 Cr" },
      { id: "ITM008", name: "Monitor", stock: 4100, value: "₹4.1 Cr" },
      { id: "ITM009", name: "Camera", stock: 3800, value: "₹3.8 Cr" },
      { id: "ITM010", name: "Microphone", stock: 3500, value: "₹3.5 Cr" }
    ],

    "90-180 Days": [
      { id: "ITM011", name: "Router", stock: 2500, value: "₹2.5 Cr" },
      { id: "ITM012", name: "Switch", stock: 2400, value: "₹2.4 Cr" },
      { id: "ITM013", name: "Adapter", stock: 2300, value: "₹2.3 Cr" },
      { id: "ITM014", name: "Cable", stock: 2200, value: "₹2.2 Cr" },
      { id: "ITM015", name: "Charger", stock: 2000, value: "₹2.0 Cr" }
    ],

    "180+ Days": [
      { id: "ITM016", name: "Tripod", stock: 1200, value: "₹1.2 Cr" },
      { id: "ITM017", name: "Ring Light", stock: 1100, value: "₹1.1 Cr" },
      { id: "ITM018", name: "Battery", stock: 1000, value: "₹1.0 Cr" },
      { id: "ITM019", name: "USB Drive", stock: 900, value: "₹0.9 Cr" },
      { id: "ITM020", name: "Power Bank", stock: 850, value: "₹0.85 Cr" }
    ]
  },

  category: {
    Electronics: [
      { id: "ITM021", name: "Laptop", stock: 9000, value: "₹9 Cr" },
      { id: "ITM022", name: "Tablet", stock: 8500, value: "₹8.5 Cr" },
      { id: "ITM023", name: "Phone", stock: 8000, value: "₹8 Cr" },
      { id: "ITM024", name: "Camera", stock: 7500, value: "₹7.5 Cr" },
      { id: "ITM025", name: "Drone", stock: 7000, value: "₹7 Cr" }
    ]
  },

  store: {
    "Delhi Warehouse": [
      { id: "ITM010", name: "Microphone", stock: 5928, value: "₹5.93 Cr" },
      { id: "ITM021", name: "Accelerometer", stock: 6806, value: "₹6.81 Cr" },
      { id: "ITM024", name: "Barometer", stock: 8230, value: "₹8.23 Cr" },
      { id: "ITM014", name: "Power button", stock: 8991, value: "₹8.99 Cr" },
      { id: "ITM026", name: "Ambient light sensor", stock: 9696, value: "₹9.70 Cr" }
    ],

    "Kolkata Warehouse": [
      { id: "ITM030", name: "Sensor Kit", stock: 4500, value: "₹4.5 Cr" },
      { id: "ITM031", name: "Arduino Board", stock: 4300, value: "₹4.3 Cr" },
      { id: "ITM032", name: "Raspberry Pi", stock: 4200, value: "₹4.2 Cr" },
      { id: "ITM033", name: "Motor Driver", stock: 4100, value: "₹4.1 Cr" },
      { id: "ITM034", name: "Voltage Regulator", stock: 3900, value: "₹3.9 Cr" }
    ]
  }
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function StockValuationDashboard(): JSX.Element {
  const [tab, setTab] = useState<TabType>("store");
  const [index, setIndex] = useState<number>(0);

  const charts = chartData[tab];
  const currentSegment = charts[index];

  const rows =
    tableData[tab][currentSegment?.name] ??
    tableData[tab][Object.keys(tableData[tab])[0]];

  const next = () =>
    setIndex((i) => (i === charts.length - 1 ? 0 : i + 1));

  const prev = () =>
    setIndex((i) => (i === 0 ? charts.length - 1 : i - 1));

  return (
    <div className="p-6 bg-gray-100">

      <div className="bg-white rounded-lg border shadow-sm p-6">

        <Header tab={tab} setTab={setTab} />

        <div className="grid grid-cols-2 gap-10 mt-6">

          <DonutChart chart={charts} />

          <RightPanel
            title={currentSegment.name}
            rows={rows}
            next={next}
            prev={prev}
          />

        </div>

      </div>
    </div>
  );
}

/* ---------------- HEADER ---------------- */

interface HeaderProps {
  tab: TabType;
  setTab: (t: TabType) => void;
}

function Header({ tab, setTab }: HeaderProps) {
  return (
    <div className="flex justify-between items-start">

      <div>
        <h2 className="text-xl font-semibold">Stock Valuation</h2>

        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
          Last updated: 6:12 pm, 05 Mar 2026
          <RefreshCw size={14} className="cursor-pointer" />
        </div>

        <div className="bg-green-100 mt-4 px-4 py-3 rounded-md text-sm w-[380px]">
          <div>Total Items: 220</div>
          <div>Stock Valuation: ₹2.00 Cr (Based on FIFO Pricing)</div>
        </div>
      </div>

      <Tabs tab={tab} setTab={setTab} />

    </div>
  );
}

/* ---------------- TABS ---------------- */

interface TabsProps {
  tab: TabType;
  setTab: (t: TabType) => void;
}

function Tabs({ tab, setTab }: TabsProps) {
  const tabs: { key: TabType; label: string }[] = [
    { key: "age", label: "Age" },
    { key: "category", label: "Category" },
    { key: "store", label: "Store" }
  ];

  return (
    <div className="flex border rounded-lg overflow-hidden">

      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-6 py-2 text-sm font-medium transition
          ${
            tab === t.key
              ? "bg-green-600 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {t.label}
        </button>
      ))}

    </div>
  );
}

/* ---------------- DONUT CHART ---------------- */

interface ChartProps {
  chart: ChartItem[];
}

function DonutChart({ chart }: ChartProps) {
  return (
    <div className="h-[380px] w-full flex flex-col">

      {/* Chart */}
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chart}
              dataKey="value"
              innerRadius={90}
              outerRadius={130}
              paddingAngle={3}
            >
              {chart.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 max-w-full">
        {chart.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: c.color }}
            />
            <span>{c.name} {c.percent}%</span>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ---------------- RIGHT PANEL ---------------- */

interface RightProps {
  title: string;
  rows: TableItem[];
  next: () => void;
  prev: () => void;
}

function RightPanel({ title, rows, next, prev }: RightProps) {
  return (
    <div>

      <div className="text-sm text-gray-600 mb-1">
        Top 5 items in
      </div>

      <div className="flex items-center border rounded-md w-fit mb-4">

        <button
          onClick={prev}
          className="px-3 py-2 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="px-6 py-2 text-green-700 font-medium">
          {title}
        </div>

        <button
          onClick={next}
          className="px-3 py-2 hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>

      </div>

      <DataTable rows={rows} />

    </div>
  );
}

/* ---------------- TABLE ---------------- */

interface TableProps {
  rows: TableItem[];
}

function DataTable({ rows }: TableProps) {
  return (
    <div className="border rounded-md overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-3">Item Id</th>
            <th className="text-left px-4 py-3">Item Name</th>
            <th className="text-right px-4 py-3">Stock</th>
            <th className="text-right px-4 py-3">Stock Value</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-3">{r.id}</td>
              <td className="px-4 py-3">{r.name}</td>
              <td className="px-4 py-3 text-right">{r.stock}</td>
              <td className="px-4 py-3 text-right">{r.value}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}