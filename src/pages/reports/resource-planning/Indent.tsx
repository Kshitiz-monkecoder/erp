import React, { useMemo, useState } from "react";
import { ChevronDown, ArrowUpDown, Search, Plus } from "lucide-react";

/* ============================= */
/* Types */
/* ============================= */

export interface Indent {
  id: string;
  indentNo: string;
  linkedPO?: string;
  status: "Sent" | "Draft" | "Approved";
  documentDate: string;
  items: number;
  createdBy: string;
  expectedBy: string;
  store: string;
  requiredFor: string;
  markedCompleteBy?: string;
  markedCompleteDate?: string;
}

/* ============================= */
/* Mock Data */
/* ============================= */

const mockData: Indent[] = [
  {
    id: "1",
    indentNo: "IND-0012",
    linkedPO: "PO-9087",
    status: "Sent",
    documentDate: "2026-03-01",
    items: 5,
    createdBy: "Rahul",
    expectedBy: "2026-03-10",
    store: "Mumbai",
    requiredFor: "Maintenance",
  },
  {
    id: "2",
    indentNo: "IND-0013",
    status: "Draft",
    documentDate: "2026-03-02",
    items: 3,
    createdBy: "Ankit",
    expectedBy: "2026-03-12",
    store: "Delhi",
    requiredFor: "Operations",
  },
];

/* ============================= */
/* Reusable Components */
/* ============================= */

const Select: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-gray-600">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none"
    />
  </div>
);

/* ============================= */
/* Main Page */
/* ============================= */

const Indent: React.FC = () => {
  const [data] = useState<Indent[]>(mockData);
  const [indentStatus, setIndentStatus] = useState("Sent");
  const [canPO, setCanPO] = useState("Yes");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sortKey, setSortKey] = useState<keyof Indent>("indentNo");
  const [sortAsc, setSortAsc] = useState(true);

  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});

  /* Sorting */
  const handleSort = (key: keyof Indent) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  /* Filter + Search + Sort */
  const filteredData = useMemo(() => {
    let result = [...data];

    if (statusFilter !== "All") {
      result = result.filter((d) => d.status === statusFilter);
    }

    Object.entries(columnSearch).forEach(([key, value]) => {
      if (!value) return;
      result = result.filter((row) =>
        String((row as any)[key])
          ?.toLowerCase()
          .includes(value.toLowerCase())
      );
    });

    result.sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, statusFilter, columnSearch, sortKey, sortAsc]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Indent</h1>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition">
          <Plus size={16} />
          Create Indent
          <span className="ml-2 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-md">
            PRO
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6 grid grid-cols-3 gap-6">
        <Select
          label="Indent Status"
          value={indentStatus}
          options={["Sent", "Draft", "Approved"]}
          onChange={setIndentStatus}
        />
        <Select
          label="Can PO be created?"
          value={canPO}
          options={["Yes", "No"]}
          onChange={setCanPO}
        />
        <Select
          label="Status"
          value={statusFilter}
          options={["All", "Sent", "Draft", "Approved"]}
          onChange={setStatusFilter}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-sky-100 text-gray-700">
            <tr>
              <th className="p-3">
                <input type="checkbox" />
              </th>

              {[
                { label: "Indent No", key: "indentNo" },
                { label: "Linked Purchase Order", key: "linkedPO" },
                { label: "Status", key: "status" },
                { label: "Document Date", key: "documentDate" },
                { label: "No. of Items", key: "items" },
                { label: "Created By", key: "createdBy" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof Indent)}
                  className="p-3 text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    <ArrowUpDown size={14} />
                  </div>
                </th>
              ))}

              <th className="p-3 text-left">Actions</th>
            </tr>

            {/* Column Search */}
            <tr className="bg-sky-50">
              <td></td>
              {[
                "indentNo",
                "linkedPO",
                "status",
                "documentDate",
                "items",
                "createdBy",
              ].map((key) => (
                <td key={key} className="p-2">
                  <SearchInput
                    value={columnSearch[key] || ""}
                    onChange={(v) =>
                      setColumnSearch((prev) => ({
                        ...prev,
                        [key]: v,
                      }))
                    }
                  />
                </td>
              ))}
              <td></td>
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3">{row.indentNo}</td>
                  <td className="p-3">{row.linkedPO || "-"}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">{row.documentDate}</td>
                  <td className="p-3">{row.items}</td>
                  <td className="p-3">{row.createdBy}</td>
                  <td className="p-3">
                    <button className="text-emerald-600 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Indent;