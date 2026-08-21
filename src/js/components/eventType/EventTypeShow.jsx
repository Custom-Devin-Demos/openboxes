import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import eventTypeApi from 'api/services/EventTypeApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { EVENT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const EventTypeShow = () => {
  useTranslation('eventType', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [eventType, setEventType] = useState(null);

  useEffect(() => {
    spinner.show();
    eventTypeApi.getEventType(id)
      .then((response) => setEventType(response.data.data))
      .catch(() => history.push(EVENT_TYPE_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteEventType = async (onClose) => {
    try {
      await eventTypeApi.deleteEventType(id);
      notification(NotificationType.SUCCESS)({
        message: `Event type ${id} deleted`,
      });
      history.push(EVENT_TYPE_URL.list());
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
      onClick: () => deleteEventType(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = eventType ? [
    {
      key: 'id',
      label: translate({ id: 'react.eventType.id.label', defaultMessage: 'Id' }),
      value: eventType.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.eventType.name.label', defaultMessage: 'Name' }),
      value: eventType.name,
    },
    {
      key: 'description',
      label: translate({ id: 'react.eventType.description.label', defaultMessage: 'Description' }),
      value: eventType.description,
    },
    {
      key: 'sortOrder',
      label: translate({ id: 'react.eventType.sortOrder.label', defaultMessage: 'Sort Order' }),
      value: eventType.sortOrder,
    },
    {
      key: 'eventCode',
      label: translate({ id: 'react.eventType.eventCode.label', defaultMessage: 'Event Status' }),
      value: eventType.eventCode,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.eventType.dateCreated.label', defaultMessage: 'Date Created' }),
      value: eventType.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.eventType.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: eventType.lastUpdated,
    },
    {
      key: 'optionValue',
      label: translate({ id: 'react.eventType.optionValue.label', defaultMessage: 'Option Value' }),
      value: eventType.optionValue,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.eventType.showEventType.label',
          defaultMessage: 'Show Event Type',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.eventType.header.label"
            defaultLabel="Event Type List"
            variant="secondary"
            onClick={() => history.push(EVENT_TYPE_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {eventType && (
        <div className="p-3">
          <h2>{eventType.name}</h2>
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
              onClick={() => history.push(EVENT_TYPE_URL.edit(id))}
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

export default EventTypeShow;
