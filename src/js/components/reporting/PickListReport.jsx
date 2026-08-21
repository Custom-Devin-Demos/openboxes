/* eslint-disable react/no-array-index-key, jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_PICK_LIST_REPORT } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const PickListReport = ({ location }) => {
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
    apiClient.get(SHIPMENT_PICK_LIST_REPORT(shipmentId))
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

  const { shipment, containers } = data;

  return (
    <div className="m-3">
      <style>
        {'@media print { .print-buttons { display: none; } .page { page-break-after: always; } }'}
      </style>
      {containers.map((containerEntry, containerIndex) => (
        <div className="page mb-5" key={containerIndex}>
          <div className="print-buttons d-flex mb-3">
            <button type="button" className="btn btn-outline-primary btn-sm mr-2" onClick={() => window.print()}>
              <Translate id="react.default.button.print.label" defaultMessage="Print" />
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.close()}>
              <Translate id="react.default.button.close.label" defaultMessage="Close" />
            </button>
          </div>
          <h1>
            <Translate id="react.report.pickList.header.label" defaultMessage="Pick List" />
          </h1>
          <h3>{shipment.name}</h3>
          <div className="row mb-3">
            <div className="col-6">
              <table>
                <tbody>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.shipmentNumber.label" defaultMessage="Shipment Number" />
                    </td>
                    <td>{shipment.shipmentNumber}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.expectedShippingDate.label" defaultMessage="Expected Shipping Date" />
                    </td>
                    <td>{shipment.expectedShippingDate}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.expectedDeliveryDate.label" defaultMessage="Expected Delivery Date" />
                    </td>
                    <td>{shipment.expectedDeliveryDate}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.origin.label" defaultMessage="Origin" />
                    </td>
                    <td>{shipment.origin}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.destination.label" defaultMessage="Destination" />
                    </td>
                    <td>{shipment.destination}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-6">
              <table>
                <tbody>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.pickedBy.label" defaultMessage="Picked by" />
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.verifiedBy.label" defaultMessage="Verified by" />
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.printedBy.label" defaultMessage="Printed by" />
                    </td>
                    <td>{data.printedBy}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 font-weight-bold">
                      <Translate id="react.report.printedOn.label" defaultMessage="Printed on" />
                    </td>
                    <td>{data.printedOn}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <h4>
            {containerEntry.container
              ? [
                containerEntry.container.containerTypeName,
                containerEntry.container.name,
              ].filter(Boolean).join(' ')
              : <Translate id="react.report.unpacked.label" defaultMessage="Unpacked" />}
          </h4>
          <table className="table table-sm table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th><Translate id="react.report.productCode.label" defaultMessage="Code" /></th>
                <th><Translate id="react.report.product.label" defaultMessage="Product" /></th>
                <th><Translate id="react.report.lotNumber.label" defaultMessage="Lot Number" /></th>
                <th><Translate id="react.report.expirationDate.label" defaultMessage="Expiration Date" /></th>
                <th className="text-right"><Translate id="react.report.quantity.label" defaultMessage="Quantity" /></th>
                <th><Translate id="react.report.unitOfMeasure.label" defaultMessage="UOM" /></th>
                <th><Translate id="react.report.bins.label" defaultMessage="Bins" /></th>
                <th><Translate id="react.report.binPicked.label" defaultMessage="Bin Picked" /></th>
                <th><Translate id="react.report.lotPicked.label" defaultMessage="Lot Picked" /></th>
                <th><Translate id="react.report.quantityPicked.label" defaultMessage="Qty Picked" /></th>
              </tr>
            </thead>
            <tbody>
              {containerEntry.pickListItems.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.productCode}</td>
                  <td>{item.productName}</td>
                  <td>{item.lotNumber}</td>
                  <td>{item.expirationDate}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td>{item.unitOfMeasure}</td>
                  <td>
                    {(item.bins || []).map((bin, binIndex) => (
                      <div key={binIndex}>
                        {`${bin.binLocation || 'Default'}: ${bin.quantity}`}
                      </div>
                    ))}
                  </td>
                  <td>{item.binLocationPicked}</td>
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <div className="font-weight-bold">
              <Translate id="react.report.comments.label" defaultMessage="Comments" />
            </div>
            <div className="border" style={{ minHeight: '150px' }}>&nbsp;</div>
          </div>
        </div>
      ))}
      {!containers.length && (
        <div className="alert alert-warning">
          <Translate id="react.default.noResultsFound.label" defaultMessage="No results found" />
        </div>
      )}
    </div>
  );
};

export default PickListReport;

PickListReport.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
