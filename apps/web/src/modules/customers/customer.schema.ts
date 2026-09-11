// Read-only compatibility shape for inherited consumers outside Customer.
// Customer data is fetched from the backend by customer.hooks.ts.
export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  addressDetail?: string;
  contactPreferences?: {
    preferredChannel: string;
    consentStatus: string;
    preferredTime: string;
    allowEmail: boolean;
    allowWhatsApp: boolean;
  };
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};
