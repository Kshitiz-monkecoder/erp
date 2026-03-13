// src/pages/production/bom-details.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, FileText, Eye, EyeOff, ChevronDown, ChevronUp, Link2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from 'xlsx';
import { bomAPI } from "@/services/bomService";
import { get } from "@/lib/apiService";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";

interface BOMDetailsType {
  bomId: string;
  bomName: string;
  status: string;
  fgName: string;
  numberOfRm: number;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdBy: string;
  creationDate: string;
  fgStore: string;
  rmStore: string;
  scrapStore: string;
  description: string;
  comments: string;
}

interface RawMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  comment: string;
  childBOM?: {
    bomId: number;
    bomNumber: string;
    bomName: string;
    rawMaterials: ChildBOMRMRow[];
  } | null;
}

interface ChildBOMRMRow {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  comment: string;
}

interface FinishedGood {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
}

interface ScrapMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  comment: string;
}

interface Routing {
  id: number;
  name: string;
  description: string;
}

interface OtherCharge {
  id: number;
  name: string;
  amount: string;
  rawAmount: number;
  comment: string;
}

// ── Costing API types ──
interface CostingRM {
  itemId: number;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costingMethod: string;
}

interface CostingFG {
  itemId: number;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CostingOtherCharge {
  id: number;
  classification: string;
  charges: number;
  comment: string | null;
}

interface CostingBOMItem {
  bomItemId: number;
  finishedGoods: CostingFG;
  rawMaterials: CostingRM[];
  otherCharges: CostingOtherCharge[];
  rmSubTotal: number;
  otherChargesSubTotal: number;
}

interface CostingSummary {
  totalFgValue: number;
  totalRmCost: number;
  totalOtherCharges: number;
  totalBomCost: number;
}

interface CostingData {
  quantity: number;
  bomItems: CostingBOMItem[];
  summary: CostingSummary;
}

interface ApiSubBom {
  id: number;
  docNumber: string;
  docName: string;
  bomItems: Array<{
    finishedGoods: {
      quantity: number;
      costAlloc: number;
      comment: string;
      item: { sku: string; name: string; type?: string };
      unit: { name: string };
    };
    rawMaterials: Array<{
      quantity: number;
      costAlloc: number;
      comment: string;
      item: { sku: string; name: string; type?: string };
      unit: { name: string };
    }>;
  }>;
}

interface ApiItem {
  sku: string;
  name: string;
  isProduct: boolean;
  type: string;
  currentStock: string;
  defaultPrice: string;
  hsnCode: string;
  minimumStockLevel: string;
  maximumStockLevel: string;
  id: number;
  regularBuyingPrice: string;
  regularSellingPrice: string;
  wholesaleBuyingPrice: string;
  mrp: string;
  dealerPrice: string;
  distributorPrice: string;
  lastTransactionAt: string;
}

interface ApiUnit {
  name: string;
  description: string;
  uom: string;
  status: boolean;
  id: number;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiFinishedGood {
  id: number;
  quantity: number;
  costAlloc: number;
  comment: string;
  hasAlternate: boolean;
  item: ApiItem;
  unit: ApiUnit;
  alternateList: any[];
}

interface ApiRawMaterial {
  id: number;
  quantity: number;
  costAlloc: number;
  comment: string;
  hasAlternate: boolean;
  item: ApiItem;
  unit: ApiUnit;
  alternateList: any[];
  subBom?: ApiSubBom | null;
}

interface ApiScrap {
  id: number;
  quantity: number;
  costAlloc: number;
  comment?: string;
  item: ApiItem;
  unit: ApiUnit;
}

interface ApiRoutingItem {
  id: number;
  comment: string;
  routing: {
    number: string;
    name: string;
    desc: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface ApiOtherCharge {
  id: number;
  charges: number;
  classification: string;
  comment: string | null;
}

interface ApiBOMItem {
  id: number;
  subBom?: ApiSubBom | null;
  finishedGoods: ApiFinishedGood;
  rawMaterials: ApiRawMaterial[];
  routing: ApiRoutingItem[];
  scrap: ApiScrap[];
  otherCharges: ApiOtherCharge[];
}

interface ApiStore {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
}

interface ApiUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  userType: string;
}

interface ApiBOMResponse {
  id: number;
  docNumber: string;
  docDate: string;
  docName: string;
  docDescription: string | null;
  docComment: string | null;
  docBomDescription: string | null;
  docDraftDate: string | null;
  status: string;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
  rmStore: ApiStore;
  fgStore: ApiStore;
  scrapStore: ApiStore;
  createdBy: ApiUser;
  draftBy: ApiUser | null;
  bomItems: ApiBOMItem[];
  costing?: CostingData;
}

const BOMDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBOMCost, setShowBOMCost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bomData, setBomData] = useState<ApiBOMResponse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Costing state
  const [costingData, setCostingData] = useState<CostingData | null>(null);
  const [costingQuantity, setCostingQuantity] = useState<number>(1);
  const [loadingCosting, setLoadingCosting] = useState(false);
  const [costingError, setCostingError] = useState<string | null>(null);

  const [childBOMExpandedSet, setChildBOMExpandedSet] = useState<Set<number>>(new Set());

  const [bomDetails, setBomDetails] = useState<BOMDetailsType>({
    bomId: "BOM00000", bomName: "", status: "", fgName: "", numberOfRm: 0,
    lastModifiedBy: "", lastModifiedDate: "", createdBy: "", creationDate: "",
    fgStore: "", rmStore: "", scrapStore: "", description: "", comments: ""
  });

  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [scrapMaterials, setScrapMaterials] = useState<ScrapMaterial[]>([]);
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Build SKU -> costing row map for fast lookup
  const costingRMMap = useMemo(() => {
    const map = new Map<string, CostingRM>();
    costingData?.bomItems?.[0]?.rawMaterials?.forEach((rm) => map.set(rm.sku, rm));
    return map;
  }, [costingData]);

  const costingFG = costingData?.bomItems?.[0]?.finishedGoods ?? null;
  const summary = costingData?.summary ?? null;
  const costingBOMItem = costingData?.bomItems?.[0] ?? null;

  // Fetch costing from API
  const fetchCosting = async (qty: number) => {
    if (!id) return;
    setLoadingCosting(true);
    setCostingError(null);
    try {
      const res = await get(`/production/bom/${id}?quantity=${qty}`);
      if (res?.status && res.data?.costing) {
        setCostingData(res.data.costing as CostingData);
      } else {
        setCostingError("Failed to load costing data.");
        setCostingData(null);
      }
    } catch {
      setCostingError("Error fetching costing data.");
      setCostingData(null);
    } finally {
      setLoadingCosting(false);
    }
  };

  const handleToggleBOMCost = () => {
    const next = !showBOMCost;
    setShowBOMCost(next);
    if (next && !costingData) fetchCosting(costingQuantity);
  };

  useEffect(() => {
    const fetchBOMData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await bomAPI.getBOM(parseInt(id));
        if (response.status && response.data) {
          const apiData = response.data as unknown as ApiBOMResponse;
          setBomData(apiData);
          const bomItem = apiData.bomItems[0];

          setBomDetails({
            bomId: apiData.docNumber, bomName: apiData.docName,
            status: apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1),
            fgName: bomItem?.finishedGoods?.item?.name || "",
            numberOfRm: bomItem?.rawMaterials?.length || 0,
            lastModifiedBy: apiData.createdBy?.name || "",
            lastModifiedDate: formatDate(apiData.updatedAt),
            createdBy: apiData.createdBy?.name || "",
            creationDate: formatDate(apiData.createdAt),
            fgStore: apiData.fgStore?.name || "", rmStore: apiData.rmStore?.name || "",
            scrapStore: apiData.scrapStore?.name || "",
            description: apiData.docDescription || "No description provided",
            comments: apiData.docComment || "No comments provided"
          });

          if (bomItem?.finishedGoods?.quantity) setCostingQuantity(bomItem.finishedGoods.quantity);

          if (bomItem?.finishedGoods) {
            const fg = bomItem.finishedGoods;
            setFinishedGoods([{ id: fg.id, code: fg.item.sku, name: fg.item.name, category: fg.item.type || "-", quantity: fg.quantity, unit: fg.unit.name, costAllocation: fg.costAlloc }]);
          }

          if (bomItem?.rawMaterials?.length > 0) {
            setRawMaterials(bomItem.rawMaterials.map((rm: ApiRawMaterial) => {
              let childBOM: RawMaterial["childBOM"] = null;
              if (rm.subBom) {
                childBOM = {
                  bomId: rm.subBom.id, bomNumber: rm.subBom.docNumber, bomName: rm.subBom.docName,
                  rawMaterials: (rm.subBom.bomItems ?? []).flatMap((bi) =>
                    (bi.rawMaterials ?? []).map((crm) => ({ sku: crm.item?.sku ?? "-", name: crm.item?.name ?? "-", category: crm.item?.type ?? "-", quantity: crm.quantity ?? 0, unit: crm.unit?.name ?? "-", comment: crm.comment || "-" }))
                  ),
                };
              }
              return { id: rm.id, code: rm.item.sku, name: rm.item.name, category: rm.item.type || "-", quantity: rm.quantity, unit: rm.unit.name, costAllocation: rm.costAlloc, comment: rm.comment || "", childBOM };
            }));
          }

          if (bomItem?.scrap?.length > 0) {
            setScrapMaterials(bomItem.scrap.map((s: ApiScrap) => ({ id: s.id, code: s.item.sku, name: s.item.name, category: s.item.type || "-", quantity: s.quantity, unit: s.unit.name, costAllocation: s.costAlloc, comment: s.comment || "" })));
          }

          if (bomItem?.routing?.length > 0) {
            setRoutings(bomItem.routing.map((r: ApiRoutingItem) => ({ id: r.id, name: `${r.routing.number}: ${r.routing.name}`, description: r.routing.desc })));
          }

          if (bomItem?.otherCharges?.length > 0) {
            setOtherCharges(bomItem.otherCharges.map((c: ApiOtherCharge) => ({ id: c.id, name: c.classification, rawAmount: c.charges, amount: `₹${c.charges.toFixed(2)}`, comment: c.comment || "-" })));
          }
        }
      } catch (error) {
        console.error("Error fetching BOM data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBOMData();
  }, [id]);

  const toggleChildBOMExpanded = (idx: number) => {
    setChildBOMExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const downloadBOMAsExcel = () => {
    const workbook = XLSX.utils.book_new();
    const bomDetailsData = [
      ["BOM DOCUMENT DETAILS"],
      ["Document Number:", bomDetails.bomId], ["Name:", bomDetails.bomName], ["Status:", bomDetails.status],
      ["FG Store:", bomDetails.fgStore], ["RM Store:", bomDetails.rmStore], ["Scrap/Rejected Store:", bomDetails.scrapStore],
      ["Last Modified By:", bomDetails.lastModifiedBy], ["Last Modified Date:", bomDetails.lastModifiedDate],
      ["Created By:", bomDetails.createdBy], ["Creation Date:", bomDetails.creationDate],
      [], ["BOM DESCRIPTION"], [bomDetails.description], [], ["COMMENTS"], [bomDetails.comments],
      [], ["SUMMARY"],
      ["Finished Goods:", finishedGoods.length.toString()], ["Raw Materials:", rawMaterials.length.toString()],
      ["Processing Steps:", routings.length.toString()], ["Scrap Materials:", scrapMaterials.length.toString()],
      ...(summary ? [["Total RM Cost:", `₹${summary.totalRmCost.toFixed(2)}`], ["Total Other Charges:", `₹${summary.totalOtherCharges.toFixed(2)}`], ["Total BOM Cost:", `₹${summary.totalBomCost.toFixed(2)}`]] : []),
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(bomDetailsData), "BOM Details");

    const fgHeaders = ["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)"];
    if (summary) fgHeaders.push("UNIT PRICE", "TOTAL PRICE");
    const fgData = [fgHeaders];
    finishedGoods.forEach((fg) => {
      const row = [fg.code, fg.name, fg.category, fg.quantity.toString(), fg.unit, fg.costAllocation.toString()];
      if (costingFG) row.push(`₹${costingFG.unitPrice.toFixed(2)}`, `₹${costingFG.totalPrice.toFixed(2)}`);
      fgData.push(row);
    });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(fgData), "Finished Goods");

    const rmHeaders = ["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "COMMENT", "CHILD BOM"];
    if (summary) rmHeaders.push("UNIT PRICE", "TOTAL COST", "COSTING METHOD");
    const rmData = [rmHeaders];
    rawMaterials.forEach((m) => {
      const cRM = costingRMMap.get(m.code);
      const row = [m.code, m.name, m.category, m.quantity.toString(), m.unit, m.costAllocation.toString(), m.comment || "-", m.childBOM ? `${m.childBOM.bomNumber} - ${m.childBOM.bomName}` : "-"];
      if (summary) row.push(cRM ? `₹${cRM.unitPrice.toFixed(2)}` : "-", cRM ? `₹${cRM.totalPrice.toFixed(2)}` : "-", cRM ? cRM.costingMethod : "-");
      rmData.push(row);
    });
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rmData), "Raw Materials");

    const scrapData = [["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "COMMENT"]];
    scrapMaterials.forEach((s) => scrapData.push([s.code, s.name, s.category, s.quantity.toString(), s.unit, s.costAllocation.toString(), s.comment || "-"]));
    if (!scrapMaterials.length) scrapData.push(["No scrap materials available"]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(scrapData), "Scrap Materials");

    const routingData = [["ROUTING ID", "ROUTING NAME", "DESCRIPTION", "COMMENT"]];
    bomData?.bomItems[0]?.routing?.forEach(r => routingData.push([r.routing.id.toString(), `${r.routing.number}: ${r.routing.name}`, r.routing.desc, r.comment || "-"]));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(routingData), "Routing");

    const ocData = [["#", "CLASSIFICATION", "AMOUNT", "COMMENT"]];
    otherCharges.forEach((c, i) => ocData.push([(i + 1).toString(), c.name, c.amount, c.comment]));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ocData), "Other Charges");

    XLSX.writeFile(workbook, `BOM_${bomDetails.bomId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteBOM = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const response = await bomAPI.deleteBOM(parseInt(id));
      if (response.status) {
        SuccessToast({ title: "BOM deleted successfully", description: `BOM ${bomDetails.bomId} has been removed.` });
        navigate("/production/bom");
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || error?.message || "Failed to delete BOM";
      if (apiMessage.toLowerCase().includes("used") || apiMessage.toLowerCase().includes("reference") || error?.response?.status === 409) {
        ErrorToast({ title: "Deletion Not Allowed", description: "This BOM cannot be deleted because it is being used in another document." });
      } else {
        ErrorToast({ title: "Error deleting BOM", description: apiMessage });
      }
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleEditBOM = () => { if (id) navigate(`/production/bom/edit/${id}`); };

  const handleMaterialCommentChange = (index: number, value: string) => {
    const upd = [...rawMaterials];
    upd[index] = { ...upd[index], comment: value };
    setRawMaterials(upd);
  };

  const handleScrapCommentChange = (index: number, value: string) => {
    const upd = [...scrapMaterials];
    upd[index] = { ...upd[index], comment: value };
    setScrapMaterials(upd);
  };

  const handleBOMDetailsChange = (field: keyof BOMDetailsType, value: string) => setBomDetails(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BOM details...</p>
        </div>
      </div>
    );
  }

  if (!bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">BOM not found</p>
          <Link to="/production/bom"><Button className="mt-4">Back to BOM List</Button></Link>
        </div>
      </div>
    );
  }

  // How many columns the RM table has (used for colSpan on sub-rows)
  const rmColCount = showBOMCost ? 11 : 8;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-8xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/production/bom">
                <ArrowLeft className="w-6 h-6 cursor-pointer hover:text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bill of Materials</h1>
                <p className="text-sm text-gray-500">BOM Details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleToggleBOMCost}
                className={`flex items-center gap-2 ${showBOMCost ? "bg-blue-50 border-blue-200 text-blue-700" : ""}`}
              >
                {showBOMCost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showBOMCost ? "Hide Cost" : "View BOM Cost"}
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadBOMAsExcel}>
                <FileText className="w-4 h-4 mr-2" /> Export to Excel
              </Button>
              <Button variant="outline" onClick={handleEditBOM} className="p-2" title="Edit BOM">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="p-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" title="Delete BOM">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-8 py-6">

        {/* Document Details */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Document Details</h2></div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Document Number:</span><span className="text-sm font-semibold">{bomDetails.bomId}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">FG Store:</span><span className="text-sm">{bomDetails.fgStore}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Last Modified By:</span><span className="text-sm">{bomDetails.lastModifiedBy}</span></div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`text-sm font-semibold ${bomDetails.status.toUpperCase() === 'PUBLISHED' ? 'text-green-600' : bomDetails.status.toUpperCase() === 'WIP' ? 'text-blue-600' : bomDetails.status.toUpperCase() === 'COMPLETED' ? 'text-purple-600' : 'text-yellow-600'}`}>
                    {bomDetails.status.toUpperCase() === 'WIP' ? 'WIP / In Progress' : bomDetails.status}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Name:</span><span className="text-sm font-semibold">{bomDetails.bomName}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">RM Store:</span><span className="text-sm">{bomDetails.rmStore}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Last Modified Date:</span><span className="text-sm">{bomDetails.lastModifiedDate}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Document Date:</span><span className="text-sm">{bomData ? formatDate(bomData.docDate) : ''}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4"><div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Scrap/Rejected Store:</span><span className="text-sm">{bomDetails.scrapStore}</span></div></div>
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Created By:</span><span className="text-sm">{bomDetails.createdBy}</span></div>
                <div className="flex justify-between"><span className="text-sm font-medium text-gray-600">Creation Date:</span><span className="text-sm">{bomDetails.creationDate}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">BOM Description</label>
                <Textarea value={bomDetails.description} onChange={(e) => handleBOMDetailsChange('description', e.target.value)} className="min-h-[100px] text-sm" placeholder="No description provided" readOnly />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Comments</label>
                <Textarea value={bomDetails.comments} onChange={(e) => handleBOMDetailsChange('comments', e.target.value)} className="min-h-[100px] text-sm" placeholder="No comments provided" readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { count: rawMaterials.length, label: "RAW MATERIALS", colorClass: "blue" },
            { count: routings.length, label: "PROCESSING", colorClass: "green" },
            { count: finishedGoods.length, label: "FINISHED GOODS", colorClass: "purple" },
            { count: scrapMaterials.length, label: "SCRAP MATERIALS", colorClass: "orange" },
          ].map(({ count, label, colorClass }) => (
            <div key={label} className={`bg-${colorClass}-50 border border-${colorClass}-200 rounded-lg p-4 text-center`}>
              <div className={`text-2xl font-bold text-${colorClass}-600`}>{count}</div>
              <div className={`text-sm text-${colorClass}-800`}>{label}</div>
              <div className={`text-xs text-${colorClass}-600 mt-1`}>{count || 'No'} item(s)</div>
            </div>
          ))}
        </div>

        {/* ── Costing control bar (quantity input + summary totals) — only when showBOMCost ── */}
        {showBOMCost && (
          <div className="bg-white rounded-lg shadow-sm border mb-6 px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">FG Quantity:</span>
                <Input
                  type="number"
                  min={1}
                  value={costingQuantity}
                  onChange={(e) => setCostingQuantity(Number(e.target.value) || 1)}
                  className="h-9 w-28 text-sm"
                />
                <Button size="sm" onClick={() => fetchCosting(costingQuantity)} disabled={loadingCosting} className="bg-[#105076] hover:bg-[#0d4566] text-white">
                  {loadingCosting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate"}
                </Button>
              </div>

              {loadingCosting ? (
                <span className="text-sm text-gray-400 flex items-center gap-1.5 ml-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating cost…</span>
              ) : costingError ? (
                <span className="text-sm text-red-500 ml-2">{costingError}</span>
              ) : summary ? (
                <div className="flex flex-wrap items-center gap-2 ml-2">
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-blue-600 font-medium">RM Cost</span>
                    <span className="text-sm font-bold text-blue-700">₹{summary.totalRmCost.toFixed(2)}</span>
                  </div>
                  <span className="text-gray-400 text-sm">+</span>
                  <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-purple-600 font-medium">Other Charges</span>
                    <span className="text-sm font-bold text-purple-700">₹{summary.totalOtherCharges.toFixed(2)}</span>
                  </div>
                  <span className="text-gray-400 text-sm">=</span>
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-green-600 font-medium">Total BOM Cost</span>
                    <span className="text-sm font-bold text-green-700">₹{summary.totalBomCost.toFixed(2)}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-1">for qty {costingData?.quantity}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ── Finished Goods — cost columns appended when showBOMCost ── */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Finished Goods</h2></div>
          <div className="p-6">
            {finishedGoods.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM CATEGORY</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">COST ALLOCATION (%)</th>
                      {showBOMCost && (
                        <>
                          <th className="px-4 py-3 text-left font-medium text-blue-700 border bg-blue-50">UNIT PRICE</th>
                          <th className="px-4 py-3 text-left font-medium text-blue-700 border bg-blue-50">TOTAL PRICE</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {finishedGoods.map((fg) => (
                      <tr key={fg.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 border font-medium">{fg.code}</td>
                        <td className="px-4 py-3 border">{fg.name}</td>
                        <td className="px-4 py-3 border">{fg.category}</td>
                        <td className="px-4 py-3 border text-right">{fg.quantity}</td>
                        <td className="px-4 py-3 border">{fg.unit}</td>
                        <td className="px-4 py-3 border text-right">{fg.costAllocation}%</td>
                        {showBOMCost && (
                          <>
                            <td className="px-4 py-3 border text-right bg-blue-50/40">
                              {loadingCosting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-blue-400" /> : costingFG ? `₹${costingFG.unitPrice.toFixed(2)}` : "-"}
                            </td>
                            <td className="px-4 py-3 border text-right font-semibold bg-blue-50/40">
                              {loadingCosting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-blue-400" /> : costingFG ? `₹${costingFG.totalPrice.toFixed(2)}` : "-"}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No finished goods data available</div>
            )}
          </div>
        </div>

        {/* ── Raw Materials — cost columns appended when showBOMCost ── */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Raw Materials</h2></div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM CATEGORY</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COST ALLOCATION (%)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
                    {showBOMCost && (
                      <>
                        <th className="px-4 py-3 text-left font-medium text-blue-700 border bg-blue-50">UNIT PRICE</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700 border bg-blue-50">TOTAL COST</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-700 border bg-blue-50">COSTING METHOD</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((material, index) => {
                    const childExpanded = childBOMExpandedSet.has(index);
                    const cRM = costingRMMap.get(material.code);
                    return (
                      <React.Fragment key={material.id}>
                        {/* Parent RM row */}
                        <tr className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 border w-12">
                            {material.childBOM ? (
                              <button onClick={() => toggleChildBOMExpanded(index)} className="flex items-center gap-1" title={childExpanded ? "Collapse" : "Expand"}>
                                <div className="w-5 h-5 rounded flex items-center justify-center bg-[#105076] text-white shrink-0">
                                  {childExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{index + 1}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 border font-medium">{material.code}</td>
                          <td className="px-4 py-3 border">{material.name}</td>
                          <td className="px-4 py-3 border">{material.category}</td>
                          <td className="px-4 py-3 border text-right">{material.quantity}</td>
                          <td className="px-4 py-3 border">{material.unit}</td>
                          <td className="px-4 py-3 border text-right">{material.costAllocation}%</td>
                          <td className="px-4 py-3 border">
                            <Input value={material.comment} onChange={(e) => handleMaterialCommentChange(index, e.target.value)} className="border-0 focus-visible:ring-0 shadow-none text-sm" placeholder="-" />
                          </td>
                          {showBOMCost && (
                            <>
                              <td className="px-4 py-3 border text-right bg-blue-50/40">
                                {loadingCosting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-blue-400" /> : cRM ? `₹${cRM.unitPrice.toFixed(2)}` : "-"}
                              </td>
                              <td className="px-4 py-3 border text-right font-semibold bg-blue-50/40">
                                {loadingCosting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-blue-400" /> : cRM ? `₹${cRM.totalPrice.toFixed(2)}` : "-"}
                              </td>
                              <td className="px-4 py-3 border bg-blue-50/40">
                                {loadingCosting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-blue-400" /> : cRM ? (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cRM.costingMethod}</span>
                                ) : "-"}
                              </td>
                            </>
                          )}
                        </tr>

                        {/* Child BOM badge row */}
                        {material.childBOM && childExpanded && (
                          <tr className="border-t bg-blue-50">
                            <td colSpan={rmColCount} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Link2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold text-blue-700">Child BOM:</span>
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">{material.childBOM.bomNumber}</span>
                                <span className="text-xs text-blue-600">{material.childBOM.bomName}</span>
                                <button onClick={() => window.open(`/production/bom/${material.childBOM!.bomId}`, "_blank")} className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">
                                  <ExternalLink className="h-3 w-3" /> View BOM
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Child BOM RM sub-rows */}
                        {material.childBOM && childExpanded && material.childBOM.rawMaterials.map((subRM, j) => (
                          <tr key={`${material.id}-child-${j}`} className="border-t bg-[#f0f7ff] hover:bg-blue-50/80">
                            <td className="px-4 py-2.5 border w-12">
                              <div className="flex items-center justify-center">
                                <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded min-w-[28px] text-center" style={{ backgroundColor: "#e8936a" }}>{index + 1}.{j + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 border"><span className="text-xs font-medium text-blue-700">{subRM.sku}</span></td>
                            <td className="px-4 py-2.5 border"><span className="text-xs text-blue-600">{subRM.name}</span></td>
                            <td className="px-4 py-2.5 border text-xs text-gray-500">{subRM.category}</td>
                            <td className="px-4 py-2.5 border text-right text-xs font-medium">{subRM.quantity}</td>
                            <td className="px-4 py-2.5 border text-xs text-gray-600">{subRM.unit}</td>
                            <td className="px-4 py-2.5 border text-xs text-gray-400">-</td>
                            <td className="px-4 py-2.5 border text-xs text-gray-500">{subRM.comment}</td>
                            {showBOMCost && (
                              <>
                                <td className="px-4 py-2.5 border text-xs text-gray-400 bg-blue-50/40">-</td>
                                <td className="px-4 py-2.5 border text-xs text-gray-400 bg-blue-50/40">-</td>
                                <td className="px-4 py-2.5 border text-xs text-gray-400 bg-blue-50/40">-</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                {/* RM subtotal footer — only when costing is on */}
                {showBOMCost && costingBOMItem && (
                  <tfoot>
                    <tr className="bg-blue-50">
                      <td colSpan={9} className="px-4 py-3 border text-right font-semibold text-gray-700">RM Sub Total:</td>
                      <td className="px-4 py-3 border text-right font-bold text-blue-700">
                        {loadingCosting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `₹${costingBOMItem.rmSubTotal.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 border bg-blue-50"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Scrap Materials */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Scrap Materials</h2></div>
          <div className="p-6">
            {scrapMaterials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      {["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "COMMENT"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-gray-700 border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scrapMaterials.map((scrap, index) => (
                      <tr key={scrap.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 border font-medium">{scrap.code}</td>
                        <td className="px-4 py-3 border">{scrap.name}</td>
                        <td className="px-4 py-3 border">{scrap.category}</td>
                        <td className="px-4 py-3 border text-right">{scrap.quantity}</td>
                        <td className="px-4 py-3 border">{scrap.unit}</td>
                        <td className="px-4 py-3 border text-right">{scrap.costAllocation}%</td>
                        <td className="px-4 py-3 border">
                          <Input value={scrap.comment} onChange={(e) => handleScrapCommentChange(index, e.target.value)} className="border-0 focus-visible:ring-0 shadow-none text-sm" placeholder="-" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No scrap materials available</div>
            )}
          </div>
        </div>

        {/* Routing */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Routing</h2></div>
          <div className="p-6 space-y-4">
            {routings.length > 0 ? routings.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-blue-600 mb-2">{r.name}</h3>
                <p className="text-sm text-gray-600">{r.description}</p>
              </div>
            )) : <div className="text-center py-8 text-gray-500">No routing information available</div>}
          </div>
        </div>

        {/* ── Other Charges — total footer when showBOMCost ── */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Other Charges</h2></div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    {["#", "CLASSIFICATION", "AMOUNT", "COMMENT"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-700 border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {otherCharges.map((charge, index) => (
                    <tr key={charge.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 border">{index + 1}</td>
                      <td className="px-4 py-3 border font-medium">{charge.name}</td>
                      <td className="px-4 py-3 border">{charge.amount}</td>
                      <td className="px-4 py-3 border">{charge.comment}</td>
                    </tr>
                  ))}
                </tbody>
                {showBOMCost && costingBOMItem && (
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="px-4 py-3 border text-right font-semibold text-gray-700">Other Charges Total:</td>
                      <td className="px-4 py-3 border font-semibold">
                        {loadingCosting ? <Loader2 className="h-4 w-4 animate-spin" /> : `₹${costingBOMItem.otherChargesSubTotal.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 border"></td>
                    </tr>
                    <tr className="bg-green-50">
                      <td colSpan={2} className="px-4 py-3 border text-right font-bold text-base">Total BOM Cost:</td>
                      <td className="px-4 py-3 border font-bold text-base text-green-600">
                        {loadingCosting ? <Loader2 className="h-4 w-4 animate-spin" /> : summary ? `₹${summary.totalBomCost.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-4 py-3 border"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete BOM {bomDetails.bomId}?</h3>
            <p className="text-sm text-gray-600 mt-2">This action cannot be undone. If this BOM is used in another document, deletion will not be allowed.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteBOM} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMDetails;