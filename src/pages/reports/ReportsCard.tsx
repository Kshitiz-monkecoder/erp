import React, { useState } from "react";
import { post } from "@/lib/apiService";
import ErrorToast from "@/components/app/toasts/ErrorToast";

// interface DateRangePayload {
//   startDate: string | null;
//   endDate: string | null;
//   isComplete?: boolean;
// }

const ReportsCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Dates initially empty (professional default state)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isComplete, setIsComplete] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("monthly");

  const openModal = (cardKey: string) => {
    setSelectedCard(cardKey);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStartDate("");
    setEndDate("");
    setIsComplete(true);
    setFilterType("monthly");
  };

  const handleGenerateReport = async () => {
    try {
      let endpoint = "";
      let payload: any = {};

      switch (selectedCard) {
        case "overview":
          endpoint = "/bi/purchase/overview";
          payload = {
            startDate: startDate || null,
            endDate: endDate || null,
            isComplete,
          };
          break;

        case "pending":
          endpoint = "/bi/purchase/pending-orders";
          payload = { filterType };
          break;

        case "topPending":
          endpoint = "/bi/purchase/top-pending-orders";
          payload = {
            startDate: startDate || null,
            endDate: endDate || null,
          };
          break;

        case "approvedVsRejected":
          endpoint = "/bi/purchase/approved-vs-rejected";
          payload = {
            startDate: startDate || null,
            endDate: endDate || null,
          };
          break;

        case "topOrders":
          endpoint = "/bi/purchase/top-orders";
          payload = {
            startDate: startDate || null,
            endDate: endDate || null,
          };
          break;

        default:
          return;
      }

      console.log("API:", endpoint);
      console.log("Payload:", payload);

      await post(endpoint, payload);

      closeModal();
    } catch (err) {
      ErrorToast({
        title: "Failed to generate report",
        description: "Something went wrong",
      });
    }
  };

  const Card = ({
    title,
    description,
    cardKey,
  }: {
    title: string;
    description: string;
    cardKey: string;
  }) => (
    <div
      onClick={() => openModal(cardKey)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 cursor-pointer border border-gray-100"
    >
      <h3 className="text-blue-600 font-semibold text-lg">{title}</h3>
      <p className="text-gray-500 text-sm mt-3 leading-relaxed">
        {description}
      </p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Report</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card
          cardKey="overview"
          title="Total Purchase Overview"
          description="Comprehensive summary of purchase value and order completion."
        />

        <Card
          cardKey="pending"
          title="Pending Goods Orders"
          description="Track pending goods orders by daily, monthly or yearly filter."
        />

        <Card
          cardKey="topPending"
          title="Top Pending Orders"
          description="Identify highest-value pending orders within date range."
        />

        <Card
          cardKey="approvedVsRejected"
          title="Approved vs Rejected"
          description="Compare approved and rejected purchase orders."
        />

        <Card
          cardKey="topOrders"
          title="Top Purchase Orders"
          description="View top performing purchase orders by value."
        />
      </div>

      {/* Professional Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

          {/* Professional subtle overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 z-10 animate-fadeIn">

            <h2 className="text-2xl font-semibold mb-2">
              Generate {selectedCard} Report
            </h2>

            <p className="text-gray-500 mb-6">
              Select filters and generate report
            </p>

            {/* Date Fields (Only for applicable cards) */}
            {selectedCard !== "pending" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Creation Date (From)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Creation Date (To)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Overview Specific */}
            {selectedCard === "overview" && (
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={(e) => setIsComplete(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">
                  Completed Orders Only
                </label>
              </div>
            )}

            {/* Pending Filter */}
            {selectedCard === "pending" && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Filter Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-5 py-2 border rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleGenerateReport}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsCard;