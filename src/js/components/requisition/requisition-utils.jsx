import { useSelector } from 'react-redux';

import { debounceLocationsFetch, debouncePeopleFetch } from 'utils/option-utils';

// Same values and ordering as CommodityClass.list() used by g:selectCommodityClass
export const COMMODITY_CLASSES = [
  { value: 'NONE', label: 'None' },
  { value: 'CONSUMABLES', label: 'Consumables' },
  { value: 'MEDICATION', label: 'Medication' },
  { value: 'DURABLE', label: 'Durable' },
  { value: 'MIXED', label: 'Mixed' },
  { value: 'COLD_CHAIN', label: 'Cold chain' },
  { value: 'CONTROLLED_SUBSTANCE', label: 'Controlled substance' },
  { value: 'HAZARDOUS_MATERIAL', label: 'Hazardous material' },
];

export const REQUISITION_TYPE_LABELS = {
  ADHOC: 'Adhoc',
  STOCK: 'Stock',
  NON_STOCK: 'Non Stock',
};

export const useRequisitionSelectFetch = () => {
  const {
    currentLocation, user, debounceTime, minSearchLength,
  } = useSelector((state) => ({
    currentLocation: state.session.currentLocation,
    user: state.session.user,
    debounceTime: state.session.searchConfig.debounceTime,
    minSearchLength: state.session.searchConfig.minSearchLength,
  }));

  return {
    currentLocation,
    user,
    debouncedPeopleFetch: debouncePeopleFetch(debounceTime, minSearchLength),
    debouncedLocationsFetch: debounceLocationsFetch(
      debounceTime,
      minSearchLength,
      null,
      true,
    ),
  };
};

export default COMMODITY_CLASSES;
