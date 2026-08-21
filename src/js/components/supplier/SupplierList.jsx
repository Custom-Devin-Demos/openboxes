import React, { useMemo, useState } from 'react';

import { stringifyUrl } from 'query-string';

import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import {
  LOCATION_URL,
  PURCHASE_ORDER_URL,
  STOCK_MOVEMENT_URL,
  SUPPLIER_URL,
} from 'consts/applicationUrls';
import useSupplierListTableData from 'hooks/list-pages/supplier/useSupplierListTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableTitleWrapper from 'wrappers/ListTableTitleWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

// Matches ShipmentStatusCode.listPending() used by the legacy supplier list
const PENDING_RECEIPT_STATUS_CODES = ['CREATED', 'PENDING', 'SHIPPED', 'PARTIALLY_RECEIVED'];

const pendingShipmentsUrl = (supplierId) => stringifyUrl({
  url: STOCK_MOVEMENT_URL.list(),
  query: {
    direction: 'INBOUND',
    origin: supplierId,
    destination: '',
    receiptStatusCode: PENDING_RECEIPT_STATUS_CODES,
  },
});

const SupplierList = () => {
  useTranslation('supplierList', 'default');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({ q: '' });

  const {
    tableRef,
    tableData,
    onFetchHandler,
    loading,
  } = useSupplierListTableData(filterParams);

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({ q: searchTerm });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.supplierList.column.supplierOrganization.label" defaultMessage="Supplier Organization" />,
      accessor: 'organization',
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          value={row.value?.name}
          link={SUPPLIER_URL.show(row.original.organization?.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.supplierList.column.supplierLocation.label" defaultMessage="Supplier Location" />,
      accessor: 'name',
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={LOCATION_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.supplierList.column.openPurchaseOrders.label" defaultMessage="No. of Open POs" />,
      accessor: 'pendingOrdersCount',
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={PURCHASE_ORDER_URL.list({ origin: row.original.id, destination: '' })}
        />
      ),
    },
    {
      Header: <Translate id="react.supplierList.column.openShipments.label" defaultMessage="No. of Open Shipments" />,
      accessor: 'pendingShipmentsCount',
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={pendingShipmentsUrl(row.original.id)}
        />
      ),
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.supplierList.header.label',
          defaultMessage: 'Suppliers',
        }}
        />
      </HeaderWrapper>
      <form className="d-flex align-items-end p-2" onSubmit={onSearch}>
        <div className="d-flex flex-column mr-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <label htmlFor="supplier-search">
            <Translate id="react.supplierList.search.label" defaultMessage="Search" />
          </label>
          <input
            id="supplier-search"
            type="text"
            className="form-control"
            placeholder="Search by organization name or location name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          label="react.supplierList.search.button.label"
          defaultLabel="Search"
        />
      </form>
      <ListTableWrapper>
        <ListTableTitleWrapper>
          <span>
            <Translate id="react.supplierList.searchResults.label" defaultMessage="Search results" />
            &nbsp;
            (
            {tableData?.totalCount}
            )
          </span>
        </ListTableTitleWrapper>
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
          noDataText="No suppliers match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default SupplierList;
