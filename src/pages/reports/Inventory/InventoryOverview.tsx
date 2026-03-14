import { useState } from "react";
import { RefreshCw, Info, ChevronDown, ChevronUp } from "lucide-react";

export default function InventoryBI() {
  // const [activeTab, setActiveTab] = useState("Inventory BI");
  const [collapsed, setCollapsed] = useState(false);

  const sellingItems = [
    { name: "Ambient light sensor", invoices: 100, amount: "₹50.00 L" },
    { name: "RAM", invoices: 80, amount: "₹40.00 L" },
    { name: "Microphone", invoices: 60, amount: "₹30.00 L" },
    { name: "SIM card tray", invoices: 50, amount: "₹25.00 L" },
    { name: "Speaker module", invoices: 40, amount: "₹20.00 L" },
  ];

  const purchasedItems = [
    { name: "Ambient light sensor", invoices: 50, amount: "₹25.00 L" },
    { name: "Power button", invoices: 40, amount: "₹20.00 L" },
    { name: "Barometer", invoices: 30, amount: "₹15.00 L" },
    { name: "Accelerometer", invoices: 20, amount: "₹10.00 L" },
    { name: "Gyroscope", invoices: 15, amount: "₹7.50 L" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-700 font-sans">


      <div className="max-w-6xl mx-auto mt-6 px-4">
        <InventoryOverviewCard
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sellingItems={sellingItems}
          purchasedItems={purchasedItems}
        />
      </div>

    </div>
  );
}


interface InventoryOverviewCardProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  sellingItems: { name: string; invoices: number; amount: string }[];
  purchasedItems: { name: string; invoices: number; amount: string }[];
}

function InventoryOverviewCard({
  collapsed,
  setCollapsed,
  sellingItems,
  purchasedItems,
}: InventoryOverviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">

      {/* Header */}
      <div className="flex justify-between items-start p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold">Inventory Overview</h2>

          <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
            <span>Last updated: 5:55 pm, 05 Mar 2026</span>

            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
              Refresh <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-teal-600 flex items-center gap-1 text-sm font-medium hover:text-teal-700"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          COLLAPSE
        </button>
      </div>

      {!collapsed && (
        <div className="p-6">

          <StockValuationRow />

          <InventoryTables
            sellingItems={sellingItems}
            purchasedItems={purchasedItems}
          />

        </div>
      )}
    </div>
  );
}

function StockValuationRow() {
  return (
    <div className="border rounded-md overflow-hidden mb-8">
      <div className="grid grid-cols-3 bg-gray-50 border-b text-sm font-semibold">
        <div className="p-3"></div>
        <div className="p-3 text-right">Value</div>
        <div className="p-3 text-right">Count</div>
      </div>

      <div className="grid grid-cols-3 items-center hover:bg-gray-50 transition">
        <div className="p-4 flex items-center gap-2">
          Stock Valuation (By FIFO)
          <Info size={16} className="text-gray-400" />
        </div>

        <div className="p-4 text-right font-medium">₹2.00 Cr</div>
        <div className="p-4 text-right">220</div>
      </div>
    </div>
  );
}

function InventoryTables({ sellingItems, purchasedItems }: { sellingItems: { name: string; invoices: number; amount: string }[]; purchasedItems: { name: string; invoices: number; amount: string }[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">

      <ItemsTable
        title="Top 5 Selling Items (Last 3 months)"
        items={sellingItems}
      />

      <ItemsTable
        title="Top 5 Purchased Items (Last 3 months)"
        items={purchasedItems}
      />

    </div>
  );
}

function ItemsTable({ title, items }: { title: string; items: { name: string; invoices: number; amount: string }[] }) {
  return (
    <div className="border rounded-md overflow-hidden">

      <div className="flex justify-between items-center bg-gray-50 border-b px-4 py-3">
        <span className="font-medium text-sm">{title}</span>
        <Info size={16} className="text-gray-400" />
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b text-gray-600">
          <tr>
            <th className="text-left p-3 font-medium">Item Name</th>
            <th className="text-right p-3 font-medium"># Invoices</th>
            <th className="text-right p-3 font-medium">Traded Amount</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="p-3">{item.name}</td>
              <td className="p-3 text-right">{item.invoices}</td>
              <td className="p-3 text-right">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

