import { Button } from "@/components/ui/button";
import clsx from "clsx";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import BuyersAndSuppliersTable from "@/components/app/tables/BuyersAndSuppliersTable";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
type Item = {
  id: string;
  companyName: string;
  companyAddress: string;
  category: string;
  contactNumber: string;
  addedDate: string;
  tags: string[];
};
import{ get} from "@/lib/apiService"; 
const BuyerAndSupplier: React.FC = () => {
  const [updatedItems, setUpdatedItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [allTags, setAllTags] = useState<string[]>([]); // State to store all tags
  const [selectedTag, setSelectedTag] = useState<string>("none");

  const location = useLocation();
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab"); // extracting tab value here to highlight current nested value

  useEffect(() => {
    if (searchParams.size === 0) {
      navigateTo("/buyers-suppliers?tab=all");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let result = await get(`/client`);
      console.log(result.data);
      if (result.data) {
        const fetchedTags = result.data.flatMap((item: any) =>
          item.tags.map((tag: any) => tag.name),
        ) as string[];
        const uniqueTags = Array.from(new Set(fetchedTags));
        console.log(uniqueTags);
        setAllTags(uniqueTags); // Set the unique tags to state
        result = result.data.map((item: any) => ({
          id: item.id,
          companyName: item.companyName,
          companyAddress:
            item.addressLine1 + " " + item.addressLine2 + " " + item.city,
          // +item.state.name+item.country.name,
          category: item.clientType,
          contactNumber: item.phoneNo,
          addedDate: formatDate(item.createdAt),
          tags: item.tags.map((tag: any) => tag.name),
          ...item,
        }));
      }

      if (result.length === 0 || !result.data) {
        setIsEmpty(true);
      }

      setUpdatedItems(result);
      setIsLoading(false);
    };
    fetchData();
  }, [tab]);

  const tabLinks = [
    {
      name: "All",
      link: "all",
    },
    {
      name: "Buyer",
      link: "buyer",
    },
    {
      name: "Supplier",
      link: "supplier",
    },
  ];

  const filteredItems =
    selectedTag === "none"
      ? updatedItems
      : updatedItems.filter((item) => item.tags.includes(selectedTag));

  // const inputClasses: string = "border-neutral-200/70 focus-visible:ring-0";
  return (
    <div className="min-h-screen bg-neutral-50 pl-5 py-7 ">
      <div className="flex items-center gap-2 px-5">
        {tabLinks.map((tabLink) => {
          return (
            <Link
              to={`/buyers-suppliers?tab=${tabLink.link}`}
              key={tabLink.name}
            >
              <Button
                key={tabLink.name}
                className={clsx(
                  "bg-neutral-100 duration-150 hover:bg-neutral-200 shadow-none text-neutral-700",
                  {
                    "bg-neutral-200": tabLink.link === tab, // Highlight the active tab
                  },
                )}
              >
                {tabLink.name}
              </Button>
            </Link>
          );
        })}

        <div className="px-5">
          <div className="flex items-center gap-2 group relative max-w-32">
            <Label className="absolute rounded-full text-neutral-400 font-normal bg-neutral-50 start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs">
              Tags
            </Label>

            <Select
              value={selectedTag}
              onValueChange={(value) => setSelectedTag(value)}
            >
              <SelectTrigger className="focus-visible:ring-0 shadow-none">
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <BuyersAndSuppliersTable
          isEmpty={isEmpty}
          tab={tab}
          updatedItems={filteredItems}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default BuyerAndSupplier;
