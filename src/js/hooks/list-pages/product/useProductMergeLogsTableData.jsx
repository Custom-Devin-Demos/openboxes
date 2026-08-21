import _ from 'lodash';

import { PRODUCT_SCREENS_MERGE_LOGS } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useProductMergeLogsTableData = (filterParams) => {
  const errorMessageId = 'react.productMergeLogs.error.productMergeLogsList.label';
  const defaultErrorMessage = 'Unable to fetch product merge logs';

  const defaultSorting = {};

  const getParams = ({
    offset,
    state,
    sortingParams,
  }) => _.omitBy({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    primaryProductCode: filterParams.primaryProductCode,
    obsoleteProductCode: filterParams.obsoleteProductCode,
  }, (val) => _.isEmpty(val));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
    fireFetchData,
  } = useTableData({
    filterParams,
    url: PRODUCT_SCREENS_MERGE_LOGS,
    errorMessageId,
    defaultErrorMessage,
    defaultSorting,
    getParams,
  });

  return {
    tableData,
    loading,
    tableRef,
    onFetchHandler,
    fireFetchData,
  };
};

export default useProductMergeLogsTableData;
