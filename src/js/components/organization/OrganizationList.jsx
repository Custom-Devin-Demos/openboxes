import React, { useMemo, useState } from 'react';

import { ORGANIZATION_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ORGANIZATION_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ORGANIZATION_ROLE_TYPES = [
  'ROLE_ORGANIZATION',
  'ROLE_BUYER',
  'ROLE_CARRIER',
  'ROLE_SUPPLIER',
  'ROLE_MANUFACTURER',
  'ROLE_DISTRIBUTOR',
  'ROLE_DONOR',
  'ROLE_SHIPPING_AGENT',
  'ROLE_CLEARING_AGENT',
  'ROLE_CUSTOMER',
  'ROLE_PURCHASER',
  'ROLE_REQUESTOR',
];

const roleTypeOptions = ORGANIZATION_ROLE_TYPES.map((roleType) => ({
  id: roleType,
  value: roleType,
  label: roleType,
}));

const OrganizationList = () => {
  useTranslation('organization', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleTypes, setSelectedRoleTypes] = useState([]);
  const [filterParams, setFilterParams] = useState({ q: '', roleType: [] });

  const getParams = ({ offset, state, sortingParams }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...sortingParams,
    ...(filterParams.q ? { q: filterParams.q } : {}),
    ...(filterParams.roleType?.length ? { roleType: filterParams.roleType } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: ORGANIZATION_API,
    errorMessageId: 'react.organization.error.organizationList.label',
    defaultErrorMessage: 'Unable to fetch organizations',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      q: searchTerm,
      roleType: (selectedRoleTypes || []).map((option) => option.id),
    });
  };

  const downloadParams = new URLSearchParams([
    ...(filterParams.q ? [['q', filterParams.q]] : []),
    ...(filterParams.roleType || []).map((roleType) => ['roleType', roleType]),
  ]).toString();

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.organization.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      minWidth: 80,
      Cell: (row) => (row.original.active !== false
        ? <Translate id="react.default.yes.label" defaultMessage="Yes" />
        : <Translate id="react.default.no.label" defaultMessage="No" />),
    },
    {
      Header: <Translate id="react.organization.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORGANIZATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.organization.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 100,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORGANIZATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.organization.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORGANIZATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.organization.column.defaultLocation.label" defaultMessage="Default Location" />,
      accessor: 'defaultLocation.name',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.organization.column.roles.label" defaultMessage="Roles" />,
      accessor: 'roles',
      sortable: false,
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          value={(row.original.roles || []).map((role) => role.roleType || role.name || role).join(',')}
        />
      ),
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.organization.header.label',
          defaultMessage: 'Organizations',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.organization.listOrganizations.label"
            defaultLabel="List Organizations"
            variant="secondary"
            onClick={() => {
              window.location = ORGANIZATION_URL.list();
            }}
          />
          <Button
            label="react.organization.createOrganization.label"
            defaultLabel="Add Organization"
            onClick={() => {
              window.location = ORGANIZATION_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2">
          <label htmlFor="organization-search">
            <Translate id="react.default.search.label" defaultMessage="Search" />
          </label>
          <input
            id="organization-search"
            data-testid="organization-search-field"
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="d-flex flex-column mr-2" style={{ minWidth: '250px' }} data-testid="role-type-select">
          <SelectField
            title={{ id: 'react.organization.roleType.label', defaultMessage: 'Role Type' }}
            name="roleType"
            multiple
            options={roleTypeOptions}
            value={selectedRoleTypes}
            onChange={(selected) => setSelectedRoleTypes(selected || [])}
          />
        </div>
        <Button
          type="submit"
          label="react.default.search.label"
          defaultLabel="Search"
        />
        <a
          href={`${ORGANIZATION_URL.download()}${downloadParams ? `?${downloadParams}` : ''}`}
          className="btn btn-outline-secondary ml-2"
        >
          <Translate id="react.default.button.download.label" defaultMessage="Download" />
        </a>
      </form>
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
          noDataText="No organizations match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default OrganizationList;
