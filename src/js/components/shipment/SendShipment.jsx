/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { SHIPMENT_SEND, SHIPMENT_SEND_FORM } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const formatSendDate = (date) => {
  // MM/dd/yyyy HH:mm XXX (e.g. 08/21/2026 07:22 +00:00)
  const pad = (num) => String(num).padStart(2, '0');
  const offsetMinutesTotal = -date.getTimezoneOffset();
  const sign = offsetMinutesTotal >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutesTotal) / 60));
  const offsetMinutes = pad(Math.abs(offsetMinutesTotal) % 60);
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())} ${sign}${offsetHours}:${offsetMinutes}`;
};

const SendShipment = ({ match }) => {
  const { shipmentId } = match.params;
  const [data, setData] = useState(null);
  const [actualShippingDate, setActualShippingDate] = useState('');
  const [comment, setComment] = useState('');
  const [emailRecipientIds, setEmailRecipientIds] = useState([]);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get(SHIPMENT_SEND_FORM(shipmentId))
      .then((response) => setData(response.data.data));
  }, [shipmentId]);

  const onToggleRecipient = (id) => {
    setEmailRecipientIds((prev) => (
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    ));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);
    const payload = new URLSearchParams();
    if (actualShippingDate) {
      payload.append('actualShippingDate', formatSendDate(new Date(actualShippingDate)));
    }
    payload.append('comment', comment);
    emailRecipientIds.forEach((id) => payload.append('emailRecipientId', id));
    apiClient.post(SHIPMENT_SEND(shipmentId), payload)
      .then((response) => {
        if (response.data.success) {
          window.location.href = SHIPMENT_URL.showDetails(shipmentId);
        } else {
          setErrors(response.data.errors || []);
          setSubmitting(false);
        }
      })
      .catch(() => setSubmitting(false));
  };

  if (!data) {
    return null;
  }

  return (
    <div className="p-3">
      <ShipmentSummary summary={data.summary} />
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="d-flex">
        <div className="mr-3" style={{ width: '280px', flexShrink: 0 }}>
          <form onSubmit={onSubmit}>
            <div className="card p-3 mb-3">
              <h2>
                <img src={`${CONTEXT_PATH}/static/images/icons/silk/lorry.png`} alt="" style={{ verticalAlign: 'middle' }} />
                {' '}
                <Translate id="react.shipment.sendShipment.label" defaultMessage="Send shipment" />
              </h2>
              <table>
                <tbody>
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top">
                      <label>
                        <Translate id="react.shipment.actualShippingDate.label" defaultMessage="Actual shipping date" />
                      </label>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        name="actualShippingDate"
                        className="form-control form-control-sm"
                        value={actualShippingDate}
                        onChange={(e) => setActualShippingDate(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top">
                      <label>
                        <Translate id="react.shipment.comment.label" defaultMessage="Comment" />
                      </label>
                    </td>
                    <td>
                      <textarea
                        name="comment"
                        cols="60"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top">
                      <label>
                        <Translate id="react.shipment.workflowStatus.label" defaultMessage="Status" />
                      </label>
                    </td>
                    <td>
                      <span className={data.statusCode === 'CREATED' ? '' : 'fade'}>
                        {data.statusCreated}
                      </span>
                      {' \u2192 '}
                      <b>{data.statusName}</b>
                      {' \u2192 '}
                      <span className={data.statusCode === 'SHIPPED' ? '' : 'fade'}>
                        {data.statusShipped}
                      </span>
                      {' \u2192 '}
                      <span className={data.statusCode === 'RECEIVED' ? '' : 'fade'}>
                        {data.statusReceived}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top">
                      <label>
                        <Translate id="react.shipment.origin.label" defaultMessage="Origin" />
                      </label>
                    </td>
                    <td>{data.originName}</td>
                  </tr>
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top">
                      <label>
                        <Translate id="react.shipment.destination.label" defaultMessage="Destination" />
                      </label>
                    </td>
                    <td>{data.destinationName}</td>
                  </tr>
                  {data.originIsWarehouse && (
                    <tr>
                      <td className="font-weight-bold text-right pr-3 align-top">
                        <label>
                          <Translate id="react.shipment.itemsToDebit.label" defaultMessage="Items to debit" />
                        </label>
                      </td>
                      <td>
                        <table className="table table-sm table-striped">
                          <thead>
                            <tr>
                              <th><Translate id="react.shipment.container.label" defaultMessage="Container" /></th>
                              <th><Translate id="react.product.label" defaultMessage="Product" /></th>
                              <th><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
                              <th className="text-center"><Translate id="react.default.quantity.label" defaultMessage="Quantity" /></th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.shipmentItems.map((item) => (
                              <tr key={item.id}>
                                <td>{item.containerName}</td>
                                <td>{item.product.name}</td>
                                <td>{item.lotNumber}</td>
                                <td className="text-center">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                  {data.recipients.length > 0 && (
                    <tr>
                      <td className="font-weight-bold text-right pr-3 align-top">
                        <label>
                          <Translate id="react.shipment.emailRecipients.label" defaultMessage="Email recipients" />
                        </label>
                      </td>
                      <td>
                        {data.recipients.map((recipient) => (
                          <div key={recipient.id}>
                            <label>
                              <input
                                type="checkbox"
                                name="emailRecipientId"
                                value={recipient.id}
                                checked={emailRecipientIds.includes(recipient.id)}
                                onChange={() => onToggleRecipient(recipient.id)}
                              />
                              {' '}
                              {recipient.name}
                              {' '}
                              {recipient.email && (
                                <span className="text-muted">
                                  &lt;
                                  {recipient.email}
                                  &gt;
                                </span>
                              )}
                              {' '}
                              <span className="text-muted">{recipient.role}</span>
                            </label>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top" />
                    <td className="text-left">
                      <button type="submit" className="btn btn-primary btn-sm mr-1" disabled={submitting}>
                        <Translate id="react.shipment.sendShipment.label" defaultMessage="Send shipment" />
                      </button>
                      {' '}
                      <a href={SHIPMENT_URL.showDetails(shipmentId)}>
                        <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendShipment;

SendShipment.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
