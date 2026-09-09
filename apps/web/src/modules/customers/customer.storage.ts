// TODO: replace with API calls

import { Customer, CustomerInput, customerSchema, migrateCustomer } from "./customer.schema";

const STORAGE_KEY = "customers";

function generateId(): string {
  return `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredCustomers(): Customer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    
    // Migrate old customers without contactPreferences
    const migrated = Array.isArray(parsed) 
      ? parsed.map(migrateCustomer)
      : [];

    const validated = customerSchema.array().safeParse(migrated);

    return validated.success ? validated.data : [];
  } catch {
    return [];
  }
}

function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

export async function listCustomers(): Promise<Customer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return getStoredCustomers();
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  console.log('[customer.storage] getCustomerById called:', id);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const customers = getStoredCustomers();
  const customer = customers.find(c => c.id === id) ?? null;
  
  if (customer) {
    console.log('[customer.storage] Customer found:', {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    });
  } else {
    console.warn('[customer.storage] Customer not found:', id);
  }
  
  return customer;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const customers = getStoredCustomers();
  const now = new Date().toISOString();

  const newCustomer: Customer = {
    id: generateId(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  customers.push(newCustomer);
  saveCustomers(customers);

  return newCustomer;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const customers = getStoredCustomers();
  const index = customers.findIndex(c => c.id === id);

  if (index === -1) {
    throw new Error("Customer not found");
  }

  const updatedCustomer: Customer = {
    ...customers[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  customers[index] = updatedCustomer;
  saveCustomers(customers);

  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));

  const customers = getStoredCustomers();
  const filtered = customers.filter(c => c.id !== id);

  if (filtered.length === customers.length) {
    throw new Error("Customer not found");
  }

  saveCustomers(filtered);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const customers = getStoredCustomers();
  
  if (!query.trim()) {
    return customers;
  }

  const lowerQuery = query.toLowerCase();

  return customers.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.email?.toLowerCase().includes(lowerQuery) ||
    c.phone?.toLowerCase().includes(lowerQuery) ||
    c.idNumber?.toLowerCase().includes(lowerQuery)
  );
}
