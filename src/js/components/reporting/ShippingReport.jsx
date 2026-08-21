/* eslint-disable react/no-array-index-key, jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_SHIPPING_REPORT } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const containerLabel = (container) => (container
  ? [container.containerTypeName, container.name].filter(Boolean).join(' ')
  : '');

const ShippingReport = ({ location }) => {
  useTranslation('report', 'default');

  const params = queryString.parse(location.search);
  const shipmentId = params['shipment.id'] || params.id;

  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!shipmentId) {
      setErrorMessage('Missing shipment id');
      return;
    }
    apiClient.get(SHIPMENT_SHIPPING_REPORT(shipmentId))
      .then((response) => setData(response.data.data))
      .catch((error) => {
        setErrorMessage(error?.response?.data?.errorMessage
          || 'An unexpected error has occurred');
      });
  }, [shipmentId]);

  if (errorMessage) {
    return <div className="alert alert-danger m-3">{errorMessage}</div>;
  }

  if (!data) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  const { shipment, checklistItems } = data;
  let previousContainerId = null;

  return (
    <div className="m-3">
      <style>
        {'@media print { .print-buttons { display: none; } }'}
      </style>
      <div className="print-buttons d-flex mb-3">
        <button type="button" className="btn btn-outline-primary btn-sm mr-2" onClick={() => window.print()}>
          <Translate id="react.default.button.print.label" defaultMessage="Print" />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.close()}>
          <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
        </button>
      </div>
      <h1>
        <Translate id="react.report.shippingReport.header.label" defaultMessage="Shipping Report" />
      </h1>
      <h3>{shipment.name}</h3>
      <table className="mb-3">
        <tbody>
          <tr>
            <td className="pr-3 font-weight-bold">
              <Translate id="react.report.containerNumber.label" defaultMessage="Container No." />
            </td>
            <td className="pr-5">{shipment.name}</td>
            <td className="pr-3 font-weight-bold">
              <Translate id="react.report.plate.label" defaultMessage="Plate No." />
            </td>
            <td>{data.licensePlateNumber}</td>
          </tr>
          <tr>
            <td className="pr-3 font-weight-bold">
              <Translate id="react.report.origin.label" defaultMessage="Origin" />
            </td>
            <td className="pr-5">{shipment.origin}</td>
            <td className="pr-3 font-weight-bold">
              <Translate id="react.report.destination.label" defaultMessage="Destination" />
            </td>
            <td>{shipment.destination}</td>
          </tr>
        </tbody>
      </table>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th rowSpan={2}>#</th>
            <th rowSpan={2}><Translate id="react.report.container.label" defaultMessage="Container" /></th>
            <th rowSpan={2}><Translate id="react.report.productCode.label" defaultMessage="Code" /></th>
            <th rowSpan={2}><Translate id="react.report.productDescription.label" defaultMessage="Product description" /></th>
            <th rowSpan={2}><Translate id="react.report.lotNumber.label" defaultMessage="Lot Number" /></th>
            <th rowSpan={2}><Translate id="react.report.expirationDate.label" defaultMessage="Expiration Date" /></th>
            <th colSpan={2} className="text-center">
              <Translate id="react.report.quantityDelivered.label" defaultMessage="Delivered" />
            </th>
            <th colSpan={2} className="text-center">
              <Translate id="react.report.quantityReceived.label" defaultMessage="Received" />
            </th>
          </tr>
          <tr>
            <th className="text-center"><Translate id="react.report.quantityPerBox.label" defaultMessage="Qty per box" /></th>
            <th className="text-center"><Translate id="react.report.quantityTotal.label" defaultMessage="Qty" /></th>
            <th className="text-center"><Translate id="react.report.quantityPerBox.label" defaultMessage="Qty per box" /></th>
            <th className="text-center"><Translate id="react.report.quantityTotal.label" defaultMessage="Qty" /></th>
          </tr>
        </thead>
        <tbody>
          {checklistItems.map((item, index) => {
            const containerId = item.container?.id || null;
            const newContainer = containerId !== previousContainerId || index === 0;
            previousContainerId = containerId;
            return (
              <tr key={item.id || index} style={newContainer ? { borderTop: '3px solid lightgrey' } : {}}>
                <td className="text-center">{index + 1}</td>
                <td>{newContainer ? containerLabel(item.container) : ''}</td>
                <td>{item.productCode}</td>
                <td>{item.productName}</td>
                <td>{item.lotNumber}</td>
                <td>{item.expirationDate}</td>
                <td />
                <td className="text-center">{item.quantity}</td>
                <td />
                <td className="text-center">{item.quantity}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="w-100 mt-5" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td className="font-weight-bold">
              <Translate id="react.report.preparedBy.label" defaultMessage="Prepared by" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
            <td style={{ width: '10%' }} />
            <td className="font-weight-bold">
              <Translate id="react.report.receivedBy.label" defaultMessage="Received by" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
          </tr>
          <tr>
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.deliveredBy.label" defaultMessage="Delivered by" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
            <td />
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.receivedOn.label" defaultMessage="Received on" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
          </tr>
          <tr>
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.deliveredOn.label" defaultMessage="Delivered on" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
            <td />
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.verifiedOn.label" defaultMessage="Verified on" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
          </tr>
          <tr>
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.transportedBy.label" defaultMessage="Carrier" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
            <td />
            <td className="font-weight-bold pt-4">
              <Translate id="react.report.verifiedBy.label" defaultMessage="Verified by" />
            </td>
            <td style={{ borderBottom: '1px solid black' }} />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ShippingReport;

ShippingReport.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
