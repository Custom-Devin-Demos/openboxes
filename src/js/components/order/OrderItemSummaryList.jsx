import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { fetchPurchaseOrderStatuses } from 'actions';
import { ORDER_ITEM_SUMMARIES } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import { ORDER_URL } from 'consts/applicationUrls';
import useTableData from 'hooks/list-pages/useTableData';
import useTranslation from 'hooks/useTranslation';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

const OrderItemSummaryList = ({ derivedStatuses, fetchStatuses }) => {
  const location = useLocation();
  const isDetailsMode = location.pathname.includes('orderItemDetails');

  const [orderNumber, setOrderNumber] = useState('');
  const [derivedStatus, setDerivedStatus] = useState([]);
  const [filterParams, setFilterParams] = useState({ mode: isDetailsMode ? 'details' : 'summary' });

  useTranslation('order', 'reactTable');

  useEffect(() => {
    if (!derivedStatuses.length) {
      fetchStatuses();
    }
  }, []);

  const getParams = ({ offset, state }) => ({
    offset: `${offset}`,
    max: `${state.pageSize}`,
    mode: filterParams.mode,
    ...(filterParams.orderNumber ? { orderNumber: filterParams.orderNumber } : {}),
    ...(filterParams.derivedStatus?.length
      ? { derivedStatus: filterParams.derivedStatus.map(({ value }) => value) }
      : {}),
  });

  const {
    tableRef,
    loading,
    onFetchHandler,
    tableData,
  } = useTableData({
    filterParams,
    url: ORDER_ITEM_SUMMARIES,
    errorMessageId: 'react.order.error.orderItemSummaryList.label',
    defaultErrorMessage: 'Unable to fetch order item summaries',
    defaultSorting: {},
    getParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    setFilterParams({
      mode: isDetailsMode ? 'details' : 'summary',
      orderNumber,
      derivedStatus,
    });
  };

  const onClear = () => {
    setOrderNumber('');
    setDerivedStatus([]);
    setFilterParams({ mode: isDetailsMode ? 'details' : 'summary' });
  };

  const columns = useMemo(() => [
    {
      Header: <Translate id="react.order.column.orderItemId.label" defaultMessage="Order Item ID" />,
      accessor: 'id',
      minWidth: 220,
      sortable: false,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.order.column.orderNumber.label" defaultMessage="Order Number" />,
      accessor: 'orderNumber',
      minWidth: 130,
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={row.original.orderId ? ORDER_URL.show(row.original.orderId) : undefined}
        />
      ),
    },
    {
      Header: <Translate id="react.order.column.productCode.label" defaultMessage="Product Code" />,
      accessor: 'productCode',
      minWidth: 110,
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.orderItemStatus.label" defaultMessage="Order Item Status" />,
      accessor: 'orderItemStatus',
      minWidth: 130,
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.quantityOrdered.label" defaultMessage="Quantity Ordered" />,
      accessor: 'quantityOrdered',
      className: 'text-right',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.quantityShipped.label" defaultMessage="Quantity Shipped" />,
      accessor: 'quantityShipped',
      className: 'text-right',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.quantityReceived.label" defaultMessage="Quantity Received" />,
      accessor: 'quantityReceived',
      className: 'text-right',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.quantityCanceled.label" defaultMessage="Quantity Canceled" />,
      accessor: 'quantityCanceled',
      className: 'text-right',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.quantityInvoiced.label" defaultMessage="Quantity Invoiced" />,
      accessor: 'quantityInvoiced',
      className: 'text-right',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.isItemFullyShipped.label" defaultMessage="Is fully shipped" />,
      accessor: 'isItemFullyShipped',
      sortable: false,
      Cell: (row) => <TableCell {...row} value={row.value != null ? `${row.value}` : ''} />,
    },
    {
      Header: <Translate id="react.order.column.isItemFullyReceived.label" defaultMessage="Is fully Received" />,
      accessor: 'isItemFullyReceived',
      sortable: false,
      Cell: (row) => <TableCell {...row} value={row.value != null ? `${row.value}` : ''} />,
    },
    {
      Header: <Translate id="react.order.column.isItemFullyInvoiced.label" defaultMessage="Is fully Invoiced" />,
      accessor: 'isItemFullyInvoiced',
      sortable: false,
      Cell: (row) => <TableCell {...row} value={row.value != null ? `${row.value}` : ''} />,
    },
    {
      Header: <Translate id="react.order.column.derivedStatus.label" defaultMessage="Derived Status" />,
      accessor: 'derivedStatus',
      minWidth: 150,
      sortable: false,
    },
  ], []);

  return (
    <div className="d-flex flex-column list-page-main">
      <div className="d-flex list-page-header">
        <span className="d-flex align-self-center title">
          <Translate id="react.order.orderItemSummary.label" defaultMessage="Order Item Summary" />
        </span>
      </div>
      <div className="d-flex flex-column list-page-filters">
        <form onSubmit={onSearch} className="p-3 d-flex align-items-end">
          <div className="mr-3" style={{ minWidth: '250px' }}>
            <label htmlFor="orderNumber">
              <Translate id="react.order.orderNumber.label" defaultMessage="Order Number" />
            </label>
            <input
              id="orderNumber"
              name="orderNumber"
              className="form-control"
              value={orderNumber}
              placeholder="Search by order number"
              onChange={(event) => setOrderNumber(event.target.value)}
            />
          </div>
          {!isDetailsMode && (
            <div className="mr-3" style={{ minWidth: '250px' }}>
              <label htmlFor="derivedStatus">
                <Translate id="react.order.derivedStatus.label" defaultMessage="Derived Status" />
              </label>
              <Select
                id="derivedStatus"
                name="derivedStatus"
                multi
                options={derivedStatuses}
                value={derivedStatus}
                onChange={(value) => setDerivedStatus(value || [])}
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary mr-2" name="search" value="true">
            <Translate id="react.default.button.search.label" defaultMessage="Search" />
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onClear}>
            <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
          </button>
        </form>
      </div>
      <div className="list-page-list-section">
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
          NoDataComponent={() => (
            <div className="rt-noData" data-testid="empty-table">
              <Translate id="react.order.empty.label" defaultMessage="There are no orders that match the given criteria" />
            </div>
          )}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  derivedStatuses: state.purchaseOrder.statuses,
});

export default connect(mapStateToProps, {
  fetchStatuses: fetchPurchaseOrderStatuses,
})(OrderItemSummaryList);

OrderItemSummaryList.propTypes = {
  derivedStatuses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
  })).isRequired,
  fetchStatuses: PropTypes.func.isRequired,
};
