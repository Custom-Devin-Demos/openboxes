import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const PendingInboundTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getPendingInbound(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Type"><Translate id="react.stockCard.type.label" defaultMessage="Type" /></th>
            <th aria-label="Number"><Translate id="react.stockCard.number.label" defaultMessage="Number" /></th>
            <th aria-label="Name"><Translate id="react.stockCard.name.label" defaultMessage="Name" /></th>
            <th aria-label="Origin"><Translate id="react.stockCard.origin.label" defaultMessage="Origin" /></th>
            <th aria-label="Status"><Translate id="react.stockCard.status.label" defaultMessage="Status" /></th>
            <th aria-label="Ship Date"><Translate id="react.stockCard.shipDate.label" defaultMessage="Ship Date" /></th>
            <th aria-label="Quantity Purchased" className="text-right"><Translate id="react.stockCard.quantityPurchased.label" defaultMessage="Quantity Purchased" /></th>
            <th aria-label="Quantity Remaining" className="text-right"><Translate id="react.stockCard.quantityRemaining.label" defaultMessage="Quantity Remaining" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center">
                <Translate id="react.stockCard.noPendingInbound.message" defaultMessage="No pending inbound shipments" />
              </td>
            </tr>
          )}
          {data?.items?.map((item) => (
            <tr key={`${item.type}-${item.id}`}>
              <td>{item.type}</td>
              <td>{item.number}</td>
              <td>{item.name}</td>
              <td>{item.origin}</td>
              <td>{item.status}</td>
              <td>{formatDate(item.shipDate)}</td>
              <td className="text-right">{item.quantityPurchased}</td>
              <td className="text-right">{item.quantityRemaining}</td>
            </tr>
          ))}
        </tbody>
        {data?.items?.length > 0 && (
          <tfoot>
            <tr className="font-weight-bold">
              <td colSpan="6" className="text-right">
                <Translate id="react.stockCard.total.label" defaultMessage="Total" />
              </td>
              <td className="text-right">
                {data.totalQuantityPurchased}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
              <td className="text-right">
                {data.totalQuantityRemaining}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default PendingInboundTab;

PendingInboundTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
