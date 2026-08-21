import React from 'react';

import PropTypes from 'prop-types';

import { DOCUMENT_URL, ORDER_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const SupplierDocuments = ({ documents }) => {
  const fileDocuments = documents?.filter((document) => !document.fileUri) || [];
  const linkDocuments = documents?.filter((document) => document.fileUri) || [];

  if (!fileDocuments.length && !linkDocuments.length) {
    return (
      <div className="p-3">
        <Translate id="react.supplierShow.noDocuments.label" defaultMessage="No documents have been added" />
      </div>
    );
  }

  return (
    <div className="p-2">
      {fileDocuments.length > 0 && (
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th aria-label="PO Number"><Translate id="react.supplierShow.document.orderNumber.label" defaultMessage="PO Number" /></th>
              <th aria-label="Description"><Translate id="react.supplierShow.document.orderDescription.label" defaultMessage="Description" /></th>
              <th aria-label="Origin"><Translate id="react.supplierShow.document.origin.label" defaultMessage="Origin" /></th>
              <th aria-label="Destination"><Translate id="react.supplierShow.document.destination.label" defaultMessage="Destination" /></th>
              <th aria-label="Type"><Translate id="react.supplierShow.document.type.label" defaultMessage="Type" /></th>
              <th aria-label="Name"><Translate id="react.supplierShow.document.name.label" defaultMessage="Name" /></th>
              <th aria-label="Content type"><Translate id="react.supplierShow.document.fileType.label" defaultMessage="Content type" /></th>
              <th aria-label="Download" />
            </tr>
          </thead>
          <tbody>
            {fileDocuments.map((document) => (
              <tr key={document.documentId}>
                <td>
                  <a href={ORDER_URL.show(document.orderId)}>{document.orderNumber}</a>
                </td>
                <td>{document.orderDescription}</td>
                <td>{document.origin}</td>
                <td>{document.destination}</td>
                <td>{document.documentType}</td>
                <td>{document.documentName}</td>
                <td>{document.fileType}</td>
                <td>
                  <a href={DOCUMENT_URL.download(document.documentId)}>
                    <Translate id="react.supplierShow.document.download.label" defaultMessage="Download" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {linkDocuments.length > 0 && (
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th aria-label="PO Number"><Translate id="react.supplierShow.document.orderNumber.label" defaultMessage="PO Number" /></th>
              <th aria-label="Description"><Translate id="react.supplierShow.document.orderDescription.label" defaultMessage="Description" /></th>
              <th aria-label="Name"><Translate id="react.supplierShow.document.name.label" defaultMessage="Name" /></th>
              <th aria-label="URL"><Translate id="react.supplierShow.document.url.label" defaultMessage="URL" /></th>
            </tr>
          </thead>
          <tbody>
            {linkDocuments.map((document) => (
              <tr key={document.documentId}>
                <td>
                  <a href={ORDER_URL.show(document.orderId)}>{document.orderNumber}</a>
                </td>
                <td>{document.orderDescription}</td>
                <td>{document.documentName}</td>
                <td>
                  <a href={document.fileUri} target="_blank" rel="noopener noreferrer">{document.fileUri}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupplierDocuments;

SupplierDocuments.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.shape({})),
};

SupplierDocuments.defaultProps = {
  documents: [],
};
