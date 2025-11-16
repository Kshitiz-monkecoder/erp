import React, { useRef, useEffect, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {get} from "../../../lib/apiService"

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuyer?: (buyer: any) => void; // for ShowBuyers
  onSelectSupplier?: (supplier: any) => void; // for ShowSuppliers
}

const ShowBuyers: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  onSelectBuyer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
       
        const data = await get("/client");

        const filteredBuyers = (data.data || []).filter(
          (client: any) =>
            client.clientType === "Buyer" || client.clientType === "Both",
        );

        setBuyers(filteredBuyers);

        // Set initial selected buyer after buyers are loaded
        const savedBuyer = localStorage.getItem("selectedBuyer");
        if (savedBuyer) {
          try {
            const parsedBuyer = JSON.parse(savedBuyer);
            console.log("Parsed buyer from localStorage:", parsedBuyer);

            // Check if this buyer exists in the fetched buyers list
            const buyerExists = filteredBuyers.find(
              (buyer: any) => buyer.id == parsedBuyer.id,
            );
            if (buyerExists) {
              setSelectedBuyerId(String(parsedBuyer.id));
              console.log("Setting selected buyer ID:", String(parsedBuyer.id));
            }
          } catch (error) {
            console.error("Error parsing saved buyer:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching buyers:", error);
      }
    };

    if (isOpen) fetchBuyers();
  }, [isOpen]);

  useEffect(() => {
    const selectedBuyer = buyers.find((b) => b.id == selectedBuyerId);
    if (selectedBuyer) {
      localStorage.setItem("selectedBuyer", JSON.stringify(selectedBuyer));
      onSelectBuyer?.(selectedBuyer); // ✅ Call the parent callback
    }
  }, [selectedBuyerId, buyers, onSelectBuyer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Please Add/Select Buyer
          </h4>
          <X className="text-[#8A8AA3] cursor-pointer w-5" onClick={onClose} />
        </div>

        <div className="p-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-3">
              <Label className={labelClasses} htmlFor="selectBuyer">
                Select Buyer <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Link
                to="/add-company"
                className="flex text-[#7047EB] underline underline-offset-3 text-xs items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4" />
                Add New Company
              </Link>
            </div>

            <Select
              value={selectedBuyerId}
              onValueChange={(value) => {
                console.log("Selected buyer ID:", value);
                setSelectedBuyerId(value);
              }}
            >
              <SelectTrigger className={`${inputClasses} w-full`}>
                <SelectValue placeholder="Select a Buyer" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(buyers || []).map((buyer) => (
                    <SelectItem key={buyer.id} value={String(buyer.id)}>
                      {buyer.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowBuyers;
