/**
 * Country Constants for Address Forms
 * Focus on Americas for MVP
 */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  nameEs: string;
}

export const COUNTRIES: Country[] = [
  // North America
  { code: "US", name: "United States", nameEs: "Estados Unidos" },
  { code: "CA", name: "Canada", nameEs: "Canadá" },
  { code: "MX", name: "Mexico", nameEs: "México" },
  
  // Central America
  { code: "CR", name: "Costa Rica", nameEs: "Costa Rica" },
  { code: "GT", name: "Guatemala", nameEs: "Guatemala" },
  { code: "HN", name: "Honduras", nameEs: "Honduras" },
  { code: "SV", name: "El Salvador", nameEs: "El Salvador" },
  { code: "NI", name: "Nicaragua", nameEs: "Nicaragua" },
  { code: "PA", name: "Panama", nameEs: "Panamá" },
  { code: "BZ", name: "Belize", nameEs: "Belice" },
  
  // Caribbean
  { code: "DO", name: "Dominican Republic", nameEs: "República Dominicana" },
  { code: "CU", name: "Cuba", nameEs: "Cuba" },
  { code: "PR", name: "Puerto Rico", nameEs: "Puerto Rico" },
  { code: "JM", name: "Jamaica", nameEs: "Jamaica" },
  
  // South America
  { code: "CO", name: "Colombia", nameEs: "Colombia" },
  { code: "AR", name: "Argentina", nameEs: "Argentina" },
  { code: "BR", name: "Brazil", nameEs: "Brasil" },
  { code: "CL", name: "Chile", nameEs: "Chile" },
  { code: "PE", name: "Peru", nameEs: "Perú" },
  { code: "UY", name: "Uruguay", nameEs: "Uruguay" },
  { code: "VE", name: "Venezuela", nameEs: "Venezuela" },
  { code: "EC", name: "Ecuador", nameEs: "Ecuador" },
  { code: "BO", name: "Bolivia", nameEs: "Bolivia" },
  { code: "PY", name: "Paraguay", nameEs: "Paraguay" },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

export const getCountryName = (code: string, lang: "en" | "es" = "es"): string => {
  const country = getCountryByCode(code);
  if (!country) return code;
  return lang === "es" ? country.nameEs : country.name;
};
