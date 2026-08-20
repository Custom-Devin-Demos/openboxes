import { useState } from 'react';

import queryString from 'query-string';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { LOCATION_TYPES } from 'api/urls';
import useCommonFiltersCleaner from 'hooks/list-pages/useCommonFiltersCleaner';
import apiClient from 'utils/apiClient';
import splitTranslation from 'utils/translation-utils';

const fetchOrganizations = async () => {
  const { data } = await apiClient.get('/api/organizations');
  return data.data.map((organization) => ({
    id: organization.id,
    value: organization.id,
    name: organization.name,
    label: organization.name,
  }));
};

const fetchLocationGroups = async () => {
  const { data } = await apiClient.get('/api/locationGroups');
  return data.data.map((locationGroup) => ({
    id: locationGroup.id,
    value: locationGroup.id,
    name: locationGroup.name,
    label: locationGroup.name,
  }));
};

const useLocationsListFilters = () => {
  const [filterParams, setFilterParams] = useState({});
  const [defaultFilterValues, setDefaultFilterValues] = useState({});
  const [organizations, setOrganizations] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);
  const [locationGroups, setLocationGroups] = useState([]);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  const history = useHistory();
  const { locale } = useSelector((state) => ({
    locale: state.session.activeLanguage,
  }));

  const fetchLocationTypes = async () => {
    const { data } = await apiClient.get(LOCATION_TYPES);
    return data.data.map((locationType) => ({
      ...locationType,
      value: locationType.id,
      label: splitTranslation(locationType.name, locale),
    }));
  };

  const clearFilterValues = () => {
    const { pathname } = history.location;
    history.push({ pathname });
  };

  const initializeDefaultFilterValues = async () => {
    const queryProps = queryString.parse(history.location.search);

    const [organizationList, locationTypeList, locationGroupList] = await Promise.all([
      fetchOrganizations(),
      fetchLocationTypes(),
      fetchLocationGroups(),
    ]);
    setOrganizations(organizationList);
    setLocationTypes(locationTypeList);
    setLocationGroups(locationGroupList);

    const defaultValues = {
      q: queryProps.q || '',
      organization: organizationList
        .find(({ id }) => id === queryProps['organization.id']) || null,
      // The location list is filtered to depots by default (same as the legacy
      // screen); an explicitly empty locationType.id param means "all types"
      locationType: 'locationType.id' in queryProps
        ? locationTypeList.find(({ id }) => id === queryProps['locationType.id']) || null
        : locationTypeList
          .find(({ locationTypeCode }) => locationTypeCode === 'DEPOT') || null,
      locationGroup: locationGroupList
        .find(({ id }) => id === queryProps['locationGroup.id']) || null,
    };
    setDefaultFilterValues(defaultValues);
    setFiltersInitialized(true);
  };

  useCommonFiltersCleaner({ filtersInitialized, initializeDefaultFilterValues, clearFilterValues });

  const setFilterValues = (values) => {
    const transformedParams = {
      q: values.q || undefined,
      'organization.id': values.organization?.id || undefined,
      // Always keep locationType.id in the query string so that clearing the
      // filter means "all location types" instead of the default depot filter
      'locationType.id': values.locationType?.id ?? '',
      'locationGroup.id': values.locationGroup?.id || undefined,
    };
    const queryFilterParams = queryString.stringify(transformedParams);
    const { pathname } = history.location;
    if (Object.keys(values).length) {
      history.push({ pathname, search: queryFilterParams });
    }
    setFilterParams({ ...values });
  };

  return {
    defaultFilterValues,
    setFilterValues,
    filterParams,
    organizations,
    locationTypes,
    locationGroups,
  };
};

export default useLocationsListFilters;
