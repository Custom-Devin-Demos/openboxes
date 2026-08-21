import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import locationTypeApi from 'api/services/LocationTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { LOCATION_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const LocationTypeForm = ({ match }) => {
  useTranslation('locationType');
  const { locationTypeId } = match.params;
  const isEdit = Boolean(locationTypeId);

  const [values, setValues] = useState({
    name: '',
    description: '',
    sortOrder: '',
    locationTypeCode: null,
    supportedActivities: [],
    version: null,
  });
  const [locationTypeCodeOptions, setLocationTypeCodeOptions] = useState([]);
  const [supportedActivityOptions, setSupportedActivityOptions] = useState([]);

  useEffect(() => {
    locationTypeApi.getLocationTypeCodeOptions()
      .then((response) => {
        setLocationTypeCodeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
    locationTypeApi.getSupportedActivityOptions()
      .then((response) => {
        setSupportedActivityOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      locationTypeApi.getLocationType(locationTypeId)
        .then((response) => {
          const locationType = response.data.data;
          setValues({
            name: locationType.name || '',
            description: locationType.description || '',
            sortOrder: locationType.sortOrder != null ? `${locationType.sortOrder}` : '',
            locationTypeCode: locationType.locationTypeCode ? {
              id: locationType.locationTypeCode,
              value: locationType.locationTypeCode,
              label: locationType.locationTypeCode,
            } : null,
            supportedActivities: locationType.supportedActivities || [],
            version: locationType.version,
          });
        });
    }
  }, [locationTypeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: values.name,
      description: values.description,
      sortOrder: values.sortOrder,
      locationTypeCode: values.locationTypeCode?.id || null,
      supportedActivities: values.supportedActivities || [],
    };
    if (isEdit) {
      await locationTypeApi.updateLocationType(locationTypeId, {
        ...payload,
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Location type ${values.name} updated`,
      });
    } else {
      const response = await locationTypeApi.createLocationType(payload);
      notification(NotificationType.SUCCESS)({
        message: `Location type ${response.data.data.name} created`,
      });
    }
    window.location = LOCATION_TYPE_URL.list();
  };

  const deleteLocationType = async (onClose) => {
    try {
      await locationTypeApi.deleteLocationType(locationTypeId);
      notification(NotificationType.SUCCESS)({
        message: `Location type ${values.name} deleted`,
      });
      window.location = LOCATION_TYPE_URL.list();
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

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.locationType.editLocationType.label" defaultMessage="Edit Location Type" />
            : <Translate id="react.locationType.createLocationType.label" defaultMessage="Create Location Type" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.locationType.locationTypeCode.label', defaultMessage: 'Location Type Code' }}
              name="locationTypeCode"
              options={locationTypeCodeOptions}
              defaultValue={values.locationTypeCode}
              onChange={setValue('locationTypeCode')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.locationType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.locationType.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.locationType.supportedActivities.label', defaultMessage: 'Supported Activities' }}
              name="supportedActivities"
              multiple
              options={supportedActivityOptions}
              value={(values.supportedActivities || []).map((activity) =>
                supportedActivityOptions.find((option) => option.id === activity)
                  || { id: activity, value: activity, label: activity })}
              onChange={(selected) =>
                setValue('supportedActivities')((selected || []).map((option) => option.id))}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.locationType.sortOrder.label', defaultMessage: 'Sort Order' }}
              name="sortOrder"
              value={values.sortOrder}
              onChange={(e) => setValue('sortOrder')(e.target.value)}
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
            <a href={LOCATION_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(LocationTypeForm);

LocationTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      locationTypeId: PropTypes.string,
    }),
  }).isRequired,
};
