import {
  PRODUCT_ASSOCIATION_DELETE,
  PRODUCT_ASSOCIATION_DETAILS,
  PRODUCT_ASSOCIATION_SAVE,
  PRODUCT_ASSOCIATION_TYPE_CODE_OPTIONS,
  PRODUCT_ASSOCIATION_UPDATE,
  PRODUCT_ASSOCIATIONS_SEARCH,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  searchProductAssociations: (config) => apiClient.get(PRODUCT_ASSOCIATIONS_SEARCH, config),
  getProductAssociation: (id) => apiClient.get(PRODUCT_ASSOCIATION_DETAILS(id)),
  deleteProductAssociation: (id, mutualDelete) =>
    apiClient.delete(PRODUCT_ASSOCIATION_DELETE(id), { params: { mutualDelete } }),
  getProductAssociationTypeCodeOptions: () =>
    apiClient.get(PRODUCT_ASSOCIATION_TYPE_CODE_OPTIONS),
  createProductAssociation: (data) => apiClient.post(PRODUCT_ASSOCIATION_SAVE, data),
  updateProductAssociation: (id, data) => apiClient.put(PRODUCT_ASSOCIATION_UPDATE(id), data),
};
