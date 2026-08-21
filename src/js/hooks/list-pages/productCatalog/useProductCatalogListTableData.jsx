import _ from 'lodash';

import { PRODUCT_CATALOGS_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useProductCatalogListTableData = (filterParams) => {
  const errorMessageId = 'react.productCatalog.error.productCatalogList.label';
  const defaultErrorMessage = 'Unable to fetch product catalogs';

  const defaultSorting = {};

  const getParams = ({
    offset,
    state,
    sortingParams,
  }) => _.omitBy({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
  }, (val) => _.isEmpty(val));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
    fireFetchData,
  } = useTableData({
    filterParams,
    url: PRODUCT_CATALOGS_SEARCH,
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

export default useProductCatalogListTableData;
