import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import ProductScreenApi from 'api/services/ProductScreenApi';
import notification from 'components/Layout/notifications/notification';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const AddDocumentPage = () => {
  useTranslation('product', 'default');

  const { id } = useParams();
  const history = useHistory();

  const [context, setContext] = useState(null);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [file, setFile] = useState(null);
  const [fileUri, setFileUri] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    ProductScreenApi.getAddDocumentContext(id)
      .then((response) => setContext(response.data));
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append('productId', id);
      formData.append('name', name);
      formData.append('typeId', typeId);
      if (file) {
        formData.append('fileContents', file);
      }
      formData.append('fileUri', fileUri);
      const response = await ProductScreenApi.uploadDocument(id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notification(NotificationType.SUCCESS)({ message: response.data.message });
      history.push(`${window.CONTEXT_PATH}/product/edit/${id}`);
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to upload document']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.product.addDocument.label" defaultMessage="Add document to product" />
        </h1>
        {context?.product && (
          <h2 className="h5">
            {`${context.product.productCode} ${context.product.name}`}
          </h2>
        )}
        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="m-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit} className="w-50">
          <div className="form-group">
            <label htmlFor="document-name">
              <Translate id="react.product.documentName.label" defaultMessage="Name" />
            </label>
            <input
              id="document-name"
              className="form-control"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="document-type">
              <Translate id="react.product.documentType.label" defaultMessage="Type" />
            </label>
            <select
              id="document-type"
              className="form-control"
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
            >
              <option value="">
                Choose type
              </option>
              {context?.documentTypes?.map((documentType) => (
                <option key={documentType.id} value={documentType.id}>{documentType.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="document-file">
              <Translate id="react.product.documentFile.label" defaultMessage="File" />
            </label>
            <input
              id="document-file"
              className="form-control-file"
              type="file"
              onChange={(event) => setFile(event.target.files[0])}
            />
          </div>
          <div className="form-group">
            <label htmlFor="document-url">
              <Translate id="react.product.documentUrl.label" defaultMessage="URL" />
            </label>
            <input
              id="document-url"
              className="form-control"
              type="text"
              value={fileUri}
              onChange={(event) => setFileUri(event.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mr-2" disabled={submitting}>
            <Translate id="react.default.button.upload.label" defaultMessage="Upload" />
          </button>
          <a className="btn btn-outline-danger" href={INVENTORY_ITEM_URL.showStockCard(id)}>
            <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
          </a>
        </form>
      </div>
    </PageWrapper>
  );
};

export default AddDocumentPage;
