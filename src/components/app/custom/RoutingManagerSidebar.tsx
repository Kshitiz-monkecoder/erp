// src/components/ui/RoutingManagerSidebar.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Save,
  Loader2,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { routingAPI, type Routing } from "@/services/routingService";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type SidebarMode = "manage" | "select";

export interface RoutingManagerSidebarProps {
  /** Whether the sidebar is visible */
  open: boolean;
  /** Called when the sidebar should close */
  onClose: () => void;

  // ── "select" mode (used in BOM create / edit / process-details) ──
  /** If provided, renders a "Select" button per routing row */
  onSelect?: (routing: Routing, comment: string) => void;
  /** IDs already added — shown as disabled in select mode */
  existingRoutingIds?: number[];
  /** Currently selected routing ID (highlighted) */
  selectedRoutingId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline form for create / edit
// ─────────────────────────────────────────────────────────────────────────────
interface RoutingFormData {
  number: string;
  name: string;
  desc: string;
}

const emptyForm = (): RoutingFormData => ({ number: "", name: "", desc: "" });

// ─────────────────────────────────────────────────────────────────────────────
// RoutingManagerSidebar
// ─────────────────────────────────────────────────────────────────────────────
const RoutingManagerSidebar: React.FC<RoutingManagerSidebarProps> = ({
  open,
  onClose,
  onSelect,
  existingRoutingIds = [],
  selectedRoutingId,
}) => {
  const isSelectMode = Boolean(onSelect);

  const [routings, setRoutings] = useState<Routing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // form state
  const [showForm, setShowForm] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Routing | null>(null);
  const [formData, setFormData] = useState<RoutingFormData>(emptyForm());
  const [formSaving, setFormSaving] = useState(false);

  // delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // select comment
  const [selectComment, setSelectComment] = useState("");
  const [pendingSelect, setPendingSelect] = useState<Routing | null>(null);

  // search
  const [search, setSearch] = useState("");

  // ── fetch ──
  const fetchRoutings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await routingAPI.getAllRoutings();
      if (res?.status && Array.isArray(res.data)) {
        setRoutings(res.data);
        setHasFetched(true);
      } else {
        toast.error("Failed to load routings");
      }
    } catch {
      toast.error("Error loading routings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !hasFetched) {
      fetchRoutings();
    }
    if (!open) {
      // reset transient UI state on close
      setShowForm(null);
      setEditTarget(null);
      setFormData(emptyForm());
      setConfirmDeleteId(null);
      setPendingSelect(null);
      setSelectComment("");
      setSearch("");
    }
  }, [open, hasFetched, fetchRoutings]);

  // ── create ──
  const handleCreate = async () => {
    if (!formData.number.trim() || !formData.name.trim()) {
      toast.error("Routing Number and Name are required");
      return;
    }
    setFormSaving(true);
    try {
      const res = await routingAPI.createRouting(formData);
      if (res?.status) {
        setRoutings((prev) => [...prev, res.data]);
        toast.success(`Routing "${res.data.number}" created`);
        setShowForm(null);
        setFormData(emptyForm());
      } else {
        toast.error(res?.message || "Failed to create routing");
      }
    } catch {
      toast.error("Error creating routing");
    } finally {
      setFormSaving(false);
    }
  };

  // ── edit save ──
  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!formData.number.trim() || !formData.name.trim()) {
      toast.error("Routing Number and Name are required");
      return;
    }
    setFormSaving(true);
    try {
      const res = await routingAPI.updateRouting(editTarget.id, formData);
      if (res?.status) {
        setRoutings((prev) =>
          prev.map((r) => (r.id === editTarget.id ? res.data : r))
        );
        toast.success(`Routing "${res.data.number}" updated`);
        setShowForm(null);
        setEditTarget(null);
        setFormData(emptyForm());
      } else {
        toast.error(res?.message || "Failed to update routing");
      }
    } catch {
      toast.error("Error updating routing");
    } finally {
      setFormSaving(false);
    }
  };

  // ── delete ──
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await routingAPI.deleteRouting(id);
      if (res?.status) {
        setRoutings((prev) => prev.filter((r) => r.id !== id));
        toast.success("Routing deleted");
      } else {
        toast.error(res?.message || "Failed to delete routing");
      }
    } catch {
      toast.error("Error deleting routing");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── select confirm ──
  const handleConfirmSelect = () => {
    if (!pendingSelect || !onSelect) return;
    onSelect(pendingSelect, selectComment);
    toast.success(`Routing "${pendingSelect.number}" added`);
    setPendingSelect(null);
    setSelectComment("");
    onClose();
  };

  const filteredRoutings = routings.filter(
    (r) =>
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  );

  const alreadySelected = (id: number) => existingRoutingIds.includes(id);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-[#105076]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isSelectMode ? "Select Routing" : "Manage Routings"}
              </h2>
              <p className="text-xs text-white/70">
                {isSelectMode
                  ? "Choose a routing or create a new one"
                  : "Create, edit or delete routing work centers"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Create form or Add button */}
          <div className="px-6 py-4 border-b bg-gray-50">
            {showForm === "create" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#105076]" /> New Routing
                </h3>
                <div>
                  <Label className="text-xs font-medium">
                    Routing Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.number}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, number: e.target.value }))
                    }
                    placeholder="e.g. R-001"
                    className="mt-1 h-9 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">
                    Routing Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Assembly Line"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Description</Label>
                  <Textarea
                    value={formData.desc}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, desc: e.target.value }))
                    }
                    placeholder="Optional description…"
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={formSaving}
                    className="flex-1 bg-[#105076] hover:bg-[#0d4566] text-white"
                  >
                    {formSaving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Save Routing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowForm(null);
                      setFormData(emptyForm());
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : showForm === "edit" && editTarget ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-amber-600" />
                  Edit: {editTarget.number}
                </h3>
                <div>
                  <Label className="text-xs font-medium">
                    Routing Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.number}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, number: e.target.value }))
                    }
                    className="mt-1 h-9 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">
                    Routing Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Description</Label>
                  <Textarea
                    value={formData.desc}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, desc: e.target.value }))
                    }
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                    disabled={formSaving}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {formSaving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Update Routing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowForm(null);
                      setEditTarget(null);
                      setFormData(emptyForm());
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setShowForm("create");
                  setEditTarget(null);
                  setFormData(emptyForm());
                }}
                className="w-full bg-[#105076] hover:bg-[#0d4566] text-white h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Routing
              </Button>
            )}
          </div>

          {/* Pending select — comment box */}
          {pendingSelect && isSelectMode && (
            <div className="mx-6 mt-4 p-4 border border-blue-200 rounded-xl bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-blue-800">
                  Selected: {pendingSelect.number}
                </span>
              </div>
              <p className="text-xs text-blue-700 mb-3">{pendingSelect.name}</p>
              <Label className="text-xs font-medium">Comment (optional)</Label>
              <Textarea
                value={selectComment}
                onChange={(e) => setSelectComment(e.target.value)}
                placeholder="Add routing notes…"
                rows={2}
                className="mt-1 text-sm resize-none"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleConfirmSelect}
                  className="flex-1 bg-[#105076] hover:bg-[#0d4566] text-white"
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  Confirm & Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingSelect(null);
                    setSelectComment("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search routings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Routing list */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#105076]" />
                <span className="text-sm">Loading routings…</span>
              </div>
            ) : filteredRoutings.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                <GitBranch className="h-10 w-10 text-gray-300" />
                <span className="text-sm font-medium">
                  {search ? "No routings match your search" : "No routings yet"}
                </span>
                {!search && (
                  <p className="text-xs text-center text-gray-400">
                    Click "Create New Routing" above to add one.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {filteredRoutings.map((routing) => {
                  const isAlreadyAdded = alreadySelected(routing.id);
                  const isHighlighted =
                    selectedRoutingId === routing.id || pendingSelect?.id === routing.id;
                  const isConfirmingDelete = confirmDeleteId === routing.id;

                  return (
                    <div
                      key={routing.id}
                      className={`
                        rounded-xl border p-4 transition-all duration-150
                        ${isHighlighted
                          ? "border-[#105076] bg-blue-50 shadow-sm"
                          : isAlreadyAdded && isSelectMode
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {routing.number}
                            </span>
                            {isHighlighted && (
                              <span className="shrink-0 text-[10px] bg-[#105076] text-white px-1.5 py-0.5 rounded font-medium">
                                Selected
                              </span>
                            )}
                            {isAlreadyAdded && isSelectMode && !isHighlighted && (
                              <span className="shrink-0 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                Added
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{routing.name}</p>
                          {routing.desc && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{routing.desc}</p>
                          )}
                          {routing.createdAt && (
                            <p className="text-[10px] text-gray-300 mt-1">
                              Created {new Date(routing.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Select button (only in select mode) */}
                          {isSelectMode && !isAlreadyAdded && (
                            <Button
                              size="sm"
                              variant={pendingSelect?.id === routing.id ? "default" : "outline"}
                              className={`h-7 text-xs px-3 ${
                                pendingSelect?.id === routing.id
                                  ? "bg-[#105076] hover:bg-[#0d4566] text-white"
                                  : ""
                              }`}
                              onClick={() => {
                                if (pendingSelect?.id === routing.id) {
                                  setPendingSelect(null);
                                  setSelectComment("");
                                } else {
                                  setPendingSelect(routing);
                                  setSelectComment("");
                                  // scroll up to comment box
                                  setTimeout(() => {
                                    document
                                      .querySelector(".routing-comment-box")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }, 100);
                                }
                              }}
                            >
                              {pendingSelect?.id === routing.id ? "Deselect" : "Select"}
                            </Button>
                          )}

                          {/* Edit */}
                          <button
                            title="Edit routing"
                            onClick={() => {
                              setShowForm("edit");
                              setEditTarget(routing);
                              setFormData({
                                number: routing.number,
                                name: routing.name,
                                desc: routing.desc ?? "",
                              });
                              setConfirmDeleteId(null);
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-300 text-gray-400 hover:text-amber-600 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1">
                              <button
                                title="Confirm delete"
                                onClick={() => handleDelete(routing.id)}
                                disabled={deletingId === routing.id}
                                className="h-7 px-2 flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
                              >
                                {deletingId === routing.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="h-3 w-3" />
                                )}
                                Delete?
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 text-xs"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              title="Delete routing"
                              onClick={() => setConfirmDeleteId(routing.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {filteredRoutings.length} routing{filteredRoutings.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRoutings}
              disabled={loading}
              className="h-8 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoutingManagerSidebar;