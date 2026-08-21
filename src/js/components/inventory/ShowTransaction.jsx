import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { INVENTORY_SHOW_TRANSACTION } from 'api/urls';
import {
  INVENTORY_ITEM_URL,
  INVENTORY_URL,
  ORDER_URL,
  RECEIPT_URL,
  SHIPMENT_URL,
  TRANSACTION_ENTRY_URL,
} from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const ShowTransaction = ({ match }) => {
  useTranslation('inventory', 'default');

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_SHOW_TRANSACTION(match.params.id))
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.error || ''));
  }, [match.params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transaction = data?.transaction;

  return (
    <PageWrapper className="inventory-legacy-page">
      {error && <div className="alert alert-danger m-2">{error}</div>}
      {transaction && (
        <div className="box p-3">
          <h2>
            <Translate id="react.inventory.transaction.label" defaultMessage="Transaction" />
            {' '}
            {transaction.transactionNumber}
          </h2>
          <table className="table table-sm w-auto">
            <tbody>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.inventory.transactionNumber.label" defaultMessage="Transaction number" />
                </td>
                <td>{transaction.transactionNumber}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.inventory.transactionDate.label" defaultMessage="Date" />
                </td>
                <td>{transaction.transactionDate}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.inventory.transactionType.label" defaultMessage="Type" />
                </td>
                <td>{transaction.transactionType?.name}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.default.source.label" defaultMessage="Source" />
                </td>
                <td>{transaction.source}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.default.destination.label" defaultMessage="Destination" />
                </td>
                <td>{transaction.destination}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.inventory.inventory.label" defaultMessage="Inventory" />
                </td>
                <td>{transaction.inventory}</td>
              </tr>
              {transaction.outgoingShipment && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.inventory.outgoingShipment.label" defaultMessage="Outgoing shipment" />
                  </td>
                  <td>
                    <a href={SHIPMENT_URL.showDetails(transaction.outgoingShipment.id)}>
                      {transaction.outgoingShipment.shipmentNumber}
                    </a>
                  </td>
                </tr>
              )}
              {transaction.incomingShipment && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.inventory.incomingShipment.label" defaultMessage="Incoming shipment" />
                  </td>
                  <td>
                    <a href={SHIPMENT_URL.showDetails(transaction.incomingShipment.id)}>
                      {transaction.incomingShipment.shipmentNumber}
                    </a>
                  </td>
                </tr>
              )}
              {transaction.receipt && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.inventory.receipt.label" defaultMessage="Receipt" />
                  </td>
                  <td>
                    <a href={RECEIPT_URL.show(transaction.receipt.id)}>
                      {transaction.receipt.receiptNumber || transaction.receipt.id}
                    </a>
                  </td>
                </tr>
              )}
              {transaction.order && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.inventory.order.label" defaultMessage="Order" />
                  </td>
                  <td>
                    <a href={ORDER_URL.show(transaction.order.id)}>
                      {transaction.order.name || transaction.order.id}
                    </a>
                  </td>
                </tr>
              )}
              {transaction.localTransfer?.sourceTransaction && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate id="react.inventory.sourceTransaction.label" defaultMessage="Source transaction" />
                  </td>
                  <td>
                    <a
                      href={INVENTORY_URL.showTransaction(
                        transaction.localTransfer.sourceTransaction.id,
                      )}
                    >
                      {transaction.localTransfer.sourceTransaction.transactionNumber}
                    </a>
                  </td>
                </tr>
              )}
              {transaction.localTransfer?.destinationTransaction && (
                <tr>
                  <td className="font-weight-bold">
                    <Translate
                      id="react.inventory.destinationTransaction.label"
                      defaultMessage="Destination transaction"
                    />
                  </td>
                  <td>
                    <a
                      href={INVENTORY_URL.showTransaction(
                        transaction.localTransfer.destinationTransaction.id,
                      )}
                    >
                      {transaction.localTransfer.destinationTransaction.transactionNumber}
                    </a>
                  </td>
                </tr>
              )}
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.default.comment.label" defaultMessage="Comment" />
                </td>
                <td>{transaction.comment}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.default.createdBy.label" defaultMessage="Created by" />
                </td>
                <td>
                  {transaction.createdBy}
                  {' '}
                  <span className="text-muted">{transaction.dateCreated}</span>
                </td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.default.updatedBy.label" defaultMessage="Updated by" />
                </td>
                <td>
                  {transaction.updatedBy}
                  {' '}
                  <span className="text-muted">{transaction.lastUpdated}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <h3>
            <Translate id="react.inventory.transactionEntries.label" defaultMessage="Transaction entries" />
            {' '}
            <span className="text-muted">{`(${transaction.entries?.length ?? 0})`}</span>
          </h3>
          <table className="table table-striped table-sm">
            <thead>
              <tr>
                {data?.isSuperuser && (
                  <th>
                    <Translate id="react.default.actions.label" defaultMessage="Actions" />
                  </th>
                )}
                <th>
                  <Translate id="react.inventory.productCode.label" defaultMessage="Code" />
                </th>
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
                  <Translate id="react.inventory.expirationDate.label" defaultMessage="Expiration date" />
                </th>
                <th className="text-right">
                  <Translate id="react.inventory.quantity.label" defaultMessage="Quantity" />
                </th>
              </tr>
            </thead>
            <tbody>
              {transaction.entries?.map((entry) => (
                <tr key={entry.id}>
                  {data?.isSuperuser && (
                    <td>
                      <a
                        className="btn btn-outline-secondary btn-sm"
                        href={TRANSACTION_ENTRY_URL.edit(entry.id)}
                      >
                        <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                      </a>
                    </td>
                  )}
                  <td>{entry.product?.productCode}</td>
                  <td>
                    <a href={INVENTORY_ITEM_URL.showStockCard(entry.product?.id)}>
                      {entry.product?.name}
                    </a>
                  </td>
                  <td>{entry.binLocation}</td>
                  <td>{entry.inventoryItem?.lotNumber}</td>
                  <td>{entry.inventoryItem?.expirationDate}</td>
                  <td className="text-right">{entry.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};

export default withRouter(ShowTransaction);

ShowTransaction.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
