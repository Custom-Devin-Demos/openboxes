import React, { useMemo, useState } from 'react';

import { USER_LIST } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { USER_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const statusOptions = [
  { id: '', value: '', label: 'All users' },
  { id: 'true', value: 'true', label: 'Active users only' },
  { id: 'false', value: 'false', label: 'Inactive users only' },
];

const UserList = () => {
  useTranslation('user', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [filterParams, setFilterParams] = useState({ q: '', status: '' });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.q ? { q: filterParams.q } : {}),
    ...(filterParams.status ? { status: filterParams.status } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: USER_LIST,
    errorMessageId: 'react.user.error.userList.label',
    defaultErrorMessage: 'Unable to fetch users',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      q: searchTerm,
      status: selectedStatus?.id ?? '',
    });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.user.active.label" defaultMessage="Active" />,
      accessor: 'active',
      minWidth: 80,
      Cell: (row) => (
        <TableCell {...row}>
          {row.original.active
            ? <Translate id="react.default.yes.label" defaultMessage="Yes" />
            : <Translate id="react.default.no.label" defaultMessage="No" />}
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.user.username.label" defaultMessage="Username" />,
      accessor: 'username',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={USER_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.user.name.label" defaultMessage="Name" />,
      accessor: 'name',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.user.email.label" defaultMessage="Email" />,
      accessor: 'email',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.user.locale.label" defaultMessage="Locale" />,
      accessor: 'locale',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.user.roles.label" defaultMessage="Roles" />,
      accessor: 'roles',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.user.lastLoginDate.label" defaultMessage="Last Login" />,
      accessor: 'lastLoginDate',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.user.listUsers.label',
          defaultMessage: 'User List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.user.createUser.header.label"
            defaultLabel="Create User"
            onClick={() => { window.location = USER_URL.create(); }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2">
          <label htmlFor="user-search">
            <Translate id="react.default.button.search.label" defaultMessage="Search" />
          </label>
          <input
            id="user-search"
            data-testid="user-search-field"
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="d-flex flex-column mr-2" style={{ minWidth: '250px' }} data-testid="user-status-select">
          <SelectField
            title={{ id: 'react.user.status.label', defaultMessage: 'Status' }}
            name="status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(selected) => setSelectedStatus(selected)}
          />
        </div>
        <Button
          type="submit"
          label="react.default.button.search.label"
          defaultLabel="Search"
        />
      </form>
      <ListTableWrapper>
        <DataTable
          manual
          sortable
          ref={tableRef}
          columns={columns}
          data={tableData.data}
          loading={loading}
          defaultPageSize={15}
          pages={tableData.pages}
          totalData={tableData.totalCount}
          onFetchData={onFetchHandler}
          noDataText="No users returned"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default UserList;
