import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import eventTypeApi from 'api/services/EventTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { EVENT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const EventTypeForm = ({ match }) => {
  useTranslation('eventType');
  const { eventTypeId } = match.params;
  const isEdit = Boolean(eventTypeId);

  const [values, setValues] = useState({
    name: '',
    description: '',
    sortOrder: '',
    eventCode: null,
    version: null,
  });
  const [eventCodeOptions, setEventCodeOptions] = useState([]);

  useEffect(() => {
    eventTypeApi.getEventCodeOptions()
      .then((response) => {
        setEventCodeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      eventTypeApi.getEventType(eventTypeId)
        .then((response) => {
          const eventType = response.data.data;
          setValues({
            name: eventType.name || '',
            description: eventType.description || '',
            sortOrder: eventType.sortOrder != null ? `${eventType.sortOrder}` : '',
            eventCode: eventType.eventCode ? {
              id: eventType.eventCode,
              value: eventType.eventCode,
              label: eventType.eventCode,
            } : null,
            version: eventType.version,
          });
        });
    }
  }, [eventTypeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: values.name,
      description: values.description,
      sortOrder: values.sortOrder,
      eventCode: values.eventCode?.id || null,
    };
    if (isEdit) {
      await eventTypeApi.updateEventType(eventTypeId, {
        ...payload,
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Event type ${eventTypeId} updated`,
      });
    } else {
      const response = await eventTypeApi.createEventType(payload);
      notification(NotificationType.SUCCESS)({
        message: `Event type ${response.data.data.id} created`,
      });
    }
    window.location = EVENT_TYPE_URL.list();
  };

  const deleteEventType = async (onClose) => {
    try {
      await eventTypeApi.deleteEventType(eventTypeId);
      notification(NotificationType.SUCCESS)({
        message: `Event type ${eventTypeId} deleted`,
      });
      window.location = EVENT_TYPE_URL.list();
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

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.eventType.editEventType.label" defaultMessage="Edit Event Type" />
            : <Translate id="react.eventType.createEventType.label" defaultMessage="Create Event Type" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.eventType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.eventType.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.eventType.sortOrder.label', defaultMessage: 'Sort Order' }}
              name="sortOrder"
              value={values.sortOrder}
              onChange={(e) => setValue('sortOrder')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.eventType.eventCode.label', defaultMessage: 'Event Code' }}
              name="eventCode"
              options={eventCodeOptions}
              defaultValue={values.eventCode}
              onChange={setValue('eventCode')}
            />
          </div>
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label={isEdit ? 'react.default.button.update.label' : 'react.default.button.create.label'}
              defaultLabel={isEdit ? 'Update' : 'Create'}
            />
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
            )}
            <a href={EVENT_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(EventTypeForm);

EventTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      eventTypeId: PropTypes.string,
    }),
  }).isRequired,
};
