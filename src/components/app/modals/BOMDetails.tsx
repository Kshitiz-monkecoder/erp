// src/pages/production/bom-details.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from 'xlsx';
import { bomAPI } from "@/services/bomService";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";

// Define proper TypeScript interfaces
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
  pricePerUnit: number;
  totalPrice: number;
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
  pricePerUnit: number;
  totalPrice: number;
}

interface ScrapMaterial {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  pricePerUnit: number;
  totalPrice: number;
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
  comment: string;
}

// API Response interfaces based on the provided JSON
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
}

const BOMDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBOMCost, setShowBOMCost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bomData, setBomData] = useState<ApiBOMResponse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  
  const [bomDetails, setBomDetails] = useState<BOMDetailsType>({
    bomId: "BOM00000",
    bomName: "",
    status: "",
    fgName: "",
    numberOfRm: 0,
    lastModifiedBy: "",
    lastModifiedDate: "",
    createdBy: "",
    creationDate: "",
    fgStore: "",
    rmStore: "",
    scrapStore: "",
    description: "",
    comments: ""
  });

  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [scrapMaterials, setScrapMaterials] = useState<ScrapMaterial[]>([]);
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total costs
  const totalRawMaterialCost = rawMaterials.reduce((sum, material) => sum + material.totalPrice, 0);
  const totalOtherCharges = otherCharges.reduce((sum, charge) => sum + parseFloat(charge.amount.replace('₹', '').replace(',', '')), 0);
  const totalBOMCost = totalRawMaterialCost + totalOtherCharges;

  // Fetch BOM data when component mounts
  useEffect(() => {
    const fetchBOMData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await bomAPI.getBOM(parseInt(id));
        
        if (response.status && response.data) {
          const apiData = response.data as unknown as ApiBOMResponse;
          setBomData(apiData);
          
          // Get the first BOM item (assuming single BOM item for now)
          const bomItem = apiData.bomItems[0];

          // Update bomDetails with API data
          setBomDetails({
            bomId: apiData.docNumber,
            bomName: apiData.docName,
            status: apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1),
            fgName: bomItem?.finishedGoods?.item?.name || "",
            numberOfRm: bomItem?.rawMaterials?.length || 0,
            lastModifiedBy: apiData.createdBy?.name || "",
            lastModifiedDate: formatDate(apiData.updatedAt),
            createdBy: apiData.createdBy?.name || "",
            creationDate: formatDate(apiData.createdAt),
            fgStore: apiData.fgStore?.name || "",
            rmStore: apiData.rmStore?.name || "",
            scrapStore: apiData.scrapStore?.name || "",
            description: apiData.docDescription || "No description provided",
            comments: apiData.docComment || "No comments provided"
          });

          // Transform Finished Goods
          if (bomItem?.finishedGoods) {
            const fg = bomItem.finishedGoods;
            setFinishedGoods([{
              id: fg.id,
              code: fg.item.sku,
              name: fg.item.name,
              category: fg.item.type || "-",
              quantity: fg.quantity,
              unit: fg.unit.name,
              costAllocation: fg.costAlloc,
              pricePerUnit: parseFloat(fg.item.defaultPrice) || 0,
              totalPrice: fg.quantity * (parseFloat(fg.item.defaultPrice) || 0)
            }]);
          }

          // Transform Raw Materials
          if (bomItem?.rawMaterials && bomItem.rawMaterials.length > 0) {
            const transformedRawMaterials = bomItem.rawMaterials.map((rm: ApiRawMaterial) => ({
              id: rm.id,
              code: rm.item.sku,
              name: rm.item.name,
              category: rm.item.type || "-",
              quantity: rm.quantity,
              unit: rm.unit.name,
              costAllocation: rm.costAlloc,
              pricePerUnit: parseFloat(rm.item.defaultPrice) || 0,
              totalPrice: rm.quantity * (parseFloat(rm.item.defaultPrice) || 0),
              comment: rm.comment || ""
            }));
            setRawMaterials(transformedRawMaterials);
          }

          // Transform Scrap Materials
          if (bomItem?.scrap && bomItem.scrap.length > 0) {
            const transformedScrap = bomItem.scrap.map((scrap: ApiScrap) => ({
              id: scrap.id,
              code: scrap.item.sku,
              name: scrap.item.name,
              category: scrap.item.type || "-",
              quantity: scrap.quantity,
              unit: scrap.unit.name,
              costAllocation: scrap.costAlloc,
              pricePerUnit: parseFloat(scrap.item.defaultPrice) || 0,
              totalPrice: scrap.quantity * (parseFloat(scrap.item.defaultPrice) || 0),
              comment: scrap.comment || ""
            }));
            setScrapMaterials(transformedScrap);
          }

          // Transform Routings
          if (bomItem?.routing && bomItem.routing.length > 0) {
            const transformedRouting = bomItem.routing.map((route: ApiRoutingItem) => ({
              id: route.id,
              name: `${route.routing.number}: ${route.routing.name}`,
              description: route.routing.desc
            }));
            setRoutings(transformedRouting);
          }

          // Transform Other Charges
          if (bomItem?.otherCharges && bomItem.otherCharges.length > 0) {
            const transformedCharges = bomItem.otherCharges.map((charge: ApiOtherCharge) => ({
              id: charge.id,
              name: charge.classification,
              amount: `₹${charge.charges.toFixed(2)}`,
              comment: charge.comment || "-"
            }));
            setOtherCharges(transformedCharges);
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

  // Download BOM as Excel
  const downloadBOMAsExcel = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // BOM Details Sheet
    const bomDetailsData = [
      ["BOM DOCUMENT DETAILS"],
      ["Document Number:", bomDetails.bomId],
      ["Name:", bomDetails.bomName],
      ["Status:", bomDetails.status],
      ["FG Store:", bomDetails.fgStore],
      ["RM Store:", bomDetails.rmStore],
      ["Scrap/Rejected Store:", bomDetails.scrapStore],
      ["Last Modified By:", bomDetails.lastModifiedBy],
      ["Last Modified Date:", bomDetails.lastModifiedDate],
      ["Created By:", bomDetails.createdBy],
      ["Creation Date:", bomDetails.creationDate],
      [],
      ["BOM DESCRIPTION"],
      [bomDetails.description],
      [],
      ["COMMENTS"],
      [bomDetails.comments],
      [],
      ["SUMMARY"],
      ["Finished Goods:", finishedGoods.length.toString()],
      ["Raw Materials:", rawMaterials.length.toString()],
      ["Processing Steps:", routings.length.toString()],
      ["Scrap Materials:", scrapMaterials.length.toString()],
      ["Other Charges:", otherCharges.length.toString()],
      ["Total BOM Cost:", `₹${totalBOMCost.toFixed(2)}`]
    ];

    const bomDetailsSheet = XLSX.utils.aoa_to_sheet(bomDetailsData);
    XLSX.utils.book_append_sheet(workbook, bomDetailsSheet, "BOM Details");

    // Finished Goods Sheet
    const finishedGoodsData = [
      ["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "PRICE/UNIT", "TOTAL PRICE"]
    ];
    
    finishedGoods.forEach((fg) => {
      finishedGoodsData.push([
        fg.code,
        fg.name,
        fg.category,
        fg.quantity.toString(),
        fg.unit,
        fg.costAllocation.toString(),
        `₹${fg.pricePerUnit.toFixed(2)}`,
        `₹${fg.totalPrice.toFixed(2)}`
      ]);
    });

    const finishedGoodsSheet = XLSX.utils.aoa_to_sheet(finishedGoodsData);
    XLSX.utils.book_append_sheet(workbook, finishedGoodsSheet, "Finished Goods");

    // Raw Materials Sheet
    const rawMaterialsData = [
      ["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "PRICE/UNIT", "TOTAL PRICE", "COMMENT"]
    ];
    
    rawMaterials.forEach((material) => {
      rawMaterialsData.push([
        material.code,
        material.name,
        material.category,
        material.quantity.toString(),
        material.unit,
        material.costAllocation.toString(),
        `₹${material.pricePerUnit.toFixed(2)}`,
        `₹${material.totalPrice.toFixed(2)}`,
        material.comment || "-"
      ]);
    });

    const rawMaterialsSheet = XLSX.utils.aoa_to_sheet(rawMaterialsData);
    XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, "Raw Materials");

    // Scrap Materials Sheet
    const scrapMaterialsData = [
      ["ITEM ID", "ITEM NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "PRICE/UNIT", "TOTAL PRICE", "COMMENT"]
    ];
    
    if (scrapMaterials.length > 0) {
      scrapMaterials.forEach((scrap) => {
        scrapMaterialsData.push([
          scrap.code,
          scrap.name,
          scrap.category,
          scrap.quantity.toString(),
          scrap.unit,
          scrap.costAllocation.toString(),
          `₹${scrap.pricePerUnit.toFixed(2)}`,
          `₹${scrap.totalPrice.toFixed(2)}`,
          scrap.comment || "-"
        ]);
      });
    } else {
      scrapMaterialsData.push(["No scrap materials available"]);
    }

    const scrapMaterialsSheet = XLSX.utils.aoa_to_sheet(scrapMaterialsData);
    XLSX.utils.book_append_sheet(workbook, scrapMaterialsSheet, "Scrap Materials");

    // Routing Sheet
    const routingData = [
      ["ROUTING ID", "ROUTING NAME", "DESCRIPTION", "COMMENT"]
    ];
    
    if (bomData?.bomItems[0]?.routing) {
      bomData.bomItems[0].routing.forEach(route => {
        routingData.push([
          route.routing.id.toString(),
          `${route.routing.number}: ${route.routing.name}`,
          route.routing.desc,
          route.comment || "-"
        ]);
      });
    }

    const routingSheet = XLSX.utils.aoa_to_sheet(routingData);
    XLSX.utils.book_append_sheet(workbook, routingSheet, "Routing");

    // Other Charges Sheet
    const otherChargesData = [
      ["ID", "CLASSIFICATION", "AMOUNT", "COMMENT"]
    ];
    
    if (bomData?.bomItems[0]?.otherCharges) {
      bomData.bomItems[0].otherCharges.forEach((charge) => {
        otherChargesData.push([
          charge.id.toString(),
          charge.classification,
          `₹${charge.charges.toFixed(2)}`,
          charge.comment || "-"
        ]);
      });
    }

    const otherChargesSheet = XLSX.utils.aoa_to_sheet(otherChargesData);
    XLSX.utils.book_append_sheet(workbook, otherChargesSheet, "Other Charges");

    // Download the file
    XLSX.writeFile(workbook, `BOM_${bomDetails.bomId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle delete BOM
  const handleDeleteBOM = async () => {
  if (!id) return;
  setDeleting(true);

  try {
    const response = await bomAPI.deleteBOM(parseInt(id));

    if (response.status) {
      SuccessToast({
        title: "BOM deleted successfully",
        description: `BOM ${bomDetails.bomId} has been removed.`,
      });

      navigate("/production/bom");
    }
  } catch (error: any) {
    console.error("Error deleting BOM:", error);

    const apiMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete BOM";

    // ⭐ Detect “being used” errors — adjust if your API text differs
    if (
      apiMessage.toLowerCase().includes("used") ||
      apiMessage.toLowerCase().includes("reference") ||
      error?.response?.status === 409
    ) {
      ErrorToast({
        title: "Deletion Not Allowed",
        description:
          "This BOM cannot be deleted because it is being used in another document.",
      });
    } else {
      ErrorToast({
        title: "Error deleting BOM",
        description: apiMessage,
      });
    }
  } finally {
    setDeleting(false);
    setShowDeleteModal(false);
  }
};

  // Handle edit BOM
  const handleEditBOM = () => {
    if (!id) return;
    // Navigate to edit page
    navigate(`/production/bom/edit/${id}`);
  };

  // Handle raw material comment update
  const handleMaterialCommentChange = (index: number, value: string) => {
    const updatedMaterials = [...rawMaterials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      comment: value
    };
    setRawMaterials(updatedMaterials);
  };

  // Handle scrap material comment update
  const handleScrapCommentChange = (index: number, value: string) => {
    const updatedScrap = [...scrapMaterials];
    updatedScrap[index] = {
      ...updatedScrap[index],
      comment: value
    };
    setScrapMaterials(updatedScrap);
  };

  // Handle BOM details update
  const handleBOMDetailsChange = (field: keyof BOMDetailsType, value: string) => {
    setBomDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          <Link to="/production/bom">
            <Button className="mt-4">Back to BOM List</Button>
          </Link>
        </div>
      </div>
    );
  }

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
              {/* View BOM Cost Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setShowBOMCost(!showBOMCost)}
                className={`flex items-center gap-2 ${
                  showBOMCost ? "bg-blue-50 border-blue-200 text-blue-700" : ""
                }`}
              >
                {showBOMCost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showBOMCost ? "Hide Cost" : "View BOM Cost"}
              </Button>

              {/* Export to Excel Button */}
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={downloadBOMAsExcel}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>

              {/* Edit Button - Icon Only */}
              <Button 
                variant="outline"
                onClick={handleEditBOM}
                className="p-2"
                title="Edit BOM"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              {/* Delete Button - Icon Only */}
              <Button 
  variant="outline"
  onClick={() => setShowDeleteModal(true)}
  className="p-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
  title="Delete BOM"
>
  <Trash2 className="w-4 h-4" />
</Button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-8 py-6">
        {/* Document Details - Always Visible */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Document Details</h2>
          </div>
          <div className="p-6">
            {/* Basic Document Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Document Number:</span>
                  <span className="text-sm font-semibold">{bomDetails.bomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">FG Store:</span>
                  <span className="text-sm">{bomDetails.fgStore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Modified By:</span>
                  <span className="text-sm">{bomDetails.lastModifiedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`text-sm font-semibold ${
                    bomDetails.status.toLowerCase() === 'published' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {bomDetails.status}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <span className="text-sm font-semibold">{bomDetails.bomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">RM Store:</span>
                  <span className="text-sm">{bomDetails.rmStore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Modified Date:</span>
                  <span className="text-sm">{bomDetails.lastModifiedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Document Date:</span>
                  <span className="text-sm">{bomData ? formatDate(bomData.docDate) : ''}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Scrap/Rejected Store:</span>
                  <span className="text-sm">{bomDetails.scrapStore}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Created By:</span>
                  <span className="text-sm">{bomDetails.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Creation Date:</span>
                  <span className="text-sm">{bomDetails.creationDate}</span>
                </div>
              </div>
            </div>

            {/* Description and Comments */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  BOM Description
                </label>
                <Textarea 
                  value={bomDetails.description}
                  onChange={(e) => handleBOMDetailsChange('description', e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="No description provided"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comments
                </label>
                <Textarea 
                  value={bomDetails.comments}
                  onChange={(e) => handleBOMDetailsChange('comments', e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="No comments provided"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{rawMaterials.length}</div>
            <div className="text-sm text-blue-800">RAW MATERIALS</div>
            <div className="text-xs text-blue-600 mt-1">{rawMaterials.length} items</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{routings.length}</div>
            <div className="text-sm text-green-800">PROCESSING</div>
            <div className="text-xs text-green-600 mt-1">{routings.length} steps</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{finishedGoods.length}</div>
            <div className="text-sm text-purple-800">FINISHED GOODS</div>
            <div className="text-xs text-purple-600 mt-1">{finishedGoods.length} item(s)</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{scrapMaterials.length}</div>
            <div className="text-sm text-orange-800">SCRAP MATERIALS</div>
            <div className="text-xs text-orange-600 mt-1">{scrapMaterials.length || 'No'} item(s)</div>
          </div>
        </div>

        {/* BOM Cost Section - Conditionally Rendered */}
        {showBOMCost && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">BOM Cost: ₹{totalBOMCost.toFixed(2)}</h2>
            </div>
            <div className="p-6">
              {/* Finished Goods Section in BOM Cost */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Finished Goods</h3>
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
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">PRICE/UNIT</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL PRICE</th>
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
                          <td className="px-4 py-3 border text-right">₹{fg.pricePerUnit.toFixed(2)}</td>
                          <td className="px-4 py-3 border text-right font-semibold">₹{fg.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw Materials Section in BOM Cost */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Raw Materials</h3>
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
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">PRICE/UNIT</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawMaterials.map((material) => (
                        <tr key={material.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 border font-medium">{material.code}</td>
                          <td className="px-4 py-3 border">{material.name}</td>
                          <td className="px-4 py-3 border">{material.category}</td>
                          <td className="px-4 py-3 border text-right">{material.quantity}</td>
                          <td className="px-4 py-3 border">{material.unit}</td>
                          <td className="px-4 py-3 border text-right">{material.costAllocation}%</td>
                          <td className="px-4 py-3 border text-right">₹{material.pricePerUnit.toFixed(2)}</td>
                          <td className="px-4 py-3 border text-right">₹{material.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-3 border text-right font-semibold">Total Raw Materials Cost:</td>
                        <td className="px-4 py-3 border text-right font-semibold">₹{totalRawMaterialCost.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Other Charges Section */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">Other Charges</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">#</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">CLASSIFICATION</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">AMOUNT</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
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
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="px-4 py-3 border text-right font-semibold">Total Other Charges:</td>
                        <td className="px-4 py-3 border font-semibold">₹{totalOtherCharges.toFixed(2)}</td>
                        <td className="px-4 py-3 border"></td>
                      </tr>
                      <tr className="bg-green-50">
                        <td colSpan={2} className="px-4 py-3 border text-right font-bold text-lg">Total BOM Cost:</td>
                        <td className="px-4 py-3 border font-bold text-lg text-green-600">₹{totalBOMCost.toFixed(2)}</td>
                        <td className="px-4 py-3 border"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finished Goods Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Finished Goods</h2>
          </div>
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
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">PRICE/UNIT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL PRICE</th>
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
                        <td className="px-4 py-3 border text-right">₹{fg.pricePerUnit.toFixed(2)}</td>
                        <td className="px-4 py-3 border text-right font-semibold">₹{fg.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No finished goods data available
              </div>
            )}
          </div>
        </div>

        {/* Raw Materials Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Raw Materials</h2>
          </div>
          <div className="p-6">
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
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">PRICE/UNIT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL PRICE</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((material, index) => (
                    <tr key={material.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 border font-medium">{material.code}</td>
                      <td className="px-4 py-3 border">{material.name}</td>
                      <td className="px-4 py-3 border">{material.category}</td>
                      <td className="px-4 py-3 border text-right">{material.quantity}</td>
                      <td className="px-4 py-3 border">{material.unit}</td>
                      <td className="px-4 py-3 border text-right">{material.costAllocation}%</td>
                      <td className="px-4 py-3 border text-right">₹{material.pricePerUnit.toFixed(2)}</td>
                      <td className="px-4 py-3 border text-right">₹{material.totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 border">
                        <Input 
                          value={material.comment}
                          onChange={(e) => handleMaterialCommentChange(index, e.target.value)}
                          className="border-0 focus-visible:ring-0 shadow-none text-sm"
                          placeholder="-"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scrap Materials Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Scrap Materials</h2>
          </div>
          <div className="p-6">
            {scrapMaterials.length > 0 ? (
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
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">PRICE/UNIT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL PRICE</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
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
                        <td className="px-4 py-3 border text-right">₹{scrap.pricePerUnit.toFixed(2)}</td>
                        <td className="px-4 py-3 border text-right">₹{scrap.totalPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 border">
                          <Input 
                            value={scrap.comment}
                            onChange={(e) => handleScrapCommentChange(index, e.target.value)}
                            className="border-0 focus-visible:ring-0 shadow-none text-sm"
                            placeholder="-"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No scrap materials available
              </div>
            )}
          </div>
        </div>

        {/* Routing Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Routing</h2>
          </div>
          <div className="p-6 space-y-4">
            {routings.length > 0 ? (
              routings.map((routing) => (
                <div key={routing.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-blue-600 mb-2">{routing.name}</h3>
                  <p className="text-sm text-gray-600">{routing.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No routing information available
              </div>
            )}
          </div>
        </div>

        {/* Other Charges Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Other Charges</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">CLASSIFICATION</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">AMOUNT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
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
              </table>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Delete BOM {bomDetails.bomId}?
      </h3>

      <p className="text-sm text-gray-600 mt-2">
        This action cannot be undone. If this BOM is used in another document,
        deletion will not be allowed.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setShowDeleteModal(false)}
          disabled={deleting}
        >
          Cancel
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={handleDeleteBOM}
          disabled={deleting}
        >
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