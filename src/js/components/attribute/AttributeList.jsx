import React, { useMemo, useState } from 'react';

import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ATTRIBUTE_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useAttributeListTableData from 'hooks/list-pages/attribute/useAttributeListTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableTitleWrapper from 'wrappers/ListTableTitleWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const AttributeList = () => {
  useTranslation('attribute', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '' });

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
  } = useAttributeListTableData(filterParams);

  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchTerm });
  };

  const booleanCell = (value) => (value
    ? <Translate id="react.default.boolean.true" defaultMessage="True" />
    : <Translate id="react.default.boolean.false" defaultMessage="False" />);

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.attribute.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      Cell: (row) => (
        <TableCell
          {...row}
          link={ATTRIBUTE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.attribute.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      Cell: (row) => (
        <TableCell
          {...row}
          link={ATTRIBUTE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.attribute.column.entityTypeCode.label" defaultMessage="Entity Type" />,
      accessor: 'entityTypeCode',
      sortable: false,
      Cell: (row) => (row.value
        ? (
          <Translate
            id={`react.attribute.entityTypeCode.${row.value}.label`}
            defaultMessage={row.value}
          />
        )
        : null),
    },
    {
      Header: <Translate id="react.attribute.column.options.label" defaultMessage="Options" />,
      accessor: 'options',
      sortable: false,
      Cell: (row) => (
        <span>
          {row.value?.length ?? 0}
          {' '}
          <Translate id="react.attribute.column.options.label" defaultMessage="Options" />
        </span>
      ),
    },
    {
      Header: <Translate id="react.attribute.column.active.label" defaultMessage="Active" />,
      accessor: 'active',
      Cell: (row) => booleanCell(row.value),
    },
    {
      Header: <Translate id="react.attribute.column.required.label" defaultMessage="Required" />,
      accessor: 'required',
      Cell: (row) => booleanCell(row.value),
    },
    {
      Header: <Translate id="react.attribute.column.allowOther.label" defaultMessage="Allow Free-Text" />,
      accessor: 'allowOther',
      Cell: (row) => booleanCell(row.value),
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.attribute.header.label',
          defaultMessage: 'Attributes',
        }}
        />
        <HeaderButtonsWrapper>
          {isUserAdmin && (
            <Button
              label="react.attribute.createAttribute.label"
              defaultLabel="Add attribute"
              onClick={() => {
                window.location = ATTRIBUTE_URL.create();
              }}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2">
          <label htmlFor="attribute-search">
            <Translate id="react.attribute.search.name.label" defaultMessage="Name" />
          </label>
          <input
            id="attribute-search"
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          label="react.attribute.search.button.label"
          defaultLabel="Search"
        />
      </form>
      <ListTableWrapper>
        <ListTableTitleWrapper>
          <span>
            <Translate id="react.attribute.header.label" defaultMessage="Attributes" />
            &nbsp;
            (
            {tableData?.totalCount}
            )
          </span>
        </ListTableTitleWrapper>
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
          noDataText="No attributes match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default AttributeList;
