import { BUDGET_CODE_API, BUDGET_CODE_BY_ID } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getBudgetCode: (id) => apiClient.get(BUDGET_CODE_BY_ID(id)),
  createBudgetCode: (payload) => apiClient.post(BUDGET_CODE_API, payload),
  updateBudgetCode: (id, payload) => apiClient.put(BUDGET_CODE_BY_ID(id), payload),
  deleteBudgetCode: (id) => apiClient.delete(BUDGET_CODE_BY_ID(id)),
};
