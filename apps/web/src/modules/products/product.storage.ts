// TODO: replace with API calls

import { Product, ProductInput, productSchema } from "./product.schema";

const STORAGE_KEY = "products";

function generateId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Migration: Add description field to old products without it
function migrateProducts(products: any[]): Product[] {
  return products.map((product): Product => {
    // Ensure description exists (optional field, can be undefined)
    if (product.description === undefined) {
      product.description = undefined; // Explicitly set for clarity
    }
    return product as Product;
  });
}

function getStoredProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    
    // Apply migrations
    const migrated = migrateProducts(parsed);
    
    const validated = productSchema.array().safeParse(migrated);

    return validated.success ? validated.data : [];
  } catch {
    return [];
  }
}

function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export async function listProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return getStoredProducts();
}

export async function getProductById(id: string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const products = getStoredProducts();
  return products.find(p => p.id === id) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const products = getStoredProducts();
  const now = new Date().toISOString();

  const newProduct: Product = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  products.push(newProduct);
  saveProducts(products);

  return newProduct;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const products = getStoredProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    throw new Error("Product not found");
  }

  const updatedProduct: Product = {
    ...products[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  saveProducts(products);

  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));

  const products = getStoredProducts();
  const filtered = products.filter(p => p.id !== id);

  if (filtered.length === products.length) {
    throw new Error("Product not found");
  }

  saveProducts(filtered);
}

export async function searchProducts(query: string): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const products = getStoredProducts();
  
  if (!query.trim()) {
    return products;
  }

  const lowerQuery = query.toLowerCase();

  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.sku?.toLowerCase().includes(lowerQuery)
  );
}
