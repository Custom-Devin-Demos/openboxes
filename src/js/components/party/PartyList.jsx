import React, { useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { PARTY_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyList = () => {
  useTranslation('party', 'default');
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
    filterParams: {},
    url: PARTY_API,
    errorMessageId: 'react.party.error.partyList.label',
    defaultErrorMessage: 'Unable to fetch parties',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.party.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PARTY_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.party.column.partyType.label" defaultMessage="Party Type" />,
      accessor: 'partyType.name',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.party.header.label',
          defaultMessage: 'Party List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.party.listParties.label"
            defaultLabel="List parties"
            variant="secondary"
            onClick={() => history.push(PARTY_URL.list())}
          />
          <Button
            label="react.party.createParty.label"
            defaultLabel="Add party"
            onClick={() => history.push(PARTY_URL.create())}
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
          noDataText="No parties match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default PartyList;
