import React, { useEffect, useRef, useState } from 'react';

import { ADMIN_MAIL_FORM, ADMIN_SEND_MAIL } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const initialValues = {
  to: '',
  from: '',
  subject: 'Test email',
  includesHtml: false,
  message: '',
};

const SendMailPage = () => {
  useTranslation('admin', 'default');

  const [defaults, setDefaults] = useState(initialValues);
  const [values, setValues] = useState(initialValues);
  const fileInputRef = useRef(null);

  useEffect(() => {
    apiClient.get(ADMIN_MAIL_FORM)
      .then((response) => {
        const fetchedDefaults = {
          ...initialValues,
          to: response.data.data.to || '',
          from: response.data.data.from || '',
          subject: response.data.data.subject || 'Test email',
        };
        setDefaults(fetchedDefaults);
        setValues(fetchedDefaults);
      });
  }, []);

  const resetForm = () => {
    setValues(defaults);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('to', values.to);
    formData.append('from', values.from);
    formData.append('subject', values.subject);
    if (values.includesHtml) {
      formData.append('includesHtml', 'on');
    }
    formData.append('message', values.message);
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append('file', file);
    }
    apiClient.post(ADMIN_SEND_MAIL, formData)
      .then((response) => {
        notification(NotificationType.SUCCESS)({ message: response.data.data.message });
      });
  };

  return (
    <PageWrapper>
      <div className="admin-page box">
        <h2>
          <Translate id="react.admin.email.label" defaultMessage="Email" />
        </h2>
        <form onSubmit={onSubmit}>
          <table>
            <tbody>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="to">
                    <Translate id="react.admin.mail.to.label" defaultMessage="To" />
                  </label>
                </td>
                <td className="value">
                  <input
                    id="to"
                    name="to"
                    type="text"
                    className="text"
                    size="60"
                    value={values.to}
                    onChange={(e) => setValues({ ...values, to: e.target.value })}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="from">
                    <Translate id="react.admin.mail.from.label" defaultMessage="From" />
                  </label>
                </td>
                <td className="value">
                  <input
                    id="from"
                    name="from"
                    type="text"
                    className="text"
                    size="60"
                    value={values.from}
                    onChange={(e) => setValues({ ...values, from: e.target.value })}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="subject">
                    <Translate id="react.admin.mail.subject.label" defaultMessage="Subject" />
                  </label>
                </td>
                <td className="value">
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    className="text"
                    size="60"
                    value={values.subject}
                    onChange={(e) => setValues({ ...values, subject: e.target.value })}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="includesHtml">
                    <Translate id="react.admin.mail.includesHtml.label" defaultMessage="Includes HTML?" />
                  </label>
                </td>
                <td className="value">
                  <input
                    id="includesHtml"
                    name="includesHtml"
                    type="checkbox"
                    checked={values.includesHtml}
                    onChange={(e) => setValues({ ...values, includesHtml: e.target.checked })}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="message">
                    <Translate id="react.admin.mail.message.label" defaultMessage="Message" />
                  </label>
                </td>
                <td className="value">
                  <textarea
                    id="message"
                    name="message"
                    className="text"
                    cols="60"
                    rows="10"
                    value={values.message}
                    onChange={(e) => setValues({ ...values, message: e.target.value })}
                  />
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  <label htmlFor="file">
                    <Translate id="react.admin.mail.file.label" defaultMessage="File" />
                  </label>
                </td>
                <td className="value">
                  <input id="file" name="file" type="file" ref={fileInputRef} />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="center">
                  <button type="submit" className="button icon email">
                    <Translate id="react.admin.mail.send.label" defaultMessage="Send Mail" />
                  </button>
                  <button type="button" className="button icon reload" onClick={resetForm}>
                    <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </form>
      </div>
    </PageWrapper>
  );
};

export default SendMailPage;
