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

  return (
    <div className="body">
      <ShipmentSummary summary={data.summary} />
      <div className="box">
        <h2><Translate id="react.shipment.packingList.label" defaultMessage="Packing list" /></h2>
        <table className="dataTable">
          <thead>
            <tr>
              <th><Translate id="react.shipment.packingUnit.label" defaultMessage="Packing unit" /></th>
              <th><Translate id="react.product.label" defaultMessage="Product" /></th>
              <th><Translate id="react.shipment.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
              <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
              <th className="center"><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
              {data.wasReceived && (
                <th className="center"><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
              )}
              <th><Translate id="react.shipment.recipient.label" defaultMessage="Recipient" /></th>
            </tr>
          </thead>
          <tbody>
            {data.containers.map((container) => (
              <React.Fragment key={container.id || 'unpacked'}>
                <tr className="container-row">
                  <td colSpan={colSpan}>
                    <b>
                      {container.id ? (
                        <>
                          {container.containerTypeName}
                          {' '}
                          {container.name}
                        </>
                      ) : (
                        <Translate id="react.shipment.unpacked.label" defaultMessage="Unpacked" />
                      )}
                    </b>
                    {container.dimensions && (
                      <span className="fade">
                        {' '}
                        {container.dimensions}
                      </span>
                    )}
                    {container.weight && (
                      <span className="fade">
                        {' '}
                        {container.weight}
                      </span>
                    )}
                  </td>
                </tr>
                {container.shipmentItems.map((item) => (
                  <tr key={item.id}>
                    <td />
                    <td>
                      <a href={`${CONTEXT_PATH}/inventoryItem/showStockCard?product.id=${item.product.id}`}>
                        {item.product.name}
                      </a>
                    </td>
                    <td>{item.lotNumber}</td>
                    <td>{item.expirationDate}</td>
                    <td className="center">
                      {item.quantity}
                      {' '}
                      {item.unitOfMeasure}
                    </td>
                    {data.wasReceived && (
                      <td className="center">
                        {item.quantityReceived}
                        {' '}
                        {item.unitOfMeasure}
                      </td>
                    )}
                    <td>{item.recipient?.name}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {data.containers.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="empty center">
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
