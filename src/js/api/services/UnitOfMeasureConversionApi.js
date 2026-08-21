import {
  UNIT_OF_MEASURE_CONVERSION_API,
  UNIT_OF_MEASURE_CONVERSION_UOM_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  createUnitOfMeasureConversion: (payload) =>
    apiClient.post(UNIT_OF_MEASURE_CONVERSION_API, payload),
  getUnitOfMeasureOptions: () => apiClient.get(UNIT_OF_MEASURE_CONVERSION_UOM_OPTIONS),
};
