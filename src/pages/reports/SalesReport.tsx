import  { useEffect, useState } from "react";
import { post } from "@/lib/apiService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ------------------ Utility Formatters ------------------ */

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

/* ------------------ Role Check Stub ------------------ */

const hasPermission = (key: string) => {
  const role = localStorage.getItem("role");
  if (role === "ADMIN") return true;
  if (key === "VIEW_FINANCIALS" && role !== "ADMIN") return false;
  return true;
};

/* ------------------ Main Component ------------------ */

const SalesDashboard = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    isComplete: true,
  });

  const [data, setData] = useState<any>({});
  const [view, setView] = useState<"chart" | "table">("chart");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [overview, pending, topPending, quotations] =
        await Promise.all([
          post("/bi/sales/overview", filters),
          post("/bi/sales/pending-orders", { filterType: "daily" }),
          post("/bi/sales/top-pending-orders", filters),
          post("/bi/sales/top-quotations", filters),
        ]);

      setData({
        overview: overview.data,
        pending: pending.data,
        topPending: topPending.data,
        quotations: quotations.data,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleExport = async (type: "excel" | "pdf") => {
    const blob = await post("/bi/sales/export", { ...filters, type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report.${type === "excel" ? "xlsx" : "pdf"}`;
    a.click();
  };

  /* ------------------ Reusable Components ------------------ */

  const KpiCard = ({ title, value, drill }: any) => (
    <div
      className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition"
      onClick={() => drill && navigate(drill)}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-semibold mt-1">{value ?? 0}</h2>
    </div>
  );

  const Table = ({ rows }: any) => (
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          {rows?.[0] &&
            Object.keys(rows[0]).map((key) => (
              <th key={key} className="p-2 text-left capitalize">
                {key}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {rows?.map((row: any, i: number) => (
          <tr key={i} className="border-b">
            {Object.values(row).map((val: any, j) => (
              <td key={j} className="p-2">
                {typeof val === "string" && val.includes("T")
                  ? formatDate(val)
                  : val}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  /* ------------------ UI ------------------ */

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">Sales BI Dashboard</h1>

        <div className="flex gap-3 flex-wrap">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="border p-2 rounded"
          />

          <button
            onClick={fetchData}
            className="bg-gray-200 px-3 py-2 rounded flex items-center gap-1"
          >
            <RefreshCw size={16} /> Sync
          </button>

          <button
            onClick={() => handleExport("excel")}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            <Download size={16} /> Excel
          </button>

          <button
            onClick={() => handleExport("pdf")}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            PDF
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {hasPermission("VIEW_FINANCIALS") && (
          <KpiCard
            title="Total Sales"
            value={formatCurrency(data?.overview?.totalSalesValue)}
            drill="/sales/orders"
          />
        )}
        <KpiCard
          title="Orders Created"
          value={data?.overview?.totalOrdersCreated}
        />
        <KpiCard
          title="Completed"
          value={data?.overview?.totalCompletedOrders}
        />
        <KpiCard
          title="Pending"
          value={data?.overview?.totalPendingOrders}
          drill="/sales/orders?status=pending"
        />
        <KpiCard
          title="Cancelled"
          value={data?.overview?.totalCancelledOrders}
        />
        <KpiCard
          title="Conversion Rate"
          value={data?.overview?.conversionRate}
        />
      </div>

      {/* Chart + Table Dual View */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Daily Pending Orders</h3>
          <div className="flex gap-2">
            <button onClick={() => setView("chart")}>Chart</button>
            <button onClick={() => setView("table")}>Table</button>
          </div>
        </div>

        {view === "chart" ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.pending || []}>
              <XAxis dataKey="orderNumber" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orderValue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Table rows={data?.pending || []} />
        )}
      </div>

      {/* Top Pending */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <h3 className="font-semibold mb-4">Top 5 Pending Orders</h3>
        <Table rows={data?.topPending || []} />
      </div>

      {/* Top Quotations */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <h3 className="font-semibold mb-4">
          Top 5 Quotations (Last 7 Days)
        </h3>
        <Table rows={data?.quotations || []} />
      </div>

      {loading && (
        <div className="text-center text-gray-500">Loading data...</div>
      )}
    </div>
  );
};

export default SalesDashboard;