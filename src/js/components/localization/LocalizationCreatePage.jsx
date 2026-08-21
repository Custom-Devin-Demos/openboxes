/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import { LOCALIZATION_LOCALE_OPTIONS, LOCALIZATIONS } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import { LOCALIZATION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const LocalizationCreatePage = () => {
  useTranslation('localization', 'default');

  const [localeOptions, setLocaleOptions] = useState([]);
  const [values, setValues] = useState({
    code: '',
    locale: '',
    text: '',
  });

  useEffect(() => {
    apiClient.get(LOCALIZATION_LOCALE_OPTIONS)
      .then((response) => setLocaleOptions(response.data.data));
  }, []);

  const setValue = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const response = await apiClient.post(LOCALIZATIONS, {
      code: values.code,
      locale: values.locale,
      text: values.text,
    });
    notification(NotificationType.SUCCESS)({ message: response.data.data.message });
    window.location = LOCALIZATION_URL.list();
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <form onSubmit={onSubmit}>
          <fieldset>
            <div className="dialog">
              <div className="box">
                <h2>
                  <Translate id="react.localization.create.label" defaultMessage="Create Localization" />
                </h2>
                <table>
                  <tbody>
                    <tr className="prop">
                      <td valign="top" className="name">
                        <label htmlFor="code">
                          <Translate id="react.localization.code.label" defaultMessage="Code" />
                        </label>
                      </td>
                      <td valign="top" className="value">
                        <input
                          id="code"
                          name="code"
                          type="text"
                          className="text medium"
                          size="80"
                          value={values.code}
                          onChange={setValue('code')}
                        />
                      </td>
                    </tr>
                    <tr className="prop">
                      <td valign="top" className="name">
                        <label htmlFor="locale">
                          <Translate id="react.localization.locale.label" defaultMessage="Locale" />
                        </label>
                      </td>
                      <td valign="top" className="value">
                        <select
                          id="locale"
                          name="locale"
                          value={values.locale}
                          onChange={setValue('locale')}
                        >
                          <option value="" />
                          {localeOptions.map((option) => (
                            <option key={option.id} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td valign="top" className="name">
                        <label htmlFor="text">
                          <Translate id="react.localization.text.label" defaultMessage="Text" />
                        </label>
                      </td>
                      <td valign="top" className="value">
                        <input
                          id="text"
                          name="text"
                          type="text"
                          className="text medium"
                          size="80"
                          value={values.text}
                          onChange={setValue('text')}
                        />
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="prop">
                      <td valign="top" />
                      <td valign="top">
                        <button type="submit" className="button">
                          <Translate id="react.default.button.create.label" defaultMessage="Create" />
                        </button>
                        <a href={LOCALIZATION_URL.list()} className="button">
                          <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                        </a>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </PageWrapper>
  );
};

export default LocalizationCreatePage;
