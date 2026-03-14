import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

type StockCategory = {
  name: string;
  color: string;
  count: number;
  percent: number;
};

export default function StockLevelDashboard() {
  const stockCategories: StockCategory[] = [
    {
      name: "Negative Stock",
      color: "border-pink-500 bg-pink-100",
      count: 20,
      percent: 9,
    },
    {
      name: "Low Stock",
      color: "bg-orange-100",
      count: 40,
      percent: 18,
    },
    {
      name: "Reorder Stock",
      color: "bg-yellow-100",
      count: 10,
      percent: 5,
    },
    {
      name: "Optimum Stock",
      color: "bg-green-100",
      count: 100,
      percent: 45,
    },
    {
      name: "High Stock",
      color: "bg-blue-100",
      count: 20,
      percent: 9,
    },
    {
      name: "Excess Stock",
      color: "bg-red-100",
      count: 30,
      percent: 14,
    },
  ];

  const tableData: Record<string, Array<{ id: string; name: string; store: string; qty: number; min: number; max: number }>> = {
    "Negative Stock": [
      { id: "ITM0001", name: "Battery", store: "", qty: -100, min: 1000, max: 10000 },
      { id: "ITM0002", name: "Camera", store: "", qty: -50, min: 1000, max: 10000 },
      { id: "ITM0003", name: "Display", store: "", qty: -20, min: 500, max: 5000 },
      { id: "ITM0004", name: "Sensor", store: "", qty: -10, min: 500, max: 3000 },
      { id: "ITM0005", name: "Chipset", store: "", qty: -5, min: 300, max: 2000 },
    ],
    "Low Stock": [
      { id: "ITM0101", name: "Keyboard", store: "", qty: 10, min: 100, max: 500 },
      { id: "ITM0102", name: "Mouse", store: "", qty: 15, min: 100, max: 500 },
      { id: "ITM0103", name: "Cable", store: "", qty: 20, min: 200, max: 800 },
      { id: "ITM0104", name: "Adapter", store: "", qty: 30, min: 200, max: 900 },
      { id: "ITM0105", name: "HDMI", store: "", qty: 25, min: 150, max: 700 },
    ],
    "Reorder Stock": [
      { id: "ITM0201", name: "Router", store: "", qty: 80, min: 70, max: 500 },
      { id: "ITM0202", name: "Switch", store: "", qty: 90, min: 80, max: 500 },
      { id: "ITM0203", name: "Access Point", store: "", qty: 70, min: 60, max: 450 },
      { id: "ITM0204", name: "Fiber Cable", store: "", qty: 65, min: 60, max: 400 },
      { id: "ITM0205", name: "Modem", store: "", qty: 75, min: 70, max: 420 },
    ],
    "Optimum Stock": [
      { id: "ITM0301", name: "SSD", store: "", qty: 400, min: 200, max: 1000 },
      { id: "ITM0302", name: "RAM", store: "", qty: 350, min: 200, max: 1000 },
      { id: "ITM0303", name: "CPU", store: "", qty: 300, min: 200, max: 900 },
      { id: "ITM0304", name: "GPU", store: "", qty: 280, min: 200, max: 800 },
      { id: "ITM0305", name: "Motherboard", store: "", qty: 260, min: 200, max: 750 },
    ],
    "High Stock": [
      { id: "ITM0401", name: "Speakers", store: "", qty: 800, min: 200, max: 600 },
      { id: "ITM0402", name: "Webcam", store: "", qty: 750, min: 200, max: 600 },
      { id: "ITM0403", name: "Microphone", store: "", qty: 700, min: 200, max: 600 },
      { id: "ITM0404", name: "Tripod", store: "", qty: 650, min: 200, max: 600 },
      { id: "ITM0405", name: "Ring Light", store: "", qty: 640, min: 200, max: 600 },
    ],
    "Excess Stock": [
      { id: "ITM0501", name: "USB Drive", store: "", qty: 2000, min: 200, max: 800 },
      { id: "ITM0502", name: "External HDD", store: "", qty: 1800, min: 200, max: 800 },
      { id: "ITM0503", name: "Memory Card", store: "", qty: 1700, min: 200, max: 800 },
      { id: "ITM0504", name: "Power Bank", store: "", qty: 1600, min: 200, max: 800 },
      { id: "ITM0505", name: "Charger", store: "", qty: 1500, min: 200, max: 800 },
    ],
  };

  const [activeIndex, setActiveIndex] = useState(0);

  const currentCategory = stockCategories[activeIndex].name;
  const rows = tableData[currentCategory];

  const prev = () =>
    setActiveIndex((i) => (i === 0 ? stockCategories.length - 1 : i - 1));

  const next = () =>
    setActiveIndex((i) => (i === stockCategories.length - 1 ? 0 : i + 1));

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="bg-white rounded-lg shadow border p-6">

        <Header />

        <StockCards
          categories={stockCategories}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />

        <TotalInventory />

        <StockNavigator
          title={currentCategory}
          prev={prev}
          next={next}
        />

        <Recommendation />

        <StockTable rows={rows} />

      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">
        Stock Level of Items in Inventory
      </h2>

      <div className="bg-green-600 text-white w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-green-700">
        ?
      </div>
    </div>
  );
}

function StockCards({ categories, activeIndex, setActiveIndex }: { categories: StockCategory[]; activeIndex: number; setActiveIndex: (index: number) => void }) {
  return (
    <div className="grid grid-cols-6 gap-3 mb-5">
      {categories.map((cat, i) => (
        <div
          key={cat.name}
          onClick={() => setActiveIndex(i)}
          className={`p-4 rounded-md cursor-pointer border transition
          ${cat.color}
          ${activeIndex === i ? "border-pink-500 shadow-sm" : "border-transparent hover:border-gray-300"}
          `}
        >
          <div className="text-sm text-gray-700">{cat.name}</div>

          <div className="mt-2 text-xl font-semibold">
            {cat.count}{" "}
            <span className="text-xs text-gray-600">
              ({cat.percent}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TotalInventory() {
  return (
    <div className="bg-blue-100 text-gray-700 rounded-md px-4 py-3 mb-3">
      Total Inventory Items - 220
    </div>
  );
}

function StockNavigator({ title, prev, next }: { title: string; prev: () => void; next: () => void }) {
  return (
    <div className="mt-6">

      <div className="text-sm text-gray-600 mb-2">
        Top 5 items with most
      </div>

      <div className="flex items-center w-fit border rounded-md overflow-hidden">

        <button
          onClick={prev}
          className="px-3 py-2 hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="px-6 py-2 font-medium text-green-600">
          {title}
        </div>

        <button
          onClick={next}
          className="px-3 py-2 hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>

      </div>
    </div>
  );
}

function Recommendation() {
  return (
    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-md mt-4 mb-4">
      <Info size={16} />
      Recommendation: Recount these items and update their count on Benco & Company.
    </div>
  );
}

function StockTable({ rows }: { rows: Array<{ id: string; name: string; store: string; qty: number; min: number; max: number }> }) {
  return (
    <div className="border rounded-md overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="text-left px-4 py-3">Item Id</th>
            <th className="text-left px-4 py-3">Item Name</th>
            <th className="text-left px-4 py-3">Store Name</th>
            <th className="text-right px-4 py-3">Current Quantity</th>
            <th className="text-right px-4 py-3">Min. Stock Level</th>
            <th className="text-right px-4 py-3">Max. Stock Level</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t hover:bg-gray-50 transition"
            >
              <td className="px-4 py-3">{row.id}</td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">{row.store}</td>
              <td className="px-4 py-3 text-right">{row.qty}</td>
              <td className="px-4 py-3 text-right">{row.min}</td>
              <td className="px-4 py-3 text-right">{row.max}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}