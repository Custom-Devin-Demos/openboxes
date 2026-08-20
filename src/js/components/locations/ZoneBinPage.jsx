import React, { Component } from 'react';

import _ from 'lodash';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import { confirmAlert } from 'react-confirm-alert';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Alert from 'react-s-alert';
import ReactTable from 'react-table';

import { fetchTranslations, hideSpinner, showSpinner } from 'actions';
import { LOCATION, LOCATION_DETAILS, LOCATION_TYPES } from 'api/urls';
import CheckboxField from 'components/form-elements/CheckboxField';
import ModalWrapper from 'components/form-elements/ModalWrapper';
import SelectField from 'components/form-elements/SelectField';
import TextField from 'components/form-elements/TextField';
import AddBinModal from 'components/locations-configuration/modals/AddBinModal';
import AddZoneModal from 'components/locations-configuration/modals/AddZoneModal';
import ImportBinModal from 'components/locations-configuration/modals/ImportBinModal';
import { LOCATION_URL } from 'consts/applicationUrls';
import apiClient, { flattenRequest } from 'utils/apiClient';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

import 'react-confirm-alert/src/react-confirm-alert.css';
import 'react-table/react-table.css';
import 'components/locations-configuration/ZoneTable.scss';

const ZONE_FIELDS = {
  active: {
    type: CheckboxField,
    label: 'react.locationsConfiguration.addZone.status.label',
    defaultMessage: 'Status',
    attributes: {
      withLabel: true,
      label: 'Active',
    },
  },
  name: {
    type: TextField,
    label: 'react.locationsConfiguration.name.label',
    defaultMessage: 'Name',
    attributes: {
      required: true,
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.addZone.name.tooltip.label',
    },
  },
  locationType: {
    type: SelectField,
    label: 'react.locationsConfiguration.zoneType.label',
    defaultMessage: 'Zone Type',
    attributes: {
      required: true,
      valueKey: 'id',
      labelKey: 'name',
    },
    getDynamicAttr: ({ zoneTypes }) => ({
      options: zoneTypes,
    }),
  },
};

const BIN_FIELDS = {
  active: {
    type: CheckboxField,
    label: 'react.locationsConfiguration.addZone.status.label',
    defaultMessage: 'Status',
    attributes: {
      withLabel: true,
      label: 'Active',
    },
  },
  name: {
    type: TextField,
    label: 'react.locationsConfiguration.name.label',
    defaultMessage: 'Name',
    attributes: {
      required: true,
      withTooltip: true,
      tooltip: 'react.locationsConfiguration.addZone.name.tooltip.label',
    },
  },
  locationType: {
    type: SelectField,
    label: 'react.locationsConfiguration.binType.label',
    defaultMessage: 'Bin Type',
    attributes: {
      required: true,
      valueKey: 'id',
      labelKey: 'name',
    },
    getDynamicAttr: ({ binTypes }) => ({
      options: binTypes,
    }),
  },
  zoneLocation: {
    type: SelectField,
    label: 'react.locationsConfiguration.zoneLocation.label',
    defaultMessage: 'Zone Location',
    attributes: {
      valueKey: 'id',
      labelKey: 'name',
    },
    getDynamicAttr: ({ zoneData }) => ({
      options: zoneData,
    }),
  },
};

const makeValidate = (FIELDS) => (values) => {
  const requiredFields = ['name', 'locationType'];
  return Object.keys(FIELDS)
    .reduce((acc, fieldName) => {
      if (!values[fieldName] && requiredFields.includes(fieldName)) {
        return {
          ...acc,
          [fieldName]: 'react.default.error.requiredField.label',
        };
      }
      return acc;
    }, {});
};

const zoneValidate = makeValidate(ZONE_FIELDS);
const binValidate = makeValidate(BIN_FIELDS);

/**
 * Standalone page listing the zone or bin locations of a location. React
 * equivalent of the legacy location/showZoneLocations and
 * location/showBinLocations screens.
 */
class ZoneBinPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      location: {},
      details: {},
      data: [],
      pages: -1,
      loading: true,
      zoneTypes: [],
      binTypes: [],
      zoneData: [],
    };
    this.refTable = React.createRef();
    this.refetchTable = this.refetchTable.bind(this);
    this.deleteLocation = this.deleteLocation.bind(this);
    this.handleLocationEdit = this.handleLocationEdit.bind(this);
    this.onFetchData = this.onFetchData.bind(this);
  }

  componentDidMount() {
    this.props.fetchTranslations('', 'locationsConfiguration');
    this.fetchLocation();
    this.fetchBinAndZoneTypes();
    if (this.props.mode === 'bin') {
      this.fetchZoneData();
    }
  }

  onFetchData(state) {
    const offset = state.page > 0 ? (state.page) * state.pageSize : 0;
    const isZonePage = this.props.mode === 'zone';
    // The legacy bin locations screen lists the bins within a zone when
    // showing a zone location, and the bins of a depot otherwise
    const parentParam = this.state.details.isZoneLocation && !isZonePage
      ? { 'zone.id': this.locationId }
      : { 'parentLocation.id': this.locationId };
    apiClient.get('/api/internalLocations/search', {
      paramsSerializer: (parameters) => queryString.stringify(parameters),
      params: {
        locationTypeCode: isZonePage ? 'ZONE' : ['BIN_LOCATION', 'INTERNAL'],
        offset: `${offset}`,
        max: `${state.pageSize}`,
        ...parentParam,
        includeInactive: true,
      },
    })
      .then((res) => {
        this.setState({
          loading: false,
          pages: Math.ceil(res.data.totalCount / state.pageSize),
          data: res.data.data,
        });
      })
      .catch(() => Promise.reject(new Error(this.props.translate('react.locationsConfiguration.error.binList.label', 'Could not get list of bin locations'))));
  }

  get locationId() {
    return this.props.match.params.locationId;
  }

  fetchLocation() {
    apiClient.get(LOCATION(this.locationId)).then((response) => {
      this.setState({ location: response.data.data || {} });
    });
    apiClient.get(LOCATION_DETAILS(this.locationId)).then((response) => {
      this.setState({ details: response.data.data || {} }, () => this.refetchTable());
    });
  }

  fetchBinAndZoneTypes() {
    apiClient.get(LOCATION_TYPES)
      .then((response) => {
        const locationTypes = _.map(response.data.data, (locationType) => {
          const [en, fr] = _.split(locationType.name, '|fr:');
          return {
            ...locationType,
            label: this.props.locale === 'fr' && fr ? fr : en,
          };
        });
        const binTypes = locationTypes.filter((location) => location.locationTypeCode === 'BIN_LOCATION' || location.locationTypeCode === 'INTERNAL');
        const zoneTypes = locationTypes.filter((location) => location.locationTypeCode === 'ZONE');
        this.setState({ binTypes, zoneTypes });
      })
      .catch(() => Promise.reject(new Error(this.props.translate('react.locationsConfiguration.error.fetchingBinAndZoneTypes', 'Could not load location types'))));
  }

  fetchZoneData() {
    apiClient.get('/api/internalLocations/search', {
      params: {
        locationTypeCode: 'ZONE',
        'parentLocation.id': this.locationId,
        includeInactive: true,
        max: '100',
        offset: '0',
      },
    }).then((response) => {
      this.setState({ zoneData: response.data.data });
    });
  }

  refetchTable() {
    if (this.refTable.current) {
      this.refTable.current.fireFetchData();
    }
  }

  handleLocationEdit(values) {
    this.props.showSpinner();
    const payload = {
      name: values.name,
      parentLocation: values.parentLocation && { id: values.parentLocation.id },
      active: values.active,
      locationType: { id: values.locationType.id },
      zone: values.zoneLocation && { id: values.zoneLocation.id },
    };

    apiClient.post(`/api/locations/${values.id}`, flattenRequest(payload))
      .then(() => {
        this.props.hideSpinner();
        Alert.success(this.props.translate('react.locationsConfiguration.editBin.success.label', 'Bin location has been edited successfully!'), { timeout: 3000 });
        this.refetchTable();
      })
      .catch(() => {
        this.props.hideSpinner();
        return Promise.reject(new Error(this.props.translate('react.locationsConfiguration.editZone.error.label', 'Could not edit zone location')));
      });
  }

  deleteLocation(location) {
    confirmAlert({
      title: this.props.translate('react.locationsConfiguration.deleteZoneConfirm.title.label', 'Deleting a location'),
      message: this.props.translate(
        'react.locationsConfiguration.deleteZoneConfirm.subtitle.label',
        'If you press \'Yes\', this will delete the location. If you decide not to delete the location, press \'No\'',
      ),
      buttons: [
        {
          label: this.props.translate('react.default.yes.label', 'Yes'),
          onClick: () => {
            apiClient.delete(`/api/locations/${location.id}`)
              .then(() => this.refetchTable())
              .catch(() => Promise.reject(new Error(this.props.translate('react.locationsConfiguration.deleteBin.error.label', 'Could not delete bin location'))));
          },
        },
        {
          label: this.props.translate('react.default.no.label', 'No'),
        },
      ],
    });
  }

  render() {
    const isZonePage = this.props.mode === 'zone';
    const FIELDS = isZonePage ? ZONE_FIELDS : BIN_FIELDS;
    const validate = isZonePage ? zoneValidate : binValidate;

    const columns = [
      {
        Header: 'Status',
        accessor: 'active',
        minWidth: 30,
        className: 'active-circle',
        headerClassName: 'header',
        Cell: (row) => (row.original.active
          ? <i className="fa fa-check-circle green-circle" aria-hidden="true" />
          : <i className="fa fa-times-circle grey-circle" aria-hidden="true" />),
      },
      {
        Header: 'Name',
        accessor: 'name',
        className: 'cell',
        headerClassName: 'header text-align-left',
      },
      {
        Header: isZonePage ? 'Zone Type' : 'Bin Type',
        accessor: 'locationType.name',
        className: 'cell',
        headerClassName: 'header text-align-left',
      },
      ...(!isZonePage ? [{
        Header: 'Zone location',
        accessor: 'zoneName',
        minWidth: 50,
        className: 'cell',
        headerClassName: 'header text-align-left',
      }] : []),
      {
        Header: 'Actions',
        minWidth: 20,
        accessor: 'actions',
        className: 'action-cell',
        headerClassName: 'header',
        Cell: (row) => (
          <div className="d-flex justify-content-center align-items-center" style={{ gap: '3px' }}>
            {!isZonePage && (
              <a href={LOCATION_URL.showContents(row.original.id)} aria-label="Show contents">
                <i className="fa fa-search action-icons icon-pointer" aria-hidden="true" />
              </a>
            )}
            <ModalWrapper
              onSave={(values) => this.handleLocationEdit(values)}
              fields={FIELDS}
              validate={validate}
              initialValues={{
                ...row.original,
                locationType: row.original.locationType,
                zoneLocation: row.original.zoneId
                  ? { id: row.original.zoneId, name: row.original.zoneName }
                  : null,
              }}
              formProps={{
                binTypes: this.state.binTypes,
                zoneTypes: this.state.zoneTypes,
                zoneData: this.state.zoneData,
              }}
              title={isZonePage ? 'react.locationsConfiguration.editZone.label' : 'react.locationsConfiguration.editBin.label'}
              defaultTitleMessage={isZonePage ? 'Edit Zone Location' : 'Edit Bin Location'}
              btnSaveDefaultText="Save"
              btnOpenAsIcon
              btnOpenIcon="fa-pencil"
              btnOpenClassName="action-icons icon-pointer"
              btnContainerClassName="d-flex justify-content-end"
              btnContainerStyle={{ gap: '3px' }}
              btnSaveClassName="btn btn-primary"
              btnCancelClassName="btn btn-outline-primary"
            />
            <i
              className="fa fa-trash-o action-icons icon-pointer"
              aria-hidden="true"
              onClick={() => this.deleteLocation(row.original)}
            />
          </div>
        ),
      },
    ];

    return (
      <div className="d-flex flex-column list-page-main">
        <div className="d-flex list-page-header">
          <span className="d-flex align-self-center title">
            {isZonePage
              ? <Translate id="react.locationsList.zoneLocations.label" defaultMessage="Zone Locations" />
              : <Translate id="react.locationsList.binLocations.label" defaultMessage="Bin Locations" />}
            {this.state.location.name ? `: ${this.state.location.name}` : ''}
          </span>
        </div>
        <div className="p-3">
          <div className="d-flex bin-buttons mb-2" style={{ gap: '8px' }}>
            {isZonePage
              ? (
                <AddZoneModal
                  FIELDS={ZONE_FIELDS}
                  validate={zoneValidate}
                  locationId={this.locationId}
                  addZoneLocation={this.refetchTable}
                  zoneTypes={this.state.zoneTypes}
                />
              )
              : (
                <>
                  <AddBinModal
                    FIELDS={BIN_FIELDS}
                    validate={binValidate}
                    locationId={this.locationId}
                    addBinLocation={this.refetchTable}
                    binTypes={this.state.binTypes}
                    zoneData={this.state.zoneData}
                  />
                  <ImportBinModal
                    locationId={this.locationId}
                    onResponse={this.refetchTable}
                  />
                  <a className="btn-xs btn btn-outline-primary add-zonebin-btn" href={LOCATION_URL.exportBinLocations(this.locationId)}>
                    <i className="fa fa-arrow-up mr-1" aria-hidden="true" />
                    <Translate id="react.locationsConfiguration.exportBinLocations.label" defaultMessage="Export Bin Locations" />
                  </a>
                </>
              )}
            <a className="btn-xs btn btn-outline-secondary" href={LOCATION_URL.edit(this.locationId)}>
              <Translate id="react.default.button.back.label" defaultMessage="Back" />
            </a>
          </div>
          <ReactTable
            data={this.state.data}
            ref={this.refTable}
            columns={columns}
            loading={this.state.loading}
            pages={this.state.pages}
            defaultPageSize={10}
            manual
            className="-striped -highlight zoneTable"
            resizable={false}
            sortable={false}
            multiSort={false}
            previousText={<i className="fa fa-chevron-left" aria-hidden="true" />}
            nextText={<i className="fa fa-chevron-right" aria-hidden="true" />}
            pageText=""
            onFetchData={this.onFetchData}
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ZoneBinPage));

ZoneBinPage.propTypes = {
  mode: PropTypes.oneOf(['zone', 'bin']).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({ locationId: PropTypes.string }),
  }).isRequired,
  translate: PropTypes.func.isRequired,
  locale: PropTypes.string.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  fetchTranslations: PropTypes.func.isRequired,
};
