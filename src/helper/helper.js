export const shapeWoolworthsData = (data) => {
  // 1. Safety Check: Return empty array if no data
  if (!data || !data.Products) return [];

  // 2. Flatten the nested structure
  // Woolworths API structure: { Products: [ { Products: [ ...actual items ] } ] }
  // We use .flatMap() to pull the inner items out of their groups into one long list.
  return data.Products.flatMap((group) => group.Products || []).map((item) => ({
    id: item.Stockcode, // Unique ID (e.g., 76358)
    name: item.Name, // Product Name
    brand: item.Brand, // Brand (e.g., "Kinder")
    store: "Woolworths", // Hardcoded source
    price: item.Price, // Current selling price (e.g., 2.2)
    unitPrice: item.InstoreCupPrice, // Price per unit (e.g., 11)
    unitPriceString: item.InstoreCupString,
    size: item.PackageSize || item.CupMeasure, // "20g" (Preferred) or fallback to "100G"
  }));
};
