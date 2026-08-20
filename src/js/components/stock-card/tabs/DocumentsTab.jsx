import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { getLegacyUrl } from 'components/stock-card/legacyForm';
import Translate from 'utils/Translate';

const DocumentsTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getDocuments(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="File name"><Translate id="react.stockCard.filename.label" defaultMessage="File name" /></th>
            <th aria-label="Document type"><Translate id="react.stockCard.documentType.label" defaultMessage="Document type" /></th>
            <th aria-label="Content type"><Translate id="react.stockCard.contentType.label" defaultMessage="Content type" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.documents?.length === 0 && data?.links?.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">
                <Translate id="react.stockCard.noDocuments.message" defaultMessage="No documents" />
              </td>
            </tr>
          )}
          {data?.documents?.map((document) => (
            <tr key={document.id}>
              <td>
                <a href={getLegacyUrl(`/document/download/${document.id}`)}>{document.filename}</a>
              </td>
              <td>{document.documentType}</td>
              <td>{document.contentType}</td>
            </tr>
          ))}
          {data?.links?.map((link) => (
            <tr key={link.id}>
              <td>
                <a href={link.fileUri} target="_blank" rel="noopener noreferrer">{link.name || link.fileUri}</a>
              </td>
              <td><Translate id="react.stockCard.link.label" defaultMessage="Link" /></td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsTab;

DocumentsTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
