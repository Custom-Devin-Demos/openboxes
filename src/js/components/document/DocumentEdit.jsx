import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import {
  DOCUMENT_DELETE,
  DOCUMENT_DETAILS,
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_UPDATE,
  DOCUMENT_UPLOAD,
} from 'api/urls';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { DOCUMENT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const DocumentEdit = ({ match }) => {
  useTranslation('document', 'default');
  const translate = useTranslate();
  const { documentId } = match.params;

  const [documentTypeOptions, setDocumentTypeOptions] = useState([]);
  const [details, setDetails] = useState(null);
  const [values, setValues] = useState({
    name: '',
    documentType: null,
    extension: '',
    contentType: '',
    fileUri: '',
    documentNumber: '',
    version: null,
  });
  const [activeTab, setActiveTab] = useState('metadata');
  const [flashMessage, setFlashMessage] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    apiClient.get(DOCUMENT_TYPE_OPTIONS)
      .then((response) => {
        setDocumentTypeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.name,
        })));
      });
  }, []);

  useEffect(() => {
    apiClient.get(DOCUMENT_DETAILS(documentId))
      .then((response) => {
        const document = response.data.data;
        setDetails(document);
        setValues({
          name: document.name || '',
          documentType: document.documentType ? {
            id: document.documentType.id,
            value: document.documentType.id,
            label: document.documentType.name,
          } : null,
          extension: document.extension || '',
          contentType: document.contentType || '',
          fileUri: document.fileUri || '',
          documentNumber: document.documentNumber || '',
          version: document.version,
        });
      });
  }, [documentId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleError = (error) => {
    const responseData = error?.response?.data;
    setFlashMessage(responseData?.flashMessage || responseData?.errorMessage || null);
    setErrorMessages(responseData?.errorMessages || []);
  };

  const onUpdate = async (event) => {
    event.preventDefault();
    const formData = new URLSearchParams();
    formData.append('name', values.name);
    formData.append('documentType.id', values.documentType?.id || 'null');
    formData.append('extension', values.extension);
    formData.append('contentType', values.contentType);
    formData.append('fileUri', values.fileUri);
    formData.append('documentNumber', values.documentNumber);
    if (values.version != null) {
      formData.append('version', values.version);
    }
    try {
      const response = await apiClient.post(DOCUMENT_UPDATE(documentId), formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      notification(NotificationType.SUCCESS)({
        message: response.data.message,
      });
      window.location = DOCUMENT_URL.list();
    } catch (error) {
      handleError(error);
    }
  };

  const onDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(translate('react.default.areYouSure.label', 'Are you sure?'))) {
      return;
    }
    try {
      const response = await apiClient.delete(DOCUMENT_DELETE(documentId));
      notification(NotificationType.SUCCESS)({
        message: response.data.message,
      });
      window.location = DOCUMENT_URL.list();
    } catch (error) {
      handleError(error);
    }
  };

  const onUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append('fileContents', file);
    }
    if (values.version != null) {
      formData.append('version', values.version);
    }
    try {
      const response = await apiClient.post(DOCUMENT_UPLOAD(documentId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notification(NotificationType.SUCCESS)({
        message: response.data.message,
      });
      window.location = DOCUMENT_URL.edit(documentId);
    } catch (error) {
      handleError(error);
    }
  };

  if (!details) {
    return (
      <div className="p-3">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        {flashMessage && (
          <div className="alert alert-info" role="status" aria-label="message">{flashMessage}</div>
        )}
        {errorMessages.length > 0 && (
          <div className="alert alert-danger" role="alert" aria-label="error-message">
            <ul className="mb-0">
              {errorMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          </div>
        )}
        <div className="mb-3">
          <a href={DOCUMENT_URL.list()} className="btn btn-outline-secondary btn-sm mr-2">
            <Translate id="react.document.list.label" defaultMessage="List documents" />
          </a>
          <a href={DOCUMENT_URL.create()} className="btn btn-outline-secondary btn-sm">
            <Translate id="react.document.add.label" defaultMessage="Add document" />
          </a>
        </div>
        <div id="document-tabs">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'metadata' ? 'active' : ''}`}
                onClick={() => setActiveTab('metadata')}
              >
                <Translate id="react.document.label" defaultMessage="Document" />
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => setActiveTab('file')}
              >
                <Translate id="react.document.file.label" defaultMessage="File" />
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link" href={DOCUMENT_URL.preview(documentId)}>
                <Translate id="react.default.button.preview.label" defaultMessage="Preview" />
              </a>
            </li>
          </ul>
          {activeTab === 'metadata' && (
            <form onSubmit={onUpdate} className="w-50">
              <h1 className="mb-3">
                <Translate id="react.document.editDocument.label" defaultMessage="Edit Document" />
              </h1>
              <div className="mb-3">
                <TextInput
                  title={{ id: 'react.document.name.label', defaultMessage: 'Document name' }}
                  name="name"
                  value={values.name}
                  onChange={(e) => setValue('name')(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <SelectField
                  title={{ id: 'react.document.documentType.label', defaultMessage: 'Document Type' }}
                  name="documentType"
                  options={documentTypeOptions}
                  defaultValue={values.documentType}
                  onChange={setValue('documentType')}
                />
              </div>
              <div className="mb-3">
                <TextInput
                  title={{ id: 'react.document.extension.label', defaultMessage: 'Extension' }}
                  name="extension"
                  value={values.extension}
                  onChange={(e) => setValue('extension')(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <TextInput
                  title={{ id: 'react.document.contentType.label', defaultMessage: 'Content type' }}
                  name="contentType"
                  value={values.contentType}
                  onChange={(e) => setValue('contentType')(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <TextInput
                  title={{ id: 'react.document.fileUri.label', defaultMessage: 'File Uri' }}
                  name="fileUri"
                  value={values.fileUri}
                  onChange={(e) => setValue('fileUri')(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <TextInput
                  title={{ id: 'react.document.documentNumber.label', defaultMessage: 'Document Number' }}
                  name="documentNumber"
                  value={values.documentNumber}
                  onChange={(e) => setValue('documentNumber')(e.target.value)}
                />
              </div>
              <div className="d-flex gap-8 align-items-center">
                <Button
                  type="submit"
                  label="react.default.button.update.label"
                  defaultLabel="Update"
                />
                <Button
                  type="button"
                  variant="danger"
                  label="react.default.button.delete.label"
                  defaultLabel="Delete"
                  onClick={onDelete}
                />
              </div>
            </form>
          )}
          {activeTab === 'file' && (
            <form onSubmit={onUpload} className="w-50">
              <h1 className="mb-3">
                <Translate id="react.document.uploadDocument.label" defaultMessage="Upload Document" />
              </h1>
              <div className="mb-3">
                <div className="font-weight-bold mb-1">
                  <Translate id="react.document.filename.label" defaultMessage="Filename" />
                </div>
                <div id="filename">{details.filename}</div>
              </div>
              <div className="mb-3">
                <div className="font-weight-bold mb-1">
                  <Translate id="react.document.image.label" defaultMessage="Image" />
                </div>
                <div id="image">{String(details.isImage)}</div>
              </div>
              <div className="mb-3">
                <div className="font-weight-bold mb-1">
                  <Translate id="react.document.size.label" defaultMessage="Size" />
                </div>
                <div id="size">
                  {details.size}
                  {' '}
                  bytes
                </div>
              </div>
              <div className="mb-3">
                <div className="font-weight-bold mb-1">
                  <Translate id="react.document.lastUpdated.label" defaultMessage="Last Updated" />
                </div>
                <div>{details.lastUpdated}</div>
              </div>
              <div className="mb-3">
                <div className="font-weight-bold mb-1">
                  <label htmlFor="fileContents">
                    <Translate id="react.document.fileContents.label" defaultMessage="File Contents" />
                  </label>
                </div>
                <input type="file" id="fileContents" name="fileContents" ref={fileInputRef} className="mr-2" />
                <Button
                  type="submit"
                  label="react.default.button.upload.label"
                  defaultLabel="Upload"
                />
              </div>
              <div className="d-flex gap-8 align-items-center">
                <a href={DOCUMENT_URL.download(documentId)} className="btn btn-outline-primary btn-sm">
                  <Translate id="react.document.download.label" defaultMessage="Download" />
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(DocumentEdit);

DocumentEdit.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      documentId: PropTypes.string,
    }),
  }).isRequired,
};
