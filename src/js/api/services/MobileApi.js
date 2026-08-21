import {
  MOBILE_OUTBOUND_ITEMS,
  MOBILE_PRODUCT_SUMMARIES,
  MOBILE_PRODUCT_SUMMARY_BY_ID,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getProductSummaries: (params) => apiClient.get(MOBILE_PRODUCT_SUMMARIES, { params }),
  getProductSummary: (id) => apiClient.get(MOBILE_PRODUCT_SUMMARY_BY_ID(id)),
  getOutboundItems: (params) => apiClient.get(MOBILE_OUTBOUND_ITEMS, { params }),
};
