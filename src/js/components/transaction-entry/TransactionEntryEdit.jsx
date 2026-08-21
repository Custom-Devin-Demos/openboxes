/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import transactionEntryApi from 'api/services/TransactionEntryApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { INVENTORY_URL, TRANSACTION_ENTRY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TransactionEntryEdit = () => {
  useTranslation('transactionEntry', 'transaction', 'default');
  const { id } = useParams();
  const spinner = useSpinner();

  const [transactionEntry, setTransactionEntry] = useState(null);
  const [binLocationOptions, setBinLocationOptions] = useState([]);
  const [hasBinLocationSupport, setHasBinLocationSupport] = useState(false);

  const [binLocationId, setBinLocationId] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    spinner.show();
    transactionEntryApi.getTransactionEntry(id)
      .then((response) => {
        const entry = response.data.data;
        setTransactionEntry(entry);
        setBinLocationId(entry.binLocationId || '');
        setInventoryItemId(entry.inventoryItemId || '');
        setQuantity(entry.quantity != null ? `${entry.quantity}` : '');
        setComments(entry.comments || '');
      })
      .catch(() => {
        window.location = TRANSACTION_ENTRY_URL.list();
      })
      .finally(() => spinner.hide());
    transactionEntryApi.getBinLocationOptions()
      .then((response) => {
        setBinLocationOptions(response.data.data || []);
        setHasBinLocationSupport(Boolean(response.data.hasBinLocationSupport));
      });
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      await transactionEntryApi.updateTransactionEntry(id, {
        version: transactionEntry?.version,
        binLocationId,
        inventoryItemId,
        quantity,
        comments,
      });
      notification(NotificationType.SUCCESS)({
        message: `TransactionEntry ${id} updated`,
      });
      window.location = INVENTORY_URL.showTransaction(transactionEntry?.transactionId);
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

  const deleteTransactionEntry = async (onClose) => {
    try {
      await transactionEntryApi.deleteTransactionEntry(id);
      notification(NotificationType.SUCCESS)({
        message: `TransactionEntry ${id} deleted`,
      });
      window.location = TRANSACTION_ENTRY_URL.list();
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'No',
      label: 'react.default.no.label',
      onClick: () => onClose?.(),
    },
    {
      variant: 'primary',
      defaultLabel: 'Yes',
      label: 'react.default.yes.label',
      onClick: () => deleteTransactionEntry(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const transactionDetails = transactionEntry?.transactionDetails;

  const detailRows = transactionDetails ? [
    {
      key: 'transactionNumber',
      label: <Translate id="react.transaction.transactionNumber.label" defaultMessage="Transaction Number" />,
      value: transactionDetails.transactionNumber,
    },
    {
      key: 'type',
      label: <Translate id="react.transaction.type.label" defaultMessage="Type" />,
      value: transactionDetails.transactionType,
    },
    {
      key: 'source',
      label: <Translate id="react.transaction.source.label" defaultMessage="Source" />,
      value: transactionDetails.source,
    },
    {
      key: 'destination',
      label: <Translate id="react.transaction.destination.label" defaultMessage="Destination" />,
      value: transactionDetails.destination,
    },
    {
      key: 'inventory',
      label: <Translate id="react.transaction.inventory.label" defaultMessage="Inventory" />,
      value: transactionDetails.inventory,
    },
    {
      key: 'transactionDate',
      label: <Translate id="react.transaction.date.label" defaultMessage="Date" />,
      value: transactionDetails.transactionDate,
    },
    {
      key: 'dateCreated',
      label: <Translate id="react.default.dateCreated.label" defaultMessage="Date Created" />,
      value: transactionDetails.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: <Translate id="react.default.lastUpdated.label" defaultMessage="Last Updated" />,
      value: transactionDetails.lastUpdated,
    },
  ].filter((row) => row.value != null) : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.transactionEntry.editTransactionEntry.label',
          defaultMessage: 'Edit Transaction entry',
        }}
        />
      </HeaderWrapper>
      {transactionEntry && (
        <div className="m-3">
          {errors.length > 0 && (
            <div className="alert alert-danger" role="alert" aria-label="error-message">
              <ul className="mb-0">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}
          <div className="row">
            <div className="col-md-4">
              <div className="box p-3">
                <h2><Translate id="react.transaction.details.label" defaultMessage="Transaction Details" /></h2>
                <table className="table table-sm">
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.key}>
                        <td className="font-weight-bold">{row.label}</td>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-md-8">
              <form onSubmit={onSubmit} className="box p-3">
                <h2>
                  <Translate id="react.transactionEntry.label" defaultMessage="Transaction entry" />
                  {' › '}
                  {transactionEntry.product?.productCode}
                  {' '}
                  {transactionEntry.product?.name}
                </h2>
                <div className="form-group">
                  <label htmlFor="transaction">
                    <Translate id="react.transactionEntry.column.transaction.label" defaultMessage="Transaction" />
                  </label>
                  <div id="transaction">{transactionEntry.transaction}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="product">
                    <Translate id="react.transactionEntry.product.label" defaultMessage="Product" />
                  </label>
                  <div id="product">
                    {transactionEntry.product?.productCode}
                    {' '}
                    {transactionEntry.product?.name}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="binLocation">
                    <Translate id="react.transactionEntry.binLocation.label" defaultMessage="Bin Location" />
                  </label>
                  {hasBinLocationSupport ? (
                    <select
                      id="binLocation"
                      className="form-control"
                      value={binLocationId}
                      onChange={(event) => setBinLocationId(event.target.value)}
                    >
                      <option value="" />
                      {binLocationOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <Translate id="react.default.notSupported.label" defaultMessage="Not supported" />
                    </div>
                  )}
                </div>
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
                    {(transactionEntry.productInventoryItems || []).map((option) => (
                      <option key={option.id} value={option.id}>{option.lotNumber}</option>
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
                  <label htmlFor="unitOfMeasure">
                    <Translate id="react.transactionEntry.unitOfMeasure.label" defaultMessage="Unit of measure" />
                  </label>
                  <div id="unitOfMeasure">{transactionEntry.product?.unitOfMeasure}</div>
                </div>
                <div className="form-group">
                  <label htmlFor="comments">
                    <Translate id="react.transactionEntry.column.comments.label" defaultMessage="Comments" />
                  </label>
                  <textarea
                    id="comments"
                    className="form-control"
                    cols="100"
                    rows="5"
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                  />
                </div>
                <div className="d-flex gap-8 align-items-center">
                  <Button
                    type="submit"
                    label="react.default.button.update.label"
                    defaultLabel="Update"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    label="react.default.button.delete.label"
                    defaultLabel="Delete"
                    onClick={onDelete}
                  />
                  <a href={INVENTORY_URL.showTransaction(transactionEntry.transactionId)} className="ml-2">
                    <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default TransactionEntryEdit;
