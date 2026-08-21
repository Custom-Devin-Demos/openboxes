import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const DemandTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getDemand(productId, { params: { 'product.id': productId } })
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      {data && (
        <div className="p-2 text-muted">
          <Translate id="react.stockCard.demandPeriod.label" defaultMessage="Demand period" />
          {': '}
          {formatDate(data.startDate)}
          {' - '}
          {formatDate(data.endDate)}
        </div>
      )}
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Month"><Translate id="react.stockCard.monthRequested.label" defaultMessage="Month" /></th>
            <th aria-label="Number"><Translate id="react.stockCard.number.label" defaultMessage="Number" /></th>
            <th aria-label="Status"><Translate id="react.stockCard.status.label" defaultMessage="Status" /></th>
            <th aria-label="Origin"><Translate id="react.stockCard.origin.label" defaultMessage="Origin" /></th>
            <th aria-label="Destination"><Translate id="react.stockCard.destination.label" defaultMessage="Destination" /></th>
            <th aria-label="Date Issued"><Translate id="react.stockCard.dateIssued.label" defaultMessage="Date Issued" /></th>
            <th aria-label="Reason code"><Translate id="react.stockCard.reasonCode.label" defaultMessage="Reason code" /></th>
            <th aria-label="Quantity Requested" className="text-right"><Translate id="react.stockCard.quantityRequested.label" defaultMessage="Quantity Requested" /></th>
            <th aria-label="Quantity Issued" className="text-right"><Translate id="react.stockCard.quantityIssued.label" defaultMessage="Quantity Issued" /></th>
            <th aria-label="Quantity Demand" className="text-right"><Translate id="react.stockCard.quantityDemand.label" defaultMessage="Quantity Demand" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.requisitionItems?.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center">
                <Translate id="react.stockCard.noDemand.message" defaultMessage="No demand data" />
              </td>
            </tr>
          )}
          {data?.requisitionItems?.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={`${item.requisitionId}-${index}`}>
              <td>{item.monthRequested}</td>
              <td>{item.requestNumber}</td>
              <td>{item.status}</td>
              <td>{item.origin}</td>
              <td>{item.destination}</td>
              <td>{formatDate(item.dateIssued)}</td>
              <td>{item.reasonCode}</td>
              <td className="text-right">{item.quantityRequested}</td>
              <td className="text-right">{item.quantityIssued}</td>
              <td className="text-right">{item.quantityDemand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DemandTab;

DemandTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
