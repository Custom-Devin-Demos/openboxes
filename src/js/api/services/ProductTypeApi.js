import {
  PRODUCT_TYPE_ACTIVITY_CODE_OPTIONS,
  PRODUCT_TYPE_API,
  PRODUCT_TYPE_BY_ID,
  PRODUCT_TYPE_FIELD_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getProductType: (id) => apiClient.get(PRODUCT_TYPE_BY_ID(id)),
  createProductType: (payload) => apiClient.post(PRODUCT_TYPE_API, payload),
  updateProductType: (id, payload) => apiClient.put(PRODUCT_TYPE_BY_ID(id), payload),
  deleteProductType: (id) => apiClient.delete(PRODUCT_TYPE_BY_ID(id)),
  getProductActivityCodeOptions: () => apiClient.get(PRODUCT_TYPE_ACTIVITY_CODE_OPTIONS),
  getProductFieldOptions: () => apiClient.get(PRODUCT_TYPE_FIELD_OPTIONS),
};
