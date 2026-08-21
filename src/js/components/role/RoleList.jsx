import React, { useMemo } from 'react';

import { ROLES } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ROLE_URL } from 'consts/applicationUrls';
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

const RoleList = () => {
  useTranslation('role');

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
    url: ROLES,
    errorMessageId: 'react.role.error.roleList.label',
    defaultErrorMessage: 'Unable to fetch roles',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.role.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ROLE_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.role.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.role.column.roleType.label" defaultMessage="Role Type" />,
      accessor: 'roleType',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.role.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.role.listRoles.label',
          defaultMessage: 'Role List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.role.createRole.header.label"
            defaultLabel="Create Role"
            onClick={() => {
              window.location = ROLE_URL.create();
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
          noDataText="No roles match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default RoleList;
