import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import {
  INVENTORY_SAVE_TRANSACTION,
  INVENTORY_TRANSACTION_BY_ID,
  INVENTORY_TRANSACTION_ENTRY_DELETE,
} from 'api/urls';
import { INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const EditTransaction = ({ match }) => {
  useTranslation('inventory', 'default');

  const transactionId = match.params.id;
  const [data, setData] = useState(null);
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [comment, setComment] = useState('');
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState([]);

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_TRANSACTION_BY_ID(transactionId))
      .then((response) => {
        const transaction = response.data?.transaction;
        setData(response.data);
        setTransactionDate(transaction?.transactionDate || '');
        setTransactionType(transaction?.transactionType?.id || '');
        setSource(transaction?.source?.id || '');
        setDestination(transaction?.destination?.id || '');
        setComment(transaction?.comment || '');
        setEntries(transaction?.entries?.map((entry) => ({
          id: entry.id,
          productId: entry.product?.id,
          productLabel: `${entry.product?.productCode || ''} ${entry.product?.name || ''}`,
          inventoryItemId: entry.inventoryItem?.id || '',
          binLocation: entry.binLocation,
          quantity: entry.quantity,
        })) || []);
      });
  }, [transactionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateEntry = (index, values) => {
    setEntries(entries.map((entry, i) => (i === index ? { ...entry, ...values } : entry)));
  };

  const onDeleteEntry = (entry) => {
    apiClient.delete(INVENTORY_TRANSACTION_ENTRY_DELETE(entry.id))
      .then(() => fetchData());
  };

  const dateWithZone = (value) => {
    if (!value) {
      return '';
    }
    const offsetMinutes = -new Date(value).getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = `${Math.floor(absOffset / 60)}`.padStart(2, '0');
    const minutes = `${absOffset % 60}`.padStart(2, '0');
    return `${value}${sign}${hours}:${minutes}`;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setErrors([]);
    const params = new URLSearchParams();
    params.append('id', transactionId);
    params.append('transactionDate', dateWithZone(transactionDate));
    params.append('transactionType.id', transactionType);
    if (source) {
      params.append('source.id', source);
    }
    if (destination) {
      params.append('destination.id', destination);
    }
    params.append('comment', comment);
    entries.forEach((entry, index) => {
      params.append(`transactionEntries[${index}].id`, entry.id);
      params.append(`transactionEntries[${index}].inventoryItem.id`, entry.inventoryItemId);
      params.append(`transactionEntries[${index}].quantity`, entry.quantity);
    });
    apiClient.post(INVENTORY_SAVE_TRANSACTION, params)
      .then((response) => {
        window.location = INVENTORY_URL.showTransaction(response.data?.id || transactionId);
      })
      .catch((error) => {
        setErrors(error.response?.data?.errors || []);
      });
  };

  const transaction = data?.transaction;

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.editTransaction.label" defaultMessage="Edit transaction" />
          {' '}
          {transaction?.transactionNumber}
        </h2>
        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert" aria-label="error-message">
            <ul className="mb-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <table className="table table-sm w-auto">
            <tbody>
              <tr>
                <td>
                  <Translate id="react.inventory.transactionNumber.label" defaultMessage="Transaction number" />
                </td>
                <td>{transaction?.transactionNumber}</td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="transactionDate">
                    <Translate id="react.inventory.transactionDate.label" defaultMessage="Date" />
                  </label>
                </td>
                <td>
                  <input
                    id="transactionDate"
                    type="datetime-local"
                    className="form-control"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="transactionType">
                    <Translate id="react.inventory.transactionType.label" defaultMessage="Transaction type" />
                  </label>
                </td>
                <td>
                  <select
                    id="transactionType"
                    className="form-control"
                    value={transactionType}
                    onChange={(event) => setTransactionType(event.target.value)}
                  >
                    <option value="" aria-label="empty" />
                    {data?.transactionTypeList?.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="source">
                    <Translate id="react.inventory.transactionSource.label" defaultMessage="Source" />
                  </label>
                </td>
                <td>
                  <select
                    id="source"
                    className="form-control"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  >
                    <option value="" aria-label="empty" />
                    {data?.locationInstanceList?.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="destination">
                    <Translate id="react.inventory.transactionDestination.label" defaultMessage="Destination" />
                  </label>
                </td>
                <td>
                  <select
                    id="destination"
                    className="form-control"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  >
                    <option value="" aria-label="empty" />
                    {data?.locationInstanceList?.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.inventory.label" defaultMessage="Inventory" />
                </td>
                <td>{transaction?.inventory?.name}</td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="comment">
                    <Translate id="react.inventory.comment.label" defaultMessage="Comment" />
                  </label>
                </td>
                <td>
                  <textarea
                    id="comment"
                    className="form-control"
                    rows="2"
                    cols="80"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <h3>
            <Translate id="react.inventory.transactionEntries.label" defaultMessage="Transaction entries" />
          </h3>
          <table className="table table-striped table-sm">
            <thead>
              <tr>
                <th>
                  <Translate id="react.inventory.product.label" defaultMessage="Product" />
                </th>
                <th>
                  <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
                </th>
                <th className="text-right">
                  <Translate id="react.inventory.quantity.label" defaultMessage="Quantity" />
                </th>
                <th>
                  <Translate id="react.default.actions.label" defaultMessage="Actions" />
                </th>
              </tr>
            </thead>
            <tbody>
              {!entries.length && (
                <tr>
                  <td colSpan="4" className="text-center">
                    <Translate id="react.default.empty.label" defaultMessage="Empty" />
                  </td>
                </tr>
              )}
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>{entry.productLabel}</td>
                  <td>
                    <select
                      className="form-control"
                      value={entry.inventoryItemId}
                      onChange={(event) => updateEntry(index, {
                        inventoryItemId: event.target.value,
                      })}
                    >
                      <option value="" aria-label="empty" />
                      {data?.inventoryItemsMap?.[entry.productId]?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.lotNumber || ''}
                          {item.expirationDate ? ` (${item.expirationDate})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      className="form-control text-right"
                      value={entry.quantity}
                      onChange={(event) => updateEntry(index, { quantity: event.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDeleteEntry(entry)}
                    >
                      <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-primary btn-sm mr-2">
              <Translate id="react.default.button.save.label" defaultMessage="Save" />
            </button>
            <a className="btn btn-outline-secondary btn-sm" href={INVENTORY_URL.listTransactions()}>
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(EditTransaction);

EditTransaction.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
