export const API_HOST =
  (import.meta as any)?.env?.VITE_API_BASE ||
  ((typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"))
    ? "http://127.0.0.1:5000"
    : "https://api.zooda.in");
export const API_BASE_URL = `${API_HOST.replace(/\\/$/, "")}/api`; // update to your backend URL if needed

export interface Promotion {
  id?: string;
  _id?: string;
  name: string;
  title?: string;
  description: string;
  image?: string;
  imageUrl?: string;
  discountType?: string;
  discountValue?: number;
  discountPercentage?: number;
  couponCode?: string;
  discountCode?: string;
  type?: "banner" | "popup" | "discount" | "coupon" | "bogo";
  isActive: boolean;
  startDate: string;
  endDate: string;
  status?: string;
  targetUrl?: string;
  [key: string]: any;
}

export async function getCompanyPromotions(companyId: string): Promise<Promotion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions/company/${companyId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    if (result.success && Array.isArray(result.promotions)) {
      return result.promotions;
    }
    return [];
  } catch (error) {
    console.error("Error fetching company promotions:", error);
    return [];
  }
}
