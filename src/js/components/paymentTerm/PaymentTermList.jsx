import React, { useMemo } from 'react';

import { PAYMENT_TERM_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PAYMENT_TERM_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

// useTableData skips fetching when filterParams is empty,
// so pass a stable non-empty object for screens without filters
const filterParams = { initialized: true };

const PaymentTermList = () => {
  useTranslation('paymentTerm');
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
    url: PAYMENT_TERM_API,
    errorMessageId: 'react.paymentTerm.error.paymentTermList.label',
    defaultErrorMessage: 'Unable to fetch payment terms',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.paymentTerm.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PAYMENT_TERM_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.paymentTerm.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.paymentTerm.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.paymentTerm.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.paymentTerm.column.prepaymentPercent.label" defaultMessage="Prepayment percent" />,
      accessor: 'prepaymentPercent',
      minWidth: 150,
      Cell: (row) => (
        <TableCell {...row}>
          {row.original.prepaymentPercent != null
            ? `${row.original.prepaymentPercent}%`
            : ''}
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.paymentTerm.column.daysToPayment.label" defaultMessage="Days payment due after invoice" />,
      accessor: 'daysToPayment',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.paymentTerm.header.label',
          defaultMessage: 'Payment Terms List',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.paymentTerm.createPaymentTerm.label"
              defaultLabel="Create Payment Term"
              onClick={() => {
                window.location = PAYMENT_TERM_URL.create();
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
          noDataText="No payment terms match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default PaymentTermList;
