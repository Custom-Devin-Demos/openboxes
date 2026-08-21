import React, { useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { PARTY_TYPE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_TYPE_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyTypeList = () => {
  useTranslation('partyType', 'default');
  const history = useHistory();

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
    filterParams: { q: '' },
    url: PARTY_TYPE_API,
    errorMessageId: 'react.partyType.error.partyTypeList.label',
    defaultErrorMessage: 'Unable to fetch party types',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.partyType.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PARTY_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.partyType.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.partyType.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.partyType.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.partyType.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.partyType.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.partyType.column.partyTypeCode.label" defaultMessage="Party Type Code" />,
      accessor: 'partyTypeCode',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.partyType.header.label',
          defaultMessage: 'PartyType List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyType.listPartyTypes.label"
            defaultLabel="List party types"
            variant="secondary"
            onClick={() => history.push(PARTY_TYPE_URL.list())}
          />
          <Button
            label="react.partyType.addPartyType.label"
            defaultLabel="Add party type"
            onClick={() => history.push(PARTY_TYPE_URL.create())}
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
          noDataText="No party types match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default PartyTypeList;
