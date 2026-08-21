/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import {
  STOCK_MOVEMENT_COMMENTS_DATA,
  STOCK_MOVEMENT_DOCUMENTS,
  STOCK_MOVEMENT_EVENTS_DATA,
  STOCK_MOVEMENT_PACKING_LIST_DATA,
  STOCK_MOVEMENT_RECEIPTS_DATA,
  STOCK_MOVEMENT_REQUISITION_ITEMS_DATA,
} from 'api/urls';
import {
  INVENTORY_ITEM_URL,
  SHIPMENT_URL,
  STOCK_MOVEMENT_URL,
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

export const StockMovementRequisitionTab = ({ stockMovementId }) => {
  const data = useTabData(STOCK_MOVEMENT_REQUISITION_ITEMS_DATA(stockMovementId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th><Translate id="react.stockMovement.status.label" defaultMessage="Status" /></th>
            <th><Translate id="react.stockMovement.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.stockMovement.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.stockMovement.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.stockMovement.quantityRequested.label" defaultMessage="Requested" /></th>
            <th><Translate id="react.stockMovement.quantityApproved.label" defaultMessage="Approved" /></th>
            <th><Translate id="react.stockMovement.quantityPicked.label" defaultMessage="Picked" /></th>
            <th><Translate id="react.stockMovement.quantityAdjusted.label" defaultMessage="Adjusted" /></th>
            <th><Translate id="react.stockMovement.quantityIssued.label" defaultMessage="Issued" /></th>
            <th><Translate id="react.stockMovement.reasonCode.label" defaultMessage="Reason code" /></th>
          </tr>
        </thead>
        <tbody>
          {data.requisitionItems.map((item) => (
            <tr key={item.id} className={item.isCanceled ? 'text-muted' : undefined}>
              <td>{item.index}</td>
              <td>{item.statusLabel}</td>
              <td>{item.productCode}</td>
              <td>
                <a href={INVENTORY_ITEM_URL.showStockCard(item.productId)}>{item.productName}</a>
                {item.substitutions.map((substitution) => (
                  <div key={substitution.productId} className="pl-3">
                    ↳
                    {' '}
                    {substitution.productCode}
                    {' '}
                    <a href={INVENTORY_ITEM_URL.showStockCard(substitution.productId)}>
                      {substitution.productName}
                    </a>
                    {' '}
                    (
                    {substitution.quantity}
                    )
                  </div>
                ))}
              </td>
              <td>{item.unitOfMeasure}</td>
              <td>{item.quantityRequested}</td>
              <td>{item.quantityApproved}</td>
              <td>{item.quantityPicked}</td>
              <td>{item.quantityAdjusted}</td>
              <td>{item.quantityIssued}</td>
              <td>{item.cancelReasonCode || item.pickReasonCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const StockMovementPackingListTab = ({ stockMovementId }) => {
  const data = useTabData(STOCK_MOVEMENT_PACKING_LIST_DATA(stockMovementId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.stockMovement.packLevel.label" defaultMessage="Pack level" /></th>
            <th><Translate id="react.stockMovement.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.stockMovement.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.stockMovement.binLocation.label" defaultMessage="Bin location" /></th>
            <th><Translate id="react.stockMovement.lotNumber.label" defaultMessage="Lot number" /></th>
            <th><Translate id="react.stockMovement.expirationDate.label" defaultMessage="Expiration date" /></th>
            <th><Translate id="react.stockMovement.quantityShipped.label" defaultMessage="Shipped" /></th>
            {data.showReceivedColumns && (
              <>
                <th><Translate id="react.stockMovement.quantityReceived.label" defaultMessage="Received" /></th>
                <th><Translate id="react.stockMovement.quantityCanceled.label" defaultMessage="Canceled" /></th>
              </>
            )}
            <th><Translate id="react.stockMovement.unitOfMeasure.label" defaultMessage="UOM" /></th>
            <th><Translate id="react.stockMovement.recipient.label" defaultMessage="Recipient" /></th>
          </tr>
        </thead>
        <tbody>
          {data.shipmentItems.map((item) => (
            <tr key={item.id}>
              <td>{item.containerName}</td>
              <td>{item.productCode}</td>
              <td>
                <a href={INVENTORY_ITEM_URL.showStockCard(item.productId)}>{item.productName}</a>
              </td>
              <td>{item.binLocation}</td>
              <td>{item.lotNumber}</td>
              <td>{item.expirationDate}</td>
              <td>{item.quantityShipped}</td>
              {data.showReceivedColumns && (
                <>
                  <td>{item.quantityReceived}</td>
                  <td>{item.quantityCanceled}</td>
                </>
              )}
              <td>{item.unitOfMeasure}</td>
              <td>{item.recipient}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const StockMovementReceiptsTab = ({ stockMovementId }) => {
  const data = useTabData(STOCK_MOVEMENT_RECEIPTS_DATA(stockMovementId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.stockMovement.status.label" defaultMessage="Status" /></th>
            <th><Translate id="react.stockMovement.productCode.label" defaultMessage="Code" /></th>
            <th><Translate id="react.stockMovement.product.label" defaultMessage="Product" /></th>
            <th><Translate id="react.stockMovement.lotNumber.label" defaultMessage="Lot number" /></th>
            <th><Translate id="react.stockMovement.expirationDate.label" defaultMessage="Expiration date" /></th>
            <th><Translate id="react.stockMovement.binLocation.label" defaultMessage="Bin location" /></th>
            <th><Translate id="react.stockMovement.quantityCanceled.label" defaultMessage="Canceled" /></th>
            <th><Translate id="react.stockMovement.quantityPending.label" defaultMessage="Pending" /></th>
            <th><Translate id="react.stockMovement.quantityReceived.label" defaultMessage="Received" /></th>
          </tr>
        </thead>
        <tbody>
          {data.receiptItems.map((item) => (
            <tr key={item.id}>
              <td>{item.receiptStatus}</td>
              <td>{item.productCode}</td>
              <td>
                <a href={INVENTORY_ITEM_URL.showStockCard(item.productId)}>{item.productName}</a>
              </td>
              <td>{item.lotNumber}</td>
              <td>{item.expirationDate}</td>
              <td>{item.binLocation}</td>
              <td>{item.quantityCanceled}</td>
              <td>{item.quantityPending}</td>
              <td>{item.quantityReceived}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const StockMovementEventsTab = ({ stockMovementId }) => {
  const data = useTabData(STOCK_MOVEMENT_EVENTS_DATA(stockMovementId));
  if (!data) return <LoadingIndicator />;
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.stockMovement.event.label" defaultMessage="Event" /></th>
            <th><Translate id="react.stockMovement.date.label" defaultMessage="Date" /></th>
            <th><Translate id="react.stockMovement.location.label" defaultMessage="Location" /></th>
            <th><Translate id="react.stockMovement.createdBy.label" defaultMessage="Created by" /></th>
            <th><Translate id="react.stockMovement.comment.label" defaultMessage="Comment" /></th>
          </tr>
        </thead>
        <tbody>
          {data.historyItems.map((item) => (
            <tr key={`${item.eventName}-${item.date}`}>
              <td>
                {item.isPutaway && item.referenceUrl ? (
                  <a href={item.referenceUrl}>
                    {item.eventName}
                    {' '}
                    {item.referenceIdentifier}
                  </a>
                ) : item.eventName}
              </td>
              <td>{item.date}</td>
              <td>{item.location}</td>
              <td>{item.createdBy}</td>
              <td>{item.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const StockMovementDocumentsTab = ({ stockMovementId, shipmentId }) => {
  const data = useTabData(STOCK_MOVEMENT_DOCUMENTS(stockMovementId));
  if (!data) return <LoadingIndicator />;
  const documents = data.filter((document) => !document.hidden);
  const fileDocuments = documents.filter((document) => !document.fileUri);
  const links = documents.filter((document) => document.fileUri);
  return (
    <div className="p-2">
      <div className="table-responsive">
        <table className="table table-sm">
          <thead>
            <tr>
              <th><Translate id="react.stockMovement.document.name.label" defaultMessage="Name" /></th>
              <th><Translate id="react.stockMovement.documentType.label" defaultMessage="Type" /></th>
              <th><Translate id="react.stockMovement.contentType.label" defaultMessage="Content type" /></th>
              <th><Translate id="react.stockMovement.actions.label" defaultMessage="Actions" /></th>
            </tr>
          </thead>
          <tbody>
            {fileDocuments.map((document) => (
              <tr key={document.uri || document.name}>
                <td>{document.name}</td>
                <td>{document.documentType}</td>
                <td>{document.contentType}</td>
                <td className="text-right">
                  {document.id && (
                    <a
                      href={SHIPMENT_URL.deleteDocument(shipmentId, document.id)}
                      className="button"
                      onClick={(event) => {
                        // eslint-disable-next-line no-alert
                        if (!window.confirm('Are you sure?')) event.preventDefault();
                      }}
                    >
                      <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                    </a>
                  )}
                  {document.downloadOptions ? document.downloadOptions.map((downloadOption) => (
                    <a
                      key={downloadOption.uri}
                      href={downloadOption.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button"
                    >
                      {downloadOption.name}
                    </a>
                  )) : (
                    <a href={document.uri} target="_blank" rel="noopener noreferrer" className="button">
                      <Translate id="react.default.button.download.label" defaultMessage="Download" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {links.length > 0 && (
        <div className="table-responsive">
          <h3><Translate id="react.stockMovement.links.label" defaultMessage="Links" /></h3>
          <table className="table table-sm">
            <thead>
              <tr>
                <th><Translate id="react.stockMovement.document.name.label" defaultMessage="Name" /></th>
                <th><Translate id="react.stockMovement.document.url.label" defaultMessage="URL" /></th>
                <th><Translate id="react.stockMovement.actions.label" defaultMessage="Actions" /></th>
              </tr>
            </thead>
            <tbody>
              {links.map((document) => (
                <tr key={document.id || document.fileUri}>
                  <td>
                    <a href={document.fileUri} target="_blank" rel="noopener noreferrer">{document.name}</a>
                  </td>
                  <td>
                    <a href={document.fileUri} target="_blank" rel="noopener noreferrer">{document.fileUri}</a>
                  </td>
                  <td className="text-right">
                    {document.id && (
                      <a
                        href={SHIPMENT_URL.deleteDocument(shipmentId, document.id)}
                        className="button"
                        onClick={(event) => {
                          // eslint-disable-next-line no-alert
                          if (!window.confirm('Are you sure?')) event.preventDefault();
                        }}
                      >
                        <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const StockMovementCommentsTab = ({ stockMovementId }) => {
  const data = useTabData(STOCK_MOVEMENT_COMMENTS_DATA(stockMovementId));
  if (!data) return <LoadingIndicator />;
  if (!data.comments.length || data.isReturn) {
    return (
      <div className="fade center empty p-3">
        <Translate id="react.stockMovement.noComments.label" defaultMessage="No comments" />
      </div>
    );
  }
  return (
    <div className="table-responsive p-2">
      <table className="table table-sm">
        <thead>
          <tr>
            <th><Translate id="react.stockMovement.comment.to.label" defaultMessage="To" /></th>
            <th><Translate id="react.stockMovement.comment.from.label" defaultMessage="From" /></th>
            <th><Translate id="react.stockMovement.comment.label" defaultMessage="Comment" /></th>
            <th><Translate id="react.stockMovement.date.label" defaultMessage="Date" /></th>
            <th><Translate id="react.stockMovement.actions.label" defaultMessage="Actions" /></th>
          </tr>
        </thead>
        <tbody>
          {data.comments.map((comment) => (
            <tr key={comment.id}>
              <td>{comment.recipient}</td>
              <td>{comment.sender}</td>
              <td>{comment.comment}</td>
              <td>{comment.lastUpdated}</td>
              <td className="text-right">
                {comment.senderId === data.currentUserId && (
                  <>
                    <a href={STOCK_MOVEMENT_URL.editComment(comment.id, stockMovementId)}>
                      <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                    </a>
                    {' '}
                    <a
                      href={STOCK_MOVEMENT_URL.deleteComment(comment.id, stockMovementId)}
                      onClick={(event) => {
                        // eslint-disable-next-line no-alert
                        if (!window.confirm('Are you sure?')) event.preventDefault();
                      }}
                    >
                      <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                    </a>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const idProps = {
  stockMovementId: PropTypes.string.isRequired,
};

StockMovementRequisitionTab.propTypes = idProps;
StockMovementPackingListTab.propTypes = idProps;
StockMovementReceiptsTab.propTypes = idProps;
StockMovementEventsTab.propTypes = idProps;
StockMovementCommentsTab.propTypes = idProps;
StockMovementDocumentsTab.propTypes = {
  stockMovementId: PropTypes.string.isRequired,
  shipmentId: PropTypes.string,
};
StockMovementDocumentsTab.defaultProps = {
  shipmentId: null,
};
