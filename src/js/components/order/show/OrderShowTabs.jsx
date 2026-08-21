/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import {
  ORDER_ADJUSTMENTS_DATA,
  ORDER_COMMENTS_DATA,
  ORDER_DOCUMENTS_DATA,
  ORDER_INVOICES_DATA,
  ORDER_ITEM_DETAILS_DATA,
  ORDER_ITEM_STATUS_DATA,
  ORDER_ITEMS_SUMMARY_DATA,
  ORDER_SHIPMENTS_DATA,
} from 'api/urls';
import {
  DOCUMENT_URL,
  INVOICE_URL,
  ORDER_URL,
  PRODUCT_URL,
  SHIPMENT_URL,
} from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const useTabData = (url) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiClient.get(url).then((response) => setData(response.data.data));
  }, [url]);
  return data;
};

const LoadingIndicator = () => (
  <div className="p-3">
    <Translate id="react.default.loading.label" defaultMessage="Loading..." />
  </div>
);

const canceledStyle = { backgroundColor: 'grey' };

export const OrderSummaryTab = ({ orderId }) => {
  const data = useTabData(ORDER_ITEMS_SUMMARY_DATA(orderId));
  const [filter, setFilter] = useState('');
  if (!data) return <LoadingIndicator />;
  const filterUpper = filter.toUpperCase();
  const orderItems = data.orderItems.filter((item) => (
    !filter
    || `${item.productCode || ''}${item.productName || ''}${item.supplierCode || ''}`.toUpperCase().includes(filterUpper)
  ));
  return (
    <div className="table-responsive p-2">
      <input
        type="text"
        className="form-control mb-2 w-25"
        placeholder="Search by product code, name or supplier code"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <table className="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            {data.isPurchaseOrder && <th><Translate id="react.orderShow.status.label" defaultMessage="Status" /></th>}
            <th><Translate id="react.orderShow.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderShow.product.label" defaultMessage="Product" /></th>
            {data.hasSupplierCode && <th><Translate id="react.orderShow.supplierCode.label" defaultMessage="Supplier code" /></th>}
            {data.hasManufacturerName && <th><Translate id="react.orderShow.manufacturerName.label" defaultMessage="Manufacturer name" /></th>}
            {data.hasManufacturerCode && <th><Translate id="react.orderShow.manufacturerCode.label" defaultMessage="Manufacturer code" /></th>}
            <th><Translate id="react.orderShow.quantity.label" defaultMessage="Quantity" /></th>
            <th><Translate id="react.orderShow.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.orderShow.unitPrice.label" defaultMessage="Unit price" /></th>
            <th><Translate id="react.orderShow.totalPrice.label" defaultMessage="Total price" /></th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, index) => (
            <tr key={item.id} style={item.canceled ? canceledStyle : undefined}>
              <td>{index + 1}</td>
              {data.isPurchaseOrder && <td className={item.id}>{item.canceled ? 'CANCELED' : ''}</td>}
              <td>{item.productCode}</td>
              <td><a href={PRODUCT_URL.edit(item.productId)}>{item.productName}</a></td>
              {data.hasSupplierCode && <td>{item.supplierCode}</td>}
              {data.hasManufacturerName && <td>{item.manufacturerName}</td>}
              {data.hasManufacturerCode && <td>{item.manufacturerCode}</td>}
              <td>{item.quantity}</td>
              <td>{item.unitOfMeasure}</td>
              <td className="text-right">{item.unitPrice}</td>
              <td className="text-right">{item.totalPrice}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={
              6
              + (data.isPurchaseOrder ? 1 : 0)
              + (data.hasSupplierCode ? 1 : 0)
              + (data.hasManufacturerName ? 1 : 0)
              + (data.hasManufacturerCode ? 1 : 0)
            }
            >
              <Translate id="react.orderShow.subtotal.label" defaultMessage="Subtotal" />
            </th>
            <th className="text-right">
              {data.subtotal}
              {' '}
              {data.currencyCode}
            </th>
          </tr>
          {data.isPurchaseOrder && (
            <>
              <tr>
                <th colSpan={
                  6
                  + (data.hasSupplierCode ? 1 : 0)
                  + (data.hasManufacturerName ? 1 : 0)
                  + (data.hasManufacturerCode ? 1 : 0)
                  + 1
                }
                >
                  <Translate id="react.orderShow.totalAdjustments.label" defaultMessage="Adjustments" />
                </th>
                <th className="text-right">
                  {data.totalAdjustments}
                  {' '}
                  {data.currencyCode}
                </th>
              </tr>
              <tr>
                <th colSpan={
                  6
                  + (data.hasSupplierCode ? 1 : 0)
                  + (data.hasManufacturerName ? 1 : 0)
                  + (data.hasManufacturerCode ? 1 : 0)
                  + 1
                }
                >
                  <Translate id="react.orderShow.total.label" defaultMessage="Total" />
                </th>
                <th className="text-right">
                  {data.total}
                  {' '}
                  {data.currencyCode}
                </th>
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );
};

export const OrderItemStatusTab = ({ orderId }) => {
  const data = useTabData(ORDER_ITEM_STATUS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.orderShow.status.label" defaultMessage="Status" /></th>
            <th><Translate id="react.orderShow.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderShow.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.orderShow.supplierCode.label" defaultMessage="Supplier code" /></th>
            {data.isPutawayOrder && (
              <>
                <th><Translate id="react.orderShow.lotNumber.label" defaultMessage="Lot number" /></th>
                <th><Translate id="react.orderShow.expirationDate.label" defaultMessage="Expiration date" /></th>
                <th><Translate id="react.orderShow.originBinLocation.label" defaultMessage="Origin bin" /></th>
                <th><Translate id="react.orderShow.destinationBinLocation.label" defaultMessage="Destination bin" /></th>
              </>
            )}
            <th><Translate id="react.orderShow.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.orderShow.quantityOrdered.label" defaultMessage="Ordered" /></th>
            <th><Translate id="react.orderShow.quantityShipped.label" defaultMessage="Shipped" /></th>
            <th><Translate id="react.orderShow.quantityReceived.label" defaultMessage="Received" /></th>
            {data.isPurchaseOrder && <th><Translate id="react.orderShow.quantityInvoiced.label" defaultMessage="Invoiced" /></th>}
            <th><Translate id="react.orderShow.unitPrice.label" defaultMessage="Unit price" /></th>
            <th><Translate id="react.orderShow.totalPrice.label" defaultMessage="Total price" /></th>
          </tr>
        </thead>
        <tbody>
          {data.orderItems.map((item) => (
            <tr key={item.id} style={item.canceled ? canceledStyle : undefined}>
              <td>{item.orderItemStatusCode}</td>
              <td>{item.productCode}</td>
              <td><a href={PRODUCT_URL.edit(item.productId)}>{item.productName}</a></td>
              <td>{item.supplierCode}</td>
              {data.isPutawayOrder && (
                <>
                  <td>{item.lotNumber}</td>
                  <td>{item.expirationDate}</td>
                  <td>{item.originBinLocation}</td>
                  <td>{item.destinationBinLocation}</td>
                </>
              )}
              <td>{item.unitOfMeasure}</td>
              <td>{item.quantity}</td>
              <td>{item.quantityShipped}</td>
              <td>{item.quantityReceived}</td>
              {data.isPurchaseOrder && <td>{item.postedQuantityInvoiced}</td>}
              <td className="text-right">{item.unitPrice}</td>
              <td className="text-right">{item.totalPrice}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={9 + (data.isPutawayOrder ? 4 : 0) + (data.isPurchaseOrder ? 1 : 0)}>
              <Translate id="react.orderShow.total.label" defaultMessage="Total" />
            </th>
            <th className="text-right">
              {data.total}
              {' '}
              {data.currencyCode}
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export const OrderItemDetailsTab = ({ orderId }) => {
  const data = useTabData(ORDER_ITEM_DETAILS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th><Translate id="react.orderShow.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderShow.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.orderShow.supplierCode.label" defaultMessage="Supplier code" /></th>
            <th><Translate id="react.orderShow.manufacturerName.label" defaultMessage="Manufacturer name" /></th>
            <th><Translate id="react.orderShow.manufacturerCode.label" defaultMessage="Manufacturer code" /></th>
            <th><Translate id="react.orderShow.quantity.label" defaultMessage="Quantity" /></th>
            <th><Translate id="react.orderShow.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.orderShow.recipient.label" defaultMessage="Recipient" /></th>
            <th><Translate id="react.orderShow.estimatedReadyDate.label" defaultMessage="Quoted ready date" /></th>
            <th><Translate id="react.orderShow.actualReadyDate.label" defaultMessage="Expected ship date" /></th>
            {data.isPurchaseOrder && <th><Translate id="react.orderShow.budgetCode.label" defaultMessage="Budget code" /></th>}
          </tr>
        </thead>
        <tbody>
          {data.orderItems.map((item, index) => (
            <tr key={item.id} style={item.canceled ? canceledStyle : undefined}>
              <td>{index + 1}</td>
              <td>{item.productCode}</td>
              <td><a href={PRODUCT_URL.edit(item.productId)}>{item.productName}</a></td>
              <td>{item.supplierCode}</td>
              <td>{item.manufacturerName}</td>
              <td>{item.manufacturerCode}</td>
              <td>{item.quantity}</td>
              <td>{item.unitOfMeasure}</td>
              <td>{item.recipient}</td>
              <td>{item.estimatedReadyDate}</td>
              <td>{item.actualReadyDate}</td>
              {data.isPurchaseOrder && <td>{item.budgetCode}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const OrderAdjustmentsTab = ({ orderId }) => {
  const data = useTabData(ORDER_ADJUSTMENTS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.orderShow.orderItem.label" defaultMessage="Order item" /></th>
            <th><Translate id="react.orderShow.adjustmentType.label" defaultMessage="Type" /></th>
            <th><Translate id="react.orderShow.description.label" defaultMessage="Description" /></th>
            <th><Translate id="react.orderShow.percentage.label" defaultMessage="Percentage" /></th>
            <th><Translate id="react.orderShow.amount.label" defaultMessage="Amount" /></th>
            <th><Translate id="react.orderShow.budgetCode.label" defaultMessage="Budget code" /></th>
            <th><Translate id="react.orderShow.paymentStatus.label" defaultMessage="Payment status" /></th>
          </tr>
        </thead>
        <tbody>
          {data.adjustments.map((adjustment) => (
            <tr key={adjustment.id} style={adjustment.canceled ? canceledStyle : undefined}>
              <td>
                {adjustment.orderItemProductName
                  || <Translate id="react.orderShow.allItems.label" defaultMessage="All" />}
              </td>
              <td>{adjustment.typeName}</td>
              <td>{adjustment.description}</td>
              <td>{adjustment.percentage}</td>
              <td className="text-right">{adjustment.amount}</td>
              <td>{adjustment.budgetCode}</td>
              <td>{adjustment.derivedPaymentStatus}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={6}>
              <Translate id="react.orderShow.totalAdjustments.label" defaultMessage="Adjustments" />
            </th>
            <th className="text-right">{data.totalAdjustments}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export const OrderShipmentsTab = ({ orderId }) => {
  const data = useTabData(ORDER_SHIPMENTS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th><Translate id="react.orderShow.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderShow.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.orderShow.shipment.label" defaultMessage="Shipment" /></th>
            <th><Translate id="react.orderShow.shipmentType.label" defaultMessage="Type" /></th>
            <th><Translate id="react.orderShow.status.label" defaultMessage="Status" /></th>
            <th><Translate id="react.orderShow.packLevel1.label" defaultMessage="Pack level 1" /></th>
            <th><Translate id="react.orderShow.packLevel2.label" defaultMessage="Pack level 2" /></th>
            <th><Translate id="react.orderShow.lotNumber.label" defaultMessage="Lot number" /></th>
            <th><Translate id="react.orderShow.expirationDate.label" defaultMessage="Expiration date" /></th>
            <th><Translate id="react.orderShow.quantityShipped.label" defaultMessage="Shipped" /></th>
            <th><Translate id="react.orderShow.unitOfMeasure.label" defaultMessage="UOM" /></th>
          </tr>
        </thead>
        <tbody>
          {data.shipmentItems.map((item) => (
            <tr key={item.id}>
              <td>{item.orderItemNumber}</td>
              <td>{item.productCode}</td>
              <td>{item.productName}</td>
              <td>
                <a href={SHIPMENT_URL.showDetails(item.shipmentId)}>
                  {item.shipmentNumber}
                  {' '}
                  {item.shipmentName}
                </a>
              </td>
              <td>{item.shipmentType}</td>
              <td>{item.shipmentStatus}</td>
              <td>{item.packLevel1}</td>
              <td>{item.packLevel2}</td>
              <td>{item.lotNumber}</td>
              <td>{item.expirationDate}</td>
              <td>{item.quantity}</td>
              <td>{item.unitOfMeasure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const OrderInvoicesTab = ({ orderId }) => {
  const data = useTabData(ORDER_INVOICES_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.orderShow.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.orderShow.description.label" defaultMessage="Description" /></th>
            <th><Translate id="react.orderShow.invoice.label" defaultMessage="Invoice" /></th>
            <th><Translate id="react.orderShow.invoiceType.label" defaultMessage="Type" /></th>
            <th><Translate id="react.orderShow.status.label" defaultMessage="Status" /></th>
            <th><Translate id="react.orderShow.quantity.label" defaultMessage="Quantity" /></th>
            <th><Translate id="react.orderShow.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.orderShow.unitPrice.label" defaultMessage="Unit price" /></th>
            <th><Translate id="react.orderShow.amount.label" defaultMessage="Amount" /></th>
          </tr>
        </thead>
        <tbody>
          {data.invoiceItems.map((item) => (
            <tr key={item.id}>
              <td>{item.productCode}</td>
              <td>{item.description}</td>
              <td>
                <a href={INVOICE_URL.show(item.invoiceId)}>{item.invoiceNumber}</a>
              </td>
              <td>{item.invoiceType}</td>
              <td>{item.invoiceStatus}</td>
              <td>{item.quantity}</td>
              <td>{item.unitOfMeasure}</td>
              <td className="text-right">{item.unitPrice}</td>
              <td className="text-right">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const OrderDocumentsTab = ({ orderId }) => {
  const data = useTabData(ORDER_DOCUMENTS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  const renderRows = (documents, isTemplate) => documents.map((document) => (
    <tr key={document.id}>
      <td>
        {isTemplate ? (
          <a href={ORDER_URL.render(orderId, document.id)} target="_blank" rel="noopener noreferrer">
            {document.name}
          </a>
        ) : (
          <a
            href={document.fileUri || DOCUMENT_URL.download(document.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {document.name || document.filename}
          </a>
        )}
      </td>
      <td>{document.filename}</td>
      <td>{document.documentType}</td>
      <td>{document.size}</td>
      <td>{document.lastUpdated}</td>
      <td>
        {!isTemplate && (
          <a href={ORDER_URL.editDocument(document.id, orderId)}>
            <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
          </a>
        )}
      </td>
    </tr>
  ));
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.orderShow.document.label" defaultMessage="Document" /></th>
            <th><Translate id="react.orderShow.filename.label" defaultMessage="File name" /></th>
            <th><Translate id="react.orderShow.documentType.label" defaultMessage="Type" /></th>
            <th><Translate id="react.orderShow.size.label" defaultMessage="Size" /></th>
            <th><Translate id="react.orderShow.lastUpdated.label" defaultMessage="Last updated" /></th>
            <th><Translate id="react.orderShow.actions.label" defaultMessage="Actions" /></th>
          </tr>
        </thead>
        <tbody>
          {renderRows(data.documents, false)}
          {renderRows(data.documentTemplates, true)}
          {renderRows(data.links, false)}
        </tbody>
      </table>
    </div>
  );
};

export const OrderCommentsTab = ({ orderId }) => {
  const data = useTabData(ORDER_COMMENTS_DATA(orderId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.orderShow.recipient.label" defaultMessage="Recipient" /></th>
            <th><Translate id="react.orderShow.sender.label" defaultMessage="Sender" /></th>
            <th><Translate id="react.orderShow.comment.label" defaultMessage="Comment" /></th>
            <th><Translate id="react.orderShow.lastUpdated.label" defaultMessage="Last updated" /></th>
            <th><Translate id="react.orderShow.actions.label" defaultMessage="Actions" /></th>
          </tr>
        </thead>
        <tbody>
          {data.comments.map((comment) => (
            <tr key={comment.id}>
              <td>{comment.recipient}</td>
              <td>{comment.sender}</td>
              <td>{comment.comment}</td>
              <td>{comment.lastUpdated}</td>
              <td>
                <a href={ORDER_URL.editComment(comment.id, orderId)}>
                  <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const tabPropTypes = {
  orderId: PropTypes.string.isRequired,
};

OrderSummaryTab.propTypes = tabPropTypes;
OrderItemStatusTab.propTypes = tabPropTypes;
OrderItemDetailsTab.propTypes = tabPropTypes;
OrderAdjustmentsTab.propTypes = tabPropTypes;
OrderShipmentsTab.propTypes = tabPropTypes;
OrderInvoicesTab.propTypes = tabPropTypes;
OrderDocumentsTab.propTypes = tabPropTypes;
OrderCommentsTab.propTypes = tabPropTypes;
