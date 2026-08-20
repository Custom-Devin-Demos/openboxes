import {
  CATEGORIES_MOVE,
  CATEGORIES_SAVE,
  CATEGORIES_TREE,
  CATEGORIES_UPDATE_ASSIGNING_PARENT_TO_PRODUCT,
  CATEGORY_DELETE,
  CATEGORY_DETAILS,
  CATEGORY_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getTree: (config) => apiClient.get(CATEGORIES_TREE, config),
  getCategoryDetails: (id) => apiClient.get(CATEGORY_DETAILS(id)),
  getCategoryOptions: (config) => apiClient.get(CATEGORY_OPTIONS, config),
  saveCategory: (payload) => apiClient.post(CATEGORIES_SAVE, payload),
  deleteCategory: (id) => apiClient.delete(CATEGORY_DELETE(id)),
  moveCategory: (payload) => apiClient.post(CATEGORIES_MOVE, payload),
  updateAssigningParentToProduct: (payload) =>
    apiClient.post(CATEGORIES_UPDATE_ASSIGNING_PARENT_TO_PRODUCT, payload),
};
