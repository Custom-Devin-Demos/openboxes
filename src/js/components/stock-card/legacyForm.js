import apiClient from 'utils/apiClient';

const { CONTEXT_PATH } = window;

/**
 * Submits a form-encoded request to a legacy Grails controller action.
 * Legacy actions redirect on success and re-render the form view on failure,
 * so success is determined by the final response URL after redirects.
 */
export const submitLegacyForm = async (action, params) => {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, value);
    }
  });
  const response = await apiClient.post(`${CONTEXT_PATH}/inventoryItem/${action}`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const finalUrl = response?.request?.responseURL || '';
  return {
    success: !finalUrl.includes(`/inventoryItem/${action}`),
    response,
  };
};

export const getLegacyUrl = (path) => `${CONTEXT_PATH}${path}`;

export default submitLegacyForm;
