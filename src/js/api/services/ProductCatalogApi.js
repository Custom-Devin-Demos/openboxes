import {
  PRODUCT_CATALOG_DELETE,
  PRODUCT_CATALOG_DETAILS,
  PRODUCT_CATALOG_IMPORT_ITEMS,
  PRODUCT_CATALOG_ITEM_DELETE,
  PRODUCT_CATALOGS_ADD_ITEM,
  PRODUCT_CATALOGS_SAVE,
  PRODUCT_CATALOGS_SEARCH,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  searchProductCatalogs: (config) => apiClient.get(PRODUCT_CATALOGS_SEARCH, config),
  getProductCatalog: (id) => apiClient.get(PRODUCT_CATALOG_DETAILS(id)),
  saveProductCatalog: (payload) => apiClient.post(PRODUCT_CATALOGS_SAVE, payload),
  deleteProductCatalog: (id) => apiClient.delete(PRODUCT_CATALOG_DELETE(id)),
  addProductCatalogItem: (payload) => apiClient.post(PRODUCT_CATALOGS_ADD_ITEM, payload),
  removeProductCatalogItem: (id) => apiClient.delete(PRODUCT_CATALOG_ITEM_DELETE(id)),
  importProductCatalogItems: (id, formData) =>
    apiClient.post(PRODUCT_CATALOG_IMPORT_ITEMS(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
