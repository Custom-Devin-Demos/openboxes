/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import localizationApi from 'api/services/LocalizationApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import { LOCALIZATION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const LocalizationEditPage = () => {
  useTranslation('localization', 'default');
  const { id } = useParams();
  const history = useHistory();

  const [localeOptions, setLocaleOptions] = useState([]);
  const [values, setValues] = useState({
    code: '',
    locale: '',
    text: '',
    version: null,
  });

  useEffect(() => {
    localizationApi.getLocaleOptions()
      .then((response) => setLocaleOptions(response.data.data));
  }, []);

  useEffect(() => {
    localizationApi.getLocalization(id)
      .then((response) => {
        const localization = response.data.data;
        setValues({
          code: localization.code || '',
          locale: localization.locale || '',
          text: localization.text || '',
          version: localization.version,
        });
      })
      .catch(() => history.push(LOCALIZATION_URL.list()));
  }, [id]);

  const setValue = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const response = await localizationApi.updateLocalization(id, {
      code: values.code,
      locale: values.locale,
      text: values.text,
      version: values.version,
    });
    notification(NotificationType.SUCCESS)({ message: response.data.data.message });
    window.location = LOCALIZATION_URL.list();
  };

  const deleteLocalization = async (onClose) => {
    try {
      await localizationApi.deleteLocalization(id);
      notification(NotificationType.SUCCESS)({
        message: `Localization ${id} deleted`,
      });
      window.location = LOCALIZATION_URL.list();
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'No',
      label: 'react.default.no.label',
      onClick: () => onClose?.(),
    },
    {
      variant: 'primary',
      defaultLabel: 'Yes',
      label: 'react.default.yes.label',
      onClick: () => deleteLocalization(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  return (
    <PageWrapper>
      <div className="admin-page">
        <form onSubmit={onSubmit}>
          <fieldset>
            <div className="dialog">
              <div className="box">
                <h2>
                  <Translate id="react.localization.edit.label" defaultMessage="Edit Localization" />
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
                          <Translate id="react.default.button.update.label" defaultMessage="Update" />
                        </button>
                        <Button
                          type="button"
                          variant="danger"
                          label="react.default.button.delete.label"
                          defaultLabel="Delete"
                          onClick={onDelete}
                        />
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

export default LocalizationEditPage;
