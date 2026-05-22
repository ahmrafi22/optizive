import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Category, StockUnit } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "290ad905-f363-406f-ba5e-3195719419a3";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to your environment before running the seed script.");
  process.exit(1);
}

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

// 200 Bangladeshi Grocery Products
const BANGLADESHI_GROCERY_CATALOG = [
  // Rice & Grains (20 products)
  { category: Category.GROCERIES, name: "Miniket Rice 5kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 150, minStock: 30 },
  { category: Category.GROCERIES, name: "Basmati Rice Premium 5kg", unit: StockUnit.KG, costPrice: 450, sellingPrice: 550, quantity: 120, minStock: 25 },
  { category: Category.GROCERIES, name: "Nazirshail Rice 5kg", unit: StockUnit.KG, costPrice: 320, sellingPrice: 400, quantity: 100, minStock: 20 },
  { category: Category.GROCERIES, name: "Chinigura Rice 1kg", unit: StockUnit.KG, costPrice: 180, sellingPrice: 220, quantity: 80, minStock: 15 },
  { category: Category.GROCERIES, name: "Atap Rice 5kg", unit: StockUnit.KG, costPrice: 250, sellingPrice: 310, quantity: 90, minStock: 18 },
  { category: Category.GROCERIES, name: "Moshur Dal Red 1kg", unit: StockUnit.KG, costPrice: 95, sellingPrice: 125, quantity: 200, minStock: 40 },
  { category: Category.GROCERIES, name: "Chana Dal Premium 1kg", unit: StockUnit.KG, costPrice: 110, sellingPrice: 145, quantity: 180, minStock: 35 },
  { category: Category.GROCERIES, name: "Moong Dal 1kg", unit: StockUnit.KG, costPrice: 120, sellingPrice: 155, quantity: 160, minStock: 30 },
  { category: Category.GROCERIES, name: "Masoor Dal 1kg", unit: StockUnit.KG, costPrice: 100, sellingPrice: 130, quantity: 170, minStock: 35 },
  { category: Category.GROCERIES, name: "Khesari Dal 1kg", unit: StockUnit.KG, costPrice: 85, sellingPrice: 110, quantity: 140, minStock: 28 },
  { category: Category.GROCERIES, name: "Motor Dal 1kg", unit: StockUnit.KG, costPrice: 90, sellingPrice: 120, quantity: 130, minStock: 26 },
  { category: Category.GROCERIES, name: "Wheat Flour Atta 5kg", unit: StockUnit.KG, costPrice: 220, sellingPrice: 280, quantity: 200, minStock: 40 },
  { category: Category.GROCERIES, name: "Maida Flour 2kg", unit: StockUnit.KG, costPrice: 85, sellingPrice: 110, quantity: 150, minStock: 30 },
  { category: Category.GROCERIES, name: "Suji Semolina 1kg", unit: StockUnit.KG, costPrice: 65, sellingPrice: 85, quantity: 120, minStock: 24 },
  { category: Category.GROCERIES, name: "Soybean 1kg", unit: StockUnit.KG, costPrice: 75, sellingPrice: 95, quantity: 100, minStock: 20 },
  { category: Category.GROCERIES, name: "Chickpeas Kabuli Chana 1kg", unit: StockUnit.KG, costPrice: 140, sellingPrice: 180, quantity: 110, minStock: 22 },
  { category: Category.GROCERIES, name: "Black Gram Urad Dal 1kg", unit: StockUnit.KG, costPrice: 130, sellingPrice: 165, quantity: 95, minStock: 19 },
  { category: Category.GROCERIES, name: "Puffed Rice Muri 500g", unit: StockUnit.PACK, costPrice: 35, sellingPrice: 50, quantity: 180, minStock: 36 },
  { category: Category.GROCERIES, name: "Flattened Rice Chira 500g", unit: StockUnit.PACK, costPrice: 40, sellingPrice: 55, quantity: 160, minStock: 32 },
  { category: Category.GROCERIES, name: "Vermicelli Semai 400g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 140, minStock: 28 },

  // Cooking Oils & Ghee (15 products)
  { category: Category.AGRO_PRODUCTS, name: "Mustard Oil 1L", unit: StockUnit.LITER, costPrice: 165, sellingPrice: 210, quantity: 200, minStock: 40 },
  { category: Category.AGRO_PRODUCTS, name: "Soybean Oil 5L", unit: StockUnit.LITER, costPrice: 550, sellingPrice: 680, quantity: 150, minStock: 30 },
  { category: Category.AGRO_PRODUCTS, name: "Sunflower Oil 2L", unit: StockUnit.LITER, costPrice: 280, sellingPrice: 350, quantity: 120, minStock: 24 },
  { category: Category.AGRO_PRODUCTS, name: "Palm Oil 5L", unit: StockUnit.LITER, costPrice: 480, sellingPrice: 590, quantity: 100, minStock: 20 },
  { category: Category.AGRO_PRODUCTS, name: "Rice Bran Oil 1L", unit: StockUnit.LITER, costPrice: 145, sellingPrice: 185, quantity: 90, minStock: 18 },
  { category: Category.DAIRY, name: "Pure Ghee 500g", unit: StockUnit.PACK, costPrice: 420, sellingPrice: 520, quantity: 80, minStock: 16 },
  { category: Category.DAIRY, name: "Butter 200g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 100, minStock: 20 },
  { category: Category.AGRO_PRODUCTS, name: "Olive Oil 500ml", unit: StockUnit.BOTTLE, costPrice: 380, sellingPrice: 480, quantity: 60, minStock: 12 },
  { category: Category.AGRO_PRODUCTS, name: "Coconut Oil 500ml", unit: StockUnit.BOTTLE, costPrice: 220, sellingPrice: 280, quantity: 110, minStock: 22 },
  { category: Category.AGRO_PRODUCTS, name: "Sesame Oil 250ml", unit: StockUnit.BOTTLE, costPrice: 140, sellingPrice: 180, quantity: 70, minStock: 14 },
  { category: Category.DAIRY, name: "Vegetable Ghee 1kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 95, minStock: 19 },
  { category: Category.AGRO_PRODUCTS, name: "Canola Oil 2L", unit: StockUnit.LITER, costPrice: 320, sellingPrice: 400, quantity: 85, minStock: 17 },
  { category: Category.AGRO_PRODUCTS, name: "Corn Oil 1L", unit: StockUnit.LITER, costPrice: 175, sellingPrice: 220, quantity: 105, minStock: 21 },
  { category: Category.AGRO_PRODUCTS, name: "Groundnut Oil 1L", unit: StockUnit.LITER, costPrice: 190, sellingPrice: 240, quantity: 90, minStock: 18 },
  { category: Category.AGRO_PRODUCTS, name: "Blended Oil 5L", unit: StockUnit.LITER, costPrice: 520, sellingPrice: 640, quantity: 130, minStock: 26 },

  // Spices & Condiments (25 products)
  { category: Category.GROCERIES, name: "Turmeric Powder 200g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 180, minStock: 36 },
  { category: Category.GROCERIES, name: "Red Chili Powder 200g", unit: StockUnit.PACK, costPrice: 75, sellingPrice: 95, quantity: 170, minStock: 34 },
  { category: Category.GROCERIES, name: "Coriander Powder 100g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 160, minStock: 32 },
  { category: Category.GROCERIES, name: "Cumin Powder 100g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 150, minStock: 30 },
  { category: Category.GROCERIES, name: "Garam Masala 50g", unit: StockUnit.PACK, costPrice: 40, sellingPrice: 55, quantity: 140, minStock: 28 },
  { category: Category.GROCERIES, name: "Black Pepper Whole 100g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 120, minStock: 24 },
  { category: Category.GROCERIES, name: "Cardamom Green 50g", unit: StockUnit.PACK, costPrice: 280, sellingPrice: 350, quantity: 80, minStock: 16 },
  { category: Category.GROCERIES, name: "Cinnamon Stick 50g", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 100, minStock: 20 },
  { category: Category.GROCERIES, name: "Cloves 50g", unit: StockUnit.PACK, costPrice: 120, sellingPrice: 155, quantity: 90, minStock: 18 },
  { category: Category.GROCERIES, name: "Bay Leaves 20g", unit: StockUnit.PACK, costPrice: 35, sellingPrice: 50, quantity: 130, minStock: 26 },
  { category: Category.GROCERIES, name: "Cumin Seeds 200g", unit: StockUnit.PACK, costPrice: 110, sellingPrice: 140, quantity: 110, minStock: 22 },
  { category: Category.GROCERIES, name: "Mustard Seeds 200g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 125, minStock: 25 },
  { category: Category.GROCERIES, name: "Fenugreek Seeds 100g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 105, minStock: 21 },
  { category: Category.GROCERIES, name: "Fennel Seeds 100g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 115, minStock: 23 },
  { category: Category.GROCERIES, name: "Nigella Seeds Kalonji 100g", unit: StockUnit.PACK, costPrice: 50, sellingPrice: 70, quantity: 100, minStock: 20 },
  { category: Category.GROCERIES, name: "Star Anise 50g", unit: StockUnit.PACK, costPrice: 75, sellingPrice: 95, quantity: 85, minStock: 17 },
  { category: Category.GROCERIES, name: "Nutmeg Whole 50g", unit: StockUnit.PACK, costPrice: 140, sellingPrice: 180, quantity: 70, minStock: 14 },
  { category: Category.GROCERIES, name: "Mace Javitri 25g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 60, minStock: 12 },
  { category: Category.GROCERIES, name: "Dried Red Chili 100g", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 140, minStock: 28 },
  { category: Category.GROCERIES, name: "Curry Leaves Dried 50g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 95, minStock: 19 },
  { category: Category.GROCERIES, name: "Kashmiri Chili Powder 100g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 110, minStock: 22 },
  { category: Category.GROCERIES, name: "Chat Masala 100g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 120, minStock: 24 },
  { category: Category.GROCERIES, name: "Biryani Masala 100g", unit: StockUnit.PACK, costPrice: 75, sellingPrice: 95, quantity: 130, minStock: 26 },
  { category: Category.GROCERIES, name: "Meat Masala 100g", unit: StockUnit.PACK, costPrice: 70, sellingPrice: 90, quantity: 115, minStock: 23 },
  { category: Category.GROCERIES, name: "Fish Curry Masala 100g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 105, minStock: 21 },

  // Salt, Sugar & Sweeteners (10 products)
  { category: Category.GROCERIES, name: "Iodized Salt 1kg", unit: StockUnit.KG, costPrice: 25, sellingPrice: 35, quantity: 300, minStock: 60 },
  { category: Category.GROCERIES, name: "Rock Salt 500g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 150, minStock: 30 },
  { category: Category.GROCERIES, name: "White Sugar 1kg", unit: StockUnit.KG, costPrice: 65, sellingPrice: 85, quantity: 250, minStock: 50 },
  { category: Category.GROCERIES, name: "Brown Sugar 500g", unit: StockUnit.PACK, costPrice: 75, sellingPrice: 95, quantity: 120, minStock: 24 },
  { category: Category.GROCERIES, name: "Jaggery Gur 1kg", unit: StockUnit.KG, costPrice: 95, sellingPrice: 125, quantity: 140, minStock: 28 },
  { category: Category.GROCERIES, name: "Date Palm Jaggery 500g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 80, minStock: 16 },
  { category: Category.GROCERIES, name: "Honey 500g", unit: StockUnit.BOTTLE, costPrice: 320, sellingPrice: 400, quantity: 90, minStock: 18 },
  { category: Category.GROCERIES, name: "Molasses 500ml", unit: StockUnit.BOTTLE, costPrice: 85, sellingPrice: 110, quantity: 100, minStock: 20 },
  { category: Category.GROCERIES, name: "Stevia Sweetener 100g", unit: StockUnit.PACK, costPrice: 220, sellingPrice: 280, quantity: 60, minStock: 12 },
  { category: Category.GROCERIES, name: "Icing Sugar 500g", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 110, minStock: 22 },

  // Fresh Vegetables (20 products)
  { category: Category.FRESH_PRODUCE, name: "Potato 1kg", unit: StockUnit.KG, costPrice: 25, sellingPrice: 35, quantity: 300, minStock: 60 },
  { category: Category.FRESH_PRODUCE, name: "Onion 1kg", unit: StockUnit.KG, costPrice: 35, sellingPrice: 50, quantity: 280, minStock: 56 },
  { category: Category.FRESH_PRODUCE, name: "Tomato 1kg", unit: StockUnit.KG, costPrice: 45, sellingPrice: 60, quantity: 200, minStock: 40 },
  { category: Category.FRESH_PRODUCE, name: "Green Chili 250g", unit: StockUnit.PACK, costPrice: 30, sellingPrice: 45, quantity: 150, minStock: 30 },
  { category: Category.FRESH_PRODUCE, name: "Garlic 500g", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 140, minStock: 28 },
  { category: Category.FRESH_PRODUCE, name: "Ginger 500g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 130, minStock: 26 },
  { category: Category.FRESH_PRODUCE, name: "Carrot 1kg", unit: StockUnit.KG, costPrice: 55, sellingPrice: 75, quantity: 160, minStock: 32 },
  { category: Category.FRESH_PRODUCE, name: "Cabbage 1pc", unit: StockUnit.PCS, costPrice: 35, sellingPrice: 50, quantity: 120, minStock: 24 },
  { category: Category.FRESH_PRODUCE, name: "Cauliflower 1pc", unit: StockUnit.PCS, costPrice: 45, sellingPrice: 65, quantity: 110, minStock: 22 },
  { category: Category.FRESH_PRODUCE, name: "Eggplant Begun 1kg", unit: StockUnit.KG, costPrice: 40, sellingPrice: 55, quantity: 140, minStock: 28 },
  { category: Category.FRESH_PRODUCE, name: "Bitter Gourd Korola 500g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 100, minStock: 20 },
  { category: Category.FRESH_PRODUCE, name: "Bottle Gourd Lau 1kg", unit: StockUnit.KG, costPrice: 35, sellingPrice: 50, quantity: 130, minStock: 26 },
  { category: Category.FRESH_PRODUCE, name: "Ridge Gourd Jhinga 500g", unit: StockUnit.PACK, costPrice: 40, sellingPrice: 55, quantity: 110, minStock: 22 },
  { category: Category.FRESH_PRODUCE, name: "Pumpkin Misti Kumra 1kg", unit: StockUnit.KG, costPrice: 30, sellingPrice: 45, quantity: 150, minStock: 30 },
  { category: Category.FRESH_PRODUCE, name: "Spinach Palak 500g", unit: StockUnit.PACK, costPrice: 25, sellingPrice: 40, quantity: 120, minStock: 24 },
  { category: Category.FRESH_PRODUCE, name: "Okra Bhindi 500g", unit: StockUnit.PACK, costPrice: 50, sellingPrice: 70, quantity: 100, minStock: 20 },
  { category: Category.FRESH_PRODUCE, name: "Radish Mula 1kg", unit: StockUnit.KG, costPrice: 30, sellingPrice: 45, quantity: 140, minStock: 28 },
  { category: Category.FRESH_PRODUCE, name: "Cucumber Shosha 1kg", unit: StockUnit.KG, costPrice: 35, sellingPrice: 50, quantity: 130, minStock: 26 },
  { category: Category.FRESH_PRODUCE, name: "Beans 500g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 110, minStock: 22 },
  { category: Category.FRESH_PRODUCE, name: "Coriander Leaves 100g", unit: StockUnit.PACK, costPrice: 15, sellingPrice: 25, quantity: 180, minStock: 36 },

  // Fresh Fruits (15 products)
  { category: Category.FRESH_PRODUCE, name: "Banana 12pc", unit: StockUnit.DOZEN, costPrice: 40, sellingPrice: 60, quantity: 200, minStock: 40 },
  { category: Category.FRESH_PRODUCE, name: "Mango Fazli 1kg", unit: StockUnit.KG, costPrice: 120, sellingPrice: 160, quantity: 100, minStock: 20 },
  { category: Category.FRESH_PRODUCE, name: "Apple Imported 1kg", unit: StockUnit.KG, costPrice: 220, sellingPrice: 280, quantity: 90, minStock: 18 },
  { category: Category.FRESH_PRODUCE, name: "Orange Malta 1kg", unit: StockUnit.KG, costPrice: 140, sellingPrice: 180, quantity: 120, minStock: 24 },
  { category: Category.FRESH_PRODUCE, name: "Papaya 1kg", unit: StockUnit.KG, costPrice: 45, sellingPrice: 60, quantity: 140, minStock: 28 },
  { category: Category.FRESH_PRODUCE, name: "Watermelon 1kg", unit: StockUnit.KG, costPrice: 30, sellingPrice: 45, quantity: 160, minStock: 32 },
  { category: Category.FRESH_PRODUCE, name: "Pineapple 1pc", unit: StockUnit.PCS, costPrice: 55, sellingPrice: 75, quantity: 100, minStock: 20 },
  { category: Category.FRESH_PRODUCE, name: "Guava Peyara 1kg", unit: StockUnit.KG, costPrice: 65, sellingPrice: 85, quantity: 110, minStock: 22 },
  { category: Category.FRESH_PRODUCE, name: "Pomegranate 1kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 60, minStock: 12 },
  { category: Category.FRESH_PRODUCE, name: "Grapes 500g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 80, minStock: 16 },
  { category: Category.FRESH_PRODUCE, name: "Lemon 250g", unit: StockUnit.PACK, costPrice: 35, sellingPrice: 50, quantity: 150, minStock: 30 },
  { category: Category.FRESH_PRODUCE, name: "Coconut 1pc", unit: StockUnit.PCS, costPrice: 35, sellingPrice: 50, quantity: 130, minStock: 26 },
  { category: Category.FRESH_PRODUCE, name: "Jackfruit Kathal 1kg", unit: StockUnit.KG, costPrice: 55, sellingPrice: 75, quantity: 90, minStock: 18 },
  { category: Category.FRESH_PRODUCE, name: "Litchi 500g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 70, minStock: 14 },
  { category: Category.FRESH_PRODUCE, name: "Dragon Fruit 1pc", unit: StockUnit.PCS, costPrice: 120, sellingPrice: 160, quantity: 50, minStock: 10 },

  // Fish & Seafood (15 products)
  { category: Category.FISHERY_SEAFOOD, name: "Hilsa Fish Ilish 1kg", unit: StockUnit.KG, costPrice: 950, sellingPrice: 1200, quantity: 40, minStock: 8 },
  { category: Category.FISHERY_SEAFOOD, name: "Rohu Fish Rui 1kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 80, minStock: 16 },
  { category: Category.FISHERY_SEAFOOD, name: "Catla Fish Katla 1kg", unit: StockUnit.KG, costPrice: 260, sellingPrice: 330, quantity: 75, minStock: 15 },
  { category: Category.FISHERY_SEAFOOD, name: "Tilapia Fish 1kg", unit: StockUnit.KG, costPrice: 180, sellingPrice: 230, quantity: 100, minStock: 20 },
  { category: Category.FISHERY_SEAFOOD, name: "Pangas Fish 1kg", unit: StockUnit.KG, costPrice: 160, sellingPrice: 210, quantity: 110, minStock: 22 },
  { category: Category.FISHERY_SEAFOOD, name: "Prawn Chingri Medium 1kg", unit: StockUnit.KG, costPrice: 580, sellingPrice: 720, quantity: 60, minStock: 12 },
  { category: Category.FISHERY_SEAFOOD, name: "Prawn Golda Large 1kg", unit: StockUnit.KG, costPrice: 850, sellingPrice: 1050, quantity: 45, minStock: 9 },
  { category: Category.FISHERY_SEAFOOD, name: "Crab Kankra 1kg", unit: StockUnit.KG, costPrice: 420, sellingPrice: 530, quantity: 50, minStock: 10 },
  { category: Category.FISHERY_SEAFOOD, name: "Pomfret Fish 1kg", unit: StockUnit.KG, costPrice: 680, sellingPrice: 850, quantity: 40, minStock: 8 },
  { category: Category.FISHERY_SEAFOOD, name: "Salmon Fish 500g", unit: StockUnit.PACK, costPrice: 520, sellingPrice: 650, quantity: 35, minStock: 7 },
  { category: Category.FISHERY_SEAFOOD, name: "Tuna Fish 500g", unit: StockUnit.PACK, costPrice: 380, sellingPrice: 480, quantity: 45, minStock: 9 },
  { category: Category.FISHERY_SEAFOOD, name: "Mackerel Fish 1kg", unit: StockUnit.KG, costPrice: 220, sellingPrice: 280, quantity: 70, minStock: 14 },
  { category: Category.FISHERY_SEAFOOD, name: "Sardine Fish 1kg", unit: StockUnit.KG, costPrice: 180, sellingPrice: 230, quantity: 65, minStock: 13 },
  { category: Category.FISHERY_SEAFOOD, name: "Squid 500g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 40, minStock: 8 },
  { category: Category.FISHERY_SEAFOOD, name: "Dried Fish Shutki 250g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 80, minStock: 16 },

  // Meat & Poultry (15 products)
  { category: Category.MEAT_POULTRY, name: "Chicken Broiler 1kg", unit: StockUnit.KG, costPrice: 180, sellingPrice: 230, quantity: 150, minStock: 30 },
  { category: Category.MEAT_POULTRY, name: "Chicken Breast 1kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 100, minStock: 20 },
  { category: Category.MEAT_POULTRY, name: "Chicken Leg 1kg", unit: StockUnit.KG, costPrice: 240, sellingPrice: 300, quantity: 110, minStock: 22 },
  { category: Category.MEAT_POULTRY, name: "Chicken Wings 1kg", unit: StockUnit.KG, costPrice: 220, sellingPrice: 280, quantity: 90, minStock: 18 },
  { category: Category.MEAT_POULTRY, name: "Chicken Liver 500g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 80, minStock: 16 },
  { category: Category.MEAT_POULTRY, name: "Duck Meat 1kg", unit: StockUnit.KG, costPrice: 380, sellingPrice: 480, quantity: 50, minStock: 10 },
  { category: Category.MEAT_POULTRY, name: "Beef Curry Cut 1kg", unit: StockUnit.KG, costPrice: 580, sellingPrice: 720, quantity: 80, minStock: 16 },
  { category: Category.MEAT_POULTRY, name: "Beef Boneless 1kg", unit: StockUnit.KG, costPrice: 680, sellingPrice: 850, quantity: 70, minStock: 14 },
  { category: Category.MEAT_POULTRY, name: "Beef Bone 1kg", unit: StockUnit.KG, costPrice: 280, sellingPrice: 350, quantity: 90, minStock: 18 },
  { category: Category.MEAT_POULTRY, name: "Mutton Curry Cut 1kg", unit: StockUnit.KG, costPrice: 850, sellingPrice: 1050, quantity: 60, minStock: 12 },
  { category: Category.MEAT_POULTRY, name: "Mutton Boneless 1kg", unit: StockUnit.KG, costPrice: 980, sellingPrice: 1200, quantity: 50, minStock: 10 },
  { category: Category.MEAT_POULTRY, name: "Goat Liver 500g", unit: StockUnit.PACK, costPrice: 220, sellingPrice: 280, quantity: 55, minStock: 11 },
  { category: Category.MEAT_POULTRY, name: "Minced Meat Beef 500g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 75, minStock: 15 },
  { category: Category.MEAT_POULTRY, name: "Sausage 500g", unit: StockUnit.PACK, costPrice: 280, sellingPrice: 350, quantity: 85, minStock: 17 },
  { category: Category.MEAT_POULTRY, name: "Salami 250g", unit: StockUnit.PACK, costPrice: 220, sellingPrice: 280, quantity: 70, minStock: 14 },

  // Dairy Products (15 products)
  { category: Category.DAIRY, name: "Full Cream Milk 1L", unit: StockUnit.LITER, costPrice: 65, sellingPrice: 85, quantity: 200, minStock: 40 },
  { category: Category.DAIRY, name: "Toned Milk 1L", unit: StockUnit.LITER, costPrice: 55, sellingPrice: 75, quantity: 180, minStock: 36 },
  { category: Category.DAIRY, name: "Powdered Milk 500g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 120, minStock: 24 },
  { category: Category.DAIRY, name: "Condensed Milk 400g", unit: StockUnit.CAN, costPrice: 140, sellingPrice: 180, quantity: 150, minStock: 30 },
  { category: Category.DAIRY, name: "Evaporated Milk 400ml", unit: StockUnit.CAN, costPrice: 120, sellingPrice: 155, quantity: 130, minStock: 26 },
  { category: Category.DAIRY, name: "Yogurt Plain 500g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 160, minStock: 32 },
  { category: Category.DAIRY, name: "Yogurt Flavored 200g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 180, minStock: 36 },
  { category: Category.DAIRY, name: "Cheese Cheddar 200g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 100, minStock: 20 },
  { category: Category.DAIRY, name: "Cheese Mozzarella 200g", unit: StockUnit.PACK, costPrice: 220, sellingPrice: 280, quantity: 90, minStock: 18 },
  { category: Category.DAIRY, name: "Cream 200ml", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 110, minStock: 22 },
  { category: Category.DAIRY, name: "Paneer 200g", unit: StockUnit.PACK, costPrice: 120, sellingPrice: 155, quantity: 95, minStock: 19 },
  { category: Category.DAIRY, name: "Butter Salted 200g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 105, minStock: 21 },
  { category: Category.DAIRY, name: "Butter Unsalted 200g", unit: StockUnit.PACK, costPrice: 190, sellingPrice: 240, quantity: 95, minStock: 19 },
  { category: Category.DAIRY, name: "Sour Cream 200ml", unit: StockUnit.PACK, costPrice: 110, sellingPrice: 145, quantity: 85, minStock: 17 },
  { category: Category.DAIRY, name: "Cottage Cheese 200g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 90, minStock: 18 },

  // Eggs (5 products)
  { category: Category.DAIRY, name: "Chicken Eggs White 12pc", unit: StockUnit.DOZEN, costPrice: 110, sellingPrice: 145, quantity: 250, minStock: 50 },
  { category: Category.DAIRY, name: "Chicken Eggs Brown 12pc", unit: StockUnit.DOZEN, costPrice: 120, sellingPrice: 155, quantity: 220, minStock: 44 },
  { category: Category.DAIRY, name: "Duck Eggs 6pc", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 140, minStock: 28 },
  { category: Category.DAIRY, name: "Quail Eggs 12pc", unit: StockUnit.DOZEN, costPrice: 65, sellingPrice: 85, quantity: 100, minStock: 20 },
  { category: Category.DAIRY, name: "Organic Eggs 6pc", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 120, minStock: 24 },

  // Beverages (15 products)
  { category: Category.GROCERIES, name: "Tea Leaves Premium 500g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 150, minStock: 30 },
  { category: Category.GROCERIES, name: "Tea Bags 100pc", unit: StockUnit.BOX, costPrice: 220, sellingPrice: 280, quantity: 120, minStock: 24 },
  { category: Category.GROCERIES, name: "Green Tea 50 Bags", unit: StockUnit.BOX, costPrice: 280, sellingPrice: 350, quantity: 90, minStock: 18 },
  { category: Category.GROCERIES, name: "Coffee Instant 200g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 110, minStock: 22 },
  { category: Category.GROCERIES, name: "Coffee Ground 250g", unit: StockUnit.PACK, costPrice: 420, sellingPrice: 520, quantity: 80, minStock: 16 },
  { category: Category.FMCG, name: "Soft Drink Cola 2L", unit: StockUnit.BOTTLE, costPrice: 85, sellingPrice: 110, quantity: 200, minStock: 40 },
  { category: Category.FMCG, name: "Soft Drink Orange 2L", unit: StockUnit.BOTTLE, costPrice: 80, sellingPrice: 105, quantity: 180, minStock: 36 },
  { category: Category.FMCG, name: "Energy Drink 250ml", unit: StockUnit.CAN, costPrice: 65, sellingPrice: 85, quantity: 160, minStock: 32 },
  { category: Category.FMCG, name: "Fruit Juice Mango 1L", unit: StockUnit.BOTTLE, costPrice: 120, sellingPrice: 155, quantity: 140, minStock: 28 },
  { category: Category.FMCG, name: "Fruit Juice Orange 1L", unit: StockUnit.BOTTLE, costPrice: 110, sellingPrice: 145, quantity: 130, minStock: 26 },
  { category: Category.FMCG, name: "Coconut Water 500ml", unit: StockUnit.BOTTLE, costPrice: 55, sellingPrice: 75, quantity: 150, minStock: 30 },
  { category: Category.FMCG, name: "Mineral Water 1L", unit: StockUnit.BOTTLE, costPrice: 20, sellingPrice: 30, quantity: 300, minStock: 60 },
  { category: Category.FMCG, name: "Drinking Water 5L", unit: StockUnit.BOTTLE, costPrice: 45, sellingPrice: 60, quantity: 200, minStock: 40 },
  { category: Category.GROCERIES, name: "Drinking Chocolate 500g", unit: StockUnit.PACK, costPrice: 380, sellingPrice: 480, quantity: 70, minStock: 14 },
  { category: Category.GROCERIES, name: "Malted Drink 500g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 85, minStock: 17 },

  // Snacks & Biscuits (20 products)
  { category: Category.FMCG, name: "Potato Chips 100g", unit: StockUnit.PACK, costPrice: 35, sellingPrice: 50, quantity: 200, minStock: 40 },
  { category: Category.FMCG, name: "Corn Chips 150g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 180, minStock: 36 },
  { category: Category.FMCG, name: "Crackers Salted 200g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 160, minStock: 32 },
  { category: Category.FMCG, name: "Biscuits Cream 200g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 220, minStock: 44 },
  { category: Category.FMCG, name: "Biscuits Glucose 300g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 200, minStock: 40 },
  { category: Category.FMCG, name: "Cookies Chocolate 150g", unit: StockUnit.PACK, costPrice: 85, sellingPrice: 110, quantity: 150, minStock: 30 },
  { category: Category.FMCG, name: "Wafers 100g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 170, minStock: 34 },
  { category: Category.FMCG, name: "Cake Slice 50g", unit: StockUnit.PCS, costPrice: 25, sellingPrice: 35, quantity: 240, minStock: 48 },
  { category: Category.FMCG, name: "Bread White 400g", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 60, quantity: 180, minStock: 36 },
  { category: Category.FMCG, name: "Bread Brown 400g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 160, minStock: 32 },
  { category: Category.FMCG, name: "Toast Rusk 200g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 140, minStock: 28 },
  { category: Category.FMCG, name: "Noodles Instant 400g", unit: StockUnit.PACK, costPrice: 55, sellingPrice: 75, quantity: 250, minStock: 50 },
  { category: Category.FMCG, name: "Pasta 500g", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 125, quantity: 130, minStock: 26 },
  { category: Category.FMCG, name: "Popcorn 200g", unit: StockUnit.PACK, costPrice: 65, sellingPrice: 85, quantity: 120, minStock: 24 },
  { category: Category.FMCG, name: "Peanuts Roasted 250g", unit: StockUnit.PACK, costPrice: 75, sellingPrice: 95, quantity: 140, minStock: 28 },
  { category: Category.FMCG, name: "Cashew Nuts 200g", unit: StockUnit.PACK, costPrice: 380, sellingPrice: 480, quantity: 70, minStock: 14 },
  { category: Category.FMCG, name: "Almonds 200g", unit: StockUnit.PACK, costPrice: 420, sellingPrice: 520, quantity: 65, minStock: 13 },
  { category: Category.FMCG, name: "Raisins 250g", unit: StockUnit.PACK, costPrice: 180, sellingPrice: 230, quantity: 90, minStock: 18 },
  { category: Category.FMCG, name: "Dates 500g", unit: StockUnit.PACK, costPrice: 280, sellingPrice: 350, quantity: 100, minStock: 20 },
  { category: Category.FMCG, name: "Mixed Nuts 300g", unit: StockUnit.PACK, costPrice: 320, sellingPrice: 400, quantity: 80, minStock: 16 },
];

function buildSku(category: string, index: number) {
  const prefix = category.replace(/_/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${String(index + 1).padStart(4, "0")}`;
}

function buildBarcode(index: number) {
  const base = String(880000000000 + index).slice(0, 12);
  return base;
}

async function seed() {
  console.log(`\n=== Seeding 200 Bangladeshi Grocery Products ===`);
  console.log(`Target User ID: ${userId}\n`);

  const existingCount = await prisma.product.count({
    where: { ownerId: userId },
  });

  if (existingCount > 0 && !force) {
    console.log(`❌ User ${userId} already has ${existingCount} products.`);
    console.log(`   Use --force flag to seed anyway.\n`);
    return;
  }

  if (existingCount > 0 && force) {
    console.log(`⚠️  User already has ${existingCount} products, but --force flag is set.`);
    console.log(`   Adding ${BANGLADESHI_GROCERY_CATALOG.length} more products...\n`);
  }

  const data = BANGLADESHI_GROCERY_CATALOG.map((item, index) => ({
    ownerId: userId,
    supplierId: userId,
    name: item.name,
    description: `High quality ${item.name.toLowerCase()} sourced from trusted suppliers in Bangladesh.`,
    category: item.category,
    costPrice: item.costPrice,
    sellingPrice: item.sellingPrice,
    quantity: item.quantity,
    unit: item.unit,
    minStock: item.minStock ?? null,
    sku: buildSku(item.category, index),
    barcode: buildBarcode(index + 1),
    imageLink: `https://picsum.photos/seed/${item.name.replace(/\s+/g, '-').toLowerCase()}-${index}/600/400`,
    isActive: true,
  }));

  console.log(`📦 Creating ${data.length} products...`);
  const result = await prisma.product.createMany({ data });
  
  console.log(`\n✅ Successfully seeded ${result.count} products for user ${userId}!`);
  console.log(`\nProduct Categories:`);
  
  const categoryCounts = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

  console.log(`\n=== Seeding Complete ===\n`);
}

try {
  await seed();
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
