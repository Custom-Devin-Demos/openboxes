import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { STOCKLIST_LOCATION_DETAILS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ShowStocklistPage = ({ match }) => {
  const [details, setDetails] = useState(null);

  useTranslation('stocklists');

  useEffect(() => {
    apiClient.get(STOCKLIST_LOCATION_DETAILS(match.params.locationId))
      .then((response) => {
        setDetails(response.data.data);
      });
  }, [match.params.locationId]);

  if (!details) {
    return null;
  }

  return (
    <div className="d-flex flex-column list-page-main p-3">
      <div className="box p-3 border rounded bg-white">
        <h2 id="location-name">{details.locationName}</h2>
        <div className="text-muted mb-2">
          {details.inventoryLevels.length}
          {' '}
          <Translate id="react.stocklists.inventoryLevels.label" defaultMessage="inventory levels" />
        </div>
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Product"><Translate id="react.stocklists.column.name.label" defaultMessage="Product" /></th>
              <th aria-label="Minimum quantity" className="text-center"><Translate id="react.stocklists.minimumQuantity.label" defaultMessage="Minimum quantity" /></th>
              <th aria-label="Maximum quantity" className="text-center"><Translate id="react.stocklists.maximumQuantity.label" defaultMessage="Maximum quantity" /></th>
              <th aria-label="Reorder quantity" className="text-center"><Translate id="react.stocklists.reorderQuantity.label" defaultMessage="Reorder quantity" /></th>
            </tr>
          </thead>
          <tbody>
            {details.inventoryLevels.map((inventoryLevel) => (
              <tr key={inventoryLevel.id}>
                <td>{inventoryLevel.productName}</td>
                <td className="text-center">{inventoryLevel.minimumQuantity}</td>
                <td className="text-center">{inventoryLevel.maximumQuantity}</td>
                <td className="text-center">{inventoryLevel.reorderQuantity}</td>
              </tr>
            ))}
            {details.inventoryLevels.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted">
                  <Translate id="react.stocklists.noInventoryLevels.message" defaultMessage="No inventory levels" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ShowStocklistPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      locationId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ShowStocklistPage;
