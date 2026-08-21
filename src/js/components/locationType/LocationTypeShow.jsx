import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import locationTypeApi from 'api/services/LocationTypeApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { LOCATION_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const LocationTypeShow = () => {
  useTranslation('locationType', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [locationType, setLocationType] = useState(null);

  useEffect(() => {
    spinner.show();
    locationTypeApi.getLocationType(id)
      .then((response) => setLocationType(response.data.data))
      .catch(() => history.push(LOCATION_TYPE_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteLocationType = async (onClose) => {
    try {
      await locationTypeApi.deleteLocationType(id);
      notification(NotificationType.SUCCESS)({
        message: `Location type ${id} deleted`,
      });
      history.push(LOCATION_TYPE_URL.list());
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
      onClick: () => deleteLocationType(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = locationType ? [
    {
      key: 'id',
      label: translate({ id: 'react.locationType.column.id.label', defaultMessage: 'Id' }),
      value: locationType.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.locationType.name.label', defaultMessage: 'Name' }),
      value: locationType.name,
    },
    {
      key: 'description',
      label: translate({ id: 'react.locationType.description.label', defaultMessage: 'Description' }),
      value: locationType.description,
    },
    {
      key: 'sortOrder',
      label: translate({ id: 'react.locationType.sortOrder.label', defaultMessage: 'Sort Order' }),
      value: locationType.sortOrder,
    },
    {
      key: 'supportedActivities',
      label: translate({ id: 'react.locationType.supportedActivities.label', defaultMessage: 'Supported Activities' }),
      value: (locationType.supportedActivities || []).join(', '),
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.locationType.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: locationType.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.locationType.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: locationType.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.locationType.showLocationType.label',
          defaultMessage: 'Show Location Type',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.locationType.header.label"
            defaultLabel="Location Types"
            variant="secondary"
            onClick={() => history.push(LOCATION_TYPE_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {locationType && (
        <div className="p-3">
          <h2>{locationType.name}</h2>
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
              onClick={() => history.push(LOCATION_TYPE_URL.edit(id))}
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

export default LocationTypeShow;
