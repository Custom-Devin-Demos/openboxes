import React, { useMemo, useState } from 'react';

import { PRODUCT_GROUP_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_GROUP_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductGroupList = () => {
  useTranslation('productGroup', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '' });

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
    url: PRODUCT_GROUP_API,
    errorMessageId: 'react.productGroup.error.productGroupList.label',
    defaultErrorMessage: 'Unable to fetch product groups',
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchTerm });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productGroup.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          value={row.original.name || row.original.id}
          link={PRODUCT_GROUP_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.productGroup.column.category.label" defaultMessage="Category" />,
      accessor: 'category.name',
      sortable: false,
      minWidth: 200,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productGroup.column.products.label" defaultMessage="Products" />,
      accessor: 'productCount',
      sortable: false,
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productGroup.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 180,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productGroup.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 180,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productGroup.header.label',
          defaultMessage: 'Product Groups',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productGroup.listProductGroups.label"
            defaultLabel="List Product Groups"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_GROUP_URL.list();
            }}
          />
          <Button
            label="react.productGroup.addProductGroup.label"
            defaultLabel="Add Product Group"
            onClick={() => {
              window.location = PRODUCT_GROUP_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2">
          <label htmlFor="product-group-search">
            <Translate id="react.default.search.label" defaultMessage="Search" />
          </label>
          <input
            id="product-group-search"
            data-testid="product-group-search-field"
            type="text"
            className="form-control"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          label="react.default.search.label"
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
          defaultPageSize={10}
          pages={tableData.pages}
          totalData={tableData.totalCount}
          onFetchData={onFetchHandler}
          noDataText="No product groups match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductGroupList;
