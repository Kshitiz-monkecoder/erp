import React, { useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";

type ProductionRow = {
  label: string;
  fgProduced: string;
  rmConsumed: string;
  scraps: string;
  rejected: string;
};

const mockData: ProductionRow[] = [
  {
    label: "Month to Date",
    fgProduced: "₹10.00 L",
    rmConsumed: "₹6.00 L",
    scraps: "₹4,000.00",
    rejected: "₹3,000.00",
  },
  {
    label: "Last 30 Days",
    fgProduced: "₹2.00 L",
    rmConsumed: "₹1.50 L",
    scraps: "₹10,000.00",
    rejected: "₹6,000.00",
  },
  {
    label: "Financial Year to Date",
    fgProduced: "₹1.50 Cr",
    rmConsumed: "₹1.00 Cr",
    scraps: "₹10.00 L",
    rejected: "₹8.00 L",
  },
  {
    label: "Previous Financial Year",
    fgProduced: "₹4.00 Cr",
    rmConsumed: "₹2.50 Cr",
    scraps: "₹30.00 L",
    rejected: "₹10.00 L",
  },
];

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="w-4 h-4 ml-2 text-gray-400 cursor-pointer" />

      {show && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {text}
        </div>
      )}
    </div>
  );
};

const TableHeader: React.FC = () => {
  return (
    <thead>
      <tr className="bg-gray-100 text-sm text-gray-700">
        <th className="px-6 py-4 text-left w-[260px]"></th>

        <th className="px-6 py-4 text-left font-semibold">
          <div className="flex items-center">
            FG Produced
            <InfoTooltip text="Total finished goods produced" />
          </div>
        </th>

        <th className="px-6 py-4 text-left font-semibold">
          <div className="flex items-center">
            RM Consumed
            <InfoTooltip text="Raw materials used in production" />
          </div>
        </th>

        <th className="px-6 py-4 text-left font-semibold">
          <div className="flex items-center">
            Scraps/By-products Generated
            <InfoTooltip text="Waste or by-products generated" />
          </div>
        </th>

        <th className="px-6 py-4 text-left font-semibold">
          <div className="flex items-center">
            RM Rejected
            <InfoTooltip text="Raw materials rejected during QC" />
          </div>
        </th>
      </tr>
    </thead>
  );
};

const TableRow: React.FC<{ row: ProductionRow }> = ({ row }) => {
  return (
    <tr className="border-t hover:bg-gray-50 transition">
      <td className="px-6 py-5 font-medium text-gray-700">{row.label}</td>
      <td className="px-6 py-5 text-gray-800">{row.fgProduced}</td>
      <td className="px-6 py-5 text-gray-800">{row.rmConsumed}</td>
      <td className="px-6 py-5 text-gray-800">{row.scraps}</td>
      <td className="px-6 py-5 text-gray-800">{row.rejected}</td>
    </tr>
  );
};

const ProductionOverview: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          Production Overview
        </h2>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm text-green-600 font-medium hover:text-green-700 transition"
        >
          {collapsed ? "Expand" : "Collapse"}
          {collapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHeader />

            <tbody>
              {mockData.map((row, index) => (
                <TableRow key={index} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductionOverview;