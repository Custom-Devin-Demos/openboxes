import {
  PRODUCT_GROUP_API,
  PRODUCT_GROUP_BY_ID,
  PRODUCT_GROUP_OPTION,
  PRODUCT_GROUP_PRODUCT,
  PRODUCT_GROUP_PRODUCTS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getProductGroupsOptions: () => apiClient.get(PRODUCT_GROUP_OPTION),
  getProductGroupDetails: (id) => apiClient.get(PRODUCT_GROUP_BY_ID(id)),
  createProductGroup: (payload) => apiClient.post(PRODUCT_GROUP_API, payload),
  updateProductGroup: (id, payload) => apiClient.put(PRODUCT_GROUP_BY_ID(id), payload),
  deleteProductGroup: (id) => apiClient.delete(PRODUCT_GROUP_BY_ID(id)),
  addProductToProductGroup: (id, payload) => apiClient.post(PRODUCT_GROUP_PRODUCTS(id), payload),
  removeProductFromProductGroup: (id, productId, isProductFamily) =>
    apiClient.delete(PRODUCT_GROUP_PRODUCT(id, productId), { params: { isProductFamily } }),
};
