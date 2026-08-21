import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { STOCK_MOVEMENT_SHOW_DETAILS } from 'api/urls';
import Tabs from 'components/listPagesUtils/Tabs';
import {
  StockMovementCommentsTab,
  StockMovementDocumentsTab,
  StockMovementEventsTab,
  StockMovementPackingListTab,
  StockMovementReceiptsTab,
  StockMovementRequisitionTab,
} from 'components/stock-movement/show/StockMovementShowTabs';
import {
  INVENTORY_URL,
  ORDER_URL,
  PARTIAL_RECEIVING_URL,
  REQUISITION_URL,
  SHIPMENT_URL,
  STOCK_MOVEMENT_URL,
  STOCK_REQUEST_URL,
  STOCK_TRANSFER_URL,
} from 'consts/applicationUrls';
import useFlashScopeListener from 'hooks/useFlashScopeListener';
import useQueryParams from 'hooks/useQueryParams';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const TAB = {
  REQUISITION: 'requisition',
  PACKING_LIST: 'packingList',
  RECEIPTS: 'receipts',
  EVENTS: 'events',
  DOCUMENTS: 'documents',
  COMMENTS: 'comments',
};

const StockMovementShow = ({ match, history }) => {
  useTranslation('stockMovement', 'default');
  useFlashScopeListener();
  const stockMovementId = match.params.id;
  const queryParams = useQueryParams();

  const [stockMovement, setStockMovement] = useState(null);

  useEffect(() => {
    apiClient.get(STOCK_MOVEMENT_SHOW_DETAILS(stockMovementId))
      .then((response) => setStockMovement(response.data.data));
  }, [stockMovementId]);

  if (!stockMovement) {
    return (
      <PageWrapper>
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </PageWrapper>
    );
  }

  // Legacy default tab: requisition when the shipment is pending at the origin
  // or the origin is a supplier; otherwise the packing list
  const defaultTab = stockMovement.defaultTabIsFirst && !stockMovement.originIsSupplier
    ? TAB.REQUISITION
    : TAB.PACKING_LIST;
  const activeTab = Object.values(TAB).includes(queryParams?.tab)
    ? queryParams.tab
    : defaultTab;

  const switchTab = (tab) => {
    history.push({ search: `?tab=${tab}` });
  };

  const tabLabel = (id, defaultMessage) => ({ id, defaultMessage });

  const tabsConfig = {
    ...(!stockMovement.originIsSupplier ? {
      [TAB.REQUISITION]: {
        label: tabLabel('react.stockMovement.tab.requestDetails.label', 'Request Details'),
        onClick: switchTab,
      },
    } : {}),
    [TAB.PACKING_LIST]: {
      label: tabLabel('react.stockMovement.tab.packingList.label', 'Packing List'),
      onClick: switchTab,
    },
    [TAB.RECEIPTS]: {
      label: tabLabel('react.stockMovement.tab.receipts.label', 'Receipts'),
      onClick: switchTab,
    },
    [TAB.EVENTS]: {
      label: tabLabel('react.stockMovement.tab.events.label', 'Events'),
      onClick: switchTab,
    },
    [TAB.DOCUMENTS]: {
      label: tabLabel('react.stockMovement.tab.documents.label', 'Documents'),
      onClick: switchTab,
    },
    ...(!stockMovement.isReturn ? {
      [TAB.COMMENTS]: {
        label: tabLabel(
          'react.stockMovement.tab.comments.label',
          `Comments${stockMovement.commentCount ? ` (${stockMovement.commentCount})` : ''}`,
        ),
        onClick: switchTab,
      },
    } : {}),
  };

  const renderTab = () => {
    switch (activeTab) {
      case TAB.REQUISITION:
        return <StockMovementRequisitionTab stockMovementId={stockMovementId} />;
      case TAB.RECEIPTS:
        return <StockMovementReceiptsTab stockMovementId={stockMovementId} />;
      case TAB.EVENTS:
        return <StockMovementEventsTab stockMovementId={stockMovementId} />;
      case TAB.DOCUMENTS:
        return (
          <StockMovementDocumentsTab
            stockMovementId={stockMovementId}
            shipmentId={stockMovement.shipmentId}
          />
        );
      case TAB.COMMENTS:
        return <StockMovementCommentsTab stockMovementId={stockMovementId} />;
      case TAB.PACKING_LIST:
      default:
        return <StockMovementPackingListTab stockMovementId={stockMovementId} />;
    }
  };

  const detailRow = (labelId, defaultMessage, value) => (
    <tr>
      <td className="pr-3 font-weight-bold align-top">
        <Translate id={labelId} defaultMessage={defaultMessage} />
      </td>
      <td>{value}</td>
    </tr>
  );

  const noneLabel = <Translate id="react.default.none.label" defaultMessage="None" />;

  const confirmDelete = (event) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure?')) event.preventDefault();
  };

  const canApproveOrReject = stockMovement.supportsApproveRequest
    && stockMovement.isPendingApproval
    && stockMovement.userHasRequestApproverRole;

  const canDelete = stockMovement.isPending
    && (stockMovement.isSameOrigin || !stockMovement.originIsDepot)
    && !stockMovement.electronicType;

  const canDeleteRequest = stockMovement.isPending
    && (stockMovement.isSameOrigin || stockMovement.isSameDestination
      || !stockMovement.originIsDepot)
    && stockMovement.electronicType;

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <div className="d-flex justify-content-between align-items-start">
          <h3>
            {stockMovement.identifier}
            {' '}
            {stockMovement.name}
          </h3>
          <div className="d-flex flex-wrap gap-8">
            {stockMovement.showListButton && (
              <a className="btn btn-outline-primary btn-sm" href={`${STOCK_MOVEMENT_URL.list()}?direction=${stockMovement.listDirection}`}>
                <Translate id="react.default.button.list.label" defaultMessage="List" />
              </a>
            )}
            <a className="btn btn-outline-primary btn-sm" href={STOCK_MOVEMENT_URL.create()}>
              <Translate id="react.default.button.create.label" defaultMessage="Create" />
            </a>
            {!stockMovement.isApprovalRequired && (
              <>
                {stockMovement.orderId ? (
                  <a className="btn btn-outline-primary btn-sm" href={STOCK_TRANSFER_URL.genericEdit(stockMovement.orderId)}>
                    <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                  </a>
                ) : (
                  <a className="btn btn-outline-primary btn-sm" href={STOCK_MOVEMENT_URL.genericEdit(stockMovement.id)}>
                    <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                  </a>
                )}
                <a className="btn btn-outline-primary btn-sm" href={PARTIAL_RECEIVING_URL.create(stockMovement.shipmentId)}>
                  <Translate id="react.default.button.receive.label" defaultMessage="Receive" />
                </a>
                {stockMovement.isUserAdmin
                  && (stockMovement.hasBeenReceived || stockMovement.hasBeenPartiallyReceived) && (
                  <a className="btn btn-outline-danger btn-sm" href={PARTIAL_RECEIVING_URL.rollbackLastReceipt(stockMovement.shipmentId)}>
                    <Translate id="react.stockMovement.button.rollbackLastReceipt.label" defaultMessage="Rollback Last Receipt" />
                  </a>
                )}
                {stockMovement.isUserAdmin
                  && !(stockMovement.hasBeenReceived || stockMovement.hasBeenPartiallyReceived)
                  && (stockMovement.hasBeenIssued
                    || ((stockMovement.hasBeenShipped || stockMovement.hasBeenPartiallyReceived)
                      && stockMovement.isFromOrder))
                  && (
                    <a className="btn btn-outline-danger btn-sm" href={STOCK_MOVEMENT_URL.rollback(stockMovement.id)}>
                      <Translate id="react.default.button.rollback.label" defaultMessage="Rollback" />
                    </a>
                  )}
                {canDelete && (
                  <a
                    className="btn btn-outline-danger btn-sm"
                    href={STOCK_MOVEMENT_URL.remove(stockMovement.id)}
                    onClick={confirmDelete}
                  >
                    <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                  </a>
                )}
                {canDeleteRequest && (
                  <a
                    className="btn btn-outline-danger btn-sm"
                    href={STOCK_REQUEST_URL.remove(stockMovement.id)}
                    onClick={confirmDelete}
                  >
                    <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                  </a>
                )}
              </>
            )}
            {stockMovement.isApprovalRequired && (
              <>
                {stockMovement.canUserEdit && (
                  <a className="btn btn-outline-primary btn-sm" href={STOCK_MOVEMENT_URL.genericEdit(stockMovement.id)}>
                    <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                  </a>
                )}
                {canApproveOrReject && (
                  <>
                    <a className="btn btn-outline-success btn-sm" href={`${STOCK_MOVEMENT_URL.base}/updateStatus/${stockMovement.id}?status=APPROVED`}>
                      <Translate id="react.stockMovement.button.approve.label" defaultMessage="Approve" />
                    </a>
                    <a className="btn btn-outline-danger btn-sm" href={STOCK_REQUEST_URL.reject(stockMovement.id)}>
                      <Translate id="react.stockMovement.button.reject.label" defaultMessage="Reject" />
                    </a>
                  </>
                )}
                {stockMovement.supportsApproveRequest && stockMovement.canRollbackApproval && (
                  <a className="btn btn-outline-danger btn-sm" href={STOCK_REQUEST_URL.rollbackApproval(stockMovement.id)}>
                    <Translate id="react.stockMovement.button.rollbackApproval.label" defaultMessage="Rollback Approval" />
                  </a>
                )}
              </>
            )}
            {!stockMovement.isReturn && (
              <a className="btn btn-outline-primary btn-sm" href={STOCK_MOVEMENT_URL.addComment(stockMovement.id)}>
                <Translate id="react.stockMovement.button.addComment.label" defaultMessage="Add comment" />
              </a>
            )}
            <a className="btn btn-outline-primary btn-sm" href={STOCK_MOVEMENT_URL.addDocument(stockMovement.id)}>
              <Translate id="react.stockMovement.button.uploadDocuments.label" defaultMessage="Upload documents" />
            </a>
          </div>
        </div>
        <div className="d-flex flex-wrap">
          <table className="mr-5">
            <tbody>
              {detailRow('react.stockMovement.identifier.label', 'Identification number', stockMovement.identifier)}
              {detailRow('react.stockMovement.status.label', 'Status', stockMovement.statusLabel)}
              {detailRow(
                'react.stockMovement.mostRecentEvent.label',
                'Most recent event',
                stockMovement.latestEvent && (
                  stockMovement.latestEvent.isPutaway && stockMovement.latestEvent.url ? (
                    <a href={stockMovement.latestEvent.url}>
                      {stockMovement.latestEvent.name}
                      {' '}
                      {stockMovement.latestEvent.identifier}
                    </a>
                  ) : stockMovement.latestEvent.name
                ),
              )}
              {stockMovement.isFromPurchaseOrder
                && detailRow('react.stockMovement.originCode.label', 'Origin code', stockMovement.originCode)}
              {detailRow('react.stockMovement.origin.label', 'Origin', stockMovement.originName)}
              {detailRow('react.stockMovement.destination.label', 'Destination', stockMovement.destinationName)}
              {stockMovement.isSameOrigin
                && detailRow('react.stockMovement.requestType.label', 'Request type', stockMovement.requestTypeName)}
              {stockMovement.isElectronicType
                && detailRow('react.stockMovement.desiredDateOfDelivery.label', 'Desired date of delivery', stockMovement.dateDeliveryRequested || noneLabel)}
              {detailRow('react.stockMovement.stocklist.label', 'Stocklist', stockMovement.stocklistName || noneLabel)}
              {stockMovement.approvers
                && detailRow('react.stockMovement.approvers.label', 'Approvers', stockMovement.approvers)}
              {detailRow('react.stockMovement.comments.label', 'Comments', stockMovement.comments || noneLabel)}
              {detailRow('react.stockMovement.trackingNumber.label', 'Tracking number', stockMovement.trackingNumber || noneLabel)}
              {detailRow('react.stockMovement.driverName.label', 'Driver name', stockMovement.driverName || noneLabel)}
              {detailRow('react.stockMovement.shipmentType.label', 'Shipment type', stockMovement.shipmentTypeName || noneLabel)}
              {detailRow('react.stockMovement.totalValue.label', 'Total value', stockMovement.totalValue)}
              {stockMovement.orders.length > 0 && detailRow(
                'react.stockMovement.order.label',
                'Order',
                stockMovement.orders.map((order) => (
                  <div key={order.id}>
                    <a href={`${ORDER_URL.show(order.id)}?override=true`}>
                      <Translate id="react.stockMovement.viewOrder.label" defaultMessage="View Order" />
                      {' '}
                      {order.orderNumber}
                    </a>
                  </div>
                )),
              )}
              {stockMovement.isSuperuser && stockMovement.requisitionLink && detailRow(
                'react.stockMovement.requisition.label',
                'Requisition',
                <a href={`${REQUISITION_URL.base}/show/${stockMovement.requisitionLink.id}?override=true`}>
                  <Translate id="react.stockMovement.viewRequisition.label" defaultMessage="View Requisition" />
                  {' '}
                  {stockMovement.requisitionLink.number}
                </a>,
              )}
              {stockMovement.isSuperuser && stockMovement.shipmentLink && detailRow(
                'react.stockMovement.shipment.label',
                'Shipment',
                <a href={`${SHIPMENT_URL.showDetails(stockMovement.shipmentLink.id)}?override=true`}>
                  <Translate id="react.stockMovement.viewShipment.label" defaultMessage="View Shipment" />
                  {' '}
                  {stockMovement.shipmentLink.number}
                </a>,
              )}
              {stockMovement.isSuperuser && stockMovement.inboundTransactions.length > 0
                && detailRow(
                  'react.stockMovement.inbound.label',
                  'Inbound',
                  stockMovement.inboundTransactions.map((transaction) => (
                    <div key={transaction.id}>
                      <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                        <Translate id="react.stockMovement.viewTransaction.label" defaultMessage="View Transaction" />
                        {' '}
                        {transaction.number}
                      </a>
                    </div>
                  )),
                )}
              {stockMovement.isSuperuser && stockMovement.outboundTransactions.length > 0
                && detailRow(
                  'react.stockMovement.outbound.label',
                  'Outbound',
                  stockMovement.outboundTransactions.map((transaction) => (
                    <div key={transaction.id}>
                      <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                        <Translate id="react.stockMovement.viewTransaction.label" defaultMessage="View Transaction" />
                        {' '}
                        {transaction.number}
                      </a>
                    </div>
                  )),
                )}
            </tbody>
          </table>
          <table>
            <tbody>
              {detailRow(
                'react.stockMovement.dateRequested.label',
                'Date requested',
                stockMovement.auditing.dateRequested
                  ? `${stockMovement.auditing.dateRequested} ${stockMovement.auditing.requestedBy ? `by ${stockMovement.auditing.requestedBy}` : ''}`
                  : noneLabel,
              )}
              {stockMovement.auditing.approvalLabel && detailRow(
                stockMovement.auditing.approvalLabel === 'dateApproved'
                  ? 'react.stockMovement.dateApproved.label'
                  : 'react.stockMovement.dateRejected.label',
                stockMovement.auditing.approvalLabel === 'dateApproved' ? 'Date approved' : 'Date rejected',
                stockMovement.auditing.approvalDate
                  ? `${stockMovement.auditing.approvalDate} by ${stockMovement.auditing.approvalBy}`
                  : noneLabel,
              )}
              {detailRow(
                'react.stockMovement.dateShipped.label',
                'Date shipped',
                stockMovement.auditing.dateShipped
                  ? `${stockMovement.auditing.dateShipped} ${stockMovement.auditing.shippedBy ? `by ${stockMovement.auditing.shippedBy}` : ''}`
                  : noneLabel,
              )}
              {detailRow(
                'react.stockMovement.dateReceived.label',
                'Date received',
                stockMovement.auditing.receipts.length > 0
                  ? stockMovement.auditing.receipts.map((receipt) => (
                    <div key={`${receipt.date}-${receipt.recipient}`}>
                      {receipt.date}
                      {receipt.recipient ? ` by ${receipt.recipient}` : ''}
                    </div>
                  ))
                  : noneLabel,
              )}
              {detailRow(
                'react.stockMovement.dateCreated.label',
                'Date created',
                stockMovement.auditing.dateCreated
                  ? `${stockMovement.auditing.dateCreated} ${stockMovement.auditing.createdBy ? `by ${stockMovement.auditing.createdBy}` : ''}`
                  : noneLabel,
              )}
              {detailRow(
                'react.stockMovement.lastUpdated.label',
                'Last updated',
                stockMovement.auditing.lastUpdated
                  ? `${stockMovement.auditing.lastUpdated} ${stockMovement.auditing.updatedBy ? `by ${stockMovement.auditing.updatedBy}` : ''}`
                  : noneLabel,
              )}
            </tbody>
          </table>
        </div>
        <Tabs config={tabsConfig} className="mt-3" />
        {renderTab()}
      </div>
    </PageWrapper>
  );
};

export default StockMovementShow;

StockMovementShow.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
};
