import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { INVOICE_DETAILS } from 'api/urls';
import InvoiceSummary from 'components/invoice/show/InvoiceSummary';
import {
  CONTEXT_PATH, DOCUMENT_URL, INVOICE_URL, ORDER_URL, STOCK_MOVEMENT_URL,
} from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const formatAmount = (value) => (value === null || value === undefined
  ? ''
  : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const formatWholeNumber = (value) => (value === null || value === undefined
  ? ''
  : Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 }));

const InvoiceShowPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('items');

  useTranslation('invoice');

  useEffect(() => {
    apiClient.get(INVOICE_DETAILS(id))
      .then((response) => setInvoice(response.data.data));
  }, [id]);

  if (!invoice) {
    return null;
  }

  const allDocuments = [...(invoice.documents || []), ...(invoice.orderDocuments || [])];
  const fileDocuments = (invoice.documents || []).filter((doc) => !doc.fileUri);
  const fileOrderDocuments = (invoice.orderDocuments || []).filter((doc) => !doc.fileUri);
  const linkDocuments = (invoice.documents || []).filter((doc) => doc.fileUri);
  const linkOrderDocuments = (invoice.orderDocuments || []).filter((doc) => doc.fileUri);

  const confirmDelete = (event) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure?')) {
      event.preventDefault();
    }
  };

  return (
    <div className="d-flex flex-column list-page-main">
      <InvoiceSummary invoice={invoice} />
      <div className="d-flex flex-wrap">
        <div className="col-md-4 px-0">
          <div className="box">
            <h2>
              <Translate id="react.invoice.invoiceHeader.label" defaultMessage="Invoice Header" />
            </h2>
            <table>
              <tbody>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.invoiceNumber.label" defaultMessage="Invoice Number" />
                  </td>
                  <td valign="top" className="value">{invoice.invoiceNumber}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.vendorInvoiceNumber.label" defaultMessage="Vendor invoice number" />
                  </td>
                  <td valign="top" className="value">{invoice.vendorInvoiceNumber}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.vendor.label" defaultMessage="Vendor" />
                  </td>
                  <td valign="top" className="value">{invoice.vendorName}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.partyFrom.label" defaultMessage="Buying organization" />
                  </td>
                  <td valign="top" className="value">{invoice.partyFromName}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.default.createdBy.label" defaultMessage="Created by" />
                  </td>
                  <td valign="top" className="value">{invoice.createdByName}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.currency.label" defaultMessage="Currency" />
                  </td>
                  <td valign="top" className="value">{invoice.currencyName}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.invoiceType.label" defaultMessage="Invoice type" />
                  </td>
                  <td valign="top" className="value">{invoice.invoiceTypeName}</td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.totalValue.label" defaultMessage="Total value" />
                    {' '}
                    <small><Translate id="react.invoice.localCurrency.label" defaultMessage="Local Currency" /></small>
                  </td>
                  <td valign="top" className="value">
                    {invoice.totalValue}
                    {' '}
                    {invoice.currencyCode}
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.totalValue.label" defaultMessage="Total value" />
                    {' '}
                    <small><Translate id="react.invoice.defaultCurrency.label" defaultMessage="Default Currency" /></small>
                  </td>
                  <td valign="top" className="value">
                    {invoice.totalValueNormalized}
                    {' '}
                    {invoice.defaultCurrencyCode}
                  </td>
                </tr>
                {invoice.orders && invoice.orders.length > 0 && (
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.invoice.orders.label" defaultMessage="Orders" />
                    </td>
                    <td className="value">
                      {invoice.orders.map((order) => (
                        <a key={order.id} href={ORDER_URL.show(order.id)} target="_blank" rel="noopener noreferrer">
                          <Translate id="react.invoice.viewOrder.label" defaultMessage="View Order" />
                          {' '}
                          {order.orderNumber}
                        </a>
                      ))}
                    </td>
                  </tr>
                )}
                {invoice.shipments && invoice.shipments.length > 0 && (
                  <tr className="prop">
                    <td className="name">
                      <Translate id="react.invoice.shipments.label" defaultMessage="Shipments" />
                    </td>
                    <td className="value">
                      {invoice.shipments.map((shipment) => (
                        <a key={shipment.id} href={STOCK_MOVEMENT_URL.show(shipment.id)} target="_blank" rel="noopener noreferrer">
                          <Translate id="react.invoice.viewShipment.label" defaultMessage="View Shipment" />
                          {' '}
                          {shipment.shipmentNumber}
                        </a>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="box">
            <h2><Translate id="react.default.auditing.label" defaultMessage="Auditing" /></h2>
            <table>
              <tbody>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.default.createdBy.label" defaultMessage="Created by" />
                  </td>
                  <td valign="top" className="value">
                    <div>{invoice.createdByName}</div>
                    <small>{invoice.dateCreated}</small>
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.default.updatedBy.label" defaultMessage="Updated by" />
                  </td>
                  <td valign="top" className="value">
                    <div>{invoice.updatedByName}</div>
                    <small>{invoice.lastUpdated}</small>
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.invoiced.label" defaultMessage="Invoiced" />
                  </td>
                  <td valign="top" className="value">
                    <div>{invoice.dateInvoiced}</div>
                  </td>
                </tr>
                <tr className="prop">
                  <td valign="top" className="name">
                    <Translate id="react.invoice.submitted.label" defaultMessage="Submitted" />
                  </td>
                  <td valign="top" className="value">
                    <div>{invoice.datePosted}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-8 px-0">
          <div className="tabs tabs-ui box">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a
                  href="#tabs-items"
                  className={`nav-link ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={(event) => { event.preventDefault(); setActiveTab('items'); }}
                >
                  <Translate id="react.invoice.invoiceItems.label" defaultMessage="Invoice Items" />
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#tabs-documents"
                  className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={(event) => { event.preventDefault(); setActiveTab('documents'); }}
                >
                  <Translate id="react.invoice.documents.label" defaultMessage="Documents" />
                </a>
              </li>
            </ul>
            {activeTab === 'items' && (
              <div id="tabs-items" className="box">
                <h2>
                  <Translate id="react.invoice.invoiceItems.label" defaultMessage="Invoice Items" />
                </h2>
                {invoice.items && invoice.items.length > 0 ? (
                  <table className="table table-bordered">
                    <thead>
                      <tr className="odd">
                        <th aria-label="Code"><Translate id="react.default.code.label" defaultMessage="Code" /></th>
                        <th aria-label="Name"><Translate id="react.default.name.label" defaultMessage="Name" /></th>
                        <th aria-label="Order number"><Translate id="react.invoice.orderNumber.label" defaultMessage="Order number" /></th>
                        <th aria-label="GL account"><Translate id="react.invoice.glAccount.label" defaultMessage="GL account" /></th>
                        <th aria-label="Budget code"><Translate id="react.invoice.budgetCode.label" defaultMessage="Budget code" /></th>
                        <th aria-label="Quantity"><Translate id="react.default.quantity.label" defaultMessage="Quantity" /></th>
                        <th aria-label="Quantity per UOM"><Translate id="react.invoice.quantityPerUom.label" defaultMessage="Quantity per UOM" /></th>
                        <th aria-label="Amount"><Translate id="react.invoice.amount.label" defaultMessage="Amount" /></th>
                        <th aria-label="Total amount"><Translate id="react.invoice.totalAmount.label" defaultMessage="Total amount" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'odd' : 'even'}>
                          <td>{item.productCode || 'All'}</td>
                          <td>{item.description}</td>
                          <td>{item.orderNumber}</td>
                          <td>{item.glAccountCode}</td>
                          <td>{item.budgetCodeCode}</td>
                          <td>{item.quantity}</td>
                          <td>{formatWholeNumber(item.quantityPerUom)}</td>
                          <td>{formatAmount(item.unitPrice || 0)}</td>
                          <td>{formatAmount(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="8" aria-label="Total" />
                        <th>{invoice.totalValue}</th>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="fade show center empty">
                    <Translate id="react.default.noItems.label" defaultMessage="No items" />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'documents' && (
              <div id="tabs-documents">
                {[...fileDocuments, ...fileOrderDocuments].length > 0 && (
                  <div className="box">
                    <h2><Translate id="react.invoice.documents.label" defaultMessage="Documents" /></h2>
                    <table>
                      <thead>
                        <tr className="odd">
                          <th aria-label="File name"><Translate id="react.invoice.document.filename.label" defaultMessage="File name" /></th>
                          <th aria-label="Type"><Translate id="react.invoice.document.type.label" defaultMessage="Type" /></th>
                          <th aria-label="Description"><Translate id="react.default.description.label" defaultMessage="Description" /></th>
                          <th aria-label="Size"><Translate id="react.invoice.document.size.label" defaultMessage="Size" /></th>
                          <th aria-label="Last updated"><Translate id="react.default.lastUpdated.label" defaultMessage="Last updated" /></th>
                          <th className="right" aria-label="Actions"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              {doc.filename}
                              {' ('}
                              <a href={DOCUMENT_URL.download(doc.id)}>download</a>
                              )
                            </td>
                            <td>{doc.documentTypeName}</td>
                            <td>{doc.name}</td>
                            <td>
                              {doc.size}
                              {' '}
                              bytes
                            </td>
                            <td>{doc.lastUpdated}</td>
                            <td className="right" align="right">
                              <a href={INVOICE_URL.editDocument(doc.id, invoice.id)} aria-label="Edit">
                                <img src={`${CONTEXT_PATH}/static/images/icons/silk/page_edit.png`} alt="Edit" />
                              </a>
                              <a
                                href={INVOICE_URL.deleteDocument(doc.id, invoice.id)}
                                onClick={confirmDelete}
                                aria-label="Delete"
                              >
                                <img src={`${CONTEXT_PATH}/static/images/icons/trash.png`} alt="Delete" />
                              </a>
                            </td>
                          </tr>
                        ))}
                        {fileOrderDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              {doc.filename}
                              {' ('}
                              <a href={DOCUMENT_URL.download(doc.id)}>download</a>
                              )
                            </td>
                            <td>{doc.documentTypeName}</td>
                            <td>{doc.name}</td>
                            <td>
                              {doc.size}
                              {' '}
                              bytes
                            </td>
                            <td>{doc.lastUpdated}</td>
                            <td />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {[...linkDocuments, ...linkOrderDocuments].length > 0 && (
                  <div className="box">
                    <h2><Translate id="react.invoice.links.label" defaultMessage="Links" /></h2>
                    <table>
                      <thead>
                        <tr className="odd">
                          <th aria-label="Name"><Translate id="react.default.name.label" defaultMessage="Name" /></th>
                          <th aria-label="URL"><Translate id="react.invoice.document.url.label" defaultMessage="URL" /></th>
                          <th className="right" aria-label="Actions"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              <a href={doc.fileUri} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                            </td>
                            <td style={{ width: '80%' }}>
                              <a href={doc.fileUri} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                                {doc.fileUri}
                              </a>
                            </td>
                            <td className="right">
                              <a href={INVOICE_URL.editDocument(doc.id, invoice.id)} aria-label="Edit">
                                <img src={`${CONTEXT_PATH}/static/images/icons/silk/page_edit.png`} alt="Edit" />
                              </a>
                              <a
                                href={INVOICE_URL.deleteDocument(doc.id, invoice.id)}
                                onClick={confirmDelete}
                                aria-label="Delete"
                              >
                                <img src={`${CONTEXT_PATH}/static/images/icons/trash.png`} alt="Delete" />
                              </a>
                            </td>
                          </tr>
                        ))}
                        {linkOrderDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>
                              <a href={doc.fileUri} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                            </td>
                            <td style={{ width: '80%' }}>
                              <a href={doc.fileUri} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                                {doc.fileUri}
                              </a>
                            </td>
                            <td />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {allDocuments.length === 0 && (
                  <div className="fade show center empty">
                    <Translate id="react.default.noDocuments.label" defaultMessage="No documents" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceShowPage;
