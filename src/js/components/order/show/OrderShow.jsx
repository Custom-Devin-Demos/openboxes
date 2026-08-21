import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { ORDER_DETAILS, ORDER_SUMMARY } from 'api/urls';
import Tabs from 'components/listPagesUtils/Tabs';
import {
  OrderAdjustmentsTab,
  OrderCommentsTab,
  OrderDocumentsTab,
  OrderInvoicesTab,
  OrderItemDetailsTab,
  OrderItemStatusTab,
  OrderShipmentsTab,
  OrderSummaryTab,
} from 'components/order/show/OrderShowTabs';
import {
  INVOICE_URL, ORDER_URL, PURCHASE_ORDER_URL, PUTAWAY_URL,
} from 'consts/applicationUrls';
import useQueryParams from 'hooks/useQueryParams';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const TAB = {
  SUMMARY: 'summary',
  ITEM_STATUS: 'itemStatus',
  ITEM_DETAILS: 'itemDetails',
  ADJUSTMENTS: 'adjustments',
  SHIPMENTS: 'shipments',
  INVOICES: 'invoices',
  DOCUMENTS: 'documents',
  COMMENTS: 'comments',
};

const OrderShow = ({ match, history }) => {
  useTranslation('orderShow', 'default');
  const orderId = match.params.id;
  const queryParams = useQueryParams();
  const activeTab = Object.values(TAB).includes(queryParams?.tab)
    ? queryParams.tab
    : TAB.SUMMARY;

  const [order, setOrder] = useState(null);
  const [derivedStatus, setDerivedStatus] = useState(null);

  useEffect(() => {
    apiClient.get(ORDER_DETAILS(orderId))
      .then((response) => setOrder(response.data.data));
    apiClient.get(ORDER_SUMMARY(orderId))
      .then((response) => setDerivedStatus(response.data.data?.derivedStatus));
  }, [orderId]);

  if (!order) {
    return (
      <PageWrapper>
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </PageWrapper>
    );
  }

  const switchTab = (tab) => {
    history.push({ search: `?tab=${tab}` });
  };

  const tabLabel = (id, defaultMessage) => ({ id, defaultMessage });

  const tabsConfig = {
    [TAB.SUMMARY]: {
      label: tabLabel('react.orderShow.tab.summary.label', 'Summary'),
      onClick: switchTab,
    },
    [TAB.ITEM_STATUS]: {
      label: tabLabel('react.orderShow.tab.itemStatus.label', 'Item Status'),
      onClick: switchTab,
    },
    [TAB.ITEM_DETAILS]: {
      label: tabLabel('react.orderShow.tab.itemDetails.label', 'Item Details'),
      onClick: switchTab,
    },
    ...(order.isPurchaseOrder ? {
      [TAB.ADJUSTMENTS]: {
        label: tabLabel('react.orderShow.tab.adjustments.label', 'Adjustments'),
        onClick: switchTab,
      },
      [TAB.SHIPMENTS]: {
        label: tabLabel('react.orderShow.tab.shipments.label', 'Shipments'),
        onClick: switchTab,
      },
      [TAB.INVOICES]: {
        label: tabLabel('react.orderShow.tab.invoices.label', 'Invoices'),
        onClick: switchTab,
      },
    } : {}),
    [TAB.DOCUMENTS]: {
      label: tabLabel('react.orderShow.tab.documents.label', 'Documents'),
      onClick: switchTab,
    },
    [TAB.COMMENTS]: {
      label: tabLabel(
        'react.orderShow.tab.comments.label',
        `Comments${order.commentsCount ? ` (${order.commentsCount})` : ''}`,
      ),
      onClick: switchTab,
    },
  };

  const canEdit = order.isPurchaseOrder
    && !order.isPutawayOrder
    && (order.isPending || (order.isPlaced && (order.isApprover || order.isSuperuser)));

  const canPlaceOrder = order.isPurchaseOrder
    && order.isPending
    && order.supportsPlaceOrder
    && !order.hasRoleAssistant;

  const canDelete = order.isSuperuser || (order.isBeforePlaced && !order.hasShipments);

  const renderTab = () => {
    switch (activeTab) {
      case TAB.ITEM_STATUS:
        return <OrderItemStatusTab orderId={orderId} />;
      case TAB.ITEM_DETAILS:
        return <OrderItemDetailsTab orderId={orderId} />;
      case TAB.ADJUSTMENTS:
        return <OrderAdjustmentsTab orderId={orderId} />;
      case TAB.SHIPMENTS:
        return <OrderShipmentsTab orderId={orderId} />;
      case TAB.INVOICES:
        return <OrderInvoicesTab orderId={orderId} />;
      case TAB.DOCUMENTS:
        return <OrderDocumentsTab orderId={orderId} />;
      case TAB.COMMENTS:
        return <OrderCommentsTab orderId={orderId} />;
      case TAB.SUMMARY:
      default:
        return <OrderSummaryTab orderId={orderId} />;
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

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <div className="d-flex justify-content-between align-items-start">
          <h3>
            {order.orderNumber}
            {' '}
            {order.name}
          </h3>
          <div className="d-flex flex-wrap gap-8">
            {canEdit && (
              <a className="btn btn-outline-primary btn-sm" href={PURCHASE_ORDER_URL.edit(order.id)}>
                <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
              </a>
            )}
            {order.isPutawayOrder ? (
              <a className="btn btn-outline-primary btn-sm" href={PUTAWAY_URL.generatePdf(order.id)}>
                <Translate id="react.orderShow.button.print.label" defaultMessage="Print" />
              </a>
            ) : (
              <a className="btn btn-outline-primary btn-sm" href={ORDER_URL.print(order.id)}>
                <Translate id="react.orderShow.button.print.label" defaultMessage="Print" />
              </a>
            )}
            {order.isPurchaseOrder && (
              <a className="btn btn-outline-primary btn-sm" href={ORDER_URL.download(order.id)}>
                <Translate id="react.orderShow.button.download.label" defaultMessage="Download" />
              </a>
            )}
            {order.isPurchaseOrder && order.isPlaced && order.hasRoleInvoice
              && order.isPrepaymentInvoiceAllowed && (
              <a className="btn btn-outline-primary btn-sm" href={`${INVOICE_URL.base}/createFromOrder/${order.id}`}>
                <Translate id="react.orderShow.button.generateInvoice.label" defaultMessage="Generate invoice" />
              </a>
            )}
            {canPlaceOrder && (
              <a className="btn btn-primary btn-sm" href={ORDER_URL.placeOrder(order.id)}>
                <Translate id="react.orderShow.button.placeOrder.label" defaultMessage="Place order" />
              </a>
            )}
            <a className="btn btn-outline-primary btn-sm" href={ORDER_URL.addComment(order.id)}>
              <Translate id="react.orderShow.button.addComment.label" defaultMessage="Add comment" />
            </a>
            <a className="btn btn-outline-primary btn-sm" href={ORDER_URL.addDocument(order.id)}>
              <Translate id="react.orderShow.button.addDocument.label" defaultMessage="Add document" />
            </a>
            {order.isPlaced && order.isSuperuser && (
              <a className="btn btn-outline-danger btn-sm" href={ORDER_URL.rollbackOrderStatus(order.id)}>
                <Translate id="react.orderShow.button.rollback.label" defaultMessage="Rollback" />
              </a>
            )}
            {canDelete && (
              <a className="btn btn-outline-danger btn-sm" href={ORDER_URL.remove(order.id)}>
                <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
              </a>
            )}
          </div>
        </div>
        <div className="d-flex flex-wrap">
          <table className="mr-5">
            <tbody>
              {detailRow('react.orderShow.orderNumber.label', 'Order Number', order.orderNumber)}
              {detailRow('react.orderShow.status.label', 'Status', derivedStatus || order.status)}
              {detailRow('react.orderShow.orderType.label', 'Order Type', order.orderTypeName)}
              {order.isPurchaseOrder
                && detailRow('react.orderShow.originCode.label', 'Origin Code', order.originCode)}
              {detailRow('react.orderShow.origin.label', 'Origin', order.origin)}
              {detailRow('react.orderShow.destination.label', 'Destination', order.destination)}
              {order.isPurchaseOrder && (
                <>
                  {detailRow('react.orderShow.paymentTerm.label', 'Payment Term', order.paymentTerm)}
                  {detailRow('react.orderShow.paymentMethod.label', 'Payment Method', order.paymentMethodType)}
                  {detailRow('react.orderShow.subtotal.label', 'Subtotal', `${order.subtotal} ${order.currencyCode}`)}
                  {detailRow('react.orderShow.totalAdjustments.label', 'Adjustments', `${order.totalAdjustments} ${order.currencyCode}`)}
                  {detailRow('react.orderShow.total.label', 'Total', `${order.total} ${order.currencyCode}`)}
                </>
              )}
            </tbody>
          </table>
          <table>
            <tbody>
              {detailRow('react.orderShow.orderedBy.label', 'Ordered By', order.orderedBy && `${order.orderedBy} ${order.dateOrdered || ''}`)}
              {detailRow('react.orderShow.approvedBy.label', 'Approved By', order.approvedBy && `${order.approvedBy} ${order.dateApproved || ''}`)}
              {detailRow('react.orderShow.completedBy.label', 'Completed By', order.completedBy && `${order.completedBy} ${order.dateCompleted || ''}`)}
              {detailRow('react.orderShow.createdBy.label', 'Created By', order.createdBy && `${order.createdBy} ${order.dateCreated || ''}`)}
              {detailRow('react.orderShow.updatedBy.label', 'Updated By', order.updatedBy && `${order.updatedBy} ${order.lastUpdated || ''}`)}
            </tbody>
          </table>
        </div>
        <Tabs config={tabsConfig} className="mt-3" />
        {renderTab()}
      </div>
    </PageWrapper>
  );
};

export default OrderShow;

OrderShow.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
};
