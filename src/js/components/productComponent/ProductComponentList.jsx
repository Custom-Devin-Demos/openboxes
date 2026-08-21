import React, { useMemo, useState } from 'react';

import { PRODUCT_COMPONENT_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_COMPONENT_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductComponentList = () => {
  useTranslation('productComponent', 'default');
  const [filterParams] = useState({ q: '' });

  const getParams = ({ offset, state }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: PRODUCT_COMPONENT_API,
    errorMessageId: 'react.productComponent.error.productComponentList.label',
    defaultErrorMessage: 'Unable to fetch product components',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productComponent.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productComponent.column.assemblyProduct.label" defaultMessage="Assembly Product" />,
      accessor: 'assemblyProduct.name',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productComponent.column.componentProduct.label" defaultMessage="Component Product" />,
      accessor: 'componentProduct.name',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productComponent.column.quantity.label" defaultMessage="Quantity" />,
      accessor: 'quantity',
      sortable: false,
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productComponent.column.unitOfMeasure.label" defaultMessage="Unit Of Measure" />,
      accessor: 'unitOfMeasure',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productComponent.header.label',
          defaultMessage: 'ProductComponent List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productComponent.listProductComponents.label"
            defaultLabel="ProductComponent List"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_COMPONENT_URL.index();
            }}
          />
          <Button
            label="react.productComponent.addProductComponent.label"
            defaultLabel="Add ProductComponent"
            onClick={() => {
              window.location = PRODUCT_COMPONENT_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <ListTableWrapper>
        <DataTable
          manual
          ref={tableRef}
          columns={columns}
          data={tableData.data}
          loading={loading}
          defaultPageSize={10}
          pages={tableData.pages}
          totalData={tableData.totalCount}
          onFetchData={onFetchHandler}
          noDataText="No product components match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductComponentList;
