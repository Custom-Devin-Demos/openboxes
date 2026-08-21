import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import localizationApi from 'api/services/LocalizationApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { LOCALIZATION_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const LocalizationShowPage = () => {
  useTranslation('localization', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [localization, setLocalization] = useState(null);

  useEffect(() => {
    spinner.show();
    localizationApi.getLocalization(id)
      .then((response) => setLocalization(response.data.data))
      .catch(() => history.push(LOCALIZATION_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteLocalization = async (onClose) => {
    try {
      await localizationApi.deleteLocalization(id);
      notification(NotificationType.SUCCESS)({
        message: `Localization ${id} deleted`,
      });
      history.push(LOCALIZATION_URL.list());
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

  const rows = localization ? [
    {
      key: 'id',
      label: translate({ id: 'react.localization.column.id.label', defaultMessage: 'Id' }),
      value: localization.id,
    },
    {
      key: 'code',
      label: translate({ id: 'react.localization.code.label', defaultMessage: 'Code' }),
      value: localization.code,
    },
    {
      key: 'locale',
      label: translate({ id: 'react.localization.locale.label', defaultMessage: 'Locale' }),
      value: localization.locale,
    },
    {
      key: 'text',
      label: translate({ id: 'react.localization.text.label', defaultMessage: 'Text' }),
      value: localization.text,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.localization.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: localization.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.localization.column.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: localization.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.localization.show.label',
          defaultMessage: 'Show Localization',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.localization.header.label"
            defaultLabel="Localizations"
            variant="secondary"
            onClick={() => history.push(LOCALIZATION_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {localization && (
        <div className="p-3">
          <h2>{localization.code}</h2>
          <table className="table table-sm w-50">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-weight-bold">{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(LOCALIZATION_URL.edit(id))}
            />
            <Button
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={onDelete}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default LocalizationShowPage;
