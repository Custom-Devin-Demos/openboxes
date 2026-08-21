import React, { useMemo, useState } from 'react';

import { SHIPMENT_ITEM_API } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import DateCell from 'components/DataTable/DateCell';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { SHIPMENT_ITEM_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ShipmentItemList = () => {
  useTranslation('shipmentItem', 'default');
  const [filterParams] = useState({ q: '' });

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
    url: SHIPMENT_ITEM_API,
    errorMessageId: 'react.shipmentItem.error.shipmentItemList.label',
    defaultErrorMessage: 'Unable to fetch shipment items',
    getParams,
  });

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.shipmentItem.column.id.label" defaultMessage="Id" />,
      accessor: 'id',
      minWidth: 250,
      Cell: (row) => (
        <TableCell
          {...row}
          link={SHIPMENT_ITEM_URL.edit(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.shipmentItem.column.container.label" defaultMessage="Container" />,
      accessor: 'container.name',
      sortable: false,
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.shipmentItem.column.product.label" defaultMessage="Product" />,
      accessor: 'product.name',
      sortable: false,
      minWidth: 250,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.shipmentItem.column.lotNumber.label" defaultMessage="Lot Number" />,
      accessor: 'lotNumber',
      minWidth: 150,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.shipmentItem.column.expirationDate.label" defaultMessage="Expiration Date" />,
      accessor: 'expirationDate',
      minWidth: 150,
      Cell: (row) => <DateCell {...row} />,
    },
    {
      Header: <Translate id="react.shipmentItem.column.quantity.label" defaultMessage="Quantity" />,
      accessor: 'quantity',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} value={row.value != null ? String(row.value) : ''} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.shipmentItem.header.label',
          defaultMessage: 'Shipment Items',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.shipmentItem.createShipmentItem.label"
            defaultLabel="Add Shipment Item"
            onClick={() => {
              window.location = SHIPMENT_ITEM_URL.create();
            }}
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
          noDataText="No shipment items match the given criteria"
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default ShipmentItemList;
