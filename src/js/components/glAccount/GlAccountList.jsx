import React, { useMemo } from 'react';

import { GL_ACCOUNT_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { GL_ACCOUNT_URL } from 'consts/applicationUrls';
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

const GlAccountList = () => {
  useTranslation('glAccount');
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
    url: GL_ACCOUNT_API,
    errorMessageId: 'react.glAccount.error.glAccountList.label',
    defaultErrorMessage: 'Unable to fetch GL accounts',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.glAccount.column.active.label" defaultMessage="Active" />,
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
      Header: <Translate id="react.glAccount.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={GL_ACCOUNT_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.glAccount.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccount.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccount.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccount.column.glAccountType.label" defaultMessage="GL Account Type" />,
      accessor: 'glAccountType.code',
      minWidth: 150,
      sortable: false,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.glAccount.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.glAccount.column.lastUpdated.label" defaultMessage="Date Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.glAccount.header.label',
          defaultMessage: 'GL Accounts List',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.glAccount.createGlAccount.label"
              defaultLabel="Create GL Account"
              onClick={() => {
                window.location = GL_ACCOUNT_URL.create();
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
          noDataText="No GL accounts match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default GlAccountList;
