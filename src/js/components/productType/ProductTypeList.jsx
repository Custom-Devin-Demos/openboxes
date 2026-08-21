import React, { useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { PRODUCT_TYPE_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_TYPE_URL } from 'consts/applicationUrls';
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

const ProductTypeList = () => {
  useTranslation('productType', 'default');
  const history = useHistory();

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
    url: PRODUCT_TYPE_API,
    errorMessageId: 'react.productType.error.productTypeList.label',
    defaultErrorMessage: 'Unable to fetch product types',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productType.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PRODUCT_TYPE_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.productType.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productType.column.productTypeCode.label" defaultMessage="Product Type Code" />,
      accessor: 'productTypeCode',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productType.column.productIdentifierFormat.label" defaultMessage="Product Identifier Format" />,
      accessor: 'productIdentifierFormat',
      minWidth: 180,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productType.column.sequenceNumber.label" defaultMessage="Sequence Number" />,
      accessor: 'sequenceNumber',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.productType.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.productType.column.lastUpdated.label" defaultMessage="Last Updated" />,
      accessor: 'lastUpdated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productType.header.label',
          defaultMessage: 'ProductType List',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productType.listProductTypes.label"
            defaultLabel="List product types"
            variant="secondary"
            onClick={() => history.push(PRODUCT_TYPE_URL.list())}
          />
          <Button
            label="react.productType.addProductType.label"
            defaultLabel="Add product type"
            onClick={() => history.push(PRODUCT_TYPE_URL.create())}
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
          noDataText="No product types match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductTypeList;
