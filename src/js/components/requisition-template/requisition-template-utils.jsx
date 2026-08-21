import { useEffect, useState } from 'react';

import { REQUISITION_TEMPLATE_DETAILS } from 'api/urls';
import apiClient from 'utils/apiClient';

export const formatCurrency = (value) => Number(value || 0)
  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const useTemplateDetails = (templateId) => {
  const [template, setTemplate] = useState(null);
  const [fetchCounter, setFetchCounter] = useState(0);

  useEffect(() => {
    apiClient.get(REQUISITION_TEMPLATE_DETAILS(templateId))
      .then((response) => {
        setTemplate(response.data.data);
      });
  }, [templateId, fetchCounter]);

  return { template, refetchTemplate: () => setFetchCounter((counter) => counter + 1) };
};

export default useTemplateDetails;
