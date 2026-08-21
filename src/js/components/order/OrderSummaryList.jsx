import React, { useEffect, useMemo, useState } from 'react';

import { ORDER_SUMMARIES, ORDER_SUMMARY_STATUS_OPTIONS } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ORDER_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import ListTableWrapper from 'wrappers/ListTableWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const initialFilterValues = {
  orderNumber: '',
  orderStatus: [],
  shipmentStatus: [],
  receiptStatus: [],
  paymentStatus: [],
  derivedStatus: [],
};

const OrderSummaryList = () => {
  useTranslation('orderSummaryList');

  const [filterValues, setFilterValues] = useState(initialFilterValues);
  const [filterParams, setFilterParams] = useState({ initialized: true });
  const [statusOptions, setStatusOptions] = useState({
    orderStatuses: [],
    shipmentStatuses: [],
    receiptStatuses: [],
    paymentStatuses: [],
    derivedStatuses: [],
  });

  useEffect(() => {
    apiClient.get(ORDER_SUMMARY_STATUS_OPTIONS)
      .then((response) => {
        setStatusOptions(response.data.data);
      });
  }, []);

  const getParams = ({ offset, state }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    ...(filterParams.orderNumber ? { orderNumber: filterParams.orderNumber } : {}),
    ...(filterParams.orderStatus?.length ? { orderStatus: filterParams.orderStatus } : {}),
    ...(filterParams.shipmentStatus?.length ? { shipmentStatus: filterParams.shipmentStatus } : {}),
    ...(filterParams.receiptStatus?.length ? { receiptStatus: filterParams.receiptStatus } : {}),
    ...(filterParams.paymentStatus?.length ? { paymentStatus: filterParams.paymentStatus } : {}),
    ...(filterParams.derivedStatus?.length ? { derivedStatus: filterParams.derivedStatus } : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: ORDER_SUMMARIES,
    errorMessageId: 'react.orderSummaryList.error.label',
    defaultErrorMessage: 'Unable to fetch order summaries',
    getParams,
  });

  const setFilterValue = (field) => (value) => (
    setFilterValues((prev) => ({ ...prev, [field]: value }))
  );

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      initialized: true,
      orderNumber: filterValues.orderNumber,
      orderStatus: filterValues.orderStatus?.map((it) => it.id),
      shipmentStatus: filterValues.shipmentStatus?.map((it) => it.id),
      receiptStatus: filterValues.receiptStatus?.map((it) => it.id),
      paymentStatus: filterValues.paymentStatus?.map((it) => it.id),
      derivedStatus: filterValues.derivedStatus?.map((it) => it.id),
    });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.orderSummaryList.column.orderNumber.label" defaultMessage="Order Number" />,
      accessor: 'orderNumber',
      minWidth: 150,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORDER_URL.show(row.original.id)}
        />
      ),
    },
    {
      Header: <Translate id="react.orderSummaryList.column.itemsOrdered.label" defaultMessage="Items Ordered" />,
      accessor: 'itemsOrdered',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.itemsShipped.label" defaultMessage="Items Shipped" />,
      accessor: 'itemsShipped',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.itemsReceived.label" defaultMessage="Items Received" />,
      accessor: 'itemsReceived',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.itemsInvoiced.label" defaultMessage="Items Invoiced" />,
      accessor: 'itemsInvoiced',
      minWidth: 100,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.orderStatus.label" defaultMessage="Order Status" />,
      accessor: 'orderStatus',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.shipmentStatus.label" defaultMessage="Shipment Status" />,
      accessor: 'shipmentStatus',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.receiptStatus.label" defaultMessage="Receipt Status" />,
      accessor: 'receiptStatus',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.paymentStatus.label" defaultMessage="Payment Status" />,
      accessor: 'paymentStatus',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
    {
      Header: <Translate id="react.orderSummaryList.column.derivedStatus.label" defaultMessage="Derived Status" />,
      accessor: 'derivedStatus',
      minWidth: 130,
      Cell: (row) => <TableCell {...row} />,
    },
  ], []);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.orderSummaryList.header.label',
          defaultMessage: 'Order Summary List',
        }}
        />
      </HeaderWrapper>
      <form onSubmit={onSearch} className="d-flex flex-wrap align-items-end gap-8 px-3 py-2">
        <div style={{ minWidth: '180px' }}>
          <TextInput
            title={{ id: 'react.orderSummaryList.filters.orderNumber.label', defaultMessage: 'Order Number' }}
            name="orderNumber"
            value={filterValues.orderNumber}
            onChange={(e) => setFilterValue('orderNumber')(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <SelectField
            title={{ id: 'react.orderSummaryList.filters.orderStatus.label', defaultMessage: 'Order Status' }}
            name="orderStatus"
            multiple
            options={statusOptions.orderStatuses}
            defaultValue={filterValues.orderStatus}
            onChange={setFilterValue('orderStatus')}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <SelectField
            title={{ id: 'react.orderSummaryList.filters.shipmentStatus.label', defaultMessage: 'Shipment Status' }}
            name="shipmentStatus"
            multiple
            options={statusOptions.shipmentStatuses}
            defaultValue={filterValues.shipmentStatus}
            onChange={setFilterValue('shipmentStatus')}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <SelectField
            title={{ id: 'react.orderSummaryList.filters.receiptStatus.label', defaultMessage: 'Receipt Status' }}
            name="receiptStatus"
            multiple
            options={statusOptions.receiptStatuses}
            defaultValue={filterValues.receiptStatus}
            onChange={setFilterValue('receiptStatus')}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <SelectField
            title={{ id: 'react.orderSummaryList.filters.paymentStatus.label', defaultMessage: 'Payment Status' }}
            name="paymentStatus"
            multiple
            options={statusOptions.paymentStatuses}
            defaultValue={filterValues.paymentStatus}
            onChange={setFilterValue('paymentStatus')}
          />
        </div>
        <div style={{ minWidth: '180px' }}>
          <SelectField
            title={{ id: 'react.orderSummaryList.filters.derivedStatus.label', defaultMessage: 'Derived Status' }}
            name="derivedStatus"
            multiple
            options={statusOptions.derivedStatuses}
            defaultValue={filterValues.derivedStatus}
            onChange={setFilterValue('derivedStatus')}
          />
        </div>
        <div className="mb-1">
          <Button
            type="submit"
            label="react.default.button.search.label"
            defaultLabel="Search"
          />
        </div>
      </form>
      <ListTableWrapper>
        <DataTable
          manual
          sortable={false}
          ref={tableRef}
          columns={columns}
          data={tableData.data}
          loading={loading}
          defaultPageSize={10}
          pages={tableData.pages}
          totalData={tableData.totalCount}
          onFetchData={onFetchHandler}
          noDataText="No order summaries match the given criteria"
          footerComponent={() => (
            <span className="title-text p-1 d-flex flex-1 justify-content-end" />
          )}
        />
      </ListTableWrapper>
    </PageWrapper>
  );
};

export default OrderSummaryList;
