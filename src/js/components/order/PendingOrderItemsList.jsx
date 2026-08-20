import React, { useEffect, useMemo, useState } from 'react';

import { ORDER_PENDING_ORDER_ITEMS } from 'api/urls';
import DataTable, { TableCell } from 'components/DataTable';
import { ORDER_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const PendingOrderItemsList = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useTranslation('order', 'reactTable');

  useEffect(() => {
    apiClient.get(ORDER_PENDING_ORDER_ITEMS)
      .then((response) => setOrderItems(response.data.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo(() => [
    {
      Header: ' ',
      width: 50,
      sortable: false,
      Cell: () => <span />,
    },
    {
      Header: <Translate id="react.order.column.order.label" defaultMessage="Order" />,
      accessor: 'orderName',
      minWidth: 250,
      sortable: false,
      Cell: (row) => (
        <TableCell
          {...row}
          link={ORDER_URL.show(row.original.orderId)}
        />
      ),
    },
    {
      Header: <Translate id="react.order.column.description.label" defaultMessage="Description" />,
      accessor: 'description',
      minWidth: 300,
      sortable: false,
      Cell: (row) => <TableCell {...row} tooltip />,
    },
    {
      Header: <Translate id="react.order.column.quantity.label" defaultMessage="Qty" />,
      accessor: 'quantity',
      className: 'text-right',
      headerClassName: 'justify-content-end',
      sortable: false,
    },
    {
      Header: <Translate id="react.order.column.status.label" defaultMessage="Status" />,
      accessor: 'isCompletelyFulfilled',
      minWidth: 120,
      sortable: false,
      Cell: (row) => (
        <TableCell {...row}>
          {row.original.isCompletelyFulfilled
            ? <Translate id="react.order.complete.label" defaultMessage="Complete" />
            : <Translate id="react.order.pending.label" defaultMessage="Pending" />}
        </TableCell>
      ),
    },
  ], []);

  return (
    <div className="d-flex flex-column list-page-main">
      <div className="d-flex list-page-header">
        <span className="d-flex align-self-center title">
          <Translate id="react.order.listOrderItems.label" defaultMessage="List order items" />
        </span>
      </div>
      <div className="list-page-list-section">
        <DataTable
          manual
          sortable={false}
          columns={columns}
          data={orderItems}
          loading={loading}
          showPagination={false}
          pageSize={orderItems.length || 1}
          minRows={0}
          NoDataComponent={() => (
            <div className="rt-noData" data-testid="empty-table">
              <Translate id="react.order.noPendingItems.label" defaultMessage="No pending order items" />
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default PendingOrderItemsList;
