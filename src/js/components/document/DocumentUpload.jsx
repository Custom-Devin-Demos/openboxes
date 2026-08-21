import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import {
  DOCUMENT_API,
  DOCUMENT_DETAILS,
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_UPDATE,
} from 'api/urls';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { DOCUMENT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const DocumentUpload = ({ match }) => {
  useTranslation('document', 'default');
  const { documentId } = match.params;

  const [documentTypeOptions, setDocumentTypeOptions] = useState([]);
  const [details, setDetails] = useState(null);
  const [values, setValues] = useState({
    name: '',
    documentNumber: '',
    documentType: null,
    version: null,
  });
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
    if (!documentId) {
      return;
    }
    apiClient.get(DOCUMENT_DETAILS(documentId))
      .then((response) => {
        const document = response.data.data;
        setDetails(document);
        setValues({
          name: document.name || '',
          documentNumber: document.documentNumber || '',
          documentType: document.documentType ? {
            id: document.documentType.id,
            value: document.documentType.id,
            label: document.documentType.name,
          } : null,
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

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      if (documentId) {
        const formData = new URLSearchParams();
        formData.append('name', values.name);
        formData.append('documentType.id', values.documentType?.id || 'null');
        formData.append('documentNumber', values.documentNumber);
        if (values.version != null) {
          formData.append('version', values.version);
        }
        const response = await apiClient.post(DOCUMENT_UPDATE(documentId), formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        notification(NotificationType.SUCCESS)({
          message: response.data.message,
        });
        window.location = DOCUMENT_URL.edit(documentId);
      } else {
        const formData = new FormData();
        formData.append('documentType.id', values.documentType?.id || 'null');
        formData.append('name', values.name);
        formData.append('documentNumber', values.documentNumber);
        const file = fileInputRef.current?.files?.[0];
        if (file) {
          formData.append('fileContents', file);
        }
        const response = await apiClient.post(DOCUMENT_API, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        window.location = DOCUMENT_URL.edit(response.data.data.id);
      }
    } catch (error) {
      handleError(error);
    }
  };

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
        <h1 className="mb-3">
          <Translate id="react.document.addDocument.label" defaultMessage="Add Document" />
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.document.type.label', defaultMessage: 'Type' }}
              name="typeId"
              options={documentTypeOptions}
              defaultValue={values.documentType}
              onChange={setValue('documentType')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.document.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
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
          <div className="mb-3">
            <div className="font-weight-bold mb-1">
              <label htmlFor="fileContents">
                <Translate id="react.document.selectFile.label" defaultMessage="Select file" />
              </label>
            </div>
            {!documentId ? (
              <input type="file" id="fileContents" name="fileContents" ref={fileInputRef} />
            ) : (
              <div id="filename">{details?.filename}</div>
            )}
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label={documentId ? 'react.default.button.save.label' : 'react.default.button.upload.label'}
              defaultLabel={documentId ? 'Save' : 'Upload'}
            />
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(DocumentUpload);

DocumentUpload.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      documentId: PropTypes.string,
    }),
  }).isRequired,
};
