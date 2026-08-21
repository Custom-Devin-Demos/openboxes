import React, { useEffect, useState } from 'react';

import transactionEntryApi from 'api/services/TransactionEntryApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { TRANSACTION_ENTRY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TransactionEntryCreate = () => {
  useTranslation('transactionEntry', 'default');

  const [inventoryItemOptions, setInventoryItemOptions] = useState([]);
  const [transactionOptions, setTransactionOptions] = useState([]);

  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comments, setComments] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    transactionEntryApi.getInventoryItemOptions()
      .then((response) => {
        const options = response.data.data || [];
        setInventoryItemOptions(options);
        if (options.length) {
          setInventoryItemId(options[0].id);
        }
      });
    transactionEntryApi.getTransactionOptions()
      .then((response) => {
        const options = response.data.data || [];
        setTransactionOptions(options);
        if (options.length) {
          setTransactionId(options[0].id);
        }
      });
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await transactionEntryApi.createTransactionEntry({
        inventoryItemId,
        transactionId,
        quantity,
        comments,
      });
      notification(NotificationType.SUCCESS)({
        message: `TransactionEntry ${response.data.data.id} created`,
      });
      window.location = TRANSACTION_ENTRY_URL.edit(response.data.data.id);
    } catch (error) {
      const errorMessages = error?.response?.data?.errorMessages;
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessages?.length) {
        setErrors(errorMessages);
      } else if (errorMessage) {
        setErrors([errorMessage]);
      }
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.transactionEntry.createTransactionEntry.label',
          defaultMessage: 'Create TransactionEntry',
        }}
        />
      </HeaderWrapper>
      <div className="m-3">
        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert" aria-label="error-message">
            <ul className="mb-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit} className="w-50">
          <div className="form-group">
            <label htmlFor="inventoryItem">
              <Translate id="react.transactionEntry.column.inventoryItem.label" defaultMessage="Inventory Item" />
            </label>
            <select
              id="inventoryItem"
              className="form-control"
              value={inventoryItemId}
              onChange={(event) => setInventoryItemId(event.target.value)}
            >
              {inventoryItemOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quantity">
              <Translate id="react.transactionEntry.column.quantity.label" defaultMessage="Quantity" />
            </label>
            <input
              id="quantity"
              type="text"
              size="10"
              className="form-control"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="comments">
              <Translate id="react.transactionEntry.column.comments.label" defaultMessage="Comments" />
            </label>
            <textarea
              id="comments"
              className="form-control"
              cols="40"
              rows="5"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="transaction">
              <Translate id="react.transactionEntry.column.transaction.label" defaultMessage="Transaction" />
            </label>
            <select
              id="transaction"
              className="form-control"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
            >
              {transactionOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label="react.default.button.create.label"
              defaultLabel="Create"
            />
            <a href={TRANSACTION_ENTRY_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default TransactionEntryCreate;
