import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';

import { ORDER_DOCUMENT_FORM_DATA } from 'api/urls';
import OrderSummary from 'components/order/OrderSummary';
import { DOCUMENT_URL, ORDER_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const OrderAddDocumentPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryProps = queryString.parse(location.search);

  // On the edit screen (order/editDocument/:documentId?order.id=:orderId),
  // :id is the document id and the order id comes from the query string
  const isEdit = location.pathname.includes('editDocument');
  const orderId = isEdit ? queryProps['order.id'] : id;
  const documentId = isEdit ? id : null;

  const [documentTypes, setDocumentTypes] = useState([]);
  const [existingDocument, setExistingDocument] = useState(null);
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [typeId, setTypeId] = useState('');
  const [fileUri, setFileUri] = useState('');

  useTranslation('order');

  useEffect(() => {
    if (orderId) {
      apiClient.get(ORDER_DOCUMENT_FORM_DATA(orderId), {
        params: documentId ? { documentId } : {},
      })
        .then((response) => {
          const { data } = response.data;
          setDocumentTypes(data.documentTypes);
          if (data.document) {
            setExistingDocument(data.document);
            setName(data.document.name || '');
            setDocumentNumber(data.document.documentNumber || '');
            setTypeId(data.document.documentTypeId || '');
            setFileUri(data.document.fileUri || '');
          }
        });
    }
  }, [orderId, documentId]);

  // Process an upload or save depending on whether we are adding
  // a new document or modifying a previous one (legacy semantics)
  const formAction = existingDocument
    ? DOCUMENT_URL.saveDocument()
    : DOCUMENT_URL.uploadDocument();

  return (
    <div className="d-flex flex-column list-page-main">
      <OrderSummary orderId={orderId} />
      <div className="box p-3">
        <h2>
          <Translate id="react.order.addDocument.label" defaultMessage="Add document" />
        </h2>
        <form method="post" action={formAction} encType="multipart/form-data">
          <input type="hidden" name="orderId" value={orderId || ''} />
          <input type="hidden" name="documentId" value={existingDocument?.id || ''} />
          <table>
            <tbody>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="name" className="optional">
                    <Translate id="react.order.document.description.label" defaultMessage="Description" />
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
                  <label htmlFor="documentNumber" className="optional">
                    <Translate id="react.order.document.number.label" defaultMessage="Document number" />
                  </label>
                </td>
                <td valign="top" className="value">
                  <input
                    id="documentNumber"
                    name="documentNumber"
                    type="text"
                    className="text form-control"
                    size="80"
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="typeId">
                    <Translate id="react.order.document.type.label" defaultMessage="Type" />
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
                    <Translate id="react.order.document.selectFile.label" defaultMessage="Select file" />
                  </label>
                </td>
                <td valign="top" className="value">
                  {/* At this point you can only edit document details,
                      not modify the file itself (legacy behavior) */}
                  {!existingDocument
                    ? <input id="fileContents" name="fileContents" type="file" />
                    : existingDocument.filename}
                </td>
              </tr>
              <tr className="prop">
                <td valign="top" className="name">
                  <label htmlFor="fileUri">
                    <Translate id="react.order.document.url.label" defaultMessage="URL" />
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
                      {existingDocument
                        ? <Translate id="react.default.button.save.label" defaultMessage="Save" />
                        : <Translate id="react.default.button.upload.label" defaultMessage="Upload" />}
                    </button>
                    <a href={ORDER_URL.show(orderId)} className="button">
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

export default OrderAddDocumentPage;
