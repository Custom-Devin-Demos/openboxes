import { PAYMENT_TERM_API, PAYMENT_TERM_BY_ID } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getPaymentTerm: (id) => apiClient.get(PAYMENT_TERM_BY_ID(id)),
  createPaymentTerm: (payload) => apiClient.post(PAYMENT_TERM_API, payload),
  updatePaymentTerm: (id, payload) => apiClient.put(PAYMENT_TERM_BY_ID(id), payload),
  deletePaymentTerm: (id) => apiClient.delete(PAYMENT_TERM_BY_ID(id)),
};
