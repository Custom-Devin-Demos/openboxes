/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { SHIPMENT_PACKING_LIST } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { CONTEXT_PATH } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ShipmentPackingList = ({ match }) => {
  const { shipmentId } = match.params;
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get(SHIPMENT_PACKING_LIST(shipmentId))
      .then((response) => setData(response.data.data));
  }, [shipmentId]);

  if (!data) {
    return null;
  }

  const colSpan = data.wasReceived ? 7 : 6;

  const containerGroups = data.shipmentItems.reduce((acc, item) => {
    const key = item.container?.id || 'unpacked';
    const existing = acc.find((group) => group.key === key);
    if (existing) {
      existing.items.push(item);
      return acc;
    }
    return [...acc, { key, container: item.container, items: [item] }];
  }, []);

  return (
    <div className="p-3">
      <ShipmentSummary summary={data.summary} />
      <div className="card p-3 mb-3">
        <h2><Translate id="react.shipment.packingList.label" defaultMessage="Packing list" /></h2>
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th><Translate id="react.shipment.packingUnit.label" defaultMessage="Packing unit" /></th>
              <th><Translate id="react.product.label" defaultMessage="Product" /></th>
              <th><Translate id="react.shipment.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
              <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
              <th className="text-center"><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
              {data.wasReceived && (
                <th className="text-center"><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
              )}
              <th><Translate id="react.shipment.recipient.label" defaultMessage="Recipient" /></th>
            </tr>
          </thead>
          <tbody>
            {containerGroups.map(({ key, container, items }) => (
              <React.Fragment key={key}>
                <tr className="table-secondary">
                  <td colSpan={colSpan}>
                    <b>
                      {container ? (
                        <>
                          {container.containerTypeName}
                          {' '}
                          {container.name}
                        </>
                      ) : (
                        <Translate id="react.shipment.unpacked.label" defaultMessage="Unpacked" />
                      )}
                    </b>
                    {container && (container.length || container.width || container.height) && (
                      <span className="text-muted">
                        {' '}
                        {container.length}
                        {' x '}
                        {container.width}
                        {' x '}
                        {container.height}
                        {' '}
                        {container.volumeUnits}
                      </span>
                    )}
                    {container?.weight && (
                      <span className="text-muted">
                        {' '}
                        {container.weight}
                        {' '}
                        {container.weightUnits}
                      </span>
                    )}
                  </td>
                </tr>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td />
                    <td>
                      <a href={`${CONTEXT_PATH}/inventoryItem/showStockCard?product.id=${item.product.id}`}>
                        {item.product.name}
                      </a>
                    </td>
                    <td>{item.lotNumber}</td>
                    <td>{item.expirationDate}</td>
                    <td className="text-center">
                      {item.quantity}
                      {' '}
                      {item.unitOfMeasure}
                    </td>
                    {data.wasReceived && (
                      <td className="text-center">
                        {item.quantityReceived}
                        {' '}
                        {item.unitOfMeasure}
                      </td>
                    )}
                    <td>{item.recipientName}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {data.shipmentItems.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="text-center text-muted p-3">
                  <Translate id="react.default.empty.label" defaultMessage="Empty" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShipmentPackingList;

ShipmentPackingList.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
