import React from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import FilterForm from 'components/Filter/FilterForm';
import Button from 'components/form-elements/Button';
import filterFields from 'components/locations/FilterFields';
import LocationsListTable from 'components/locations/LocationsListTable';
import { LOCATION_URL } from 'consts/applicationUrls';
import useLocationsListFilters from 'hooks/list-pages/location/useLocationsListFilters';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';

const LocationsList = ({ isUserAdmin }) => {
  const {
    defaultFilterValues,
    setFilterValues,
    filterParams,
    organizations,
    locationTypes,
    locationGroups,
  } = useLocationsListFilters();

  useTranslation('locationsList', 'reactTable');

  return (
    <div className="d-flex flex-column list-page-main">
      <div className="d-flex list-page-header">
        <span className="d-flex align-self-center title">
          <Translate id="react.locationsList.header.label" defaultMessage="Locations" />
        </span>
        {isUserAdmin && (
          <div className="d-flex justify-content-end buttons align-items-center">
            <a href={LOCATION_URL.create()}>
              <Button
                defaultLabel="Add location"
                label="react.locationsList.addLocation.label"
              />
            </a>
          </div>
        )}
      </div>
      <div className="d-flex flex-column list-page-filters">
        <FilterForm
          filterFields={filterFields}
          updateFilterParams={(values) => setFilterValues({ ...values })}
          formProps={{ organizations, locationTypes, locationGroups }}
          searchFieldPlaceholder="react.locationsList.filters.search.placeholder.label"
          searchFieldDefaultPlaceholder="Search by location name"
          searchFieldId="q"
          allowEmptySubmit
          hidden={false}
          defaultValues={defaultFilterValues}
        />
      </div>
      <LocationsListTable filterParams={filterParams} />
    </div>
  );
};

const mapStateToProps = (state) => ({
  isUserAdmin: state.session.isUserAdmin,
});

export default withRouter(connect(mapStateToProps)(LocationsList));

LocationsList.propTypes = {
  isUserAdmin: PropTypes.bool.isRequired,
};
