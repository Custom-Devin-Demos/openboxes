import { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { fetchBuyers } from 'actions';
import { ORDER_STATUS_OPTIONS, ORDER_TYPE_OPTIONS } from 'api/urls';
import filterFields from 'components/order/FilterFields';
import useCommonFiltersCleaner from 'hooks/list-pages/useCommonFiltersCleaner';
import apiClient from 'utils/apiClient';
import { transformFilterParams } from 'utils/list-utils';
import { fetchLocationById, fetchUserById } from 'utils/option-utils';

const PUTAWAY_ORDER = 'PUTAWAY_ORDER';

const useOrderListFilters = () => {
  const [filterParams, setFilterParams] = useState({});
  const [defaultFilterValues, setDefaultFilterValues] = useState({});
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);

  const history = useHistory();
  const dispatch = useDispatch();
  const {
    supportedActivities,
    buyers,
    currentLocation,
    currentUser,
    currentLocale,
  } = useSelector((state) => ({
    supportedActivities: state.session.supportedActivities,
    buyers: state.organizations.buyers,
    currentLocation: state.session.currentLocation,
    currentUser: state.session.user,
    currentLocale: state.session.activeLanguage,
  }));

  const queryProps = queryString.parse(history.location.search);
  const orderTypeParam = queryProps.orderType;
  const isPutawayList = orderTypeParam === PUTAWAY_ORDER;
  const isCentralPurchasingEnabled = supportedActivities.includes('ENABLE_CENTRAL_PURCHASING');

  useEffect(() => {
    dispatch(fetchBuyers());
  }, []);

  useEffect(() => {
    apiClient.get(ORDER_STATUS_OPTIONS)
      .then((response) => setStatuses(response.data.data));
    apiClient.get(ORDER_TYPE_OPTIONS)
      .then((response) => setOrderTypes(response.data.data));
  }, [currentLocale]);

  const clearFilterValues = () => {
    const { pathname } = history.location;
    const search = orderTypeParam
      ? queryString.stringify({ orderType: orderTypeParam })
      : undefined;
    history.push({ pathname, search });
  };

  const initializeDefaultFilterValues = async () => {
    // INITIALIZE EMPTY FILTER OBJECT
    const defaultValues = Object.keys(filterFields)
      .reduce((acc, key) => ({ ...acc, [key]: '' }), {});

    const currentLocationOption = {
      id: currentLocation?.id,
      value: currentLocation?.id,
      name: currentLocation?.name,
      label: currentLocation?.name,
    };

    defaultValues.orderType = orderTypeParam || 'PURCHASE_ORDER';

    if (isCentralPurchasingEnabled && !isPutawayList) {
      defaultValues.destinationParty = buyers
        .find((org) => org.id === currentLocation.organization.id);
    }

    // IF VALUE IS IN A SEARCH QUERY SET DEFAULT VALUES
    if (queryProps.status) {
      defaultValues.status = statuses.find(({ value }) => value === queryProps.status);
    }
    if (queryProps.statusStartDate) {
      defaultValues.statusStartDate = queryProps.statusStartDate;
    }
    if (queryProps.statusEndDate) {
      defaultValues.statusEndDate = queryProps.statusEndDate;
    }
    if (queryProps.q) {
      defaultValues.searchTerm = queryProps.q;
    }
    if (queryProps.origin) {
      defaultValues.origin = currentLocation.id === queryProps.origin
        ? currentLocationOption
        : await fetchLocationById(queryProps.origin);
    }
    if (queryProps.destination) {
      defaultValues.destination = currentLocation.id === queryProps.destination
        ? currentLocationOption
        : await fetchLocationById(queryProps.destination);
    } else if (!isCentralPurchasingEnabled && queryProps.destination === undefined) {
      defaultValues.destination = currentLocationOption;
    }
    if (queryProps.destinationParty && !isCentralPurchasingEnabled) {
      defaultValues.destinationParty = buyers
        .find(({ id }) => id === queryProps.destinationParty);
    }
    if (queryProps.orderedBy) {
      defaultValues.orderedBy = queryProps.orderedBy === currentUser.id
        ? currentUser
        : await fetchUserById(queryProps.orderedBy);
    }
    if (queryProps.createdBy) {
      defaultValues.createdBy = queryProps.createdBy === currentUser.id
        ? currentUser
        : await fetchUserById(queryProps.createdBy);
    }

    setDefaultFilterValues(defaultValues);
    setFiltersInitialized(true);
  };

  // Custom hook for changing location/filters rebuilding logic
  useCommonFiltersCleaner({
    clearFilterValues,
    initializeDefaultFilterValues,
    filtersInitialized,
  });

  const setFilterValues = (values) => {
    const filterAccessors = {
      orderType: { name: 'orderType' },
      destination: { name: 'destination', accessor: 'id' },
      origin: { name: 'origin', accessor: 'id' },
      status: { name: 'status', accessor: 'value' },
      statusStartDate: { name: 'statusStartDate' },
      statusEndDate: { name: 'statusEndDate' },
      destinationParty: { name: 'destinationParty', accessor: 'id' },
      orderedBy: { name: 'orderedBy', accessor: 'id' },
      createdBy: { name: 'createdBy', accessor: 'id' },
      searchTerm: { name: 'searchTerm' },
    };
    const transformedParams = transformFilterParams(values, filterAccessors);
    const queryFilterParams = queryString.stringify(transformedParams);
    const { pathname } = history.location;
    if (Object.keys(values).length) {
      history.push({ pathname, search: queryFilterParams });
    }
    setFilterParams(values);
  };

  return {
    defaultFilterValues,
    setFilterValues,
    filterParams,
    isCentralPurchasingEnabled,
    isPutawayList,
    statuses,
    orderTypes,
  };
};

export default useOrderListFilters;
