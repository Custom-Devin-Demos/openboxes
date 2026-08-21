/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import {
  SHIPMENT_RECEIPT_DELETE,
  SHIPMENT_RECEIPT_ITEM_DELETE,
  SHIPMENT_RECEIPT_ITEM_PUTAWAY_LOCATIONS,
  SHIPMENT_RECEIPT_ITEM_SPLIT,
  SHIPMENT_RECEIVE,
  SHIPMENT_RECEIVE_FORM,
} from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ReceiveShipment = ({ match }) => {
  const { shipmentId } = match.params;
  const [data, setData] = useState(null);
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState(null);
  const [putawayLocations, setPutawayLocations] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    apiClient.get(SHIPMENT_RECEIVE_FORM(shipmentId))
      .then((response) => {
        const formData = response.data.data;
        setData(formData);
        setActualDeliveryDate(formData.actualDeliveryDate || '');
        setItems(formData.receiptItems.map((item) => ({
          id: item.id,
          quantityReceived: item.quantityReceived ?? '',
          binLocationId: item.binLocationId || '',
          comment: item.comment || '',
        })));
      });
  }, [shipmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const copyBinLocationToAll = (binLocationId) => {
    setItems((prev) => prev.map((item) => ({ ...item, binLocationId })));
  };

  const onSave = (saveButton) => {
    setSubmitting(true);
    setErrors([]);
    setMessage(null);
    const payload = new URLSearchParams();
    payload.append('saveButton', saveButton);
    payload.append('actualDeliveryDate', actualDeliveryDate);
    items.forEach((item) => {
      payload.append('receiptItems.id', item.id);
      payload.append('receiptItems.quantityReceived', item.quantityReceived);
      payload.append('receiptItems.binLocation.id', item.binLocationId);
      payload.append('receiptItems.comment', item.comment);
    });
    apiClient.post(SHIPMENT_RECEIVE(shipmentId), payload)
      .then((response) => {
        setSubmitting(false);
        if (response.data.success) {
          if (response.data.received || saveButton === 'saveAndExit') {
            window.location.href = SHIPMENT_URL.showDetails(shipmentId);
          } else {
            setMessage(response.data.message);
            fetchData();
          }
        } else {
          setErrors(response.data.errors || []);
        }
      })
      .catch(() => setSubmitting(false));
  };

  const onSplit = (receiptItemId) => {
    apiClient.post(SHIPMENT_RECEIPT_ITEM_SPLIT(receiptItemId))
      .then(() => fetchData());
  };

  const onDeleteItem = (receiptItemId) => {
    apiClient.post(SHIPMENT_RECEIPT_ITEM_DELETE(receiptItemId))
      .then((response) => {
        if (response.data.success) {
          fetchData();
        } else {
          setErrors(response.data.errors || []);
        }
      });
  };

  const onDeleteReceipt = () => {
    apiClient.post(SHIPMENT_RECEIPT_DELETE(data.receiptId))
      .then(() => {
        window.location.href = SHIPMENT_URL.showDetails(shipmentId);
      });
  };

  const onShowPutawayLocations = (receiptItemId) => {
    if (putawayLocations[receiptItemId]) {
      setPutawayLocations((prev) => {
        const next = { ...prev };
        delete next[receiptItemId];
        return next;
      });
      return;
    }
    apiClient.get(SHIPMENT_RECEIPT_ITEM_PUTAWAY_LOCATIONS(receiptItemId))
      .then((response) => {
        setPutawayLocations((prev) => ({ ...prev, [receiptItemId]: response.data.data }));
      });
  };

  if (!data) {
    return null;
  }

  return (
    <div className="body">
      <ShipmentSummary summary={data.summary} />
      {data.warningMessage && (
        <div className="message" role="status" aria-label="message">{data.warningMessage}</div>
      )}
      {message && (
        <div className="message" role="status" aria-label="message">{message}</div>
      )}
      {errors.length > 0 && (
        <div className="errors" role="alert" aria-label="error-message">
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="box">
        <h2>
          <img src={`${CONTEXT_PATH}/static/images/icons/handtruck.png`} alt="" style={{ verticalAlign: 'middle' }} />
          {' '}
          <Translate id="react.shipment.receiveShipment.label" defaultMessage="Receive shipment" />
        </h2>
        <div className="message">
          <Translate
            id="react.shipment.receipt.saveAndContinue.message"
            defaultMessage="Please be aware that changes to receipt will not be persisted until you click one of the Save buttons at the bottom of the page."
          />
        </div>
        <table>
          <tbody>
            <tr className="prop">
              <td className="name">
                <label>
                  <Translate id="react.shipment.actualDeliveryDate.label" defaultMessage="Actual delivery date" />
                </label>
              </td>
              <td className="value">
                <input
                  type="datetime-local"
                  name="actualDeliveryDate"
                  className="text"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                />
                {data.actualShippingDate && (
                  <span className="fade">
                    {' '}
                    <Translate id="react.shipment.shippedOn.label" defaultMessage="Shipped on" />
                    {' '}
                    {data.actualShippingDate}
                  </span>
                )}
              </td>
            </tr>
            <tr className="prop">
              <td className="name">
                <label>
                  <Translate id="react.shipment.recipient.label" defaultMessage="Recipient" />
                </label>
              </td>
              <td className="value">
                {data.recipient?.name}
              </td>
            </tr>
          </tbody>
        </table>
        <table className="dataTable">
          <thead>
            <tr>
              <th><Translate id="react.product.productCode.label" defaultMessage="Code" /></th>
              <th><Translate id="react.product.label" defaultMessage="Product" /></th>
              <th><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
              <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
              <th className="center"><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
              <th className="center"><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
              <th><Translate id="react.shipment.binLocation.label" defaultMessage="Bin location" /></th>
              <th><Translate id="react.shipment.comment.label" defaultMessage="Comment" /></th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.receiptItems.map((receiptItem, index) => {
              const itemState = items.find((it) => it.id === receiptItem.id) || {};
              return (
                <React.Fragment key={receiptItem.id}>
                  <tr className={receiptItem.hasQuantityMismatch ? 'mismatch' : ''}>
                    <td>{receiptItem.productCode}</td>
                    <td>
                      <a href={`${CONTEXT_PATH}/inventoryItem/showStockCard?product.id=${receiptItem.product.id}`}>
                        {receiptItem.product.name}
                      </a>
                    </td>
                    <td>{receiptItem.lotNumber}</td>
                    <td>{receiptItem.expirationDate}</td>
                    <td className="center">{receiptItem.isFirstForShipmentItem ? receiptItem.quantityShipped : ''}</td>
                    <td className="center">
                      <input
                        type="text"
                        name="quantityReceived"
                        size="4"
                        className="text"
                        value={itemState.quantityReceived}
                        onChange={(e) => updateItem(receiptItem.id, 'quantityReceived', e.target.value)}
                      />
                    </td>
                    <td>
                      {data.hasBinLocationSupport ? (
                        <>
                          <select
                            name="binLocation.id"
                            value={itemState.binLocationId}
                            onChange={(e) => updateItem(receiptItem.id, 'binLocationId', e.target.value)}
                          >
                            <option value="" />
                            {data.binLocations.map((bin) => (
                              <option key={bin.id} value={bin.id}>{bin.name}</option>
                            ))}
                          </select>
                          {index === 0 && (
                            <>
                              {' '}
                              <button
                                type="button"
                                className="button"
                                onClick={() => copyBinLocationToAll(itemState.binLocationId)}
                              >
                                <Translate id="react.shipment.copyBinLocationToAll.label" defaultMessage="Copy to all" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <Translate id="react.default.notSupported.label" defaultMessage="Not supported" />
                      )}
                      {' '}
                      <button
                        type="button"
                        className="button"
                        onClick={() => onShowPutawayLocations(receiptItem.id)}
                      >
                        <Translate id="react.shipment.showPutawayLocations.label" defaultMessage="Show putaway locations" />
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="comment"
                        className="text"
                        value={itemState.comment}
                        onChange={(e) => updateItem(receiptItem.id, 'comment', e.target.value)}
                      />
                    </td>
                    <td>
                      {receiptItem.isFirstForShipmentItem ? (
                        <button type="button" className="button" onClick={() => onSplit(receiptItem.id)}>
                          <Translate id="react.shipment.splitLine.label" defaultMessage="Split line" />
                        </button>
                      ) : (
                        <button type="button" className="button" onClick={() => onDeleteItem(receiptItem.id)}>
                          <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {putawayLocations[receiptItem.id] && (
                    <tr>
                      <td colSpan="9">
                        <table>
                          <thead>
                            <tr>
                              <th><Translate id="react.shipment.binLocation.label" defaultMessage="Bin location" /></th>
                              <th><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
                              <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
                              <th><Translate id="react.default.quantity.label" defaultMessage="Quantity" /></th>
                            </tr>
                          </thead>
                          <tbody>
                            {putawayLocations[receiptItem.id].binLocations.map((bin) => (
                              <tr key={`${bin.binLocationName}-${bin.lotNumber}`}>
                                <td>{bin.binLocationName}</td>
                                <td>{bin.lotNumber}</td>
                                <td>{bin.expirationDate}</td>
                                <td>
                                  {bin.quantity}
                                  {' '}
                                  {bin.unitOfMeasure}
                                </td>
                              </tr>
                            ))}
                            {putawayLocations[receiptItem.id].binLocations.length === 0 && (
                              <tr>
                                <td colSpan="4" className="empty fade center">
                                  <Translate id="react.default.empty.label" defaultMessage="Empty" />
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        <div className="buttons left">
          <button
            type="button"
            className="button icon approve"
            disabled={submitting}
            onClick={() => onSave('saveAndContinue')}
          >
            <Translate id="react.shipment.saveAndContinue.label" defaultMessage="Save and continue" />
          </button>
          {' '}
          <button
            type="button"
            className="button icon approve"
            disabled={submitting}
            onClick={() => onSave('saveAndExit')}
          >
            <Translate id="react.shipment.saveAndExit.label" defaultMessage="Save and exit" />
          </button>
          {' '}
          <button
            type="button"
            className="button icon approve"
            disabled={submitting}
            onClick={() => onSave('receiveShipment')}
          >
            <Translate id="react.shipment.receiveShipment.label" defaultMessage="Receive shipment" />
          </button>
          {' '}
          {data.receiptId && (
            <button type="button" className="button icon remove" onClick={onDeleteReceipt}>
              <Translate id="react.shipment.deleteReceiptStartOver.label" defaultMessage="Delete receipt and start over" />
            </button>
          )}
          {' '}
          <a href={SHIPMENT_URL.showDetails(shipmentId)}>
            <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReceiveShipment;

ReceiveShipment.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
