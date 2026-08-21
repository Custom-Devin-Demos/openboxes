import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { ORDER_SUMMARY } from 'api/urls';
import { ORDER_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';

const OrderSummary = ({ orderId, onFetchedOrder }) => {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      apiClient.get(ORDER_SUMMARY(orderId))
        .then((response) => {
          setOrder(response.data.data);
          if (onFetchedOrder) {
            onFetchedOrder(response.data.data);
          }
        });
    }
  }, [orderId]);

  if (!order) {
    return null;
  }

  return (
    <div id="order-summary" className="summary p-3">
      <div className="title">
        <small className="font-weight-bold">{order.orderNumber}</small>
        &nbsp;
        <a href={ORDER_URL.show(order.id)}>{order.name || order.orderNumber}</a>
        &nbsp;
        {order.derivedStatus
          && <span className="tag" data-testid="status">{order.derivedStatus}</span>}
      </div>
    </div>
  );
};

export default OrderSummary;

OrderSummary.propTypes = {
  orderId: PropTypes.string.isRequired,
  onFetchedOrder: PropTypes.func,
};

OrderSummary.defaultProps = {
  onFetchedOrder: undefined,
};
