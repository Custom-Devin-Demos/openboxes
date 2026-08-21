import React, { useEffect, useMemo, useState } from 'react';

import productAssociationApi from 'api/services/ProductAssociationApi';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_ASSOCIATION_URL, PRODUCT_URL } from 'consts/applicationUrls';
import useProductAssociationListTableData from 'hooks/list-pages/productAssociation/useProductAssociationListTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductAssociationList = () => {
  useTranslation('productAssociation', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeCodes, setSelectedTypeCodes] = useState([]);
  const [typeCodeOptions, setTypeCodeOptions] = useState([]);
  const [filterParams, setFilterParams] = useState({ q: '', code: [] });

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
  } = useProductAssociationListTableData(filterParams);

  useEffect(() => {
    productAssociationApi.getProductAssociationTypeCodeOptions()
      .then((response) => {
        setTypeCodeOptions(response.data?.data ?? []);
      });
  }, []);

  const typeCodeLabels = useMemo(() => typeCodeOptions.reduce((acc, option) => ({
    ...acc,
    [option.id]: option.label,
  }), {}), [typeCodeOptions]);

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      q: searchTerm,
      code: selectedTypeCodes.map((option) => option.id),
    });
  };

  const productCell = (row, product) => (
    <TableCell
      {...row}
      value={product ? `${product.productCode} ${product.name}` : ''}
      link={product ? PRODUCT_URL.edit(product.id) : null}
      tooltip
    />
  );

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productAssociation.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PRODUCT_ASSOCIATION_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.productAssociation.column.code.label" defaultMessage="Type Code" />,
      accessor: 'code',
      minWidth: 120,
      Cell: (row) => (
        <TableCell
          {...row}
          value={typeCodeLabels[row.original.code] ?? row.original.code}
        />
      ),
    },
    {
      Header: <Translate id="react.productAssociation.column.product.label" defaultMessage="Product" />,
      accessor: 'product',
      minWidth: 200,
      Cell: (row) => productCell(row, row.original.product),
    },
    {
      Header: <Translate id="react.productAssociation.column.associatedProduct.label" defaultMessage="Associated Product" />,
      accessor: 'associatedProduct',
      minWidth: 200,
      Cell: (row) => productCell(row, row.original.associatedProduct),
    },
    {
      Header: <Translate id="react.productAssociation.column.quantity.label" defaultMessage="Conversion" />,
      accessor: 'quantity',
      minWidth: 80,
    },
    {
      Header: <Translate id="react.productAssociation.column.comments.label" defaultMessage="Comments" />,
      accessor: 'comments',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.productAssociation.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], [typeCodeLabels]);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productAssociation.header.label',
          defaultMessage: 'Product Associations',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productAssociation.listProductAssociations.label"
            defaultLabel="List Product Associations"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.list();
            }}
          />
          <Button
            label="react.productAssociation.addProductAssociation.label"
            defaultLabel="Add Product Association"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.create();
            }}
          />
          <Button
            label="react.productAssociation.exportProductAssociations.label"
            defaultLabel="Export Product Associations"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.export();
            }}
          />
          <Button
            label="react.productAssociation.importProductAssociations.label"
            defaultLabel="Import Product Associations"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.import();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <ListTableWrapper>
        <form
          className="d-flex align-items-center gap-8 p-2"
          onSubmit={onSearch}
        >
          <label htmlFor="q" className="mb-0 mr-2">
            <Translate id="react.productAssociation.search.product.label" defaultMessage="Product" />
          </label>
          <input
            id="q"
            type="text"
            name="q"
            className="form-control w-25 mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="w-25 mr-2">
            <SelectField
              multiple
              placeholder="Type Code"
              options={typeCodeOptions}
              value={selectedTypeCodes}
              onChange={(value) => setSelectedTypeCodes(value ?? [])}
            />
          </div>
          <Button
            type="submit"
            label="react.default.button.search.label"
            defaultLabel="Search"
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
          noDataText="No product associations match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductAssociationList;
