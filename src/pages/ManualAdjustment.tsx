import React, { useEffect, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import ManualAdjustmentTable from "@/components/app/tables/ManualAdjustmentTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockMovement {
  documentNumber: number;
  fromStore: string;
  toStore: string;
  numberOfItems: string;
  date: string;
  user: string;
  movementType: string;
  status: string;
  updatedAt: string;
  item: any;
  approvedBy?: string;
}
import { useNavigate } from "react-router-dom";
import {post} from "../lib/apiService"
const ManualAdjustment: React.FC = () => {
  const Navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const handleApproveTxn = () => {
    console.log("approved");
    post("/inventory/transfer/approve", {
      transferId: stockMovement?.documentNumber,
    })
      .then((data) => {
        console.log(data);
        Navigate("/inventory/?tab=stock-movement");
      })
      .catch((err) => {
        // Optionally handle error
        console.error(err);
      });
    setIsModalOpen(false);
  };

  const handleRejectTxn = () => {
    console.log("rejected");
     post("/inventory/transfer/reject", {
      transferId: stockMovement?.documentNumber,
    })
      .then((data) => {
        console.log(data);
        Navigate("/inventory/?tab=stock-movement");
      })
      .catch((err) => {
        // Optionally handle error
        console.error(err);
      });
    setIsRejectModalOpen(false);
  };

  const [stockMovement, setStockMovement] = useState<StockMovement | null>(
    null,
  );

  useEffect(() => {
    const data = localStorage.getItem("selectedStockMovement");
    if (data) {
      setStockMovement(JSON.parse(data));
    }
  }, [isModalOpen, isRejectModalOpen]);

  return (
    <div className="min-h-screen">
      <div className="bg-[#EEFBF4] px-8 py-4 flex justify-between items-center">
        <h3 className="font-normal">Manual Adjustment Details</h3>
        <EllipsisVertical className="w-4" />
      </div>
      <div className="p-7 lg:px-16 py-8">
        <div className="shadow-sm space-y-4 px-3 py-5">
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-semibold text-2xl">Manual Adjustment</h3>
            <div className="flex items-center gap-2">
              {/* <div className="rounded-md border px-2 flex items-center gap-1 border-gray-300 text-sm">
                <Printer className="w-3 text-[#3F3F50]" />
                Print
              </div>
              <div className="rounded-md border px-2 flex items-center gap-1 border-gray-300 text-sm">
                <Share2 className="w-3 text-[#3F3F50]" />
                Share
              </div> */}
            </div>
          </div>
          <div className="border px-5 py-6 text-sm">
            <h5 className="text-gray-400">Manual Adjustment Details</h5>
            <div className="grid mt-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1">
                <div>Document Number</div>
                <div className="text-xs">
                  {stockMovement?.documentNumber ?? "-"}
                </div>
              </div>
              <div className="space-y-1">
                <div>Created By</div>
                <div className="text-xs">{stockMovement?.user ?? "-"}</div>
              </div>
              <div className="space-y-1">
                <div>To Store</div>
                <div className="text-xs">{stockMovement?.toStore ?? "-"}</div>
              </div>
              <div className="space-y-1">
                <div>Date:</div>
                <div className="text-xs">{stockMovement?.date ?? "-"}</div>
              </div>
            </div>
          </div>
          <ManualAdjustmentTable itemid={stockMovement?.item?.id} />
          {/* Signature Card  */}
          {/* <div>
            <div className="p-3 space-y-8 text-sm bg-gray-100 w-fit">
              <div>For Ramesh PVT. LTD.</div>
              <div className="text-gray-400">Authorised Signatory</div>
            </div>
          </div> */}
          {!stockMovement?.approvedBy && (
            <div className="flex gap-2">
              <Button
                className="bg-[#7047EB] h-8 text-sm text-white hover:bg-[#7047EB]"
                onClick={() => setIsModalOpen(true)}
              >
                Approve Transfer
              </Button>
              <Button
                className="bg-[#D14343] h-8 text-sm text-white hover:bg-[#b13a3a]"
                onClick={() => setIsRejectModalOpen(true)}
              >
                Reject Transfer
              </Button>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to approve?</DialogTitle>
                  </DialogHeader>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#7047EB] h-8 text-sm text-white hover:bg-[#7047EB]"
                      onClick={handleApproveTxn}
                    >
                      Yes, Approve
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={isRejectModalOpen}
                onOpenChange={setIsRejectModalOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure you want to reject?</DialogTitle>
                  </DialogHeader>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#D14343] h-8 text-sm text-white hover:bg-[#b13a3a]"
                      onClick={handleRejectTxn}
                    >
                      Yes, Reject
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {stockMovement?.approvedBy && stockMovement.status == "APPROVED" && (
            <div className="flex items-center gap-3 mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="font-semibold text-green-700">Approved By:</div>
              <div className="text-green-900">{stockMovement.approvedBy}</div>
            </div>
          )}

          {stockMovement?.approvedBy && stockMovement.status === "REJECTED" && (
            <div className="flex items-center gap-3 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="font-semibold text-red-700">Rejected By:</div>
              <div className="text-red-900">{stockMovement.approvedBy}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualAdjustment;
