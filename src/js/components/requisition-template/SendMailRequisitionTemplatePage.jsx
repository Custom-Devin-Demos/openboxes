import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_TEMPLATE_SEND_MAIL, REQUISITION_TEMPLATE_SEND_MAIL_CONTEXT } from 'api/urls';
import { REQUISITION_TEMPLATE_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { useTemplateDetails } from './requisition-template-utils';
import RequisitionTemplateHeaderPanel from './RequisitionTemplateHeaderPanel';
import RequisitionTemplateSummary from './RequisitionTemplateSummary';

const SendMailRequisitionTemplatePage = ({ match }) => {
  const { template } = useTemplateDetails(match.params.templateId);
  const [context, setContext] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [includePdf, setIncludePdf] = useState(true);
  const [includeXls, setIncludeXls] = useState(true);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);

  useTranslation('requisitionTemplate');

  useEffect(() => {
    apiClient.get(REQUISITION_TEMPLATE_SEND_MAIL_CONTEXT(match.params.templateId))
      .then((response) => {
        const { data } = response.data;
        setContext(data);
        setSubject(data.defaultSubject || '');
        setBody(data.defaultMessage || '');
        setRecipients(data.requestedByEmail ? [data.requestedByEmail] : []);
      });
  }, [match.params.templateId]);

  if (!template || !context) {
    return null;
  }

  const { noManagerMessage, recipients: availableRecipients } = context;

  const send = () => {
    setSending(true);
    setMessage(null);
    setErrors([]);
    apiClient.post(REQUISITION_TEMPLATE_SEND_MAIL(match.params.templateId), {
      recipients,
      subject,
      body,
      includePdf,
      includeXls,
    }).then((response) => {
      setMessage(response.data.message);
      setTimeout(() => {
        window.location.href = REQUISITION_TEMPLATE_URL.show(match.params.templateId);
      }, 1500);
    }).catch((error) => {
      setSending(false);
      setErrors(error.response?.data?.errors || ['An error occurred']);
    });
  };

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {message && <div className="alert alert-success" role="alert">{message}</div>}
      {noManagerMessage && (
        <div className="alert alert-danger" role="alert">{noManagerMessage}</div>
      )}
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionTemplateSummary template={template} />
      <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
        <div style={{ minWidth: '320px' }}>
          <RequisitionTemplateHeaderPanel template={template} />
        </div>
        <div className="flex-grow-1">
          <div className="box p-3 border rounded bg-white">
            <h2>
              <Translate id="react.requisitionTemplate.email.label" defaultMessage="Email" />
            </h2>
            <div className="form-group">
              <label htmlFor="recipients">
                <Translate id="react.requisitionTemplate.emailRecipients.label" defaultMessage="Recipients" />
              </label>
              <select
                id="recipients"
                multiple
                size="8"
                className="form-control"
                value={recipients}
                onChange={(event) => setRecipients(
                  Array.from(event.target.selectedOptions, (option) => option.value),
                )}
              >
                {availableRecipients.map((recipient) => (
                  <option key={recipient.email} value={recipient.email}>
                    {recipient.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="subject">
                <Translate id="react.requisitionTemplate.emailSubject.label" defaultMessage="Subject" />
              </label>
              <input
                id="subject"
                type="text"
                className="form-control"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="body">
                <Translate id="react.requisitionTemplate.emailMessage.label" defaultMessage="Message" />
              </label>
              <textarea
                id="body"
                rows="6"
                className="form-control"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
            <div className="form-check">
              <input
                id="includePdf"
                type="checkbox"
                className="form-check-input"
                checked={includePdf}
                onChange={(event) => setIncludePdf(event.target.checked)}
              />
              <label className="form-check-label" htmlFor="includePdf">
                <Translate id="react.requisitionTemplate.includePdf.label" defaultMessage="Include PDF" />
              </label>
            </div>
            <div className="form-check mb-3">
              <input
                id="includeXls"
                type="checkbox"
                className="form-check-input"
                checked={includeXls}
                onChange={(event) => setIncludeXls(event.target.checked)}
              />
              <label className="form-check-label" htmlFor="includeXls">
                <Translate id="react.requisitionTemplate.includeXls.label" defaultMessage="Include XLS" />
              </label>
            </div>
            <div className="d-flex" style={{ gap: '0.5rem' }}>
              <button
                type="button"
                id="send-mail"
                className="btn btn-primary"
                disabled={sending}
                onClick={send}
              >
                <Translate id="react.requisitionTemplate.sendMail.label" defaultMessage="Send email" />
              </button>
              <a className="btn btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.show(match.params.templateId)}>
                <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SendMailRequisitionTemplatePage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default SendMailRequisitionTemplatePage;
