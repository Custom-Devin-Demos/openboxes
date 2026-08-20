import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import {
  INVENTORY_CREATE_TRANSACTION,
  INVENTORY_SAVE_ADJUSTMENT_TRANSACTION,
  INVENTORY_SAVE_CREDIT_TRANSACTION,
  INVENTORY_SAVE_DEBIT_TRANSACTION,
} from 'api/urls';
import { INVENTORY_ITEM_URL, INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

export const TRANSACTION_TYPES = {
  CONSUMPTION: '2',
  ADJUSTMENT_CREDIT: '3',
  EXPIRATION: '4',
  DAMAGE: '5',
  TRANSFER_IN: '8',
  TRANSFER_OUT: '9',
  ADJUSTMENT_DEBIT: '10',
};

const ACTION_TRANSACTION_TYPES = {
  createInboundTransfer: TRANSACTION_TYPES.TRANSFER_IN,
  createOutboundTransfer: TRANSACTION_TYPES.TRANSFER_OUT,
  createAdjustment: TRANSACTION_TYPES.ADJUSTMENT_CREDIT,
  createConsumed: TRANSACTION_TYPES.CONSUMPTION,
  createExpired: TRANSACTION_TYPES.EXPIRATION,
  createDamaged: TRANSACTION_TYPES.DAMAGE,
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

const defaultDateValue = () => {
  const now = new Date();
  const pad = (val) => `${val}`.padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const CreateTransaction = ({ location }) => {
  useTranslation('inventory', 'default');

  const query = queryString.parse(location.search);
  const action = location.pathname.split('/').filter(Boolean).pop();
  const transactionTypeFromPath = ACTION_TRANSACTION_TYPES[action];
  const initialTransactionType = transactionTypeFromPath || query.transactionType || '';

  const [data, setData] = useState(null);
  const [transactionType, setTransactionType] = useState(initialTransactionType);
  const [transactionDate, setTransactionDate] = useState(defaultDateValue());
  const [comment, setComment] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState([]);

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_CREATE_TRANSACTION, {
      params: queryString.parse(location.search),
    }).then((response) => {
      setData(response.data);
      setCreatedBy(response.data?.currentUserId || '');
      setEntries(response.data?.binLocations?.map((item) => ({
        binLocationId: item.binLocation?.id || '',
        binLocationName: item.binLocation?.name,
        inventoryItemId: item.inventoryItem?.id || '',
        lotNumber: item.inventoryItem?.lotNumber,
        expirationDate: item.inventoryItem?.expirationDate,
        product: item.product,
        onHandQuantity: item.quantity || 0,
        newQuantity: item.quantity || 0,
        quantity: '',
        reasonCode: '',
        comment: '',
      })) || []);
    });
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const productIds = [].concat(query['product.id'] || []);

  const isAdjustment = [
    TRANSACTION_TYPES.ADJUSTMENT_CREDIT,
    TRANSACTION_TYPES.ADJUSTMENT_DEBIT,
  ].includes(transactionType);
  const isTransferIn = transactionType === TRANSACTION_TYPES.TRANSFER_IN;
  const isTransferOut = transactionType === TRANSACTION_TYPES.TRANSFER_OUT;

  const updateEntry = (index, values) => {
    setEntries(entries.map((entry, i) => (i === index ? { ...entry, ...values } : entry)));
  };

  const onSuccess = (response) => {
    const productId = response.data?.productId || productIds[0];
    if (productId) {
      window.location = INVENTORY_ITEM_URL.showStockCard(productId);
      return;
    }
    window.location = INVENTORY_URL.browse();
  };

  const onError = (error) => {
    setErrors(error.response?.data?.errors || []);
  };

  const appendCommonParams = (params) => {
    productIds.forEach((id) => params.append('product.id', id));
    params.append('transactionInstance.inventory.id', data?.location?.inventoryId || '');
    params.append('transactionInstance.transactionDate', dateWithZone(transactionDate));
    params.append('transactionInstance.comment', comment);
  };

  const onSubmitAdjustment = (event) => {
    event.preventDefault();
    setErrors([]);
    const params = new URLSearchParams();
    appendCommonParams(params);
    params.append('transactionInstance.transactionType.id', transactionType);
    entries.forEach((entry, index) => {
      if (entry.binLocationId) {
        params.append(`transactionEntries[${index}].binLocation.id`, entry.binLocationId);
      }
      params.append(`transactionEntries[${index}].inventoryItem.id`, entry.inventoryItemId);
      params.append(`transactionEntries[${index}].oldQuantity`, entry.onHandQuantity);
      params.append(`transactionEntries[${index}].newQuantity`, entry.newQuantity);
      params.append(`transactionEntries[${index}].quantity`, (entry.newQuantity || 0) - entry.onHandQuantity);
      params.append(`transactionEntries[${index}].reasonCode`, entry.reasonCode);
      params.append(`transactionEntries[${index}].comment`, entry.comment);
    });
    apiClient.post(INVENTORY_SAVE_ADJUSTMENT_TRANSACTION, params).then(onSuccess).catch(onError);
  };

  const onSubmitDebit = (event) => {
    event.preventDefault();
    setErrors([]);
    const params = new URLSearchParams();
    appendCommonParams(params);
    params.append('transactionInstance.transactionType.id', transactionType);
    if (isTransferOut) {
      params.append('transactionInstance.destination.id', destination);
    } else {
      params.append('destination.id', destination);
      params.append('createdBy.id', createdBy);
    }
    entries.forEach((entry, index) => {
      if (entry.binLocationId) {
        params.append(`transactionEntries[${index}].binLocation.id`, entry.binLocationId);
      }
      params.append(`transactionEntries[${index}].inventoryItem.id`, entry.inventoryItemId);
      params.append(`transactionEntries[${index}].quantity`, entry.quantity);
    });
    apiClient.post(INVENTORY_SAVE_DEBIT_TRANSACTION, params).then(onSuccess).catch(onError);
  };

  const onSubmitCredit = (event) => {
    event.preventDefault();
    setErrors([]);
    const params = new URLSearchParams();
    appendCommonParams(params);
    params.append('transactionInstance.transactionType.id', transactionType);
    params.append('transactionInstance.source.id', source);
    entries.forEach((entry, index) => {
      params.append(`transactionEntries[${index}].product.id`, entry.product?.id || '');
      if (entry.binLocationId) {
        params.append(`transactionEntries[${index}].binLocation.id`, entry.binLocationId);
      }
      if (entry.newLotNumber) {
        params.append(`transactionEntries[${index}].lotNumber`, entry.newLotNumber);
        if (entry.newExpirationDate) {
          params.append(`transactionEntries[${index}].expirationDate`, entry.newExpirationDate);
        }
      } else if (entry.inventoryItemId) {
        params.append(`transactionEntries[${index}].inventoryItem.id`, entry.inventoryItemId);
      }
      params.append(`transactionEntries[${index}].quantity`, entry.quantity);
    });
    apiClient.post(INVENTORY_SAVE_CREDIT_TRANSACTION, params).then(onSuccess).catch(onError);
  };

  const titleId = () => {
    if (isAdjustment) return 'react.inventory.adjustStock.label';
    if (isTransferIn) return 'react.inventory.incomingTransfer.label';
    if (isTransferOut) return 'react.inventory.outgoingTransfer.label';
    return 'react.inventory.consumed.label';
  };

  const onSubmit = (event) => {
    if (isAdjustment) {
      onSubmitAdjustment(event);
    } else if (isTransferIn) {
      onSubmitCredit(event);
    } else {
      onSubmitDebit(event);
    }
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id={titleId()} defaultMessage="Create transaction" />
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
                  <Translate id="react.inventory.transactionType.label" defaultMessage="Transaction type" />
                </td>
                <td>
                  {(isAdjustment || isTransferIn || isTransferOut) ? (
                    <span>
                      {data?.transactionTypesDebit
                        ?.find((type) => type.id === transactionType)?.name
                        || transactionType}
                    </span>
                  ) : (
                    <select
                      className="form-control"
                      value={transactionType}
                      onChange={(event) => setTransactionType(event.target.value)}
                    >
                      <option value="" aria-label="empty" />
                      {data?.transactionTypesDebit?.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.inventory.label" defaultMessage="Inventory" />
                </td>
                <td>{data?.location?.name}</td>
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
              {isTransferIn && (
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
                      {data?.sources?.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )}
              {(isTransferOut || (!isAdjustment && !isTransferIn)) && (
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
                      {data?.destinations?.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )}
              {(!isAdjustment && !isTransferIn && !isTransferOut) && (
                <tr>
                  <td>
                    <label htmlFor="createdBy">
                      <Translate id="react.inventory.createdBy.label" defaultMessage="Created by" />
                    </label>
                  </td>
                  <td>
                    <select
                      id="createdBy"
                      className="form-control"
                      value={createdBy}
                      onChange={(event) => setCreatedBy(event.target.value)}
                    >
                      <option value="" aria-label="empty" />
                      {data?.users?.map((user) => (
                        <option key={user.id} value={user.id}>{user.name || user.username}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )}
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
          <table id="adjustStockTable" className="table table-striped table-sm">
            <thead>
              <tr>
                <th>
                  <Translate id="react.inventory.product.label" defaultMessage="Product" />
                </th>
                <th>
                  <Translate id="react.inventory.binLocation.label" defaultMessage="Bin location" />
                </th>
                <th>
                  <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
                </th>
                <th>
                  <Translate id="react.inventory.expirationDate.label" defaultMessage="Expires" />
                </th>
                <th className="text-right">
                  <Translate id="react.inventory.onHandQuantity.label" defaultMessage="On hand" />
                </th>
                {isAdjustment ? (
                  <>
                    <th className="text-right">
                      <Translate id="react.inventory.newQuantity.label" defaultMessage="New quantity" />
                    </th>
                    <th className="text-right">
                      <Translate id="react.inventory.quantityDiff.label" defaultMessage="Quantity diff" />
                    </th>
                    <th>
                      <Translate id="react.inventory.reasonCode.label" defaultMessage="Reason code" />
                    </th>
                  </>
                ) : (
                  <th className="text-right">
                    <Translate id="react.inventory.quantity.label" defaultMessage="Quantity" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!entries.length && (
                <tr>
                  <td colSpan={isAdjustment ? 8 : 6} className="text-center">
                    <Translate id="react.default.empty.label" defaultMessage="Empty" />
                  </td>
                </tr>
              )}
              {entries.map((entry, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={index}>
                  <td>
                    {entry.product?.productCode}
                    {' '}
                    {entry.product?.name}
                  </td>
                  <td>
                    {isTransferIn ? (
                      <select
                        className="form-control"
                        value={entry.binLocationId}
                        onChange={(event) => updateEntry(index, {
                          binLocationId: event.target.value,
                        })}
                      >
                        <option value="" aria-label="empty" />
                        {data?.warehouseBinLocations?.map((bin) => (
                          <option key={bin.id} value={bin.id}>{bin.name}</option>
                        ))}
                      </select>
                    ) : (
                      entry.binLocationName
                        || <Translate id="react.default.label" defaultMessage="Default" />
                    )}
                  </td>
                  <td>
                    {isTransferIn ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Lot number"
                        value={entry.newLotNumber || entry.lotNumber || ''}
                        onChange={(event) => updateEntry(index, {
                          newLotNumber: event.target.value,
                        })}
                      />
                    ) : entry.lotNumber}
                  </td>
                  <td>
                    {isTransferIn ? (
                      <input
                        type="date"
                        className="form-control"
                        value={entry.newExpirationDate || ''}
                        onChange={(event) => updateEntry(index, {
                          newExpirationDate: event.target.value,
                        })}
                      />
                    ) : entry.expirationDate}
                  </td>
                  <td className="text-right">{entry.onHandQuantity}</td>
                  {isAdjustment ? (
                    <>
                      <td className="text-right">
                        <input
                          type="number"
                          className="form-control text-right"
                          value={entry.newQuantity}
                          onChange={(event) => updateEntry(index, {
                            newQuantity: event.target.value,
                          })}
                        />
                      </td>
                      <td className="text-right">
                        {(entry.newQuantity || 0) - entry.onHandQuantity}
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={entry.reasonCode}
                          onChange={(event) => updateEntry(index, {
                            reasonCode: event.target.value,
                          })}
                        >
                          <option value="" aria-label="empty" />
                          {data?.reasonCodes?.map((code) => (
                            <option key={code.id} value={code.id}>{code.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="form-control mt-1"
                          placeholder="Comments"
                          value={entry.comment}
                          onChange={(event) => updateEntry(index, { comment: event.target.value })}
                        />
                      </td>
                    </>
                  ) : (
                    <td className="text-right">
                      <input
                        type="number"
                        className="form-control text-right"
                        value={entry.quantity}
                        onChange={(event) => updateEntry(index, { quantity: event.target.value })}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-primary btn-sm mr-2">
              <Translate id="react.default.button.save.label" defaultMessage="Save" />
            </button>
            <a className="btn btn-outline-secondary btn-sm" href={INVENTORY_URL.browse()}>
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(CreateTransaction);

CreateTransaction.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
