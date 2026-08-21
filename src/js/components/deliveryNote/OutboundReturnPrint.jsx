/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { DELIVERY_NOTE_PRINT_OUTBOUND_RETURN_DATA } from 'api/urls';
import {
  AddressSection,
  NotesSection,
  PrintHeader,
  printStyles,
  PrintToolbar,
  SignaturesSection,
} from 'components/deliveryNote/printShared';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const OutboundReturnPrint = ({ match }) => {
  useTranslation('deliveryNote', 'default');
  const shipmentId = match.params.id;

  const searchParams = new URLSearchParams(window.location.search);
  const [data, setData] = useState(null);
  const [orientation, setOrientation] = useState(searchParams.get('orientation') || '');

  useEffect(() => {
    apiClient.get(DELIVERY_NOTE_PRINT_OUTBOUND_RETURN_DATA(shipmentId))
      .then((response) => setData(response.data.data));
  }, [shipmentId]);

  if (!data) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  return (
    <div className="delivery-note-print m-3">
      <style>
        {printStyles}
        {`@page { size: ${orientation || 'portrait'}; margin: .25in; }`}
      </style>
      <PrintToolbar orientation={orientation} onOrientationChange={setOrientation} />
      <PrintHeader data={data} />
      <AddressSection origin={data.origin} destination={data.destination} />
      <div className="content">
        <div className="page-content">
          <table className="w100">
            <thead>
              <tr>
                <th className="center" width="3%">
                  <Translate id="react.deliveryNote.number.label" defaultMessage="No." />
                </th>
                <th><Translate id="react.deliveryNote.productCode.label" defaultMessage="Code" /></th>
                <th><Translate id="react.deliveryNote.product.label" defaultMessage="Product" /></th>
                <th><Translate id="react.deliveryNote.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
                <th><Translate id="react.deliveryNote.expirationDate.label" defaultMessage="Expiration date" /></th>
                <th className="center">
                  <Translate id="react.deliveryNote.quantityDelivered.label" defaultMessage="Qty Delivered" />
                </th>
                <th className="center">
                  <Translate id="react.deliveryNote.quantityReceived.label" defaultMessage="Qty Received" />
                </th>
                <th><Translate id="react.deliveryNote.comment.label" defaultMessage="Comment" /></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => {
                if (row.changed) {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={i}>
                      <tr>
                        <td className="center" rowSpan={row.receiptItems.length + 1}>{i + 1}</td>
                        <td><div className="canceled">{row.original.productCode}</div></td>
                        <td><div className="canceled">{row.original.productName}</div></td>
                        <td><div className="canceled">{row.original.lotNumber}</div></td>
                        <td className="no-wrap"><div className="canceled">{row.original.expirationDate}</div></td>
                        <td className="center"><div className="canceled">{row.original.quantity}</div></td>
                        <td />
                        <td />
                      </tr>
                      {row.receiptItems.map((receiptItem, j) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <tr key={`${i}-${j}`}>
                          <td>{receiptItem.productCode}</td>
                          <td>{receiptItem.productName}</td>
                          <td>{receiptItem.lotNumber}</td>
                          <td className="no-wrap">{receiptItem.expirationDate}</td>
                          <td />
                          <td className="center">{receiptItem.quantityReceived}</td>
                          <td>{receiptItem.comment}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={i}>
                    <td className="center">{i + 1}</td>
                    <td>{row.productCode}</td>
                    <td>{row.productName}</td>
                    <td>{row.lotNumber}</td>
                    <td className="no-wrap">{row.expirationDate}</td>
                    <td className="center">{row.quantity}</td>
                    <td className="center">{row.quantityReceived}</td>
                    <td>{row.comments}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <NotesSection notes={data.notes} />
        <SignaturesSection />
      </div>
    </div>
  );
};

export default OutboundReturnPrint;

OutboundReturnPrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
