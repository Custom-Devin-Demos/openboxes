import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { DOCUMENT_API, DOCUMENT_TYPE_OPTIONS } from 'api/urls';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import { DOCUMENT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const DocumentCreate = () => {
  useTranslation('document', 'default');

  const [documentTypeOptions, setDocumentTypeOptions] = useState([]);
  const [documentType, setDocumentType] = useState(null);
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

  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('documentType.id', documentType?.id || 'null');
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append('fileContents', file);
    }
    try {
      const response = await apiClient.post(DOCUMENT_API, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      window.location = DOCUMENT_URL.edit(response.data.data.id);
    } catch (error) {
      const responseData = error?.response?.data;
      setFlashMessage(responseData?.flashMessage || null);
      setErrorMessages(responseData?.errorMessages || []);
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
        <div className="mb-3">
          <a href={DOCUMENT_URL.list()} className="btn btn-outline-secondary btn-sm mr-2">
            <Translate id="react.document.list.label" defaultMessage="List documents" />
          </a>
          <a href={DOCUMENT_URL.create()} className="btn btn-outline-secondary btn-sm">
            <Translate id="react.document.add.label" defaultMessage="Add document" />
          </a>
        </div>
        <h1 className="mb-3">
          <Translate id="react.document.createDocument.label" defaultMessage="Create Document" />
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.document.documentType.label', defaultMessage: 'Document Type' }}
              name="documentType"
              options={documentTypeOptions}
              defaultValue={documentType}
              onChange={setDocumentType}
            />
          </div>
          <div className="mb-3">
            <div className="font-weight-bold mb-1">
              <label htmlFor="fileContents">
                <Translate id="react.document.fileContents.label" defaultMessage="File" />
              </label>
            </div>
            <input type="file" id="fileContents" name="fileContents" ref={fileInputRef} />
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label="react.default.button.create.label"
              defaultLabel="Create"
            />
            <a href={DOCUMENT_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(DocumentCreate);

DocumentCreate.propTypes = {
  match: PropTypes.shape({}).isRequired,
};
