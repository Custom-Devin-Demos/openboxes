import React, { Component } from 'react';

import _ from 'lodash';
import PropTypes from 'prop-types';
import { Form } from 'react-final-form';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Alert from 'react-s-alert';

import { fetchTranslations, hideSpinner, showSpinner } from 'actions';
import { LOCATION, LOCATION_DETAILS, LOCATION_TYPES } from 'api/urls';
import CheckboxField from 'components/form-elements/CheckboxField';
import ColorPickerField from 'components/form-elements/ColorPickerField';
import SelectField from 'components/form-elements/SelectField';
import TextField from 'components/form-elements/TextField';
import ActivityCode from 'consts/activityCode';
import { LOCATION_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Checkbox from 'utils/Checkbox';
import { renderFormField } from 'utils/form-utils';
import {
  debounceLocationGroupsFetch,
  debounceLocationsFetch,
  debounceOrganizationsFetch,
  debouncePeopleFetch,
} from 'utils/option-utils';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';
import splitTranslation from 'utils/translation-utils';

import 'components/locations-configuration/LocationDetails.scss';

function validate(values) {
  const errors = {};

  if (!values.name) {
    errors.name = 'react.default.error.requiredField.label';
  }

  if (!values.organization) {
    errors.organization = 'react.default.error.requiredField.label';
  }

  if (!values.locationType) {
    errors.locationType = 'react.default.error.requiredField.label';
  }

  // Don't allow having NONE supported activity in combination with any other supported activity
  if (values.supportedActivities?.length > 1
    && values.supportedActivities?.find((activity) => activity.value === ActivityCode.NONE)) {
    errors.supportedActivities = 'react.locationsConfiguration.error.supportedActivities.label';
  }

  const address = values.address || {};
  const addressErrors = Object.keys(address).reduce((acc, fieldName) => {
    if (address[fieldName] && address[fieldName].length > 255) {
      return { ...acc, [fieldName]: 'react.default.error.tooLongInput.label' };
    }
    return acc;
  }, {});
  if (!_.isEmpty(addressErrors)) {
    errors.address = addressErrors;
  }

  return errors;
}

const DETAILS_FIELDS = {
  name: {
    type: TextField,
    label: 'react.locationsConfiguration.name.label',
    defaultMessage: 'Name',
    attributes: {
      required: true,
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.name.tooltip.label',
    },
  },
  locationNumber: {
    type: TextField,
    label: 'react.locationsConfiguration.locationNumber.label',
    defaultMessage: 'Location Number',
    attributes: {
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.locationNumber.tooltip.label',
    },
  },
  parentLocation: {
    type: SelectField,
    label: 'react.locationsList.parentLocation.label',
    defaultMessage: 'Parent location',
    attributes: {
      async: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      options: [],
      filterOptions: (options) => options,
    },
    getDynamicAttr: ({ debouncedLocationsFetch, isInternalOrZone }) => ({
      loadOptions: debouncedLocationsFetch,
      hidden: !isInternalOrZone,
    }),
  },
  zone: {
    type: SelectField,
    label: 'react.locationsList.zoneLocation.label',
    defaultMessage: 'Zone location',
    attributes: {
      valueKey: 'id',
      labelKey: 'name',
    },
    getDynamicAttr: ({ zoneOptions, isInternal }) => ({
      options: zoneOptions,
      hidden: !isInternal,
    }),
  },
  organization: {
    type: SelectField,
    label: 'react.locationsConfiguration.organization.label',
    defaultMessage: 'Organization',
    attributes: {
      async: true,
      required: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.organization.tooltip.label',
      options: [],
      filterOptions: (options) => options,
    },
    getDynamicAttr: ({ debouncedOrganizationsFetch }) => ({
      loadOptions: debouncedOrganizationsFetch,
    }),
  },
  locationType: {
    type: SelectField,
    label: 'react.locationsConfiguration.locationType.label',
    defaultMessage: 'Location Type',
    attributes: {
      required: true,
      valueKey: 'id',
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.locationType.tooltip.label',
    },
    getDynamicAttr: ({ locationTypes, resetSupportedActivities }) => ({
      options: locationTypes,
      onChange: (val) => resetSupportedActivities(val),
    }),
  },
  locationGroup: {
    type: SelectField,
    label: 'react.locationsConfiguration.locationGroup.label',
    defaultMessage: 'Location Group',
    attributes: {
      async: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.locationGroup.tooltip.label',
      options: [],
      filterOptions: (options) => options,
    },
    getDynamicAttr: ({ debouncedLocationGroupsFetch, isInternalOrZone }) => ({
      loadOptions: debouncedLocationGroupsFetch,
      hidden: isInternalOrZone,
    }),
  },
  manager: {
    type: SelectField,
    label: 'react.locationsConfiguration.manager.label',
    defaultMessage: 'Manager',
    attributes: {
      async: true,
      showValueTooltip: true,
      openOnClick: false,
      autoload: false,
      cache: false,
      options: [],
      labelKey: 'name',
      filterOptions: (options) => options,
    },
    getDynamicAttr: ({ debouncedPeopleFetch, isInternalOrZone }) => ({
      loadOptions: debouncedPeopleFetch,
      hidden: isInternalOrZone,
    }),
  },
};

const CONFIGURATION_FIELDS = {
  active: {
    type: CheckboxField,
    label: 'react.locationsConfiguration.locationStatus.label',
    defaultMessage: 'Location Status',
    attributes: {
      withLabel: true,
      label: 'Active',
    },
  },
  bgColor: {
    type: ColorPickerField,
    label: 'react.locationsConfiguration.backgroundColor.label',
    defaultMessage: 'Background color',
    attributes: {
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.color.tooltip.label',
    },
    getDynamicAttr: ({ isInternalOrZone }) => ({
      hidden: isInternalOrZone,
    }),
  },
  fgColor: {
    type: ColorPickerField,
    label: 'react.locationsConfiguration.foregroundColor.label',
    defaultMessage: 'Foreground color',
    attributes: {
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.color.tooltip.label',
    },
    getDynamicAttr: ({ isInternalOrZone }) => ({
      hidden: isInternalOrZone,
    }),
  },
};

const ADDRESS_FIELDS = {
  'address.address': {
    type: TextField,
    label: 'address.address.label',
    defaultMessage: 'Street address',
  },
  'address.address2': {
    type: TextField,
    label: 'address.address2.label',
    defaultMessage: 'Street address 2',
  },
  'address.city': {
    type: TextField,
    label: 'address.city.label',
    defaultMessage: 'City',
  },
  'address.stateOrProvince': {
    type: TextField,
    label: 'address.stateOrProvince.label',
    defaultMessage: 'State/Province',
  },
  'address.postalCode': {
    type: TextField,
    label: 'address.postalCode.label',
    defaultMessage: 'Postal code',
  },
  'address.country': {
    type: TextField,
    label: 'address.country.label',
    defaultMessage: 'Country',
  },
  'address.description': {
    type: TextField,
    label: 'address.description.label',
    defaultMessage: 'Description',
  },
};

class LocationEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: { active: true },
      details: {},
      locationTypes: [],
      supportedActivities: [],
      zoneOptions: [],
      useDefaultActivities: true,
      activeTab: 'details',
    };

    this.debouncedPeopleFetch = debouncePeopleFetch(500, 2);
    this.debouncedLocationGroupsFetch = debounceLocationGroupsFetch(500, 2);
    this.debouncedOrganizationsFetch = debounceOrganizationsFetch(500, 2, [], true);
    this.debouncedLocationsFetch = debounceLocationsFetch(500, 2, null, true);
    this.getSupportedActivities = this.getSupportedActivities.bind(this);
    this.save = this.save.bind(this);
  }

  componentDidMount() {
    this.props.fetchTranslations('', 'locationsConfiguration');
    this.fetchLocationTypes();
    this.fetchSupportedActivities();
    if (this.locationId) {
      this.fetchLocation();
      this.fetchDetails();
    }
  }

  get locationId() {
    return this.props.match.params.locationId;
  }

  getSupportedActivities(locationType) {
    return _.chain(locationType)
      .get('supportedActivities')
      .map((value) => ({ value, label: this.props.translate(`react.locationsConfiguration.ActivityCode.${value}`, value) }))
      .value();
  }

  fetchLocation() {
    apiClient.get(LOCATION(this.locationId)).then((response) => {
      const location = response.data.data;
      if (!location) {
        this.props.history.push(LOCATION_URL.create());
        return;
      }
      this.setState((prev) => ({
        values: {
          ...prev.values,
          locationId: this.locationId,
          name: location.name,
          locationNumber: location.locationNumber,
          active: location.active,
          bgColor: location.backgroundColor,
          address: location.address || {},
          organization: location.organization
            ? {
              value: location.organization.id,
              id: location.organization.id,
              name: location.organization.name,
              label: `${location.organization.code} ${location.organization.name}`,
            }
            : '',
          locationType: location.locationType
            ? {
              ...location.locationType,
              value: location.locationType.id,
              label: splitTranslation(location.locationType.name, this.props.locale),
            }
            : '',
          locationGroup: location.locationGroup
            ? {
              value: location.locationGroup.id,
              id: location.locationGroup.id,
              name: location.locationGroup.name,
              label: location.locationGroup.name,
            }
            : '',
          manager: location.manager ? location.manager : '',
          parentLocation: location.parentLocation
            ? {
              value: location.parentLocation.id,
              id: location.parentLocation.id,
              name: location.parentLocation.name,
              label: location.parentLocation.name,
            }
            : '',
          zone: location.zoneId
            ? { id: location.zoneId, name: location.zoneName }
            : '',
          supportedActivities: _.map(
            location.supportedActivities,
            (value) => ({ value, label: this.props.translate(`react.locationsConfiguration.ActivityCode.${value}`, value) }),
          ),
        },
      }));
      if (location.parentLocation) {
        this.fetchZoneOptions(location.parentLocation.id);
      }
    })
      .catch(() => Promise.reject(new Error(this.props.translate('react.locationsConfiguration.error.fetchingLocation', 'Could not load location data'))));
  }

  fetchDetails() {
    apiClient.get(LOCATION_DETAILS(this.locationId)).then((response) => {
      const details = response.data.data;
      this.setState((prev) => ({
        details,
        useDefaultActivities: details.usesDefaultActivities,
        values: {
          ...prev.values,
          fgColor: details.fgColor,
        },
      }));
    });
  }

  fetchZoneOptions(parentLocationId) {
    apiClient.get('/api/internalLocations/search', {
      params: {
        locationTypeCode: 'ZONE',
        'parentLocation.id': parentLocationId,
        includeInactive: true,
        max: '100',
        offset: '0',
      },
    }).then((response) => {
      this.setState({ zoneOptions: response.data.data });
    });
  }

  fetchLocationTypes() {
    apiClient.get(LOCATION_TYPES)
      .then((response) => {
        const locationTypes = _.map(response.data.data, (locationType) => ({
          ...locationType,
          label: splitTranslation(locationType.name, this.props.locale),
        }));

        if (this.locationId) {
          this.setState({ locationTypes });
        } else {
          const locationType = _.find(locationTypes, (type) => _.startsWith(type.name, 'Depot'));
          const supportedActivities = this.getSupportedActivities(locationType);
          this.setState((prev) => ({
            locationTypes,
            values: { ...prev.values, locationType, supportedActivities },
          }));
        }
      });
  }

  fetchSupportedActivities() {
    apiClient.get('/api/locations/supportedActivities')
      .then((response) => {
        const supportedActivities = _.map(
          response.data.data,
          (value) => ({ value, label: this.props.translate(`react.locationsConfiguration.ActivityCode.${value}`, value) }),
        );
        this.setState({ supportedActivities });
      });
  }

  save(values) {
    this.props.showSpinner();

    const locationUrl = this.locationId
      ? `${LOCATION(this.locationId)}?useDefaultActivities=${this.state.useDefaultActivities}`
      : `/api/locations?useDefaultActivities=${this.state.useDefaultActivities}`;

    // Only send the address when it has any value, otherwise binding an
    // empty address object fails server-side validation
    const hasAddress = _.some(_.values(values.address), (value) => value);
    const payload = {
      ..._.omit(values, 'address'),
      ...(hasAddress ? { address: values.address } : {}),
      supportedActivities: _.map(values.supportedActivities, (val) => val.value),
    };

    apiClient.post(locationUrl, payload)
      .then((response) => {
        this.props.hideSpinner();
        Alert.success(this.props.translate('react.locationsConfiguration.alert.locationSaveCompleted.label', 'Location was successfully saved!'), { timeout: 3000 });
        const resp = response.data.data;
        if (!this.locationId) {
          this.props.history.push(LOCATION_URL.edit(resp.id));
          this.fetchLocation();
          this.fetchDetails();
        }
      })
      .catch(() => {
        this.props.hideSpinner();
        return Promise.reject(new Error(this.props.translate('react.locationsList.error.saveLocation.label', 'Could not save location')));
      });
  }

  render() {
    const { details, activeTab } = this.state;
    const isInternal = details.isInternalLocation || false;
    const isZone = details.isZoneLocation || false;
    const isInternalOrZone = isInternal || isZone;

    const tabClass = (tab) => `nav-link ${activeTab === tab ? 'active' : ''}`;

    return (
      <div className="d-flex flex-column list-page-main">
        <div className="d-flex list-page-header">
          <span className="d-flex align-self-center title">
            {this.locationId
              ? <Translate id="react.locationsList.editLocation.label" defaultMessage="Edit Location" />
              : <Translate id="react.locationsList.addLocation.label" defaultMessage="Add location" />}
            {this.state.values.name ? `: ${this.state.values.name}` : ''}
          </span>
        </div>
        <div className="p-3">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item" role="tab" aria-label="Location">
              <button type="button" className={tabClass('details')} onClick={() => this.setState({ activeTab: 'details' })}>
                <Translate id="react.locationsList.location.label" defaultMessage="Location" />
              </button>
            </li>
            <li className="nav-item" role="tab" aria-label="Configuration">
              <button type="button" className={tabClass('configuration')} onClick={() => this.setState({ activeTab: 'configuration' })}>
                <Translate id="react.locationsList.configuration.label" defaultMessage="Configuration" />
              </button>
            </li>
            {!isInternalOrZone && (
              <li className="nav-item" role="tab" aria-label="Address">
                <button type="button" className={tabClass('address')} onClick={() => this.setState({ activeTab: 'address' })}>
                  <Translate id="react.locationsList.address.label" defaultMessage="Address" />
                </button>
              </li>
            )}
            {this.locationId && !isInternalOrZone && (
              <li className="nav-item" role="tab" aria-label="Zone Locations">
                <a className="nav-link" href={LOCATION_URL.showZoneLocations(this.locationId)}>
                  <Translate id="react.locationsList.zoneLocations.label" defaultMessage="Zone Locations" />
                </a>
              </li>
            )}
            {this.locationId && !isInternal && (
              <li className="nav-item" role="tab" aria-label="Bin Locations">
                <a className="nav-link" href={LOCATION_URL.showBinLocations(this.locationId)}>
                  <Translate id="react.locationsList.binLocations.label" defaultMessage="Bin Locations" />
                </a>
              </li>
            )}
            {this.locationId && isInternal && (
              <li className="nav-item" role="tab" aria-label="Contents">
                <a className="nav-link" href={LOCATION_URL.showContents(this.locationId)}>
                  <Translate id="react.locationsList.contents.label" defaultMessage="Contents" />
                </a>
              </li>
            )}
            {this.locationId && (
              <li className="nav-item" role="tab" aria-label="Logo">
                <a className="nav-link" href={LOCATION_URL.uploadLogo(this.locationId)}>
                  <Translate id="react.locationsList.logo.label" defaultMessage="Logo" />
                </a>
              </li>
            )}
          </ul>
          <Form
            onSubmit={(values) => this.save(values)}
            validate={validate}
            initialValues={this.state.values}
            keepDirtyOnReinitialize
            mutators={{
              resetSupportedActivities: ([locationType], state, utils) => {
                const supportedActivities = this.getSupportedActivities(locationType);
                utils.changeValue(state, 'supportedActivities', () => supportedActivities);
              },
            }}
            render={({
              form: { mutators: { resetSupportedActivities } },
              handleSubmit,
              values,
            }) => (
              <form onSubmit={handleSubmit} className="w-100">
                <div className={`classic-form with-description ${activeTab === 'details' ? '' : 'd-none'}`}>
                  <div className="form-title">
                    <Translate id="react.locationsConfiguration.details.label" defaultMessage="Details" />
                  </div>
                  {_.map(
                    DETAILS_FIELDS,
                    (fieldConfig, fieldName) => renderFormField(fieldConfig, fieldName, {
                      debouncedLocationGroupsFetch: this.debouncedLocationGroupsFetch,
                      debouncedOrganizationsFetch: this.debouncedOrganizationsFetch,
                      debouncedPeopleFetch: this.debouncedPeopleFetch,
                      debouncedLocationsFetch: this.debouncedLocationsFetch,
                      locationTypes: this.state.locationTypes,
                      zoneOptions: this.state.zoneOptions,
                      resetSupportedActivities,
                      isInternal,
                      isInternalOrZone,
                    }),
                  )}
                </div>
                <div className={`classic-form with-description ${activeTab === 'configuration' ? '' : 'd-none'}`}>
                  <div className="form-title">
                    <Translate id="react.locationsList.configuration.label" defaultMessage="Configuration" />
                  </div>
                  {_.map(
                    CONFIGURATION_FIELDS,
                    (fieldConfig, fieldName) => renderFormField(fieldConfig, fieldName, {
                      active: values.active,
                      isInternalOrZone,
                    }),
                  )}
                  <div className="d-flex w-100 ml-1 pt-2 justify-content-between align-items-center">
                    <Checkbox
                      id="useDefaultActivities"
                      value={this.state.useDefaultActivities}
                      onChange={(val) => this.setState({ useDefaultActivities: val })}
                      withLabel
                      label={this.props.translate('react.locationsConfiguration.useDefaultActivities.label', 'Use default settings for Supported Activities')}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => {
                        this.setState({ useDefaultActivities: true });
                        resetSupportedActivities(values.locationType);
                      }}
                    >
                      <span>
                        <i className="fa fa-refresh pr-2" />
                        <Translate id="react.locationsConfiguration.resetToDefault.label" defaultMessage="Reset to default settings" />
                      </span>
                    </button>
                  </div>
                  <div className="location-supported-activities">
                    <SelectField
                      fieldName="supportedActivities"
                      fieldConfig={{
                        attributes: {
                          multi: true,
                        },
                        getDynamicAttr: ({ supportedActivities, useDefaultActivities }) => ({
                          disabled: useDefaultActivities,
                          options: supportedActivities,
                        }),
                      }}
                      supportedActivities={this.state.supportedActivities}
                      useDefaultActivities={this.state.useDefaultActivities}
                    />
                  </div>
                </div>
                {!isInternalOrZone && (
                  <div className={`classic-form with-description ${activeTab === 'address' ? '' : 'd-none'}`}>
                    <div className="form-title">
                      <Translate id="address.label" defaultMessage="Address" />
                    </div>
                    {_.map(
                      ADDRESS_FIELDS,
                      (fieldConfig, fieldName) => renderFormField(fieldConfig, fieldName),
                    )}
                  </div>
                )}
                <div className="submit-buttons d-flex">
                  <button type="submit" className="btn btn-outline-primary float-left btn-xs">
                    <Translate id="react.default.button.save.label" defaultMessage="Save" />
                  </button>
                  <a className="btn btn-outline-secondary btn-xs ml-2" href={LOCATION_URL.list()}>
                    <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                  </a>
                </div>
              </form>
            )}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
  locale: state.session.activeLanguage,
});

const mapDispatchToProps = {
  showSpinner,
  hideSpinner,
  fetchTranslations,
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LocationEdit));

LocationEdit.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({ locationId: PropTypes.string }),
  }).isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  translate: PropTypes.func.isRequired,
  locale: PropTypes.string.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  fetchTranslations: PropTypes.func.isRequired,
};
