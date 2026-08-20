import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { confirmAlert } from 'react-confirm-alert';
import { getTranslate } from 'react-localize-redux';
import { useSelector } from 'react-redux';

import { LOCATION, LOCATION_SUPPORTED_ACTIVITIES } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import { LOCATION_URL } from 'consts/applicationUrls';
import useLocationsListTableData from 'hooks/list-pages/location/useLocationsListTableData';
import apiClient from 'utils/apiClient';
import StatusIndicator from 'utils/StatusIndicator';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';

import 'react-confirm-alert/src/react-confirm-alert.css';

const activityCodeLabel = (activityCode) => activityCode
  .split('_')
  .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
  .join(' ');

const LocationsListTable = ({ filterParams }) => {
  const [supportedActivities, setSupportedActivities] = useState([]);
  const {
    tableData,
    tableRef,
    loading,
    onFetchHandler,
  } = useLocationsListTableData(filterParams);

  const { translate } = useSelector((state) => ({
    translate: translateWithDefaultMessage(getTranslate(state.localize)),
  }));

  useEffect(() => {
    apiClient.get(LOCATION_SUPPORTED_ACTIVITIES)
      .then((response) => setSupportedActivities(response.data.data));
  }, []);

  const deleteLocation = (location) => {
    confirmAlert({
      title: translate('react.locationsList.delete.confirm.title.label', 'Deleting a location'),
      message: translate(
        'react.locationsList.delete.confirm.message.label',
        'Are you sure you want to delete this location?',
      ),
      buttons: [
        {
          label: translate('react.default.yes.label', 'Yes'),
          onClick: () => {
            apiClient.delete(LOCATION(location.id))
              .then(() => tableRef.current.fireFetchData());
          },
        },
        {
          label: translate('react.default.no.label', 'No'),
        },
      ],
    });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.locationsList.column.actions.label" defaultMessage="Actions" />,
      accessor: 'actions',
      className: 'action-cell d-flex justify-content-center',
      headerClassName: 'header justify-content-center',
      sortable: false,
      maxWidth: 80,
      fixed: true,
      Cell: (row) => (
        <div className="d-flex justify-content-center align-items-center" style={{ gap: '8px' }}>
          <a href={LOCATION_URL.edit(row.original.id)} aria-label="Edit location">
            <i className="fa fa-pencil action-icons icon-pointer" aria-hidden="true" />
          </a>
          <a href={LOCATION_URL.uploadLogo(row.original.id)} aria-label="Upload logo">
            <i className="fa fa-photo action-icons icon-pointer" aria-hidden="true" />
          </a>
          <i
            className="fa fa-trash-o action-icons icon-pointer"
            aria-hidden="true"
            role="button"
            tabIndex={0}
            aria-label="Delete location"
            onClick={() => deleteLocation(row.original)}
            onKeyPress={() => deleteLocation(row.original)}
          />
        </div>
      ),
    },
    {
      Header: <Translate id="react.locationsList.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      className: 'active-circle',
      headerClassName: 'header',
      minWidth: 180,
      fixed: true,
      Cell: (row) => (
        <TableCell
          {...row}
          tooltip
          link={LOCATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.locationsList.column.locationNumber.label" defaultMessage="Location Number" />,
      accessor: 'locationNumber',
      minWidth: 130,
      Cell: (row) => (
        <TableCell
          {...row}
          tooltip
          link={LOCATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.locationsList.column.locationType.label" defaultMessage="Location Type" />,
      accessor: 'locationType',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} value={row.value?.name} tooltip />,
    },
    {
      Header: <Translate id="react.locationsList.column.locationGroup.label" defaultMessage="Location Group" />,
      accessor: 'locationGroup',
      minWidth: 130,
      Cell: (row) => (
        <TableCell
          {...row}
          value={row.value?.name
            ?? translate('react.default.none.label', 'None')}
          tooltip
        />
      ),
    },
    {
      Header: <Translate id="react.locationsList.column.status.label" defaultMessage="Status" />,
      accessor: 'status',
      className: 'active-circle d-flex justify-content-center',
      headerClassName: 'header justify-content-center',
      minWidth: 110,
      Cell: (row) => (
        <StatusIndicator
          variant={row.value === 'ENABLED' ? 'success' : 'danger'}
          status={row.value === 'ENABLED'
            ? translate('react.locationsList.status.enabled.label', 'Enabled')
            : translate('react.locationsList.status.disabled.label', 'Disabled')}
        />
      ),
    },
    {
      Header: <Translate id="react.locationsList.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      className: 'd-flex justify-content-center',
      headerClassName: 'header justify-content-center',
      sortable: false,
      minWidth: 70,
      Cell: (row) => (row.value
        ? <i className="fa fa-check-circle green-circle" aria-hidden="true" title="Yes" />
        : <i className="fa fa-times-circle grey-circle" aria-hidden="true" title="No" />),
    },
    ...supportedActivities.map((activityCode) => ({
      Header: (
        <Translate
          id={`react.locationsList.activityCode.${activityCode}.label`}
          defaultMessage={activityCodeLabel(activityCode)}
        />
      ),
      id: `activity-${activityCode}`,
      accessor: 'supportedActivities',
      className: 'd-flex justify-content-center',
      headerClassName: 'header justify-content-center',
      sortable: false,
      minWidth: 90,
      Cell: (row) => (row.value?.includes(activityCode)
        ? <i className="fa fa-check-circle green-circle" aria-hidden="true" title="Yes" />
        : <i className="fa fa-times-circle grey-circle" aria-hidden="true" title="No" />),
    })),
    {
      Header: <Translate id="react.locationsList.column.color.label" defaultMessage="Color" />,
      id: 'color',
      accessor: 'name',
      sortable: false,
      minWidth: 140,
      Cell: (row) => (
        <div
          className="w-100 text-center"
          style={{
            border: '1px solid lightgrey',
            color: row.original.fgColor || 'black',
            backgroundColor: row.original.bgColor || 'white',
            padding: '5px',
          }}
        >
          {row.value}
        </div>
      ),
    },
  ], [supportedActivities, translate]);

  return (
    <div className="list-page-list-section">
      <div className="title-text p-3 d-flex justify-content-between align-items-center">
        <span>
          <Translate id="react.locationsList.searchResults.label" defaultMessage="Search results" />
          &nbsp;
          (
          {tableData.totalCount}
          )
        </span>
        <a href={LOCATION_URL.exportLocations()}>
          <Button
            defaultLabel="Export locations"
            label="react.locationsList.export.label"
            variant="secondary"
          />
        </a>
      </div>
      <DataTable
        manual
        sortable
        ref={tableRef}
        columns={columns}
        data={tableData.data}
        loading={loading}
        defaultPageSize={10}
        pages={tableData.pages}
        totalData={tableData.totalCount}
        onFetchData={onFetchHandler}
        className="mb-1"
        noDataText="No locations match the given criteria"
      />
    </div>
  );
};

export default LocationsListTable;

LocationsListTable.propTypes = {
  filterParams: PropTypes.shape({}).isRequired,
};
