import React, { useMemo, useState } from 'react';

import { GL_ACCOUNT_TYPE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { GL_ACCOUNT_TYPE_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const GlAccountTypeList = () => {
  useTranslation('glAccountType');
  const [filterParams] = useState({ initialized: true });
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
    url: GL_ACCOUNT_TYPE_API,
    errorMessageId: 'react.glAccountType.error.glAccountTypeList.label',
    defaultErrorMessage: 'Unable to fetch GL account types',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.glAccountType.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={GL_ACCOUNT_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.glAccountType.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccountType.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccountType.column.glAccountTypeCode.label" defaultMessage="GL Account Type Code" />,
      accessor: 'glAccountTypeCode',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.glAccountType.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.glAccountType.column.lastUpdated.label" defaultMessage="Date Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.glAccountType.header.label',
          defaultMessage: 'GL Account Types List',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.glAccountType.createGlAccountType.label"
              defaultLabel="Create GL Account Type"
              onClick={() => {
                window.location = GL_ACCOUNT_TYPE_URL.create();
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
          noDataText="No GL account types match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default GlAccountTypeList;
