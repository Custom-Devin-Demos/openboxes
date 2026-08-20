import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { LOCATION_CONTENTS } from 'api/urls';
import { INVENTORY_ITEM_URL, LOCATION_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

/**
 * React equivalent of the legacy location/showContents screen: lists the
 * inventory items currently stored in a bin location.
 */
const LocationContents = ({ match }) => {
  const { locationId } = match.params;
  const [contents, setContents] = useState([]);
  const [location, setLocation] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient.get(LOCATION_CONTENTS(locationId))
      .then((response) => {
        setContents(response.data.data);
        setLocation(response.data.location);
        setLoaded(true);
      });
  }, [locationId]);

  return (
    <div className="d-flex flex-column list-page-main">
      <div className="d-flex list-page-header">
        <span className="d-flex align-self-center title">
          <Translate id="react.locationsList.contents.label" defaultMessage="Contents" />
          {location.name ? `: ${location.name}` : ''}
        </span>
      </div>
      <div className="p-3">
        <table className="table table-striped">
          <thead>
            <tr>
              <th aria-label="Product"><Translate id="react.locationsList.contents.product.label" defaultMessage="Product" /></th>
              <th aria-label="Lot number"><Translate id="react.locationsList.contents.lotNumber.label" defaultMessage="Lot number" /></th>
              <th aria-label="Expires"><Translate id="react.locationsList.contents.expirationDate.label" defaultMessage="Expires" /></th>
              <th aria-label="Quantity"><Translate id="react.locationsList.contents.quantity.label" defaultMessage="Quantity" /></th>
            </tr>
          </thead>
          <tbody>
            {contents.map((entry) => (
              <tr key={`${entry.product?.id}-${entry.inventoryItem?.id}`}>
                <td>
                  <a href={INVENTORY_ITEM_URL.showStockCard(entry.product?.id)}>
                    {entry.product?.productCode}
                    {' '}
                    {entry.product?.name}
                  </a>
                </td>
                <td>{entry.inventoryItem?.lotNumber}</td>
                <td>{entry.inventoryItem?.expirationDate}</td>
                <td>{entry.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loaded && !contents.length && (
          <div className="text-center text-muted">
            <Translate id="react.default.empty.label" defaultMessage="Empty" />
          </div>
        )}
        <a className="btn-xs btn btn-outline-secondary" href={LOCATION_URL.edit(locationId)}>
          <Translate id="react.default.button.back.label" defaultMessage="Back" />
        </a>
      </div>
    </div>
  );
};

export default withRouter(LocationContents);

LocationContents.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({ locationId: PropTypes.string }),
  }).isRequired,
};
