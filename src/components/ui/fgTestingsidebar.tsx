// src/components/production/FGTestingSidebar.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Paperclip,
  RefreshCw,
  BarChart2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface FGTestingData {
  fgId: number;
  fgName: string;
  tested: number;
  passed: number;
  forRepair: number;
  rejected: number;
  comment: string;
}

export interface FGTestingSidebarProps {
  open: boolean;
  onClose: () => void;
  fgItems: Array<{
    id: number;
    itemName?: string;
    tested_quantity: number;
    accept_quantity: number;
    forRepair?: number;
    reject_quantity: number;
    comment: string | null;
  }>;
  /** Called when user clicks Mark Tested */
  onMarkTested: (data: FGTestingData[]) => Promise<void>;
  onRefresh?: () => void;
}

// ─────────────────────────────────────────────
// Floating label input
// ─────────────────────────────────────────────
const FloatInput: React.FC<{
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}> = ({ label, value, onChange, type = "number", readOnly = false }) => (
  <div className="relative border rounded-md px-3 pt-5 pb-2 bg-white focus-within:border-blue-500 transition-colors">
    <label className="absolute top-1.5 left-3 text-[10px] text-gray-400 font-medium pointer-events-none">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className="w-full text-sm font-medium text-gray-800 bg-transparent outline-none"
      min={0}
    />
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const FGTestingSidebar: React.FC<FGTestingSidebarProps> = ({
  open,
  onClose,
  fgItems,
  onMarkTested,
  onRefresh,
}) => {
  const [testingData, setTestingData] = useState<FGTestingData[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Initialise from props whenever sidebar opens or fgItems change
  useEffect(() => {
    if (!open) return;
    setTestingData(
      fgItems.map((fg) => ({
        fgId: fg.id,
        fgName: fg.itemName || "Finished Good",
        tested: fg.tested_quantity || 0,
        passed: fg.accept_quantity || 0,
        forRepair: fg.forRepair || 0,
        rejected: fg.reject_quantity || 0,
        comment: fg.comment || "",
      }))
    );
    setActiveIdx(0);
  }, [open, fgItems]);

  const active = testingData[activeIdx];

  const update = (field: keyof FGTestingData, val: any) => {
    setTestingData((prev) => {
      const next = [...prev];
      (next[activeIdx] as any)[field] = val;
      return next;
    });
  };

  const handleMarkTested = async () => {
    try {
      setSaving(true);
      await onMarkTested(testingData);
      toast.success("FG testing data saved!");
      onClose();
    } catch {
      toast.error("Failed to save testing data");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl border-l"
        style={{ width: "360px" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-[#105076]" />
            <h2 className="text-sm font-bold text-gray-900">FG Testing</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Templates and Docs link */}
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
              <ExternalLink className="h-3 w-3" />
              Templates and Docs
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── FG tabs (if multiple FGs) ── */}
        {fgItems.length > 1 && (
          <div className="flex gap-1 px-4 pt-3 flex-wrap shrink-0">
            {testingData.map((td, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  i === activeIdx
                    ? "bg-[#105076] text-white border-[#105076]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-[#105076]"
                }`}
              >
                {td.fgName || `FG ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {active ? (
            <>
              {/* FG Name heading */}
              <div className="text-sm font-bold text-gray-900 uppercase tracking-wide pb-1 border-b">
                {active.fgName}
              </div>

              {/* Fields */}
              <FloatInput
                label="Tested"
                value={active.tested}
                onChange={(v) => update("tested", Number(v) || 0)}
              />
              <FloatInput
                label="Passed"
                value={active.passed}
                onChange={(v) => update("passed", Number(v) || 0)}
              />
              <FloatInput
                label="For Repair"
                value={active.forRepair}
                onChange={(v) => update("forRepair", Number(v) || 0)}
              />
              <FloatInput
                label="Rejected"
                value={active.rejected}
                onChange={(v) => update("rejected", Number(v) || 0)}
              />

              {/* Comment */}
              <div className="relative border rounded-md px-3 pt-5 pb-2 bg-white focus-within:border-blue-500 transition-colors">
                <label className="absolute top-1.5 left-3 text-[10px] text-gray-400 font-medium pointer-events-none">
                  Comment
                </label>
                <textarea
                  value={active.comment}
                  onChange={(e) => update("comment", e.target.value)}
                  rows={3}
                  className="w-full text-sm text-gray-800 bg-transparent outline-none resize-none"
                  placeholder="Add a comment..."
                />
              </div>

              {/* Utility buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 text-xs justify-center border-dashed"
                  onClick={() => {
                    // File attach — placeholder
                    toast.info("File attachment will be implemented");
                  }}
                >
                  <Paperclip className="h-3.5 w-3.5 text-gray-500" />
                  Attach files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 text-xs justify-center"
                  onClick={() => {
                    onRefresh?.();
                    toast.success("Data refreshed");
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                  Refresh Data
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No finished goods to test
            </div>
          )}
        </div>

        {/* ── Footer — Mark Tested ── */}
        <div className="border-t px-5 py-4 shrink-0">
          <Button
            onClick={handleMarkTested}
            disabled={saving || !active}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm h-10 flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            {saving ? "Saving..." : "Mark Tested"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default FGTestingSidebar;