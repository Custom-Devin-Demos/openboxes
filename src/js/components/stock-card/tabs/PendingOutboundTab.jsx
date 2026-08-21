import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const PendingOutboundTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getPendingOutbound(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Date Requested"><Translate id="react.stockCard.dateRequested.label" defaultMessage="Date Requested" /></th>
            <th aria-label="Status"><Translate id="react.stockCard.status.label" defaultMessage="Status" /></th>
            <th aria-label="Number"><Translate id="react.stockCard.number.label" defaultMessage="Number" /></th>
            <th aria-label="Name"><Translate id="react.stockCard.name.label" defaultMessage="Name" /></th>
            <th aria-label="Destination"><Translate id="react.stockCard.destination.label" defaultMessage="Destination" /></th>
            <th aria-label="Quantity Requested" className="text-right"><Translate id="react.stockCard.quantityRequested.label" defaultMessage="Quantity Requested" /></th>
            <th aria-label="Quantity Required" className="text-right"><Translate id="react.stockCard.quantityRequired.label" defaultMessage="Quantity Required" /></th>
            <th aria-label="Quantity Picked" className="text-right"><Translate id="react.stockCard.quantityPicked.label" defaultMessage="Quantity Picked" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center">
                <Translate id="react.stockCard.noPendingOutbound.message" defaultMessage="No pending outbound shipments" />
              </td>
            </tr>
          )}
          {data?.items?.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.dateRequested)}</td>
              <td>{item.status}</td>
              <td>{item.requestNumber}</td>
              <td>{item.name}</td>
              <td>{item.destination}</td>
              <td className="text-right">{item.quantityRequested}</td>
              <td className="text-right">{item.quantityRequired}</td>
              <td className="text-right">
                {item.picklistItemsByLot?.map((lot) => (
                  <div key={lot.lotNumber || 'no-lot'}>
                    {lot.lotNumber ? `${lot.lotNumber}: ` : ''}
                    {lot.quantity}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
        {data?.items?.length > 0 && (
          <tfoot>
            <tr className="font-weight-bold">
              <td colSpan="5" className="text-right">
                <Translate id="react.stockCard.total.label" defaultMessage="Total" />
              </td>
              <td className="text-right">
                {data.totalQuantityRequested}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
              <td className="text-right">
                {data.totalQuantityRequired}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
              <td className="text-right">
                {data.totalQuantityPicked}
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

export default PendingOutboundTab;

PendingOutboundTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
