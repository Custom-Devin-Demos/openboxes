import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { STOCK_MOVEMENT_DOCUMENT_FORM_DATA } from 'api/urls';
import StockMovementSummary from 'components/stock-movement/StockMovementSummary';
import { DOCUMENT_URL, STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const StockMovementAddDocumentPage = () => {
  const { id } = useParams();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [shipmentId, setShipmentId] = useState('');
  const [summary, setSummary] = useState(null);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [fileUri, setFileUri] = useState('');

  useTranslation('stockMovement');

  useEffect(() => {
    if (id) {
      apiClient.get(STOCK_MOVEMENT_DOCUMENT_FORM_DATA(id))
        .then((response) => {
          const { data } = response.data;
          setDocumentTypes(data.documentTypes);
          setShipmentId(data.shipmentId || '');
          setSummary(data.summary);
        });
    }
  }, [id]);

  return (
    <div className="d-flex flex-column list-page-main">
      <StockMovementSummary summary={summary} />
      <div className="box p-3">
        <h2>
          <Translate id="react.stockMovement.addDocument.label" defaultMessage="Add document" />
        </h2>
        {/* Plain multipart form POST preserves the legacy uploadDocument
            semantics (validation, flash messages and redirect to show) */}
        <form method="post" action={DOCUMENT_URL.uploadDocument()} encType="multipart/form-data">
          <input type="hidden" name="stockMovementId" value={id || ''} />
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="name">
                    <Translate id="react.stockMovement.document.name.label" defaultMessage="Name" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="text form-control"
                    size="80"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="typeId">
                    <Translate id="react.stockMovement.document.type.label" defaultMessage="Type" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select
                    id="typeId"
                    name="typeId"
                    aria-label="Type"
                    className="form-control"
                    value={typeId}
                    onChange={(event) => setTypeId(event.target.value)}
                  >
                    <option value="" aria-label="None" label=" " />
                    {documentTypes.map((documentType) => (
                      <option key={documentType.id} value={documentType.id}>
                        {documentType.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="fileContents">
                    <Translate id="react.stockMovement.document.file.label" defaultMessage="File" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input id="fileContents" name="fileContents" type="file" />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="fileUri">
                    <Translate id="react.stockMovement.document.url.label" defaultMessage="URL" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="fileUri"
                    name="fileUri"
                    type="text"
                    className="text form-control"
                    size="100"
                    value={fileUri}
                    onChange={(event) => setFileUri(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="prop">
                <td valign="top" />
                <td valign="top">
                  <div className="buttons left">
                    <button type="submit" className="button">
                      <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
                    </button>
                    <a href={STOCK_MOVEMENT_URL.show(id)}>
                      <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                    </a>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </form>
      </div>
    </div>
  );
};

export default StockMovementAddDocumentPage;
