// src/components/production/StoreIssueApprovalDialog.tsx
import React, {  useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Printer,
  Barcode,
  CheckCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ApprovalRow {
  /** sequential display number */
  seq: number;
  itemId: string;
  description: string;
  productCategory: string;
  /** e.g. "Issue from Store" | "Add to Store" | "Line Reject" */
  action: string;
  fromStore: string;
  toStore: string;
  documentQuantity: number;
  approvedQuantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  currentStock: number;
  comment: string;
}

export interface StoreIssueApprovalMeta {
  documentType: string;    // "Process RM" | "Process FG" | "Process Scrap" …
  documentAction: string;  // "Document Created"
  createdBy: string;
  approvedBy: string;
  comment: string;
  documentNumber: string;  // e.g. "PID00928/1"
  noOfItems: number;
  creationDate: string;
  approvalDate: string;
  referenceId: string;
}

export interface StoreIssueApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  processId: string;
  meta: StoreIssueApprovalMeta;
  rows: ApprovalRow[];
}

// ─────────────────────────────────────────────
// Helper: "APPROVED" stamp
// ─────────────────────────────────────────────
const ApprovedStamp: React.FC = () => (
  <div className="absolute top-4 left-6 z-10 pointer-events-none select-none">
    <div
      className="relative inline-flex items-center justify-center w-20 h-20"
      style={{ transform: "rotate(-12deg)" }}
    >
      <div
        className="absolute inset-0 rounded border-[3px] border-amber-500"
        style={{ borderRadius: "4px" }}
      />
      <span
        className="text-amber-500 font-extrabold text-[9px] tracking-widest uppercase text-center leading-tight"
        style={{ fontSize: "8.5px", letterSpacing: "0.12em" }}
      >
        APPROVED
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Meta field grid (top section)
// ─────────────────────────────────────────────
const MetaField: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex gap-2 text-xs">
    <span className="text-gray-500 whitespace-nowrap min-w-[110px]">{label}</span>
    <span className="font-medium text-gray-800 truncate">{value || "—"}</span>
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const StoreIssueApprovalDialog: React.FC<StoreIssueApprovalDialogProps> = ({
  open,
  onClose,
  processId,
  meta,
  rows,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Store Issue Approval - ${processId}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
        th { background: #e5f0f7; font-weight: 600; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; }
        .meta-field { display: flex; gap: 8px; }
        .meta-label { color: #666; min-width: 110px; }
        h2 { font-size: 15px; margin: 0 0 16px; }
        .stamp { color: #d97706; border: 2px solid #d97706; padding: 4px 8px; display: inline-block; transform: rotate(-12deg); font-weight: 800; font-size: 9px; letter-spacing: 0.12em; margin-bottom: 8px; }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0 relative">
          {/* Approved stamp */}
          <ApprovedStamp />

          {/* Title — offset so stamp doesn't overlap */}
          <DialogHeader className="ml-24">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Store Entry/Issue Approval &nbsp;
              <span className="text-[#105076]">({processId})</span>
            </DialogTitle>
          </DialogHeader>

          {/* Other Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-[#105076] hover:bg-[#0d4566] text-white text-xs font-semibold h-8 px-4 shrink-0"
              >
                OTHER ACTIONS
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="flex items-center gap-2 text-sm cursor-pointer"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 text-gray-500" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-sm cursor-pointer text-gray-400"
                disabled
              >
                <Barcode className="h-4 w-4" />
                Add Barcode Number
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5" ref={printRef}>

          {/* Meta info grid — 2 columns */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 mb-6 border-b pb-5">
            {/* Left column */}
            <div className="space-y-1.5">
              <MetaField label="Document Type" value={meta.documentType} />
              <MetaField label="Document Action" value={meta.documentAction} />
              <MetaField label="Created By" value={meta.createdBy} />
              <MetaField label="Approved By" value={meta.approvedBy} />
              <MetaField label="Comment" value={meta.comment} />
            </div>
            {/* Right column */}
            <div className="space-y-1.5">
              <MetaField label="Document Number" value={meta.documentNumber} />
              <MetaField label="No of Items" value={meta.noOfItems} />
              <MetaField label="Creation Date" value={meta.creationDate} />
              <MetaField label="Approval Date" value={meta.approvalDate} />
              <MetaField label="Reference Id" value={meta.referenceId} />
            </div>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm border rounded-lg">
              No changed items to display
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs min-w-[1000px]">
                <thead>
                  <tr style={{ backgroundColor: "#b2d8e8" }}>
                    {[
                      "#", "ITEM ID", "DESCRIPTION", "PRODUCT CATEGORY",
                      "ACTION", "FROM STORE", "TO STORE",
                      "DOCUMENT QUANTITY", "APPROVED QUANTITY",
                      "UNIT", "BASE QUANTITY", "BASE UNIT",
                      "CURRENT STOCK", "COMMENT",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left font-semibold text-gray-700 border-r last:border-r-0 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-3 py-2.5 border-r text-gray-500 text-center">{row.seq}</td>
                      <td className="px-3 py-2.5 border-r text-blue-600 font-medium whitespace-nowrap">
                        {row.itemId}
                      </td>
                      <td className="px-3 py-2.5 border-r whitespace-nowrap">{row.description}</td>
                      <td className="px-3 py-2.5 border-r text-gray-600">{row.productCategory || "—"}</td>
                      <td className="px-3 py-2.5 border-r whitespace-nowrap font-medium text-gray-700">
                        {row.action}
                      </td>
                      {/* From Store */}
                      <td className="px-3 py-2.5 border-r whitespace-nowrap text-blue-700">
                        {row.fromStore || "—"}
                      </td>
                      {/* To Store */}
                      <td className="px-3 py-2.5 border-r whitespace-nowrap text-blue-700">
                        {row.toStore || "—"}
                      </td>
                      <td className="px-3 py-2.5 border-r text-center font-medium">{row.documentQuantity}</td>
                      <td className="px-3 py-2.5 border-r text-center font-medium">{row.approvedQuantity}</td>
                      <td className="px-3 py-2.5 border-r text-center text-blue-600 font-medium">{row.unit}</td>
                      <td className="px-3 py-2.5 border-r text-center">{row.baseQuantity}</td>
                      <td className="px-3 py-2.5 border-r text-center">{row.baseUnit}</td>
                      <td
                        className={`px-3 py-2.5 border-r text-center font-medium ${
                          row.currentStock < 0 ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {row.currentStock.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{row.comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination footer */}
              <div className="flex items-center justify-end gap-3 px-4 py-2 border-t bg-gray-50 text-xs text-gray-600">
                <span>Rows per page:</span>
                <select className="border rounded px-1 py-0.5 text-xs bg-white">
                  <option>10</option><option>25</option><option>50</option>
                </select>
                <span>1–{rows.length} of {rows.length}</span>
                <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>◀</button>
                <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>▶</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t bg-white px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Document Approved
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreIssueApprovalDialog;