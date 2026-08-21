import React, { useMemo } from 'react';

import { EVENT_TYPE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { EVENT_TYPE_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

// useTableData skips fetching when filterParams is empty,
// so pass a stable non-empty object for screens without filters
const filterParams = { initialized: true };

const EventTypeList = () => {
  useTranslation('eventType');

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
    url: EVENT_TYPE_API,
    errorMessageId: 'react.eventType.error.eventTypeList.label',
    defaultErrorMessage: 'Unable to fetch event types',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.eventType.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={EVENT_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.eventType.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.eventType.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.eventType.column.sortOrder.label" defaultMessage="Sort Order" />,
      accessor: 'sortOrder',
      minWidth: 100,
      Cell: (row) => (
        <TableCell {...row}>
          {row.original.sortOrder != null ? `${row.original.sortOrder}` : ''}
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.eventType.column.eventCode.label" defaultMessage="Event Status" />,
      accessor: 'eventCode',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.eventType.header.label',
          defaultMessage: 'Event Type List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.eventType.createEventType.label"
            defaultLabel="Create Event Type"
            onClick={() => {
              window.location = EVENT_TYPE_URL.create();
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
          noDataText="No event types match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default EventTypeList;
