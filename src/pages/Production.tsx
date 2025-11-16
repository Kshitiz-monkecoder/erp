import AllProductionTable from "@/components/app/tables/production/AllProductionTable";
import BillOfMaterialTable from "@/components/app/tables/production/BillOfMaterialTable";
import SubContractTable from "@/components/app/tables/production/SubContractTable";
import WorkOrdersTable from "@/components/app/tables/production/WorkOrdersTable";
import { Button } from "@/components/ui/button";
import { ProductionSubLinks } from "@/lib/subnavLinks";
import clsx from "clsx";
import React from "react";
import { Link } from "react-router";
import { useLocation } from "react-router";

const Production: React.FC = () => {
  const location = useLocation();
  // const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab");
  return (
    <div className="min-h-screen bg-neutral-50 pl-5 pt-7">
      <div className="flex flex-wrap items-center gap-2 px-5">
        {ProductionSubLinks.map((tabLink) => {
          return (
            <Link to={`${tabLink.link}`} key={tabLink.name}>
              <Button
                key={tabLink.name}
                className={clsx(
                  "bg-neutral-100 duration-150 hover:bg-neutral-200 shadow-none text-neutral-700",
                  {
                    "bg-neutral-200":
                      new URLSearchParams(tabLink.link.split("?")[1]).get(
                        "tab",
                      ) === tab, // Highlight the active tab
                  },
                )}
              >
                {tabLink.name}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="mt-6">
        {tab === "all-production-process" ? (
          <AllProductionTable />
        ) : tab === "work-orders" ? (
          <WorkOrdersTable />
        ) : tab === "sub-contract" ? (
          <SubContractTable />
        ) : tab === "bill-of-materials" ? (
          <BillOfMaterialTable />
        ) : (
          ""
        )}
      </div>
    </div>
  );
};
export default Production;
