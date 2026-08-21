import _ from 'lodash';

import { ATTRIBUTES_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useAttributeListTableData = (filterParams) => {
  const errorMessageId = 'react.attribute.error.attributeList.label';
  const defaultErrorMessage = 'Unable to fetch attributes';

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
  }, (val) => _.isEmpty(val));

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
    fireFetchData,
  } = useTableData({
    filterParams,
    url: ATTRIBUTES_SEARCH,
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

export default useAttributeListTableData;
