import _ from 'lodash';

import { SUPPLIER_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useSupplierListTableData = (filterParams) => {
  const errorMessageId = 'react.supplierList.fetch.fail.label';
  const defaultErrorMessage = 'Unable to fetch suppliers';

  const defaultSorting = {};

  const getParams = ({
    offset,
    state,
  }) => _.omitBy({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    q: filterParams.q,
  }, (val) => _.isEmpty(val));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: SUPPLIER_SEARCH,
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
  };
};

export default useSupplierListTableData;
