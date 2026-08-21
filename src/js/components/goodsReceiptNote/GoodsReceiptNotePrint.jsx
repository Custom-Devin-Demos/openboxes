/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { GOODS_RECEIPT_NOTE_PRINT_DATA } from 'api/urls';
import { printStyles } from 'components/deliveryNote/printShared';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const grnStyles = `
  .delivery-note-print .canceled { text-decoration: line-through; }
  .delivery-note-print .split-row { border-top: 2px solid lightgrey; }
  .delivery-note-print .product-name {
    white-space: normal;
    overflow-wrap: break-word;
    max-width: 350px;
  }
`;

const signatureRows = [
  { key: 'deliveredBy', label: 'react.goodsReceiptNote.deliveredBy.label', defaultMessage: 'Delivered by' },
  { key: 'receivedBy', label: 'react.goodsReceiptNote.receivedBy.label', defaultMessage: 'Received by' },
  { key: 'checkedBy', label: 'react.goodsReceiptNote.checkedBy.label', defaultMessage: 'Checked by beneficiary/program' },
];

const GoodsReceiptNotePrint = ({ match }) => {
  useTranslation('goodsReceiptNote', 'default');
  const shipmentId = match.params.id;

  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get(GOODS_RECEIPT_NOTE_PRINT_DATA(shipmentId))
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
        {grnStyles}
      </style>
      <div className="print-header">
        <table className="w100 fixed-layout no-border-table">
          <tbody>
            <tr>
              <td>
                <h1 className="m-0">{data.title}</h1>
              </td>
              <td className="right">
                <div className="button-container">
                  <button
                    id="print-page"
                    type="button"
                    className="button"
                    onClick={() => window.print()}
                  >
                    <Translate id="react.default.button.print.label" defaultMessage="Print" />
                  </button>
                  <a href="#close" className="button" onClick={(e) => { e.preventDefault(); window.close(); }}>
                    <Translate id="react.default.button.close.label" defaultMessage="Close" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
      </div>
      <div id="header" className="header">
        <table className="w100 no-border-table">
          <tbody>
            <tr>
              <td width="1%">
                {data.logoUrl && (
                  <div style={{ marginBottom: '20px' }}>
                    <img src={data.logoUrl} alt="Openboxes" width="40" height="40" />
                  </div>
                )}
              </td>
              <td>
                <div style={{ fontSize: '25px', marginBottom: '10px', fontWeight: 'bold' }}>
                  {data.status}
                </div>
                <h1>{data.title}</h1>
                <h3>
                  {data.shipmentNumber}
                  {' - '}
                  {data.name}
                </h3>
                {data.shipmentNumber && (
                  <div className="barcode">
                    <img src={data.barcodeUrl} alt="" />
                  </div>
                )}
              </td>
              <td width="33%">
                <table className="no-border-table w100 no-wrap">
                  <tbody>
                    <tr>
                      <td className="right">
                        <label htmlFor="origin">
                          <Translate id="react.goodsReceiptNote.origin.label" defaultMessage="Origin" />
                          :
                        </label>
                      </td>
                      <td>{data.origin}</td>
                    </tr>
                    <tr>
                      <td className="right">
                        <label htmlFor="destination">
                          <Translate id="react.goodsReceiptNote.destination.label" defaultMessage="Destination" />
                          :
                        </label>
                      </td>
                      <td>{data.destination}</td>
                    </tr>
                    <tr>
                      <td className="right">
                        <label htmlFor="dateShipped">
                          <Translate id="react.goodsReceiptNote.dateShipped.label" defaultMessage="Shipped" />
                          :
                        </label>
                      </td>
                      <td>{data.dateShipped}</td>
                    </tr>
                    <tr>
                      <td className="right">
                        <label htmlFor="datePrinted">
                          <Translate id="react.goodsReceiptNote.datePrinted.label" defaultMessage="Date printed" />
                          :
                        </label>
                      </td>
                      <td>{data.datePrinted}</td>
                    </tr>
                    <tr>
                      <td className="right">
                        <label htmlFor="lastReceipt">
                          <Translate id="react.goodsReceiptNote.lastReceipt.label" defaultMessage="Last receipt" />
                          :
                        </label>
                      </td>
                      <td>{data.lastReceiptDate}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
      </div>
      <div className="content">
        <table className="w100">
          <thead>
            <tr>
              <th />
              <th><Translate id="react.goodsReceiptNote.productCode.label" defaultMessage="Code" /></th>
              <th><Translate id="react.goodsReceiptNote.product.label" defaultMessage="Product" /></th>
              <th><Translate id="react.goodsReceiptNote.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
              <th><Translate id="react.goodsReceiptNote.expirationDate.label" defaultMessage="Expires" /></th>
              <th><Translate id="react.goodsReceiptNote.uom.label" defaultMessage="UoM" /></th>
              <th><Translate id="react.goodsReceiptNote.quantityShipped.label" defaultMessage="Quantity Shipped" /></th>
              {data.receipts.map((receipt) => (
                <th key={receipt.id}>
                  <Translate id="react.goodsReceiptNote.receipt.label" defaultMessage="Receipt" />
                  {' '}
                  {receipt.receiptNumber}
                </th>
              ))}
              <th className="center">
                <Translate id="react.goodsReceiptNote.discrepancy.label" defaultMessage="Discrepancy" />
              </th>
              <th><Translate id="react.goodsReceiptNote.comment.label" defaultMessage="Comment" /></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <React.Fragment key={item.id}>
                {item.hasSplit && item.splitRow && (
                  <tr className="split-row">
                    <td>{i + 1}</td>
                    <td className="canceled">{item.splitRow.productCode}</td>
                    <td className="canceled product-name">{item.splitRow.productName}</td>
                    <td className="canceled">{item.splitRow.lotNumber}</td>
                    <td className="canceled">{item.splitRow.expirationDate}</td>
                    <td className="canceled">{item.splitRow.unitOfMeasure}</td>
                    <td className="canceled">{item.splitRow.quantityShipped}</td>
                    {data.receipts.map((receipt) => (
                      <td key={receipt.id} />
                    ))}
                    <td />
                    <td />
                  </tr>
                )}
                {item.receiptRows.map((row, j) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={`${item.id}-${j}`}>
                    <td>{!item.hasSplit && j === 0 ? i + 1 : null}</td>
                    <td>{row.productCode}</td>
                    <td className="product-name">{row.productName}</td>
                    <td>{row.lotNumber}</td>
                    <td>{row.expirationDate}</td>
                    <td>{!item.hasSplit && j === 0 ? row.unitOfMeasure : null}</td>
                    <td>{row.quantityShipped}</td>
                    {row.receiptQuantities.map((quantity, k) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <td key={k}>{quantity}</td>
                    ))}
                    <td className="center">{row.discrepancy}</td>
                    <td>{row.comment}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <table className="signature-table w100 fixed-layout">
          <tbody>
            {signatureRows.map((row) => (
              <tr key={row.key}>
                <td width="40%" align="left">
                  <Translate id={row.label} defaultMessage={row.defaultMessage} />
                </td>
                <td align="left">
                  <Translate id="react.goodsReceiptNote.signature.label" defaultMessage="Signature" />
                </td>
                <td align="right">
                  <Translate id="react.goodsReceiptNote.date.label" defaultMessage="Date" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoodsReceiptNotePrint;

GoodsReceiptNotePrint.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
