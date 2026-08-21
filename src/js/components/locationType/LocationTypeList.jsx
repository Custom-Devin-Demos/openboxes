import React, { useMemo, useState } from 'react';

import { LOCATION_TYPE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { LOCATION_TYPE_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const LocationTypeList = () => {
  useTranslation('locationType', 'default');
  const [filterParams] = useState({ q: '' });

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
    url: LOCATION_TYPE_API,
    errorMessageId: 'react.locationType.error.locationTypeList.label',
    defaultErrorMessage: 'Unable to fetch location types',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.locationType.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCATION_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.locationType.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 180,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCATION_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.locationType.column.locationTypeCode.label" defaultMessage="Location Type Code" />,
      accessor: 'locationTypeCode',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.locationType.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.locationType.column.sortOrder.label" defaultMessage="Sort Order" />,
      accessor: 'sortOrder',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} value={row.value != null ? String(row.value) : ''} />,
    },
    {
      Header: <Translate id="react.locationType.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.locationType.header.label',
          defaultMessage: 'Location Types',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.locationType.createLocationType.label"
            defaultLabel="Add Location Type"
            onClick={() => {
              window.location = LOCATION_TYPE_URL.create();
            }}
          />
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
          noDataText="No location types match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default LocationTypeList;
