/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-danger, jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { SHIPMENT_SHOW_DETAILS } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { CONTEXT_PATH, SHIPMENT_URL, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ShowShipment = ({ match }) => {
  const { shipmentId } = match.params;
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('contents');
  const [transactionsHtml, setTransactionsHtml] = useState(null);
  const [trackingHtml, setTrackingHtml] = useState(null);
  const isSuperuser = useSelector((state) => state.session.isSuperuser);
  const isUserManager = useSelector((state) => state.session.isUserManager);
  const isUserAdmin = useSelector((state) => state.session.isUserAdmin);

  useEffect(() => {
    apiClient.get(SHIPMENT_SHOW_DETAILS(shipmentId))
      .then((response) => setData(response.data.data));
  }, [shipmentId]);

  useEffect(() => {
    if (activeTab === 'transactions' && transactionsHtml === null) {
      apiClient.get(SHIPMENT_URL.showTransactions(shipmentId))
        .then((response) => setTransactionsHtml(response.data));
    }
    if (activeTab === 'tracking' && trackingHtml === null) {
      apiClient.get(SHIPMENT_URL.showTracking(shipmentId))
        .then((response) => setTrackingHtml(response.data));
    }
  }, [activeTab, shipmentId]);

  if (!data) {
    return null;
  }

  const { context } = data;

  return (
    <div className="p-3">
      <ShipmentSummary summary={data.summary} />
      <div className="my-2">
        {context.isDestination ? (
          <a href={SHIPMENT_URL.list({ type: 'incoming' })} className="btn btn-outline-primary btn-sm mr-1">
            <img src={`${CONTEXT_PATH}/static/images/icons/silk/lorry_stop.png`} alt="" className="align-middle" />
            &nbsp;
            <Translate id="react.shipment.listIncoming.label" defaultMessage="List incoming" />
          </a>
        ) : (
          <a href={SHIPMENT_URL.list()} className="btn btn-outline-primary btn-sm mr-1">
            <img src={`${CONTEXT_PATH}/static/images/icons/silk/lorry_start.png`} alt="" className="align-middle" />
            &nbsp;
            <Translate id="react.shipment.listOutgoing.label" defaultMessage="List outgoing" />
          </a>
        )}
        {context.hasShipped && isUserAdmin && (
          <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}`} className="btn btn-outline-primary btn-sm mr-1">
            <img src={`${CONTEXT_PATH}/static/images/icons/silk/pencil.png`} alt="" className="align-middle" />
            &nbsp;
            <Translate id="react.shipment.editShipment.label" defaultMessage="Edit shipment" />
          </a>
        )}
        {!context.hasShipped && (context.isOrigin || context.isDestination) && (
          <div className="d-inline-block mr-2">
            <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}`} className="btn btn-outline-primary btn-sm mr-1">
              <img src={`${CONTEXT_PATH}/static/images/icons/silk/pencil.png`} alt="" className="align-middle" />
              &nbsp;
              <Translate id="react.shipment.editShipment.label" defaultMessage="Edit shipment" />
            </a>
            <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}?execution=e1s1&_eventId=enterTrackingDetails`} className="btn btn-outline-primary btn-sm mr-1">
              <img src={`${CONTEXT_PATH}/static/images/icons/silk/map.png`} alt="" className="align-middle" />
              &nbsp;
              <Translate id="react.shipment.enterTrackingDetails.label" defaultMessage="Enter tracking details" />
            </a>
            <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}?skipTo=Packing`} className="btn btn-outline-primary btn-sm mr-1">
              <img src={`${CONTEXT_PATH}/static/images/icons/silk/package_add.png`} alt="" className="align-middle" />
              &nbsp;
              <Translate id="react.shipment.editPackingList.label" defaultMessage="Edit packing list" />
            </a>
            <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}?skipTo=Picking`} className="btn btn-outline-primary btn-sm mr-1">
              <img src={`${CONTEXT_PATH}/static/images/icons/silk/basket_put.png`} alt="" className="align-middle" />
              &nbsp;
              <Translate id="react.shipment.pickShipmentItems.label" defaultMessage="Pick shipment items" />
            </a>
            {context.isSendAllowed ? (
              <a href={`${CONTEXT_PATH}/createShipmentWorkflow/createShipment/${shipmentId}?skipTo=Sending`} className="btn btn-outline-primary btn-sm mr-1">
                <img src={`${CONTEXT_PATH}/static/images/icons/truck.png`} alt="" className="align-middle" />
                &nbsp;
                <Translate id="react.shipment.sendShipment.label" defaultMessage="Send shipment" />
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mr-1"
                onClick={() => {
                  let message = 'Shipment cannot be sent yet';
                  if (context.hasShipped) message = 'Shipment has already been shipped!';
                  else if (context.wasReceived) message = 'Shipment has already been received!';
                  // eslint-disable-next-line no-alert
                  alert(message);
                }}
              >
                <img src={`${CONTEXT_PATH}/static/images/icons/silk/lorry.png`} alt="" className="align-middle" />
                &nbsp;
                <span className="text-muted">
                  <Translate id="react.shipment.sendShipment.label" defaultMessage="Send shipment" />
                </span>
              </button>
            )}
          </div>
        )}
        {isUserManager && (context.isOrigin || context.isDestination) && (
          <div className="d-inline-block mr-2">
            {context.isReceiveAllowed ? (
              <>
                <a href={SHIPMENT_URL.receiveShipment(shipmentId)} className="btn btn-outline-primary btn-sm mr-1">
                  <img src={`${CONTEXT_PATH}/static/images/icons/handtruck.png`} alt="Receive Shipment" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.receiveShipment.label" defaultMessage="Receive shipment" />
                </a>
                {context.isPartialReceiveAllowed && (
                  <a href={`${CONTEXT_PATH}/partialReceiving/create/${shipmentId}`} className="btn btn-outline-primary btn-sm mr-1">
                    <img src={`${CONTEXT_PATH}/static/images/icons/handtruck.png`} alt="" className="align-middle" />
                    &nbsp;
                    <Translate id="react.shipment.partialReceipt.label" defaultMessage="Partial Receipt" />
                  </a>
                )}
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm mr-1"
                onClick={() => {
                  let message = 'Shipment cannot be received yet';
                  if (!context.hasShipped) message = 'Shipment has not been shipped!';
                  else if (context.wasReceived) message = 'Shipment was already received!';
                  // eslint-disable-next-line no-alert
                  alert(message);
                }}
              >
                <img src={`${CONTEXT_PATH}/static/images/icons/handtruck.png`} alt="Receive Shipment" className="align-middle" />
                &nbsp;
                <span className="text-muted">
                  <Translate id="react.shipment.receiveShipment.label" defaultMessage="Receive shipment" />
                </span>
              </button>
            )}
          </div>
        )}
        {isSuperuser && context.hasShipped && (
          <a href={SHIPMENT_URL.rollbackLastEvent(shipmentId)} className="btn btn-outline-primary btn-sm mr-1">
            <img src={`${CONTEXT_PATH}/static/images/icons/silk/arrow_undo.png`} alt="Rollback Last Event" className="align-middle" />
            &nbsp;
            <Translate id="react.shipment.rollbackLastEvent.label" defaultMessage="Rollback last event" />
          </a>
        )}
        {context.requisitionId && (
          <a href={STOCK_MOVEMENT_URL.genericEdit(context.requisitionId)} className="btn btn-outline-primary btn-sm mr-1">
            <img src={`${CONTEXT_PATH}/static/images/icons/silk/package.png`} alt="" className="align-middle" />
            &nbsp;
            <Translate id="react.shipment.editStockMovement.label" defaultMessage="Edit stock movement" />
          </a>
        )}
        <div className="text-right">
          <div>
            <div>
              <div className="btn btn-outline-primary btn-sm mr-1">
                <img src={`${CONTEXT_PATH}/static/images/icons/pdf.png`} alt="" className="align-middle" />
                &nbsp;
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </div>
            </div>
            <div>
              <div className="my-1">
                <a target="_blank" rel="noopener noreferrer" href={`${CONTEXT_PATH}/report/printPickListReport?shipment.id=${shipmentId}`}>
                  <img src={`${CONTEXT_PATH}/static/images/icons/silk/application_side_list.png`} alt="" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.printPickList.label" defaultMessage="Print Pick List" />
                </a>
              </div>
              <div className="my-1">
                <a target="_blank" rel="noopener noreferrer" href={`${CONTEXT_PATH}/report/printShippingReport?shipment.id=${shipmentId}`}>
                  <img src={`${CONTEXT_PATH}/static/images/icons/pdf.png`} alt="" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.printPackingList.label" defaultMessage="Print Packing List" />
                </a>
              </div>
              <div className="my-1">
                <a target="_blank" rel="noopener noreferrer" href={`${CONTEXT_PATH}/report/printPaginatedPackingListReport?shipment.id=${shipmentId}`}>
                  <img src={`${CONTEXT_PATH}/static/images/icons/silk/page_break.png`} alt="" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.downloadPackingList.label" defaultMessage="Download packing list" />
                  {' '}
                  <span className="text-muted">(.pdf)</span>
                </a>
              </div>
              <div className="my-1">
                <a href={`${CONTEXT_PATH}/doc4j/downloadPackingList/${shipmentId}`}>
                  <img src={`${CONTEXT_PATH}/static/images/icons/silk/page_white_excel.png`} alt="" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.downloadPackingList.label" defaultMessage="Download packing list" />
                  {' '}
                  <span className="text-muted">(.xls)</span>
                </a>
              </div>
              <div className="my-1">
                <a target="_blank" rel="noopener noreferrer" href={SHIPMENT_URL.downloadLabels(shipmentId)}>
                  <img src={`${CONTEXT_PATH}/static/images/icons/barcode.png`} alt="" className="align-middle" />
                  &nbsp;
                  <Translate id="react.shipment.downloadBarcodeLabels.label" defaultMessage="Download barcode labels" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex">
        <div className="mr-3" style={{ width: '280px', flexShrink: 0 }}>
          <div className="card p-3 mb-3">
            <h2><Translate id="react.shipment.details.label" defaultMessage="Details" /></h2>
            <table>
              <tbody>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.default.status.label" defaultMessage="Status" /></td>
                  <td>{data.statusName}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.origin.label" defaultMessage="Origin" /></td>
                  <td>
                    {data.originName}
                    {data.originCode && (
                      <span>
                        {' '}
                        (
                        {data.originCode}
                        )
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.destination.label" defaultMessage="Destination" /></td>
                  <td>{data.destinationName}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.totalWeight.label" defaultMessage="Total weight" /></td>
                  <td>
                    {Number(data.totalWeightInPounds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {' '}
                    <Translate id="react.shipment.lbs.label" defaultMessage="lbs" />
                  </td>
                </tr>
                {data.showTotalValue && (
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.totalValue.label" defaultMessage="Total value" /></td>
                    <td>
                      {Number(data.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' '}
                      {data.currencyCode}
                    </td>
                  </tr>
                )}
                {data.carrier && (
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.carrier.label" defaultMessage="Carrier" /></td>
                    <td>
                      {data.carrier.firstName}
                      {' '}
                      {data.carrier.lastName}
                    </td>
                  </tr>
                )}
                {data.additionalInformation && (
                  <tr>
                    <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.additionalInformation.label" defaultMessage="Additional information" /></td>
                    <td>{data.additionalInformation}</td>
                  </tr>
                )}
                {data.referenceNumbers.map((referenceNumber) => (
                  <tr key={referenceNumber.name}>
                    <td className="font-weight-bold text-right pr-3 align-top">{referenceNumber.name}</td>
                    <td>{referenceNumber.identifiers.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card p-3 mb-3">
            <h2><Translate id="react.shipment.leadTime.label" defaultMessage="Lead time" /></h2>
            <table>
              <tbody>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.timeToProcess.label" defaultMessage="Time to process" /></td>
                  <td>{data.leadTime.timeToProcess}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.timeInCustoms.label" defaultMessage="Time in customs" /></td>
                  <td>{data.leadTime.timeInCustoms}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold text-right pr-3 align-top"><Translate id="react.shipment.timeInTransit.label" defaultMessage="Time in transit" /></td>
                  <td>{data.leadTime.timeInTransit}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex-grow-1">
          <div>
            <ul className="nav nav-tabs">
              {[
                ['contents', 'Contents', 'react.shipment.contents.label'],
                ...(data.hasReceipt ? [['receipt', 'Receipt', 'react.shipment.receipt.label']] : []),
                ['documents', 'Documents', 'react.shipment.documents.label'],
                ['comments', 'Comments', 'react.shipment.comments.label'],
                ['events', 'Events', 'react.shipment.events.label'],
                ['transactions', 'Transactions', 'react.shipment.transactions.label'],
                ['tracking', 'Tracking', 'react.shipment.tracking.label'],
              ].map(([tab, label, id]) => (
                <li key={tab} className="nav-item">
                  <a
                    className={tab === activeTab ? 'nav-link active' : 'nav-link'}
                    href={`#${tab}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab);
                    }}
                  >
                    <Translate id={id} defaultMessage={label} />
                  </a>
                </li>
              ))}
            </ul>
            <div style={{ padding: '10px' }}>
              {activeTab === 'contents' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.contents.label" defaultMessage="Contents" /></h2>
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th><Translate id="react.shipment.container.label" defaultMessage="Container" /></th>
                        <th><Translate id="react.product.productCode.label" defaultMessage="Code" /></th>
                        <th><Translate id="react.product.label" defaultMessage="Product" /></th>
                        <th><Translate id="react.shipment.binLocation.label" defaultMessage="Bin location" /></th>
                        <th><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
                        <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
                        <th className="text-center"><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
                        <th className="text-center"><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
                        <th className="text-center"><Translate id="react.shipment.canceled.label" defaultMessage="Canceled" /></th>
                        <th><Translate id="react.shipment.uom.label" defaultMessage="UOM" /></th>
                        <th><Translate id="react.shipment.recipient.label" defaultMessage="Recipient" /></th>
                        <th><Translate id="react.shipment.comments.label" defaultMessage="Comments" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.shipmentItems.map((item) => (
                        <tr key={item.id} className={item.isFullyReceived ? 'received' : ''}>
                          <td>{item.container ? `${item.container.containerTypeName} ${item.container.name}` : ''}</td>
                          <td>{item.productCode}</td>
                          <td>
                            <a href={`${CONTEXT_PATH}/inventoryItem/showStockCard?product.id=${item.product.id}`}>
                              {item.product.name}
                            </a>
                          </td>
                          <td>
                            {item.binLocationName}
                            {item.receiptBins && item.receiptBins.map((bin) => (
                              <div key={`${item.id}-${bin.binLocationName}`}>
                                {bin.binLocationName}
                                {' '}
                                (
                                {bin.quantityReceived}
                                {' '}
                                {bin.unitOfMeasure}
                                )
                              </div>
                            ))}
                          </td>
                          <td>{item.lotNumber}</td>
                          <td>{item.expirationDate}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-center">{item.quantityReceived}</td>
                          <td className="text-center">{item.quantityCanceled}</td>
                          <td>{item.unitOfMeasure}</td>
                          <td>{item.recipient?.name}</td>
                          <td>{item.comments?.join(', ')}</td>
                        </tr>
                      ))}
                      {data.shipmentItems.length === 0 && (
                        <tr>
                          <td colSpan="12" className="text-center text-muted p-3">
                            <Translate id="react.default.empty.label" defaultMessage="Empty" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'receipt' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.receipt.label" defaultMessage="Receipt" /></h2>
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th><Translate id="react.product.productCode.label" defaultMessage="Code" /></th>
                        <th><Translate id="react.product.label" defaultMessage="Product" /></th>
                        <th><Translate id="react.shipment.binLocation.label" defaultMessage="Bin location" /></th>
                        <th><Translate id="react.shipment.lotNumber.label" defaultMessage="Lot number" /></th>
                        <th><Translate id="react.shipment.expirationDate.label" defaultMessage="Expiration date" /></th>
                        <th className="text-center"><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
                        <th className="text-center"><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
                        <th className="text-center"><Translate id="react.shipment.canceled.label" defaultMessage="Canceled" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.receiptItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.productCode}</td>
                          <td>
                            <a href={`${CONTEXT_PATH}/inventoryItem/showStockCard?product.id=${item.product.id}`}>
                              {item.product.name}
                            </a>
                          </td>
                          <td>{item.binLocationName}</td>
                          <td>{item.lotNumber}</td>
                          <td>{item.expirationDate}</td>
                          <td className="text-center">{item.quantityShipped}</td>
                          <td className="text-center">{item.quantityReceived}</td>
                          <td className="text-center">{item.quantityCanceled}</td>
                        </tr>
                      ))}
                      {data.receiptItems.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center text-muted p-3">
                            <Translate id="react.default.empty.label" defaultMessage="Empty" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'documents' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.documents.label" defaultMessage="Documents" /></h2>
                  <table className="table table-sm table-striped">
                    <tbody>
                      {data.documents.map((document) => (
                        <tr key={document.id}>
                          <td>
                            <a href={SHIPMENT_URL.downloadDocument(shipmentId, document.id)}>
                              {document.name || document.filename}
                            </a>
                          </td>
                          <td className="text-right">
                            <a href={`${SHIPMENT_URL.base}/editDocument?shipmentId=${shipmentId}&documentId=${document.id}`}>
                              <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                            </a>
                            {' '}
                            <a href={SHIPMENT_URL.deleteDocument(shipmentId, document.id)}>
                              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                            </a>
                          </td>
                        </tr>
                      ))}
                      {data.documents.length === 0 && (
                        <tr>
                          <td className="text-center text-muted p-3">
                            <Translate id="react.default.empty.label" defaultMessage="Empty" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex flex-wrap my-2">
                    <a href={SHIPMENT_URL.addDocument(shipmentId)} className="btn btn-outline-primary btn-sm mr-1">
                      <Translate id="react.shipment.addDocument.label" defaultMessage="Add document" />
                    </a>
                  </div>
                </div>
              )}
              {activeTab === 'comments' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.comments.label" defaultMessage="Comments" /></h2>
                  <table className="table table-sm table-striped">
                    <tbody>
                      {data.comments.map((comment) => (
                        <tr key={comment.id}>
                          <td>
                            <div>
                              <b>{comment.senderName}</b>
                              {' '}
                              <span className="text-muted">{comment.dateCreated}</span>
                            </div>
                            <div>{comment.comment}</div>
                          </td>
                          <td className="text-right">
                            <a href={SHIPMENT_URL.deleteComment(shipmentId, comment.id)}>
                              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                            </a>
                          </td>
                        </tr>
                      ))}
                      {data.comments.length === 0 && (
                        <tr>
                          <td className="text-center text-muted p-3">
                            <Translate id="react.default.empty.label" defaultMessage="Empty" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="d-flex flex-wrap my-2">
                    <a href={SHIPMENT_URL.addComment(shipmentId)} className="btn btn-outline-primary btn-sm mr-1">
                      <Translate id="react.shipment.addComment.label" defaultMessage="Add comment" />
                    </a>
                  </div>
                </div>
              )}
              {activeTab === 'events' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.events.label" defaultMessage="Events" /></h2>
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th><Translate id="react.shipment.event.label" defaultMessage="Event" /></th>
                        <th><Translate id="react.default.date.label" defaultMessage="Date" /></th>
                        <th><Translate id="react.default.time.label" defaultMessage="Time" /></th>
                        <th><Translate id="react.default.location.label" defaultMessage="Location" /></th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.events.map((event) => (
                        <tr key={event.id || 'created'}>
                          <td>{event.name}</td>
                          <td>{event.date}</td>
                          <td>{event.time}</td>
                          <td>{event.locationName}</td>
                          <td className="text-right">
                            {event.id && (
                              <>
                                <a href={SHIPMENT_URL.editEvent(event.id, { shipmentId })}>
                                  <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                                </a>
                                {' '}
                                <a href={SHIPMENT_URL.deleteEvent(event.id, { shipmentId })}>
                                  <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                                </a>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex flex-wrap my-2">
                    <a href={SHIPMENT_URL.editEvent(shipmentId)} className="btn btn-outline-primary btn-sm mr-1">
                      <Translate id="react.shipment.addEvent.label" defaultMessage="Add event" />
                    </a>
                  </div>
                </div>
              )}
              {activeTab === 'transactions' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.transactions.label" defaultMessage="Transactions" /></h2>
                  {transactionsHtml !== null
                    ? <div dangerouslySetInnerHTML={{ __html: transactionsHtml }} />
                    : <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
                </div>
              )}
              {activeTab === 'tracking' && (
                <div className="card p-3 mb-3">
                  <h2><Translate id="react.shipment.tracking.label" defaultMessage="Tracking" /></h2>
                  {trackingHtml !== null
                    ? <div dangerouslySetInnerHTML={{ __html: trackingHtml }} />
                    : <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowShipment;

ShowShipment.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
};
