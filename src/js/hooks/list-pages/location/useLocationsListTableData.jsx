import { LOCATION_SEARCH } from 'api/urls';
import useTableData from 'hooks/list-pages/useTableData';

const useLocationsListTableData = (filterParams) => {
  const errorMessageId = 'react.locationsList.fetch.fail.label';
  const defaultErrorMessage = 'Unable to fetch locations';
  const defaultSorting = {
    sort: 'name',
    order: 'asc',
  };
  const getParams = ({ offset, state, sortingParams }) => {
    const {
      q, organization, locationType, locationGroup,
    } = filterParams;
    return {
      offset: `${offset}`,
      max: `${state.pageSize}`,
      ...sortingParams,
      ...(q ? { q } : {}),
      ...(organization?.id ? { 'organization.id': organization.id } : {}),
      ...(locationGroup?.id ? { 'locationGroup.id': locationGroup.id } : {}),
      // locationType.id is always sent: an empty value means "all location
      // types", while an absent param falls back to the default depot filter
      'locationType.id': locationType?.id ?? '',
    };
  };
  const {
    tableRef,
    loading,
    tableData,
    onFetchHandler,
  } = useTableData({
    filterParams,
    url: LOCATION_SEARCH,
    errorMessageId,
    defaultErrorMessage,
    defaultSorting,
    getParams,
  });

  return {
    tableData, tableRef, loading, onFetchHandler,
  };
};

export default useLocationsListTableData;
