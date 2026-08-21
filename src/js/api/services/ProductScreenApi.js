import {
  PRODUCT_SCREENS_ADD_DOCUMENT_CONTEXT,
  PRODUCT_SCREENS_ADD_SYNONYM,
  PRODUCT_SCREENS_BATCH_EDIT,
  PRODUCT_SCREENS_CREATE_DATA,
  PRODUCT_SCREENS_EDIT_DATA,
  PRODUCT_SCREENS_IMPORT_CONFIRM,
  PRODUCT_SCREENS_IMPORT_UPLOAD,
  PRODUCT_SCREENS_SAVE_DETAILS,
  PRODUCT_SCREENS_UPLOAD_DOCUMENT,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getEditData: (id, config) =>
    apiClient.get(id ? PRODUCT_SCREENS_EDIT_DATA(id) : PRODUCT_SCREENS_CREATE_DATA, config),
  saveDetails: (data, config) => apiClient.post(PRODUCT_SCREENS_SAVE_DETAILS, data, config),
  getBatchEditData: (config) => apiClient.get(PRODUCT_SCREENS_BATCH_EDIT, config),
  batchSave: (data, config) => apiClient.post(PRODUCT_SCREENS_BATCH_EDIT, data, config),
  importUpload: (data, config) => apiClient.post(PRODUCT_SCREENS_IMPORT_UPLOAD, data, config),
  importConfirm: (data, config) => apiClient.post(PRODUCT_SCREENS_IMPORT_CONFIRM, data, config),
  getAddDocumentContext: (id, config) =>
    apiClient.get(PRODUCT_SCREENS_ADD_DOCUMENT_CONTEXT(id), config),
  uploadDocument: (id, data, config) =>
    apiClient.post(PRODUCT_SCREENS_UPLOAD_DOCUMENT(id), data, config),
  addSynonym: (id, data, config) => apiClient.post(PRODUCT_SCREENS_ADD_SYNONYM(id), data, config),
};
