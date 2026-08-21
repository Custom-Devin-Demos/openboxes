import React from 'react';

import PropTypes from 'prop-types';

import { INVOICE_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const InvoiceSummary = ({ invoice }) => {
  if (!invoice) {
    return null;
  }

  return (
    <div>
      <div className="summary p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="title">
            {[invoice.invoiceNumber, invoice.vendorName, invoice.vendorInvoiceNumber]
              .filter(Boolean).join(' ')}
          </div>
          {invoice.statusLabel
            && <span className="tag tag-alert">{invoice.statusLabel}</span>}
        </div>
      </div>
      <div className="buttonBar p-2">
        <div className="button-container">
          <a href={INVOICE_URL.list()} className="button">
            <Translate id="react.invoice.list.label" defaultMessage="List Invoices" />
          </a>
          <a href={INVOICE_URL.edit(invoice.id)} className="button">
            <Translate id="react.invoice.editInvoice.label" defaultMessage="Edit Invoice" />
          </a>
          {invoice.isPosted && (
            <a name="invoiceRollback" href={INVOICE_URL.rollback(invoice.id)} className="button">
              <Translate id="react.invoice.rollback.label" defaultMessage="Rollback" />
            </a>
          )}
          {!invoice.isPosted && (
            <a
              href={INVOICE_URL.eraseInvoice(invoice.id)}
              className="button"
              onClick={(event) => {
                // eslint-disable-next-line no-alert
                if (!window.confirm('Are you sure?')) {
                  event.preventDefault();
                }
              }}
            >
              <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
            </a>
          )}
          <a href={INVOICE_URL.addDocument(invoice.id)} className="button">
            <Translate id="react.invoice.addDocument.label" defaultMessage="Add document" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;

InvoiceSummary.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.string,
    invoiceNumber: PropTypes.string,
    vendorName: PropTypes.string,
    vendorInvoiceNumber: PropTypes.string,
    statusLabel: PropTypes.string,
    isPosted: PropTypes.bool,
  }),
};

InvoiceSummary.defaultProps = {
  invoice: null,
};
