import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ArrowUpDown,
  Search,
  Plus,
  FileText,
} from "lucide-react";

/* ================= TYPES ================= */

export interface RFQ {
  id: string;
  rfqNumber: string;
  suppliersSent: number;
  bidsReceived: number;
  deliveryDate: string;
  biddingStatus: "Open" | "Closed" | "Awarded";
  closeDate: string;
  creationStatus: "Sent" | "Draft";
  conversionStatus: "Converted" | "Not Converted";
}

/* ================= MOCK DATA ================= */

const mockData: RFQ[] = [
  {
    id: "1",
    rfqNumber: "RFQ-1001",
    suppliersSent: 5,
    bidsReceived: 3,
    deliveryDate: "2026-03-15",
    biddingStatus: "Open",
    closeDate: "2026-03-10",
    creationStatus: "Sent",
    conversionStatus: "Not Converted",
  },
  {
    id: "2",
    rfqNumber: "RFQ-1002",
    suppliersSent: 2,
    bidsReceived: 2,
    deliveryDate: "2026-03-20",
    biddingStatus: "Closed",
    closeDate: "2026-03-05",
    creationStatus: "Draft",
    conversionStatus: "Converted",
  },
];

/* ================= REUSABLE COMPONENTS ================= */

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1 w-60">
    <label className="text-sm text-gray-600">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full border border-gray-300 bg-white rounded-lg px-4 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b7f9d]"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
      />
    </div>
  </div>
);

const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="relative">
    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search"
      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-[#0b7f9d] focus:outline-none"
    />
  </div>
);

const NumberFilter: React.FC<{
  operator: string;
  value: string;
  onOperatorChange: (v: string) => void;
  onValueChange: (v: string) => void;
}> = ({ operator, value, onOperatorChange, onValueChange }) => (
  <div className="flex gap-2">
    <select
      value={operator}
      onChange={(e) => onOperatorChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-2 text-sm"
    >
      <option value=">">{">"}</option>
      <option value="<">{"<"}</option>
      <option value="=">{"="}</option>
    </select>
    <input
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
      placeholder="Value"
      type="number"
    />
  </div>
);

/* ================= MAIN COMPONENT ================= */

const RequestForQuotation: React.FC = () => {
  const [data] = useState<RFQ[]>(mockData);

  const [creationStatus, setCreationStatus] = useState("Sent");
  const [conversionStatus, setConversionStatus] = useState("All");

  const [sortKey, setSortKey] = useState<keyof RFQ>("rfqNumber");
  const [sortAsc, setSortAsc] = useState(true);

  const [search, setSearch] = useState<Record<string, string>>({});
  const [numFilter, setNumFilter] = useState({
    suppliersSent: { op: ">", value: "" },
    bidsReceived: { op: ">", value: "" },
  });

  const handleSort = (key: keyof RFQ) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    result = result.filter((d) => d.creationStatus === creationStatus);

    if (conversionStatus !== "All") {
      result = result.filter(
        (d) => d.conversionStatus === conversionStatus
      );
    }

    Object.entries(search).forEach(([key, value]) => {
      if (!value) return;
      result = result.filter((row) =>
        String((row as any)[key])
          .toLowerCase()
          .includes(value.toLowerCase())
      );
    });

    ["suppliersSent", "bidsReceived"].forEach((key) => {
      const filter = (numFilter as any)[key];
      if (!filter.value) return;
      result = result.filter((row: any) => {
        if (filter.op === ">") return row[key] > Number(filter.value);
        if (filter.op === "<") return row[key] < Number(filter.value);
        return row[key] === Number(filter.value);
      });
    });

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, creationStatus, conversionStatus, search, numFilter, sortKey, sortAsc]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Request For Quotation</h1>
          <span className="text-gray-400 cursor-pointer">ⓘ</span>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition">
          <Plus size={16} />
          Create RFQ
          <span className="ml-2 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-md">
            PRO
          </span>
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white border rounded-2xl shadow-sm p-6 mb-6 flex gap-10">
        <SelectField
          label="Creation Status"
          value={creationStatus}
          options={["Sent", "Draft"]}
          onChange={setCreationStatus}
        />

        <SelectField
          label="Conversion Status"
          value={conversionStatus}
          options={["All", "Converted", "Not Converted"]}
          onChange={setConversionStatus}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-[#d7e9f1] text-gray-800">
            <tr>
              {[
                { label: "RFQ Number", key: "rfqNumber" },
                { label: "Suppliers Sent", key: "suppliersSent" },
                { label: "Bids Received", key: "bidsReceived" },
                { label: "Delivery Date", key: "deliveryDate" },
                { label: "Bidding Status", key: "biddingStatus" },
                { label: "Close Date", key: "closeDate" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof RFQ)}
                  className="p-4 text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              ))}
            </tr>

            {/* SEARCH ROW */}
            <tr className="bg-[#eaf4f8]">
              <td className="p-3">
                <SearchInput
                  value={search.rfqNumber || ""}
                  onChange={(v) =>
                    setSearch((p) => ({ ...p, rfqNumber: v }))
                  }
                />
              </td>

              <td className="p-3">
                <NumberFilter
                  operator={numFilter.suppliersSent.op}
                  value={numFilter.suppliersSent.value}
                  onOperatorChange={(v) =>
                    setNumFilter((p) => ({
                      ...p,
                      suppliersSent: { ...p.suppliersSent, op: v },
                    }))
                  }
                  onValueChange={(v) =>
                    setNumFilter((p) => ({
                      ...p,
                      suppliersSent: { ...p.suppliersSent, value: v },
                    }))
                  }
                />
              </td>

              <td className="p-3">
                <NumberFilter
                  operator={numFilter.bidsReceived.op}
                  value={numFilter.bidsReceived.value}
                  onOperatorChange={(v) =>
                    setNumFilter((p) => ({
                      ...p,
                      bidsReceived: { ...p.bidsReceived, op: v },
                    }))
                  }
                  onValueChange={(v) =>
                    setNumFilter((p) => ({
                      ...p,
                      bidsReceived: { ...p.bidsReceived, value: v },
                    }))
                  }
                />
              </td>

              <td></td>

              <td className="p-3">
                <SearchInput
                  value={search.biddingStatus || ""}
                  onChange={(v) =>
                    setSearch((p) => ({ ...p, biddingStatus: v }))
                  }
                />
              </td>

              <td></td>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-4">
                    <FileText size={48} className="text-gray-300" />
                    No data found
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4">{row.rfqNumber}</td>
                  <td className="p-4">{row.suppliersSent}</td>
                  <td className="p-4">{row.bidsReceived}</td>
                  <td className="p-4">{row.deliveryDate}</td>
                  <td className="p-4">{row.biddingStatus}</td>
                  <td className="p-4">{row.closeDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestForQuotation;