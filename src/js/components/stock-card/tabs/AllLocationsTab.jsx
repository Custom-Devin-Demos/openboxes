import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import Translate from 'utils/Translate';

const AllLocationsTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getAllLocations(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      {data?.locationGroups?.map((group) => (
        <table className="table table-sm stock-card-table" key={group.locationGroup || 'no-group'}>
          <thead>
            <tr>
              <th colSpan="2" className="font-weight-bold">
                {group.locationGroup || <Translate id="react.stockCard.noLocationGroup.label" defaultMessage="No location group" />}
              </th>
              {data.hasRoleFinance && <th aria-label="Empty" />}
            </tr>
            <tr>
              <th aria-label="Location"><Translate id="react.stockCard.location.label" defaultMessage="Location" /></th>
              <th aria-label="Quantity on Hand" className="text-right"><Translate id="react.stockCard.quantityOnHand.label" defaultMessage="Quantity on Hand" /></th>
              {data.hasRoleFinance && (
                <th aria-label="Value" className="text-right"><Translate id="react.stockCard.value.label" defaultMessage="Value" /></th>
              )}
            </tr>
          </thead>
          <tbody>
            {group.locations.map((entry) => (
              <tr key={entry.location.id}>
                <td>{entry.location.name}</td>
                <td className="text-right">
                  {entry.quantity}
                  {' '}
                  {data.unitOfMeasure || 'EA'}
                </td>
                {data.hasRoleFinance && <td className="text-right">{entry.value}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-weight-bold">
              <td className="text-right"><Translate id="react.stockCard.total.label" defaultMessage="Total" /></td>
              <td className="text-right">
                {group.totalQuantity}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
              {data.hasRoleFinance && <td className="text-right">{group.totalValue}</td>}
            </tr>
          </tfoot>
        </table>
      ))}
      {data?.locationGroups?.length === 0 && (
        <div className="p-3 text-center">
          <Translate id="react.stockCard.noItemsCurrentlyInStock.message" defaultMessage="There are no items currently in stock." />
        </div>
      )}
    </div>
  );
};

export default AllLocationsTab;

AllLocationsTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
