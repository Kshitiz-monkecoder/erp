import { useSearchParams } from "react-router-dom";
import Indent from "./Indent";
import RequestForQuotation from "./RequestForQuotation";
import ResourcePlanningDashboard from "./ResourcePlanningDashboard";

export default function ResourcePlanning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "resource-planning";

  const tabs = [
    { label: "Resource Planning", value: "resource-planning" },
    { label: "Indent", value: "indent" },
    { label: "Request For Quotation", value: "rfq" },
  ];

  const renderTab = () => {
    switch (tab) {
      case "indent":
        return <Indent />;

      case "rfq":
        return <RequestForQuotation />;

      default:
        return <ResourcePlanningDashboard />;
    }
  };

  return (
    <div className="w-full">
      {/* Tabs Header */}
      <div className="sticky top-12 bg-white border-b border-gray-200 z-40">
        <div className="flex gap-10 px-6 overflow-x-auto">
          {tabs.map((t) => {
            const active = tab === t.value;

            return (
              <button
                key={t.value}
                onClick={() => setSearchParams({ tab: t.value })}
                className={`relative pb-3 text-base font-medium transition-colors whitespace-nowrap
                  ${
                    active
                      ? "text-[#0b7f9d]"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {t.label}

                {active && (
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#0b7f9d] rounded"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-gray-50 min-h-screen">
        {renderTab()}
      </div>
    </div>
  );
}