import { IModalProps } from "@/lib/types";
import React, { useRef, useEffect, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Plus, X } from "lucide-react";
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
// import { useNavigate } from "react-router-dom";
import {get} from "../../../lib/apiService"
interface ISelectBuyerModalProps extends IModalProps {
  onContinue: (buyerId: string) => void;
}

const SelectBuyerModal: React.FC<ISelectBuyerModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
  //   const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const selectedBuyer = buyers.find((s) => s.id == selectedBuyerId);
    if (selectedBuyer) {
      localStorage.setItem("selectedBuyer", JSON.stringify(selectedBuyer));
      console.log("Stored buyer:", selectedBuyer);

      onContinue(selectedBuyerId);
      onClose();
    }
  };

  useEffect(() => {
    const fetchBuyers = async () => {
      try {

        const data = await get("/client");
        const filteredBuyers = (data.data || []).filter(
          (client: any) =>
            client.clientType === "Buyer" || client.clientType === "Both",
        );

        setBuyers(filteredBuyers);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      }
    };

    if (isOpen) fetchBuyers();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
            <h4 className="font-semibold md:text-lg lg:text-xl">
              Please Add/Select Buyer
            </h4>
            <X
              className="text-[#8A8AA3] cursor-pointer w-5"
              onClick={onClose}
            />
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
                onValueChange={(value) => setSelectedBuyerId(value)}
              >
                <SelectTrigger className={`${inputClasses} w-full`}>
                  <SelectValue placeholder="Select a Buyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(buyers || []).map((buyer) => (
                      <SelectItem key={buyer.id} value={String(buyer.id)}>
                        {buyer.companyName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 text-right">
              <button
                type="submit"
                className="bg-[#7047EB] text-white px-4 py-2 rounded hover:bg-[#5c3cc2]"
              >
                Continue
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectBuyerModal;
