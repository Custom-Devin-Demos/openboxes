/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { getTranslate } from 'react-localize-redux';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import { STOCK_MOVEMENT_RETURN_SHOW_DETAILS } from 'api/urls';
import {
  CONTEXT_PATH,
  INVENTORY_ITEM_URL,
  INVENTORY_URL,
  ORDER_URL,
  STOCK_MOVEMENT_URL,
  STOCK_TRANSFER_URL,
} from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate, { translateWithDefaultMessage } from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/inventory/inventoryLegacy.scss';
import './ReturnsShow.scss';

const TABS = ['packingList', 'receipts', 'documents'];

const DetailRow = ({ label, children }) => (
  <tr className="prop">
    <td className="name">{label}</td>
    <td className="value">{children}</td>
  </tr>
);

DetailRow.propTypes = {
  label: PropTypes.node.isRequired,
  children: PropTypes.node,
};

DetailRow.defaultProps = {
  children: null,
};

const ReturnsShow = ({ translate }) => {
  useTranslation('stockMovement', 'default');

  const { id } = useParams();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    apiClient.get(STOCK_MOVEMENT_RETURN_SHOW_DETAILS(id))
      .then((response) => setData(response.data.data));
  }, [id]);

  if (!data) {
    return (
      <PageWrapper className="inventory-legacy-page">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </PageWrapper>
    );
  }

  const none = translate('react.default.none.label', 'None');
  const visibleDocuments = (data.documents || []).filter((document) => !document.hidden);

  const onDelete = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    if (window.confirm(translate('react.default.areYouSure.label', 'Are you sure?'))) {
      window.location.href = `${CONTEXT_PATH}/stockTransfer/remove/${data.id}?orderId=${data.orderId}`;
    }
  };

  return (
    <PageWrapper className="inventory-legacy-page returns-show">

      <section className="summary box p-3 mb-3" aria-label="summary">
        <div className="d-flex align-items-center">
          <div className="mr-3">
            {data.barcodeUrl && (
              <div className="box-barcode text-center">
                <img src={data.barcodeUrl} alt="" />
                <div className="barcode">{data.identifier}</div>
              </div>
            )}
          </div>
          <div className="flex-grow-1">
            <div className="title" data-testid="title">
              <small className="font-weight-bold">{data.identifier}</small>
              {' '}
              <a href={STOCK_MOVEMENT_URL.show(data.id)}>{data.name}</a>
              {' '}
              <small className="fade text-uppercase font-weight-bold" data-testid="direction-tag">
                {data.direction === 'INBOUND'
                  ? <Translate id="react.default.inbound.label" defaultMessage="Inbound" />
                  : <Translate id="react.default.outbound.label" defaultMessage="Outbound" />}
              </small>
            </div>
            <div>
              {data.identifier && (
                <span className="identifier mr-3">
                  <Translate id="react.stockMovement.identifier.label" defaultMessage="Identifier" />
                  {': '}
                  <b>{data.identifier}</b>
                </span>
              )}
              {data.shipmentTypeName && (
                <span className="shipmentType mr-3">
                  <Translate id="react.stockMovement.shipmentType.label" defaultMessage="Shipment type" />
                  {': '}
                  <b>{data.shipmentTypeName}</b>
                </span>
              )}
              {data.originName && (
                <span className="origin mr-3">
                  <Translate id="react.stockMovement.origin.label" defaultMessage="Origin" />
                  {': '}
                  <b>{data.originName}</b>
                </span>
              )}
              {data.destinationName && (
                <span className="destination mr-3">
                  <Translate id="react.stockMovement.destination.label" defaultMessage="Destination" />
                  {': '}
                  <b>{data.destinationName}</b>
                </span>
              )}
              <span className="mr-3">
                <Translate id="react.stockMovement.lineItems.label" defaultMessage="Line items" />
                {': '}
                <b>{data.lineItemsCount}</b>
              </span>
              <span className="mr-3">
                <Translate id="react.stockMovement.totalValue.label" defaultMessage="Total value" />
                {': '}
                <b>{data.totalValueDisplay}</b>
              </span>
              <span className="mr-3">
                <Translate id="react.stockMovement.totalWeight.label" defaultMessage="Total weight" />
                {': '}
                <b>{data.totalWeightDisplay}</b>
              </span>
            </div>
            <div>
              {data.showDateRequested && (
                <span className="dateRequested mr-3">
                  <Translate id="react.stockMovement.dateRequested.label" defaultMessage="Date requested" />
                  {': '}
                  <b>{data.dateRequested}</b>
                </span>
              )}
              {!data.hasShipped ? (
                data.expectedShippingDate && (
                  <span className="expectedShippingDate mr-3">
                    <Translate id="react.stockMovement.expectedShippingDate.label" defaultMessage="Expected shipping date" />
                    {': '}
                    <b>{data.expectedShippingDate}</b>
                  </span>
                )
              ) : (
                <span className="actualShippingDate mr-3">
                  <Translate id="react.stockMovement.actualShippingDate.label" defaultMessage="Actual shipping date" />
                  {': '}
                  <b>{data.actualShippingDate}</b>
                </span>
              )}
              {!data.wasReceived ? (
                data.expectedDeliveryDate && (
                  <span className="expectedDeliveryDate mr-3">
                    <Translate id="react.stockMovement.expectedDeliveryDate.label" defaultMessage="Expected delivery date" />
                    {': '}
                    <b>{data.expectedDeliveryDate}</b>
                  </span>
                )
              ) : (
                <span className="actualDeliveryDate mr-3">
                  <Translate id="react.stockMovement.actualDeliveryDate.label" defaultMessage="Actual delivery date" />
                  {' '}
                  <b>{data.actualDeliveryDate}</b>
                </span>
              )}
              {data.lastUpdatedPretty && (
                <span className="lastUpdated mr-3">
                  <Translate id="react.default.lastUpdated.label" defaultMessage="Last updated" />
                  {' '}
                  <b>{data.lastUpdatedPretty}</b>
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="tag tag-alert badge badge-danger" data-testid="status-tag">
              {data.statusLabel}
            </div>
          </div>
        </div>
      </section>

      <div className="button-bar d-flex align-items-center mb-3">
        <div className="btn-group mr-2">
          <a
            href={`${STOCK_MOVEMENT_URL.list()}?direction=${data.direction}`}
            className="btn btn-outline-secondary btn-sm"
          >
            <Translate id="react.default.button.list.label" defaultMessage="List" />
          </a>
          <a href={`${CONTEXT_PATH}/stockMovement/create`} className="btn btn-outline-secondary btn-sm">
            <Translate id="react.default.button.create.label" defaultMessage="Create" />
          </a>
        </div>
        <div className="btn-group mr-2">
          <a href={STOCK_TRANSFER_URL.genericEdit(data.id)} className="btn btn-outline-secondary btn-sm">
            <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
          </a>
          <a
            href={`${CONTEXT_PATH}/partialReceiving/create/${data.shipmentId}`}
            className="btn btn-outline-secondary btn-sm"
          >
            <Translate id="react.default.button.receive.label" defaultMessage="Receive" />
          </a>
          {data.showRollbackLastReceipt && (
            <a
              href={`${CONTEXT_PATH}/partialReceiving/rollbackLastReceipt/${data.shipmentId}`}
              className="btn btn-outline-secondary btn-sm"
            >
              <Translate id="react.stockMovement.rollbackLastReceipt.label" defaultMessage="Rollback last receipt" />
            </a>
          )}
          {data.showRollback && (
            <a
              href={`${CONTEXT_PATH}/stockTransfer/rollback/${data.id}`}
              className="btn btn-outline-secondary btn-sm"
            >
              <Translate id="react.default.button.rollback.label" defaultMessage="Rollback" />
            </a>
          )}
          {data.showDelete && (
            <a
              href={`${CONTEXT_PATH}/stockTransfer/remove/${data.id}?orderId=${data.orderId}`}
              className="btn btn-outline-secondary btn-sm"
              onClick={onDelete}
            >
              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
            </a>
          )}
          {data.isSuperuser && (
            <a
              href={`${CONTEXT_PATH}/stockMovement/synchronizeDialog/${data.id}`}
              className="btn btn-outline-secondary btn-sm"
            >
              <Translate id="react.default.button.synchronize.label" defaultMessage="Synchronize" />
            </a>
          )}
        </div>
        {visibleDocuments.length > 0 && (
          <div className="btn-group ml-auto">
            <a
              href={`${CONTEXT_PATH}/stockMovement/addDocument/${data.id}`}
              className="btn btn-outline-secondary btn-sm"
            >
              <Translate id="react.stockMovement.uploadDocuments.label" defaultMessage="Upload documents" />
            </a>
            <div className="dropdown d-inline-block">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                data-toggle="dropdown"
              >
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </button>
              <div className="dropdown-menu">
                {visibleDocuments.map((document) => (
                  <a
                    key={document.uri}
                    className="dropdown-item"
                    href={document.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {document.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="box p-3 mb-3">
            <h2><Translate id="react.default.details.label" defaultMessage="Details" /></h2>
            <table className="table table-sm">
              <tbody>
                <DetailRow label={<Translate id="react.stockMovement.identifier.label" defaultMessage="Identifier" />}>
                  {data.identifier}
                </DetailRow>
                <DetailRow label={<Translate id="react.default.status.label" defaultMessage="Status" />}>
                  {data.statusLabel}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.origin.label" defaultMessage="Origin" />}>
                  {data.originName}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.destination.label" defaultMessage="Destination" />}>
                  {data.destinationName}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.comments.label" defaultMessage="Comments" />}>
                  {data.comments || none}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.trackingNumber.label" defaultMessage="Tracking number" />}>
                  {data.trackingNumber || none}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.driverName.label" defaultMessage="Driver name" />}>
                  {data.driverName || none}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.shipmentType.label" defaultMessage="Shipment type" />}>
                  {data.shipmentTypeName || none}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.totalValue.label" defaultMessage="Total value" />}>
                  {data.totalValueDisplay}
                </DetailRow>
                {data.orderId && (
                  <>
                    <DetailRow label={<Translate id="react.stockMovement.orderType.label" defaultMessage="Order type" />}>
                      <span id="orderTypeCode">{data.orderTypeLabel}</span>
                    </DetailRow>
                    <DetailRow label={<Translate id="react.stockMovement.order.label" defaultMessage="Order" />}>
                      <a href={`${ORDER_URL.show(data.orderId)}?override=true`}>
                        <Translate id="react.stockMovement.viewOrder.label" defaultMessage="View Order" />
                        {' '}
                        {data.orderNumber}
                      </a>
                    </DetailRow>
                  </>
                )}
                {data.isSuperuser && data.shipmentId && (
                  <DetailRow label={<Translate id="react.stockMovement.shipment.label" defaultMessage="Shipment" />}>
                    <a href={`${CONTEXT_PATH}/shipment/showDetails/${data.shipmentId}?override=true`}>
                      <Translate id="react.stockMovement.viewShipment.label" defaultMessage="View Shipment" />
                      {' '}
                      {data.shipmentNumber}
                    </a>
                  </DetailRow>
                )}
                {data.isSuperuser && data.incomingTransactions.length > 0 && (
                  <DetailRow label={<Translate id="react.default.inbound.label" defaultMessage="Inbound" />}>
                    {data.incomingTransactions.map((transaction) => (
                      <div key={transaction.id}>
                        <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                          <Translate id="react.stockMovement.viewTransaction.label" defaultMessage="View Transaction" />
                          {' '}
                          {transaction.transactionNumber}
                        </a>
                      </div>
                    ))}
                  </DetailRow>
                )}
                {data.isSuperuser && data.outgoingTransactions.length > 0 && (
                  <DetailRow label={<Translate id="react.default.outbound.label" defaultMessage="Outbound" />}>
                    {data.outgoingTransactions.map((transaction) => (
                      <div key={transaction.id}>
                        <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                          <Translate id="react.stockMovement.viewTransaction.label" defaultMessage="View Transaction" />
                          {' '}
                          {transaction.transactionNumber}
                        </a>
                      </div>
                    ))}
                  </DetailRow>
                )}
              </tbody>
            </table>
          </div>
          <div className="box p-3 mb-3">
            <h2><Translate id="react.default.auditing.label" defaultMessage="Auditing" /></h2>
            <table className="table table-sm">
              <tbody>
                <DetailRow label={<Translate id="react.stockMovement.dateShipped.label" defaultMessage="Date shipped" />}>
                  {data.auditing.dateShipped ? (
                    <>
                      <span title={data.auditing.dateShippedTitle}>
                        {data.auditing.dateShipped}
                      </span>
                      {data.auditing.shippedBy && (
                        <>
                          {' '}
                          <Translate id="react.default.by.label" defaultMessage="by" />
                          {' '}
                          {data.auditing.shippedBy}
                        </>
                      )}
                    </>
                  ) : none}
                </DetailRow>
                <DetailRow label={<Translate id="react.stockMovement.dateReceived.label" defaultMessage="Date received" />}>
                  {data.auditing.receipts.length ? (
                    data.auditing.receipts.map((receipt, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <span key={i}>
                        <span title={receipt.actualDeliveryDateTitle}>
                          {receipt.actualDeliveryDate}
                        </span>
                        {receipt.recipientName && (
                          <>
                            {' '}
                            <Translate id="react.default.by.label" defaultMessage="by" />
                            {' '}
                            {receipt.recipientName}
                          </>
                        )}
                      </span>
                    ))
                  ) : none}
                </DetailRow>
                <DetailRow label={<Translate id="react.default.dateCreated.label" defaultMessage="Date created" />}>
                  {data.auditing.dateCreated ? (
                    <>
                      <span title={data.auditing.dateCreatedTitle}>
                        {data.auditing.dateCreated}
                      </span>
                      {data.auditing.createdByName && (
                        <>
                          {' '}
                          <Translate id="react.default.by.label" defaultMessage="by" />
                          {' '}
                          {data.auditing.createdByName}
                        </>
                      )}
                    </>
                  ) : none}
                </DetailRow>
                <DetailRow label={<Translate id="react.default.lastUpdated.label" defaultMessage="Last updated" />}>
                  {data.auditing.lastUpdated ? (
                    <>
                      <span title={data.auditing.lastUpdatedTitle}>
                        {data.auditing.lastUpdated}
                      </span>
                      {data.auditing.updatedByName && (
                        <>
                          {' '}
                          <Translate id="react.default.by.label" defaultMessage="by" />
                          {' '}
                          {data.auditing.updatedByName}
                        </>
                      )}
                    </>
                  ) : none}
                </DetailRow>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-8">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'packingList' ? 'active' : ''}`}
                onClick={() => setActiveTab('packingList')}
              >
                <Translate id="react.stockMovement.packingList.label" defaultMessage="Packing List" />
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'receipts' ? 'active' : ''}`}
                onClick={() => setActiveTab('receipts')}
              >
                <Translate id="react.stockMovement.receipts.label" defaultMessage="Receipts" />
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <Translate id="react.stockMovement.documents.label" defaultMessage="Documents" />
              </button>
            </li>
          </ul>

          {activeTab === 'packingList' && (
            <section id="packingList" className="box p-3" aria-label="Packing List">
              <h2><Translate id="react.stockMovement.packingList.label" defaultMessage="Packing List" /></h2>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th />
                    <th><Translate id="react.stockMovement.container.label" defaultMessage="Container" /></th>
                    {data.packingList.isFromPurchaseOrder && (
                      <th><Translate id="react.stockMovement.orderNumber.label" defaultMessage="Order Number" /></th>
                    )}
                    <th><Translate id="react.stockMovement.productCode.label" defaultMessage="Code" /></th>
                    <th><Translate id="react.stockMovement.product.label" defaultMessage="Product" /></th>
                    <th className="text-left"><Translate id="react.stockMovement.binLocation.label" defaultMessage="Bin Location" /></th>
                    <th className="text-left"><Translate id="react.stockMovement.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
                    <th className="text-center"><Translate id="react.stockMovement.expires.label" defaultMessage="Expires" /></th>
                    <th className="text-center"><Translate id="react.stockMovement.quantityShipped.label" defaultMessage="Shipped" /></th>
                    {data.packingList.showReceivedColumns && (
                      <>
                        <th className="text-center"><Translate id="react.stockMovement.quantityReceived.label" defaultMessage="Received" /></th>
                        <th className="text-center"><Translate id="react.stockMovement.quantityCanceled.label" defaultMessage="Canceled" /></th>
                      </>
                    )}
                    <th><Translate id="react.stockMovement.uom.label" defaultMessage="UOM" /></th>
                    <th><Translate id="react.stockMovement.recipient.label" defaultMessage="Recipient" /></th>
                    <th className="text-left"><Translate id="react.default.comment.label" defaultMessage="Comment" /></th>
                    <th><Translate id="react.stockMovement.isFullyReceived.label" defaultMessage="Received?" /></th>
                  </tr>
                </thead>
                <tbody>
                  {data.packingList.rows.length ? data.packingList.rows.map((row) => (
                    <tr key={row.id} className={`shipmentItem ${row.hasRecalledLot ? 'recalled' : ''}`}>
                      <td aria-label="Recalled" data-testid="recalled">
                        {row.hasRecalledLot && (
                          <div title={translate('react.stockMovement.recalledLot.label', 'Recalled lot')}>
                            <b>&#x24C7;</b>
                          </div>
                        )}
                      </td>
                      {row.newContainer ? (
                        <td aria-label="Details" rowSpan={row.rowspan} data-testid="details">
                          <b>
                            {row.parentContainerName && `${row.parentContainerName} \u203A `}
                            {row.containerName
                              || translate('react.stockMovement.unpacked.label', 'Unpacked')}
                          </b>
                        </td>
                      ) : null}
                      {data.packingList.isFromPurchaseOrder && (
                        <td aria-label="Order Number" data-testid="order-number">{row.orderNumber}</td>
                      )}
                      <td aria-label="Product Code" data-testid="product-code">{row.productCode}</td>
                      <td aria-label="Product" className="product" data-testid="product">
                        <a
                          href={INVENTORY_ITEM_URL.showStockCard(row.productId)}
                          style={{ color: row.productColor }}
                        >
                          {row.productName}
                        </a>
                      </td>
                      <td aria-label="Bin Location" data-testid="bin-location">
                        {data.packingList.isOrigin && (row.binLocation || 'Default')}
                        {!data.packingList.isOrigin && data.packingList.isDestination
                          && row.receiptItems.map((receiptItem, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={i} title={`${receiptItem.quantityReceived} ${receiptItem.unitOfMeasure}`}>
                              {receiptItem.binLocation || 'Default'}
                            </div>
                          ))}
                      </td>
                      <td aria-label="Lot Number" className="lotNumber" data-testid="lot-number">
                        {row.receiptItems.length ? row.receiptItems.map((receiptItem, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={i} title={`${receiptItem.quantityReceived} ${receiptItem.unitOfMeasure}`}>
                            {receiptItem.lotNumber}
                          </div>
                        )) : row.lotNumber}
                      </td>
                      <td aria-label="Expiration Date" className="text-center" data-testid="expiration-date">
                        {row.receiptItems.length ? row.receiptItems.map((receiptItem, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={i} title={`${receiptItem.quantityReceived} ${receiptItem.unitOfMeasure}`}>
                            {receiptItem.expirationDate
                              || <span className="fade"><Translate id="react.default.never.label" defaultMessage="Never" /></span>}
                          </div>
                        )) : (row.expirationDate
                          || <span className="fade"><Translate id="react.default.never.label" defaultMessage="Never" /></span>)}
                      </td>
                      <td aria-label="Quantity Shipped" className="text-center" data-testid="quantity-shipped">
                        {row.quantityShipped}
                      </td>
                      {data.packingList.showReceivedColumns && (
                        <>
                          <td
                            aria-label="Quantity Received"
                            className="text-center"
                            style={row.quantityReceived !== row.quantityShipped ? { color: 'red' } : {}}
                            data-testid="quantity-received"
                          >
                            {row.quantityReceived}
                          </td>
                          <td
                            aria-label="Quantity Canceled"
                            className="text-center"
                            style={row.quantityReceived !== row.quantityShipped ? { color: 'red' } : {}}
                            data-testid="quantity-canceled"
                          >
                            {row.quantityCanceled}
                          </td>
                        </>
                      )}
                      <td aria-label="Unit Of Measure" data-testid="uom">
                        {row.unitOfMeasure || translate('react.default.each.label', 'Each')}
                      </td>
                      <td aria-label="Recipient" className="text-left" data-testid="recipient">
                        {row.receiptItems.length ? row.receiptItems.map((receiptItem, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={i} title={`${receiptItem.quantityReceived} ${receiptItem.unitOfMeasure}`}>
                            {receiptItem.recipientName || none}
                          </div>
                        )) : (row.recipientName
                          && <div title={row.recipientEmail}>{row.recipientName}</div>)
                          || <div className="fade">{none}</div>}
                      </td>
                      <td aria-label="Comment" className="text-left" data-testid="comment">
                        {row.comments.length ? (
                          <div title={row.comments.join('\r\n')}>&#128221;</div>
                        ) : (
                          <div className="fade"><Translate id="react.default.empty.label" defaultMessage="Empty" /></div>
                        )}
                      </td>
                      <td aria-label="Is Fully Received" data-testid="is-fully-received">
                        {row.isFullyReceived}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="11" className="text-center fade empty">
                        <Translate id="react.stockMovement.noShipmentItems.label" defaultMessage="No shipment items" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === 'receipts' && (
            <section id="receipt" className="box p-3" aria-label="Receipt">
              <h2><Translate id="react.stockMovement.receipt.label" defaultMessage="Receipt" /></h2>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th><Translate id="react.stockMovement.receiptStatus.label" defaultMessage="Status" /></th>
                    <th><Translate id="react.stockMovement.receiptNumber.label" defaultMessage="Receipt Number" /></th>
                    <th><Translate id="react.stockMovement.shipmentNumber.label" defaultMessage="Shipment Number" /></th>
                    <th><Translate id="react.stockMovement.transactionNumber.label" defaultMessage="Transaction Number" /></th>
                    <th><Translate id="react.stockMovement.productCode.label" defaultMessage="Code" /></th>
                    <th><Translate id="react.stockMovement.product.label" defaultMessage="Product" /></th>
                    <th><Translate id="react.stockMovement.lotNumber.label" defaultMessage="Lot number" /></th>
                    <th><Translate id="react.stockMovement.expirationDate.label" defaultMessage="Expiration date" /></th>
                    <th><Translate id="react.stockMovement.binLocation.label" defaultMessage="Bin Location" /></th>
                    <th><Translate id="react.stockMovement.quantityCanceled.label" defaultMessage="Canceled" /></th>
                    <th><Translate id="react.stockMovement.quantityPending.label" defaultMessage="Pending" /></th>
                    <th><Translate id="react.stockMovement.quantityReceived.label" defaultMessage="Received" /></th>
                  </tr>
                </thead>
                <tbody>
                  {data.receipts.map((receiptItem, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      <td>
                        <span title={receiptItem.statusTitle}>{receiptItem.statusLabel}</span>
                      </td>
                      <td>{receiptItem.receiptNumber}</td>
                      <td>{receiptItem.shipmentNumber}</td>
                      <td>
                        {receiptItem.transactionId ? (
                          <a href={INVENTORY_URL.showTransaction(receiptItem.transactionId)}>
                            {receiptItem.transactionNumber}
                          </a>
                        ) : (
                          <Translate id="react.default.notAvailable.label" defaultMessage="N/A" />
                        )}
                      </td>
                      <td>
                        <a href={INVENTORY_ITEM_URL.showStockCard(receiptItem.productId)}>
                          {receiptItem.productCode}
                        </a>
                      </td>
                      <td>
                        <a href={INVENTORY_ITEM_URL.showStockCard(receiptItem.productId)}>
                          {receiptItem.productName}
                        </a>
                      </td>
                      <td>{receiptItem.lotNumber}</td>
                      <td>{receiptItem.expirationDate}</td>
                      <td>{receiptItem.binLocation}</td>
                      <td>{receiptItem.quantityCanceled}</td>
                      <td>{receiptItem.quantityPending}</td>
                      <td>{receiptItem.quantityReceived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.receipts.length && (
                <div className="empty fade text-center">
                  <Translate id="react.stockMovement.noReceipt.label" defaultMessage="Shipment has not been received yet" />
                </div>
              )}
            </section>
          )}

          {activeTab === 'documents' && (
            <section id="documents" className="box p-3" aria-label="Documents">
              <h2><Translate id="react.stockMovement.documents.label" defaultMessage="Documents" /></h2>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th><Translate id="react.default.name.label" defaultMessage="Name" /></th>
                    <th><Translate id="react.stockMovement.documentType.label" defaultMessage="Document type" /></th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibleDocuments.map((document) => (
                    <tr key={document.uri}>
                      <td>{document.name}</td>
                      <td>{document.documentType}</td>
                      <td>
                        <a href={document.uri} target="_blank" rel="noopener noreferrer">
                          <Translate id="react.default.button.download.label" defaultMessage="Download" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!visibleDocuments.length && (
                    <tr>
                      <td colSpan="3" className="text-center fade empty">
                        {none}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

const mapStateToProps = (state) => ({
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
});

export default connect(mapStateToProps)(ReturnsShow);

ReturnsShow.propTypes = {
  translate: PropTypes.func.isRequired,
};
