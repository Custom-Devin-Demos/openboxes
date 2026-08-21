import React, { useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { PARTY_ROLE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_ROLE_URL } from 'consts/applicationUrls';
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

const PartyRoleList = () => {
  useTranslation('partyRole', 'default');
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
    filterParams,
    url: PARTY_ROLE_API,
    errorMessageId: 'react.partyRole.error.partyRoleList.label',
    defaultErrorMessage: 'Unable to fetch party roles',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.partyRole.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PARTY_ROLE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.partyRole.column.party.label" defaultMessage="Party" />,
      accessor: 'party.name',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.partyRole.column.roleType.label" defaultMessage="Role Type" />,
      accessor: 'roleType',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.partyRole.column.startDate.label" defaultMessage="Start Date" />,
      accessor: 'startDate',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.partyRole.column.endDate.label" defaultMessage="End Date" />,
      accessor: 'endDate',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.partyRole.header.label',
          defaultMessage: 'PartyRole List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyRole.listPartyRoles.label"
            defaultLabel="List party roles"
            variant="secondary"
            onClick={() => history.push(PARTY_ROLE_URL.list())}
          />
          <Button
            label="react.partyRole.addPartyRole.label"
            defaultLabel="Add party role"
            onClick={() => history.push(PARTY_ROLE_URL.create())}
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
          noDataText="No party roles match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default PartyRoleList;
