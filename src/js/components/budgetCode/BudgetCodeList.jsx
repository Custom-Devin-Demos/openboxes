import React, { useMemo, useState } from 'react';

import { BUDGET_CODE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { BUDGET_CODE_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const BudgetCodeList = () => {
  useTranslation('budgetCode');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '' });
  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.q ? { q: filterParams.q } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: BUDGET_CODE_API,
    errorMessageId: 'react.budgetCode.error.budgetCodeList.label',
    defaultErrorMessage: 'Unable to fetch budget codes',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.budgetCode.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      width: 80,
      Cell: (row) => (
        <TableCell {...row}>
          {row.original.active
            ? <Translate id="react.default.yes.label" defaultMessage="Yes" />
            : <Translate id="react.default.no.label" defaultMessage="No" />}
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.budgetCode.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={BUDGET_CODE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.budgetCode.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.budgetCode.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.budgetCode.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.budgetCode.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.budgetCode.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.budgetCode.header.label',
          defaultMessage: 'Budget Code List',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.budgetCode.createBudgetCode.label"
              defaultLabel="Create Budget Code"
              onClick={() => {
                window.location = BUDGET_CODE_URL.create();
              }}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <ListTableWrapper>
        <form
          className="d-flex align-items-center gap-8 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            setFilterParams({ q: searchTerm });
          }}
        >
          <input
            type="text"
            name="q"
            className="form-control w-25 mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            type="submit"
            label="react.default.button.find.label"
            defaultLabel="Find"
          />
        </form>
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
          noDataText="No budget codes match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default BudgetCodeList;
