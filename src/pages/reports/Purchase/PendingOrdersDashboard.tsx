import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

/* ================= TYPES ================= */

type Status = "overdue" | "due" | "selected";

interface CalendarDay {
  day: string;
  date: number;
  pending: number;
  total: number;
  status: Status;
}

interface AggregateData {
  month: string;
  total: number;
  onTime: number;
  late: number;
  pending: number;
}

interface Order {
  id: string;
  po: string;
  supplier: string;
  createdBy: string;
  delivery: string;
  amount: number;
  pending: number;
  status: "Pending" | "Delayed" | "Critical";
}

/* ================= CALENDAR DATA ================= */

const weekData: CalendarDay[] = [
  { day: "MON", date: 2, pending: 2, total: 10, status: "overdue" },
  { day: "TUE", date: 3, pending: 0, total: 15, status: "overdue" },
  { day: "WED", date: 4, pending: 8, total: 25, status: "overdue" },
  { day: "THU", date: 5, pending: 4, total: 30, status: "selected" },
  { day: "FRI", date: 6, pending: 10, total: 35, status: "due" },
  { day: "SAT", date: 7, pending: 15, total: 40, status: "due" },
  { day: "SUN", date: 8, pending: 3, total: 20, status: "due" }
];

/* ================= AGGREGATE DATA ================= */

const aggregateData: AggregateData[] = [
  { month: "Nov 2025", total: 30, onTime: 5, late: 1, pending: 0.5 },
  { month: "Dec 2025", total: 60, onTime: 15, late: 30, pending: 15 },
  { month: "Jan 2026", total: 72, onTime: 30, late: 30, pending: 15 },
  { month: "Feb 2026", total: 90, onTime: 54, late: 24, pending: 12 },
  { month: "Mar 2026", total: 120, onTime: 90, late: 6, pending: 24 },
  { month: "Apr 2026", total: 135, onTime: 90, late: 0, pending: 45 }
];

/* ================= MOCK ORDERS ================= */

const generateOrders = (count: number, date: number): Order[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${date}-${i}`,
    po: `PO-${date}${100 + i}`,
    supplier: ["Steel Corp", "Alpha Metals", "Iron Ltd", "Global Parts"][i % 4],
    createdBy: ["Rahul", "Priya", "Amit", "Neha"][i % 4],
    delivery: `Mar ${date + (i % 3)}, 2026`,
    amount: 5000 + i * 1200,
    pending: 2000 + i * 500,
    status: ["Pending", "Delayed", "Critical"][i % 3] as Order["status"]
  }));

/* Different data per date */
const mockOrdersByDate: Record<number, Order[]> = {
  2: generateOrders(2, 2),     // few orders
  3: [],                       // empty state
  4: generateOrders(18, 4),    // large dataset
  5: generateOrders(5, 5),     // realistic dataset
  6: generateOrders(8, 6),
  7: generateOrders(12, 7),
  8: generateOrders(3, 8)
};

/* ================= HELPERS ================= */

const statusColor = (status: Status) => {
  switch (status) {
    case "overdue":
      return "bg-yellow-100";
    case "due":
      return "bg-blue-100";
    case "selected":
      return "bg-green-200";
  }
};

/* ================= MAIN COMPONENT ================= */

const PendingOrdersDashboard: React.FC = () => {
  const [view, setView] = useState<"calendar" | "aggregate">("calendar");
  const [selectedDate, setSelectedDate] = useState<number>(5);

  

  const ordersForDate = useMemo(
    () => mockOrdersByDate[selectedDate] ?? [],
    [selectedDate]
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="bg-white rounded-lg shadow p-6">

        <Header view={view} setView={setView} />

        {view === "calendar" ? (
          <>
            <CalendarView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <LegendRow />
          </>
        ) : (
          <AggregateView />
        )}

        <TopOrders
          selectedDate={selectedDate}
          orders={ordersForDate}
        />

      </div>
    </div>
  );
};

export default PendingOrdersDashboard;

/* ================= HEADER ================= */

const Header = ({
  view,
  setView
}: {
  view: "calendar" | "aggregate";
  setView: (v: "calendar" | "aggregate") => void;
}) => (
  <div className="flex justify-between items-center mb-6">

    <h2 className="text-xl font-semibold">
      Daily/Monthly Pending Orders (Goods only)
    </h2>

    <div className="flex border rounded-lg overflow-hidden">

      <button
        onClick={() => setView("calendar")}
        className={`px-4 py-2 ${
          view === "calendar"
            ? "bg-green-600 text-white"
            : "bg-gray-100"
        }`}
      >
        Calendar View
      </button>

      <button
        onClick={() => setView("aggregate")}
        className={`px-4 py-2 ${
          view === "aggregate"
            ? "bg-green-600 text-white"
            : "bg-white"
        }`}
      >
        Aggregate View
      </button>

    </div>
  </div>
);

/* ================= CALENDAR ================= */

const CalendarView = ({
  // selectedDate,
  setSelectedDate
}: {
  selectedDate: number;
  setSelectedDate: (d: number) => void;
}) => (
  <div className="grid grid-cols-7 border rounded overflow-hidden">

    {weekData.map((day) => (
      <div
        key={day.date}
        onClick={() => setSelectedDate(day.date)}
        className={`p-4 border cursor-pointer hover:brightness-95 ${statusColor(
          day.status
        )}`}
      >
        <div className="text-xs text-gray-500">{day.day}</div>

        <div className="text-sm font-semibold">{day.date}</div>

        <div className="text-3xl font-semibold mt-2">
          {day.pending}
          <span className="text-sm text-gray-500">/{day.total}</span>
        </div>
      </div>
    ))}

  </div>
);

/* ================= LEGEND ================= */

const LegendRow = () => (
  <div className="flex gap-6 mt-4 text-sm text-gray-600">

    <LegendItem color="bg-green-300" label="Selected" />
    <LegendItem color="bg-yellow-200" label="Overdue" />
    <LegendItem color="bg-blue-200" label="Due" />

  </div>
);

const LegendItem = ({
  color,
  label
}: {
  color: string;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 ${color} rounded`} />
    {label}
  </div>
);

/* ================= TOP ORDERS ================= */

const TopOrders = ({
  selectedDate,
  orders
}: {
  selectedDate: number;
  orders: Order[];
}) => (
  <div className="mt-8">

    <div className="flex justify-between items-center mb-4">

      <h3 className="font-semibold">
        Top pending orders of Mar {selectedDate}
      </h3>

    </div>

    <OrdersTable
      orders={orders}
      selectedDate={selectedDate}
    />

  </div>
);

/* ================= TABLE ================= */

const OrdersTable = ({
  orders,
  selectedDate
}: {
  orders: Order[];
  selectedDate: number;
}) => {

  if (orders.length === 0)
    return <EmptyState selectedDate={selectedDate} />;

  return (
    <div className="border rounded overflow-hidden">

      <div className="max-h-[320px] overflow-y-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600 text-left sticky top-0">
            <tr>
              <th className="p-3">PO Number</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Delivery</th>
              <th className="p-3">PO Amount</th>
              <th className="p-3">Pending</th>
            </tr>
          </thead>

          <tbody>

            {orders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-gray-50">

                <td className="p-3">{order.po}</td>
                <td className="p-3">{order.supplier}</td>
                <td className="p-3">{order.createdBy}</td>
                <td className="p-3">{order.delivery}</td>
                <td className="p-3">₹{order.amount}</td>
                <td className="p-3">₹{order.pending}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      <div className="text-right p-4 text-green-600 cursor-pointer hover:underline">
        View all Pending Orders
      </div>

    </div>
  );
};

/* ================= EMPTY ================= */

const EmptyState = ({ selectedDate }: { selectedDate: number }) => (
  <div className="flex flex-col items-center py-16 text-gray-500">
    No orders for Mar {selectedDate}
  </div>
);

/* ================= AGGREGATE VIEW ================= */

const AggregateView: React.FC = () => (
  <div className="h-[420px] w-full mt-6">

    <ResponsiveContainer width="100%" height="100%">

      <BarChart data={aggregateData}>

        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="month" />

        <YAxis />

        <Tooltip />

        <Legend />

        <Bar dataKey="total" fill="#9BD5A7" />

        <Bar dataKey="onTime" fill="#7DD3C7" />

        <Bar dataKey="late" fill="#9EC7E0" />

        <Bar dataKey="pending" fill="#5DB1B1" />

      </BarChart>

    </ResponsiveContainer>

  </div>
);