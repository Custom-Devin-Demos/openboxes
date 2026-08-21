import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import { DOCUMENT_DELETE, DOCUMENT_DETAILS } from 'api/urls';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import { DOCUMENT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const DocumentShow = ({ match, history }) => {
  useTranslation('document', 'default');
  const translate = useTranslate();
  const { documentId } = match.params;

  const [details, setDetails] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    apiClient.get(DOCUMENT_DETAILS(documentId))
      .then((response) => setDetails(response.data.data))
      .catch((error) => {
        setFlashMessage(error?.response?.data?.errorMessage || null);
      });
  }, [documentId]);

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
      setFlashMessage(error?.response?.data?.errorMessage || null);
    }
  };

  const rows = details ? [
    {
      key: 'id', label: 'react.document.column.id.label', defaultMessage: 'Id', value: details.id,
    },
    {
      key: 'name', label: 'react.document.name.label', defaultMessage: 'Name', value: details.name,
    },
    {
      key: 'filename', label: 'react.document.filename.label', defaultMessage: 'Filename', value: details.filename,
    },
    {
      key: 'fileContents', label: 'react.document.fileContents.label', defaultMessage: 'File Contents', value: '',
    },
    {
      key: 'extension', label: 'react.document.extension.label', defaultMessage: 'Extension', value: details.extension,
    },
    {
      key: 'contentType', label: 'react.document.contentType.label', defaultMessage: 'Content Type', value: details.contentType,
    },
    {
      key: 'fileUri', label: 'react.document.fileUri.label', defaultMessage: 'File Uri', value: details.fileUri,
    },
    {
      key: 'documentNumber', label: 'react.document.documentNumber.label', defaultMessage: 'Document Number', value: details.documentNumber,
    },
    {
      key: 'documentType', label: 'react.document.documentType.label', defaultMessage: 'Document Type', value: details.documentType?.name,
    },
    {
      key: 'dateCreated', label: 'react.document.dateCreated.label', defaultMessage: 'Date Created', value: details.dateCreated,
    },
    {
      key: 'lastUpdated', label: 'react.document.lastUpdated.label', defaultMessage: 'Last Updated', value: details.lastUpdated,
    },
    {
      key: 'image', label: 'react.document.image.label', defaultMessage: 'Image', value: String(details.isImage),
    },
    {
      key: 'size', label: 'react.document.size.label', defaultMessage: 'Size', value: details.size,
    },
  ] : [];

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        {flashMessage && (
          <div className="alert alert-info" role="status" aria-label="message">{flashMessage}</div>
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
          <Translate id="react.document.showDocument.label" defaultMessage="Show Document" />
        </h1>
        {details && (
          <>
            <table className="table table-sm w-50">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="font-weight-bold">
                      <Translate id={row.label} defaultMessage={row.defaultMessage} />
                    </td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex gap-8 align-items-center">
              <Button
                label="react.default.button.edit.label"
                defaultLabel="Edit"
                onClick={() => history.push(DOCUMENT_URL.edit(documentId))}
              />
              <Button
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(DocumentShow);

DocumentShow.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      documentId: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
};
