import React, { useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { TRANSACTION_ENTRY_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { TRANSACTION_ENTRY_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TransactionEntryList = () => {
  useTranslation('transactionEntry', 'default');
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
    url: TRANSACTION_ENTRY_API,
    errorMessageId: 'react.transactionEntry.error.transactionEntryList.label',
    defaultErrorMessage: 'Unable to fetch transaction entries',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.transactionEntry.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={TRANSACTION_ENTRY_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.transactionEntry.column.inventoryItem.label" defaultMessage="Inventory Item" />,
      accessor: 'inventoryItem',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.transactionEntry.column.quantity.label" defaultMessage="Quantity" />,
      accessor: 'quantity',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.transactionEntry.column.comments.label" defaultMessage="Comments" />,
      accessor: 'comments',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.transactionEntry.column.transaction.label" defaultMessage="Transaction" />,
      accessor: 'transaction',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.transactionEntry.header.label',
          defaultMessage: 'Transaction Entry List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.transactionEntry.addTransactionEntry.label"
            defaultLabel="Add transactionEntry"
            onClick={() => history.push(TRANSACTION_ENTRY_URL.create())}
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
          noDataText="No transaction entries match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default TransactionEntryList;
