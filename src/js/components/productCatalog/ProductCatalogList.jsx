import React, { useMemo } from 'react';

import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_CATALOG_URL } from 'consts/applicationUrls';
import RoleType from 'consts/roleType';
import useProductCatalogListTableData from 'hooks/list-pages/productCatalog/useProductCatalogListTableData';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductCatalogList = () => {
  useTranslation('productCatalog', 'default');

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
  } = useProductCatalogListTableData({});

  const isUserSuperuser = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_SUPERUSER,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.productCatalog.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 200,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PRODUCT_CATALOG_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.productCatalog.column.code.label" defaultMessage="Code" />,
      accessor: 'code',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.productCatalog.column.name.label" defaultMessage="Name" />,
      accessor: 'name',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PRODUCT_CATALOG_URL.show(row.original.id)}
          tooltip
        />
      ),
    },
    {
      Header: <Translate id="react.productCatalog.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 200,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.productCatalog.column.active.label" defaultMessage="Active" />,
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
      Header: <Translate id="react.productCatalog.column.color.label" defaultMessage="Color" />,
      accessor: 'color',
      minWidth: 80,
      Cell: (row) => (
        <TableCell {...row}>
          <span style={{ color: row.original.color }}>{row.original.color}</span>
        </TableCell>
      ),
    },
    {
      Header: <Translate id="react.productCatalog.column.dateCreated.label" defaultMessage="Date Created" />,
      accessor: 'dateCreated',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productCatalog.header.label',
          defaultMessage: 'Product Catalogs',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productCatalog.listProductCatalogs.label"
            defaultLabel="List Product Catalogs"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_CATALOG_URL.list();
            }}
          />
          {isUserSuperuser && (
            <Button
              label="react.productCatalog.createProductCatalog.label"
              defaultLabel="Create Product Catalog"
              onClick={() => {
                window.location = PRODUCT_CATALOG_URL.create();
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
          noDataText="No product catalogs match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ProductCatalogList;
