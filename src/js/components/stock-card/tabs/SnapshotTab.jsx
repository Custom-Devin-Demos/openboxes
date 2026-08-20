import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const SnapshotTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getSnapshot(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      {data?.inventoryLevel && (
        <div className="p-2">
          <span className="mr-3">
            <Translate id="react.stockCard.minQuantity.label" defaultMessage="Min quantity" />
            {': '}
            {data.inventoryLevel.minQuantity ?? ''}
          </span>
          <span className="mr-3">
            <Translate id="react.stockCard.reorderQuantity.label" defaultMessage="Reorder quantity" />
            {': '}
            {data.inventoryLevel.reorderQuantity ?? ''}
          </span>
          <span className="mr-3">
            <Translate id="react.stockCard.maxQuantity.label" defaultMessage="Max quantity" />
            {': '}
            {data.inventoryLevel.maxQuantity ?? ''}
          </span>
        </div>
      )}
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Date"><Translate id="react.stockCard.date.label" defaultMessage="Date" /></th>
            <th aria-label="Quantity on Hand" className="text-right"><Translate id="react.stockCard.quantityOnHand.label" defaultMessage="Quantity on Hand" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.inventorySnapshots?.length === 0 && (
            <tr>
              <td colSpan="2" className="text-center">
                <Translate id="react.stockCard.noSnapshots.message" defaultMessage="No inventory snapshots" />
              </td>
            </tr>
          )}
          {data?.inventorySnapshots?.map((snapshot) => (
            <tr key={snapshot.date}>
              <td>{formatDate(snapshot.date)}</td>
              <td className="text-right">{snapshot.quantityOnHand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SnapshotTab;

SnapshotTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
