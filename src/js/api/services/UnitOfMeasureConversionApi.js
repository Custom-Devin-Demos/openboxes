import {
  UNIT_OF_MEASURE_CONVERSION_API,
  UNIT_OF_MEASURE_CONVERSION_BY_ID,
  UNIT_OF_MEASURE_CONVERSION_UOM_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  createUnitOfMeasureConversion: (payload) =>
    apiClient.post(UNIT_OF_MEASURE_CONVERSION_API, payload),
  getUnitOfMeasureConversion: (id) =>
    apiClient.get(UNIT_OF_MEASURE_CONVERSION_BY_ID(id)),
  updateUnitOfMeasureConversion: (id, payload) =>
    apiClient.put(UNIT_OF_MEASURE_CONVERSION_BY_ID(id), payload),
  deleteUnitOfMeasureConversion: (id) =>
    apiClient.delete(UNIT_OF_MEASURE_CONVERSION_BY_ID(id)),
  getUnitOfMeasureOptions: () => apiClient.get(UNIT_OF_MEASURE_CONVERSION_UOM_OPTIONS),
};
