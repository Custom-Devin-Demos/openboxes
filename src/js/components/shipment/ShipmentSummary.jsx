/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
import React from 'react';

import PropTypes from 'prop-types';

import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const ShipmentSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  return (
    <div className="summary">
      <table id="shipmentSummary" border="0">
        <tbody>
          <tr>
            <td style={{ width: '1%' }} className="middle center">
              {summary.shipmentType
                ? (
                  <img
                    src={`${CONTEXT_PATH}/images/icons/shipmentType/ShipmentType${summary.shipmentType.defaultName}.png`}
                    alt={summary.shipmentType.name}
                    style={{ verticalAlign: 'middle', width: '24px', height: '24px' }}
                  />
                )
                : (
                  <img
                    src={`${CONTEXT_PATH}/images/icons/silk/lorry.png`}
                    alt=""
                    style={{ verticalAlign: 'middle' }}
                  />
                )}
            </td>
            <td className="middle">
              <div className="title">
                <small>{summary.shipmentNumber}</small>
                {' '}
                <a href={SHIPMENT_URL.showDetails(summary.id)}>{summary.name}</a>
                {' '}
                <small className="fade uppercase">
                  {summary.direction === 'OUTBOUND'
                    && <Translate id="react.shipment.outbound.label" defaultMessage="outbound" />}
                  {summary.direction === 'INBOUND'
                    && <Translate id="react.shipment.inbound.label" defaultMessage="inbound" />}
                </small>
              </div>
              <div>
                {summary.shipmentNumber
                  && (
                  <span className="shipmentNumber">
                    <Translate id="react.shipment.shipmentNumber.label" defaultMessage="Shipment number" />
                    :&nbsp;
                    <label>{summary.shipmentNumber}</label>
                  </span>
                  )}
                {' '}
                {summary.shipmentType
                  && (
                  <span className="shipmentType">
                    <Translate id="react.shipment.shipmentType.label" defaultMessage="Shipment type" />
                    :&nbsp;
                    <label>{summary.shipmentType.name}</label>
                  </span>
                  )}
                {' '}
                {summary.origin
                  && (
                  <span className="origin">
                    <Translate id="react.shipment.origin.label" defaultMessage="Origin" />
                    :&nbsp;
                    <label>{summary.origin.name}</label>
                  </span>
                  )}
                {' '}
                {summary.destination
                  && (
                  <span className="destination">
                    <Translate id="react.shipment.destination.label" defaultMessage="Destination" />
                    :&nbsp;
                    <label>{summary.destination.name}</label>
                  </span>
                  )}
                {' '}
                {!summary.hasShipped && summary.expectedShippingDate
                  && (
                  <span className="expectedShippingDate">
                    <Translate id="react.shipment.expectedShippingDate.label" defaultMessage="Expected shipping date" />
                    :&nbsp;
                    <label>{summary.expectedShippingDate}</label>
                  </span>
                  )}
                {summary.hasShipped
                  && (
                  <span className="actualShippingDate">
                    <Translate id="react.shipment.actualShippingDate.label" defaultMessage="Actual shipping date" />
                    :&nbsp;
                    <label>{summary.actualShippingDate}</label>
                  </span>
                  )}
                {' '}
                {!summary.wasReceived && summary.expectedDeliveryDate
                  && (
                  <span className="expectedDeliveryDate">
                    <Translate id="react.shipment.expectedDeliveryDate.label" defaultMessage="Expected delivery date" />
                    :&nbsp;
                    <label>{summary.expectedDeliveryDate}</label>
                  </span>
                  )}
                {summary.wasReceived
                  && (
                  <span className="actualDeliveryDate">
                    <Translate id="react.shipment.actualDeliveryDate.label" defaultMessage="Actual delivery date" />
                    :&nbsp;
                    <label>{summary.actualDeliveryDate}</label>
                  </span>
                  )}
                {' '}
                {summary.numItems > 0
                  && (
                  <span>
                    <Translate id="react.shipment.numItems.label" defaultMessage="Number of line items" />
                    :&nbsp;
                    <label>{summary.numItems}</label>
                  </span>
                  )}
                {' '}
                {!!summary.totalValue
                  && (
                  <span>
                    <Translate id="react.shipment.totalValue.label" defaultMessage="Total value" />
                    :&nbsp;
                    <label>
                      {Number(summary.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' '}
                      {summary.currencyCode}
                    </label>
                  </span>
                  )}
                {' '}
                {!!summary.totalWeightInPounds
                  && (
                  <span>
                    <Translate id="react.shipment.totalWeight.label" defaultMessage="Total weight" />
                    :&nbsp;
                    <label>
                      {Number(summary.totalWeightInPounds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' '}
                      <Translate id="react.shipment.lbs.label" defaultMessage="lbs" />
                    </label>
                  </span>
                  )}
              </div>
            </td>
            <td className="right middle" width="1%">
              <div className="tag tag-alert">
                {summary.status}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ShipmentSummary;

ShipmentSummary.propTypes = {
  summary: PropTypes.shape({}),
};

ShipmentSummary.defaultProps = {
  summary: null,
};
