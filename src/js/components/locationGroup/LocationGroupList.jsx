import React, { useMemo, useState } from 'react';

import { LOCATION_GROUP_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { LOCATION_GROUP_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const LocationGroupList = () => {
  useTranslation('locationGroup');
  const [filterParams] = useState({ q: '' });
  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: LOCATION_GROUP_API,
    errorMessageId: 'react.locationGroup.error.locationGroupList.label',
    defaultErrorMessage: 'Unable to fetch location groups',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.locationGroup.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCATION_GROUP_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.locationGroup.column.description.label" defaultMessage="Description" />,
      accessor: 'address.description',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.locationGroup.column.locations.label" defaultMessage="Locations" />,
      accessor: 'locationsCount',
      sortable: false,
      minWidth: 100,
      Cell: (row) => <TableCell {...row} value={String(row.value)} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.locationGroup.header.label',
          defaultMessage: 'Location Groups',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.locationGroup.createLocationGroup.label"
              defaultLabel="Add Location Group"
              onClick={() => {
                window.location = LOCATION_GROUP_URL.create();
              }}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <ListTableWrapper>
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
          noDataText="No location groups match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default LocationGroupList;
