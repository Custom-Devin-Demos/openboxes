import _ from 'lodash';

import { PERSONS_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const usePersonListTableData = (filterParams) => {
  const errorMessageId = 'react.person.error.personList.label';
  const defaultErrorMessage = 'Unable to fetch people';

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
    url: PERSONS_SEARCH,
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

export default usePersonListTableData;
