import React  from "react";
import ProductionOverview from "./Production/ProductionOverview";
import PendingOrdersProduction from "./Production/PendingOrdersProduction";
import ProductionPerformance from "./Production/ProductionPerformance";

const ProductionReport: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <ProductionOverview />
        <PendingOrdersProduction />
        <ProductionPerformance />
      </div>
    </div>
  );
};

export default ProductionReport;