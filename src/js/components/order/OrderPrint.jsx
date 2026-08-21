/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { ORDER_PRINT_DATA } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const addressLines = (address) => {
  if (!address) {
    return [];
  }
  return [
    address.address,
    address.address2,
    [address.city, address.stateOrProvince, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);
};

const OrderPrint = ({ match }) => {
  useTranslation('orderPrint', 'default');
  const orderId = match.params.id;

  const [data, setData] = useState(null);
  const [orientation, setOrientation] = useState('');

  useEffect(() => {
    apiClient.get(ORDER_PRINT_DATA(orderId))
      .then((response) => setData(response.data.data));
  }, [orderId]);

  if (!data) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  return (
    <div className="m-3">
      <style>
        {orientation ? `@page { size: ${orientation}; }` : ''}
        {'@media print { .print-buttons { display: none; } }'}
      </style>
      <div className="print-buttons d-flex align-items-center mb-3">
        <select
          className="mr-2"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
        >
          <option value="" aria-label="none" />
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => window.print()}>
          <Translate id="react.orderPrint.button.print.label" defaultMessage="Print" />
        </button>
      </div>
      <div className="d-flex justify-content-between">
        <div>
          <h1>{data.orderTypeName}</h1>
          <table>
            <tbody>
              <tr>
                <td className="pr-3 font-weight-bold">
                  <Translate id="react.orderPrint.orderNumber.label" defaultMessage="PO Number" />
                </td>
                <td>{data.orderNumber}</td>
              </tr>
              <tr>
                <td className="pr-3 font-weight-bold">
                  <Translate id="react.orderPrint.date.label" defaultMessage="Date" />
                </td>
                <td>{data.currentDate}</td>
              </tr>
              <tr>
                <td className="pr-3 font-weight-bold">
                  <Translate id="react.orderPrint.buyer.label" defaultMessage="Buyer" />
                </td>
                <td>{data.orderedByName}</td>
              </tr>
              <tr>
                <td className="pr-3 font-weight-bold">
                  <Translate id="react.orderPrint.paymentTerms.label" defaultMessage="Payment Terms" />
                </td>
                <td>{data.paymentTerm}</td>
              </tr>
              <tr>
                <td className="pr-3 font-weight-bold">
                  <Translate id="react.orderPrint.paymentMethod.label" defaultMessage="Payment Method" />
                </td>
                <td>{data.paymentMethodType}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4>{data.destinationPartyName}</h4>
          {addressLines(data.destinationPartyAddress).map((line) => <div key={line}>{line}</div>)}
        </div>
      </div>
      <div className="d-flex mt-3">
        <div className="w-50 border p-2 mr-2">
          <h5><Translate id="react.orderPrint.supplier.label" defaultMessage="Supplier" /></h5>
          <div>{data.originName}</div>
          {addressLines(data.originAddress).map((line) => <div key={line}>{line}</div>)}
        </div>
        <div className="w-50 border p-2">
          <h5><Translate id="react.orderPrint.shipTo.label" defaultMessage="Ship To" /></h5>
          <div>{data.destinationName}</div>
          {addressLines(data.destinationAddress).map((line) => <div key={line}>{line}</div>)}
        </div>
      </div>
      <table className="table table-sm mt-3">
        <thead>
          <tr>
            <th>#</th>
            <th><Translate id="react.orderPrint.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderPrint.product.label" defaultMessage="Product" /></th>
            {data.hasSupplierCode && <th><Translate id="react.orderPrint.supplierCode.label" defaultMessage="Supplier code" /></th>}
            {data.hasManufacturerName && <th><Translate id="react.orderPrint.manufacturerName.label" defaultMessage="Manufacturer name" /></th>}
            {data.hasManufacturerCode && <th><Translate id="react.orderPrint.manufacturerCode.label" defaultMessage="Manufacturer code" /></th>}
            <th><Translate id="react.orderPrint.quantity.label" defaultMessage="Quantity" /></th>
            <th><Translate id="react.orderPrint.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.orderPrint.unitPrice.label" defaultMessage="Unit price" /></th>
            <th><Translate id="react.orderPrint.totalPrice.label" defaultMessage="Total price" /></th>
          </tr>
        </thead>
        <tbody>
          {data.orderItems.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.productCode}</td>
              <td>{item.productName}</td>
              {data.hasSupplierCode && <td>{item.supplierCode}</td>}
              {data.hasManufacturerName && <td>{item.manufacturerName}</td>}
              {data.hasManufacturerCode && <td>{item.manufacturerCode}</td>}
              <td>{item.quantity}</td>
              <td>{item.unitOfMeasure}</td>
              <td className="text-right">{item.unitPrice}</td>
              <td className="text-right">{item.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={
              5
              + (data.hasSupplierCode ? 1 : 0)
              + (data.hasManufacturerName ? 1 : 0)
              + (data.hasManufacturerCode ? 1 : 0)
            }
            >
              <Translate id="react.orderPrint.subtotal.label" defaultMessage="Subtotal" />
            </th>
            <th className="text-right">
              {data.subtotal}
              {' '}
              {data.currencyCode}
            </th>
          </tr>
          {data.adjustments?.map((adjustment) => (
            <tr key={adjustment.id}>
              <th colSpan={
                5
                + (data.hasSupplierCode ? 1 : 0)
                + (data.hasManufacturerName ? 1 : 0)
                + (data.hasManufacturerCode ? 1 : 0)
              }
              >
                {adjustment.typeName}
                {' '}
                {adjustment.description}
              </th>
              <th className="text-right">
                {adjustment.totalAdjustments}
                {' '}
                {data.currencyCode}
              </th>
            </tr>
          ))}
          <tr>
            <th colSpan={
              5
              + (data.hasSupplierCode ? 1 : 0)
              + (data.hasManufacturerName ? 1 : 0)
              + (data.hasManufacturerCode ? 1 : 0)
            }
            >
              <Translate id="react.orderPrint.total.label" defaultMessage="Total" />
            </th>
            <th className="text-right">
              {data.total}
              {' '}
              {data.currencyCode}
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default OrderPrint;

OrderPrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
