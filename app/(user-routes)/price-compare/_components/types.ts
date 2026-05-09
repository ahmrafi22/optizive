export type StreamStage =
  | "idle"
  | "received"
  | "query"
  | "crawling"
  | "analysis"
  | "complete"
  | "error";

export interface CompareRequest {
  productName: string;
  category: string;
  info?: string;
  city?: string;
  country: string;
}

export interface CompareResponse {
  success: boolean;
  searchQueries: string[];
  searchLinks: string[];
  exactMatches: ProductResult[];
  relatedProducts: ProductResult[];
  totalFound: number;
  sellerPrice: string | null;
  bestPrice: string | null;
  summary: string;
  sellerSummary: string;
  timestamp: string;
}

export interface ProductResult {
  productName: string;
  source: string;
  sourceLogoUrl: string | null;
  price: number | null;
  currency: string;
  unitText: string | null;
  unitValue: number | null;
  unitName: string | null;
  unitPrice: number | null;
  unitPriceUnit: string | null;
  pricePerUnit: string | null;
  matchPercentage: number;
  productUrl: string;
  imageUrl: string | null;
  availability: string | null;
  notes: string | null;
}

// Country value sent to the API is the human-readable name (e.g. "Bangladesh")
// tld is used only to render the flag image via flagcdn.com
export const COUNTRY_OPTIONS: { value: string; label: string; tld: string }[] = [
  // Default first
  { value: "bangladesh", label: "Bangladesh", tld: "bd" },
  // Alphabetical
  { value: "afghanistan", label: "Afghanistan", tld: "af" },
  { value: "argentina", label: "Argentina", tld: "ar" },
  { value: "australia", label: "Australia", tld: "au" },
  { value: "austria", label: "Austria", tld: "at" },
  { value: "bahrain", label: "Bahrain", tld: "bh" },
  { value: "belgium", label: "Belgium", tld: "be" },
  { value: "brazil", label: "Brazil", tld: "br" },
  { value: "cambodia", label: "Cambodia", tld: "kh" },
  { value: "canada", label: "Canada", tld: "ca" },
  { value: "chile", label: "Chile", tld: "cl" },
  { value: "china", label: "China", tld: "cn" },
  { value: "colombia", label: "Colombia", tld: "co" },
  { value: "czech republic", label: "Czech Republic", tld: "cz" },
  { value: "denmark", label: "Denmark", tld: "dk" },
  { value: "ecuador", label: "Ecuador", tld: "ec" },
  { value: "egypt", label: "Egypt", tld: "eg" },
  { value: "ethiopia", label: "Ethiopia", tld: "et" },
  { value: "finland", label: "Finland", tld: "fi" },
  { value: "france", label: "France", tld: "fr" },
  { value: "germany", label: "Germany", tld: "de" },
  { value: "ghana", label: "Ghana", tld: "gh" },
  { value: "greece", label: "Greece", tld: "gr" },
  { value: "hong kong", label: "Hong Kong", tld: "hk" },
  { value: "hungary", label: "Hungary", tld: "hu" },
  { value: "india", label: "India", tld: "in" },
  { value: "indonesia", label: "Indonesia", tld: "id" },
  { value: "ireland", label: "Ireland", tld: "ie" },
  { value: "israel", label: "Israel", tld: "il" },
  { value: "italy", label: "Italy", tld: "it" },
  { value: "japan", label: "Japan", tld: "jp" },
  { value: "jordan", label: "Jordan", tld: "jo" },
  { value: "kenya", label: "Kenya", tld: "ke" },
  { value: "kuwait", label: "Kuwait", tld: "kw" },
  { value: "lebanon", label: "Lebanon", tld: "lb" },
  { value: "malaysia", label: "Malaysia", tld: "my" },
  { value: "maldives", label: "Maldives", tld: "mv" },
  { value: "mexico", label: "Mexico", tld: "mx" },
  { value: "morocco", label: "Morocco", tld: "ma" },
  { value: "myanmar", label: "Myanmar", tld: "mm" },
  { value: "nepal", label: "Nepal", tld: "np" },
  { value: "netherlands", label: "Netherlands", tld: "nl" },
  { value: "new zealand", label: "New Zealand", tld: "nz" },
  { value: "nigeria", label: "Nigeria", tld: "ng" },
  { value: "norway", label: "Norway", tld: "no" },
  { value: "oman", label: "Oman", tld: "om" },
  { value: "pakistan", label: "Pakistan", tld: "pk" },
  { value: "peru", label: "Peru", tld: "pe" },
  { value: "philippines", label: "Philippines", tld: "ph" },
  { value: "poland", label: "Poland", tld: "pl" },
  { value: "portugal", label: "Portugal", tld: "pt" },
  { value: "qatar", label: "Qatar", tld: "qa" },
  { value: "romania", label: "Romania", tld: "ro" },
  { value: "russia", label: "Russia", tld: "ru" },
  { value: "saudi arabia", label: "Saudi Arabia", tld: "sa" },
  { value: "singapore", label: "Singapore", tld: "sg" },
  { value: "south africa", label: "South Africa", tld: "za" },
  { value: "south korea", label: "South Korea", tld: "kr" },
  { value: "spain", label: "Spain", tld: "es" },
  { value: "sri lanka", label: "Sri Lanka", tld: "lk" },
  { value: "sweden", label: "Sweden", tld: "se" },
  { value: "switzerland", label: "Switzerland", tld: "ch" },
  { value: "taiwan", label: "Taiwan", tld: "tw" },
  { value: "tanzania", label: "Tanzania", tld: "tz" },
  { value: "thailand", label: "Thailand", tld: "th" },
  { value: "turkey", label: "Turkey", tld: "tr" },
  { value: "ukraine", label: "Ukraine", tld: "ua" },
  { value: "united arab emirates", label: "United Arab Emirates", tld: "ae" },
  { value: "united kingdom", label: "United Kingdom", tld: "gb" },
  { value: "united states", label: "United States", tld: "us" },
  { value: "uruguay", label: "Uruguay", tld: "uy" },
  { value: "venezuela", label: "Venezuela", tld: "ve" },
  { value: "vietnam", label: "Vietnam", tld: "vn" },
];

export const CATEGORY_OPTIONS = [
  { value: "groceries", label: "Groceries" },
  { value: "electronics", label: "Electronics" },
  { value: "raw_materials", label: "Raw materials" },
  { value: "clothing", label: "Clothing" },
  { value: "home_appliances", label: "Home appliances" },
  { value: "beauty_personal_care", label: "Beauty and personal care" },
  { value: "health_pharmacy", label: "Health and pharmacy" },
  { value: "baby_kids", label: "Baby and kids" },
  { value: "books_stationery", label: "Books and stationery" },
  { value: "sports_outdoors", label: "Sports and outdoors" },
  { value: "tools_hardware", label: "Tools and hardware" },
  { value: "automotive", label: "Automotive" },
  { value: "furniture_home", label: "Furniture and home" },
  { value: "pet_supplies", label: "Pet supplies" },
  { value: "office_supplies", label: "Office supplies" },
  { value: "services", label: "Services" },
  { value: "electronics_accessories", label: "Electronics accessories" },
  { value: "mobiles_computing", label: "Mobiles and computing" },
  { value: "kitchen_dining", label: "Kitchen and dining" },
  { value: "gifts_crafts", label: "Gifts and crafts" },
  { value: "travel_luggage", label: "Travel and luggage" },
  { value: "garden_farm", label: "Garden and farm" },
  { value: "toys_games", label: "Toys and games" },
  { value: "jewelry_watches", label: "Jewelry and watches" },
  { value: "music_instruments", label: "Music instruments" },
  { value: "industrial_equipment", label: "Industrial equipment" },
  { value: "software_digital", label: "Software and digital" },
  { value: "education_training", label: "Education and training" },
];

export const STAGE_LABELS: Record<StreamStage, string> = {
  idle: "Ready",
  received: "Queued",
  query: "Searching",
  crawling: "Crawling",
  analysis: "Analyzing",
  complete: "Complete",
  error: "Error",
};
