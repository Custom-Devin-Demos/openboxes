/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_DOCUMENT_FORM, SHIPMENT_SUMMARY } from 'api/urls';
import ShipmentSummary from 'components/shipment/ShipmentSummary';
import { DOCUMENT_URL, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const AddDocument = ({ match, location }) => {
  const parsedQuery = queryString.parse(location.search);
  const shipmentId = match.params.shipmentId || parsedQuery.shipmentId;
  const documentId = parsedQuery.documentId || parsedQuery['document.id'];
  const [summary, setSummary] = useState(null);
  const [document, setDocument] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);

  useEffect(() => {
    apiClient.get(SHIPMENT_SUMMARY(shipmentId))
      .then((response) => setSummary(response.data.data));
    apiClient.get(SHIPMENT_DOCUMENT_FORM(shipmentId), { params: { documentId } })
      .then((response) => {
        setDocument(response.data.data.document);
        setDocumentTypes(response.data.data.documentTypes);
      });
  }, [shipmentId, documentId]);

  const formAction = document?.id ? DOCUMENT_URL.saveDocument() : DOCUMENT_URL.uploadDocument();

  return (
    <div className="body">
      <ShipmentSummary summary={summary} />
      <div className="box">
        <h2>
          <Translate id="react.shipment.addDocument.label" defaultMessage="Add Document" />
        </h2>
        <form action={formAction} method="post" encType="multipart/form-data">
          <input type="hidden" name="shipmentId" value={shipmentId} />
          <input type="hidden" name="documentId" value={document?.id || ''} />
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <label>
                    <Translate id="react.default.id.label" defaultMessage="ID" />
                  </label>
                </td>
                <td valign="top" className="value">
                  {document?.id}
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label>
                    <Translate id="react.default.name.label" defaultMessage="Name" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input type="text" name="name" defaultValue={document?.name || ''} className="text" size="80" />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label>
                    <Translate id="react.shipment.document.type.label" defaultMessage="Document type" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <select name="typeId" defaultValue={document?.documentType?.id || ''}>
                    <option value="" />
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
                  <label>
                    <Translate id="react.shipment.document.number.label" defaultMessage="Document number" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input type="text" name="documentNumber" defaultValue={document?.documentNumber || ''} className="text" size="80" />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label>
                    <Translate id="react.shipment.document.filename.label" defaultMessage="File name" />
                  </label>
                </td>
                <td valign="top" className="value">
                  {document?.filename}
                </td>
              </tr>
              {document
                && (
                <>
                  <tr className="prop">
                    <td valign="top" className="name">
                      <label>
                        <Translate id="react.shipment.document.size.label" defaultMessage="Size" />
                      </label>
                    </td>
                    <td valign="top" className="value">
                      {document.size}
                      {' '}
                      bytes
                    </td>
                  </tr>
                  <tr className="prop">
                    <td valign="top" className="name">
                      <label>
                        <Translate id="react.shipment.document.contentType.label" defaultMessage="Content type" />
                      </label>
                    </td>
                    <td valign="top" className="value">
                      {document.contentType}
                    </td>
                  </tr>
                  <tr className="prop">
                    <td valign="top" className="name">
                      <label>
                        <Translate id="react.shipment.document.lastUpdated.label" defaultMessage="Last updated" />
                      </label>
                    </td>
                    <td valign="top" className="value">
                      {document.lastUpdated}
                    </td>
                  </tr>
                </>
                )}
              <tr className="prop">
                <td valign="top" className="name">
                  <label>
                    <Translate id="react.shipment.document.file.label" defaultMessage="File" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input name="fileContents" type="file" />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>
                  <div className="buttons left">
                    <button type="submit" className="button">
                      {document?.id
                        ? <Translate id="react.default.button.save.label" defaultMessage="Save" />
                        : <Translate id="react.default.button.upload.label" defaultMessage="Upload" />}
                    </button>
                    {' '}
                    <a href={SHIPMENT_URL.showDetails(shipmentId)}>
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

export default AddDocument;

AddDocument.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      shipmentId: PropTypes.string,
    }),
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
