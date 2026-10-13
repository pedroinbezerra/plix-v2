import { ICatalogProvider } from "./catalog-provider.interface";
import { catalogProvider as warezCdnCatalogProvider } from "./warezcdn-catalog.provider";
import { pomfyCatalogProvider } from "./pomfy-catalog.provider";

export * from "./catalog-provider.interface";
export * from "./types";
export { warezCdnCatalogProvider, pomfyCatalogProvider };

export type CatalogProviderId = "warez" | "pomfy";

export const DEFAULT_CATALOG_PROVIDER: CatalogProviderId =
  (process.env.DEFAULT_CATALOG_PROVIDER as CatalogProviderId) || "warez";

export function getCatalogProvider(providerId?: string | null): ICatalogProvider {
  if (providerId === "pomfy") {
    return pomfyCatalogProvider;
  }
  return warezCdnCatalogProvider;
}

// Provedor padrão atual do catálogo
export const catalogProvider: ICatalogProvider = getCatalogProvider(DEFAULT_CATALOG_PROVIDER);
