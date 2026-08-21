import _ from 'lodash';

import { PRODUCT_ASSOCIATIONS_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useProductAssociationListTableData = (filterParams) => {
  const errorMessageId = 'react.productAssociation.error.productAssociationList.label';
  const defaultErrorMessage = 'Unable to fetch product associations';

  const defaultSorting = {};

  const getParams = ({
    offset,
    state,
    sortingParams,
  }) => _.omitBy({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    q: filterParams.q,
    code: filterParams.code,
  }, (val) => _.isEmpty(val));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
    fireFetchData,
  } = useTableData({
    filterParams,
    url: PRODUCT_ASSOCIATIONS_SEARCH,
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

export default useProductAssociationListTableData;
