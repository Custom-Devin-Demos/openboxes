import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import transactionEntryApi from 'api/services/TransactionEntryApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { CONTEXT_PATH, TRANSACTION_ENTRY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TransactionEntryShow = () => {
  useTranslation('transactionEntry', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [transactionEntry, setTransactionEntry] = useState(null);

  useEffect(() => {
    spinner.show();
    transactionEntryApi.getTransactionEntry(id)
      .then((response) => setTransactionEntry(response.data.data))
      .catch(() => {
        window.location = TRANSACTION_ENTRY_URL.list();
      })
      .finally(() => spinner.hide());
  }, [id]);

  const deleteTransactionEntry = async (onClose) => {
    try {
      await transactionEntryApi.deleteTransactionEntry(id);
      notification(NotificationType.SUCCESS)({
        message: `Transaction entry ${id} deleted`,
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

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.transactionEntry.showTransactionEntry.label',
          defaultMessage: 'Show TransactionEntry',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.transactionEntry.listTransactionEntries.label"
            defaultLabel="List transaction entries"
            variant="secondary"
            onClick={() => {
              window.location = TRANSACTION_ENTRY_URL.list();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {transactionEntry && (
        <div className="p-3">
          <table className="table table-sm w-50">
            <tbody>
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.transactionEntry.column.id.label', defaultMessage: 'Id' })}
                </td>
                <td>{transactionEntry.id}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.transactionEntry.column.inventoryItem.label', defaultMessage: 'Inventory Item' })}
                </td>
                <td>
                  <a href={`${CONTEXT_PATH}/inventoryItem/show/${transactionEntry.inventoryItemId}`}>
                    {transactionEntry.inventoryItem}
                  </a>
                </td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.transactionEntry.column.quantity.label', defaultMessage: 'Quantity' })}
                </td>
                <td>{transactionEntry.quantity}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.transactionEntry.column.comments.label', defaultMessage: 'Comments' })}
                </td>
                <td>{transactionEntry.comments}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  {translate({ id: 'react.transactionEntry.column.transaction.label', defaultMessage: 'Transaction' })}
                </td>
                <td>
                  <a href={`${CONTEXT_PATH}/transaction/show/${transactionEntry.transactionId}`}>
                    {transactionEntry.transaction}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(TRANSACTION_ENTRY_URL.edit(id))}
            />
            <Button
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={onDelete}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default TransactionEntryShow;
