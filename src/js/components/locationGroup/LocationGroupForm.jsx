import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import locationGroupApi from 'api/services/LocationGroupApi';
import Button from 'components/form-elements/Button';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { LOCATION_GROUP_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const LocationGroupForm = ({ match }) => {
  useTranslation('locationGroup');
  const { locationGroupId } = match.params;
  const isEdit = Boolean(locationGroupId);

  const [values, setValues] = useState({
    name: '',
    version: null,
    address: {
      id: null,
      address: '',
      address2: '',
      city: '',
      stateOrProvince: '',
      postalCode: '',
      country: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      locationGroupApi.getLocationGroup(locationGroupId)
        .then((response) => {
          const locationGroup = response.data.data;
          setValues({
            name: locationGroup.name || '',
            version: locationGroup.version,
            address: {
              id: locationGroup.address?.id || null,
              address: locationGroup.address?.address || '',
              address2: locationGroup.address?.address2 || '',
              city: locationGroup.address?.city || '',
              stateOrProvince: locationGroup.address?.stateOrProvince || '',
              postalCode: locationGroup.address?.postalCode || '',
              country: locationGroup.address?.country || '',
              description: locationGroup.address?.description || '',
            },
          });
        });
    }
  }, [locationGroupId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));
  const setAddressValue = (field) => (value) => setValues((prev) => ({
    ...prev,
    address: { ...prev.address, [field]: value },
  }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isEdit) {
      const { id, ...addressFieldValues } = values.address;
      await locationGroupApi.updateLocationGroup(locationGroupId, {
        name: values.name,
        version: values.version,
        address: id ? values.address : addressFieldValues,
      });
      notification(NotificationType.SUCCESS)({
        message: `Location group ${values.name} updated`,
      });
    } else {
      const response = await locationGroupApi.createLocationGroup({ name: values.name });
      notification(NotificationType.SUCCESS)({
        message: `Location group ${response.data.data.name} created`,
      });
    }
    window.location = LOCATION_GROUP_URL.list();
  };

  const deleteLocationGroup = async (onClose) => {
    try {
      await locationGroupApi.deleteLocationGroup(locationGroupId);
      notification(NotificationType.SUCCESS)({
        message: `Location group ${values.name} deleted`,
      });
      window.location = LOCATION_GROUP_URL.list();
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
      onClick: () => deleteLocationGroup(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const addressFields = [
    { name: 'address', labelId: 'react.locationGroup.address.label', defaultLabel: 'Address' },
    { name: 'address2', labelId: 'react.locationGroup.address2.label', defaultLabel: 'Address 2' },
    { name: 'city', labelId: 'react.locationGroup.city.label', defaultLabel: 'City' },
    { name: 'stateOrProvince', labelId: 'react.locationGroup.stateOrProvince.label', defaultLabel: 'State or Province' },
    { name: 'postalCode', labelId: 'react.locationGroup.postalCode.label', defaultLabel: 'Postal Code' },
    { name: 'country', labelId: 'react.locationGroup.country.label', defaultLabel: 'Country' },
    { name: 'description', labelId: 'react.locationGroup.description.label', defaultLabel: 'Description' },
  ];

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.locationGroup.editLocationGroup.label" defaultMessage="Edit Location Group" />
            : <Translate id="react.locationGroup.createLocationGroup.label" defaultMessage="Add Location Group" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.locationGroup.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          {isEdit && addressFields.map((field) => (
            <div className="mb-3" key={field.name}>
              <TextInput
                title={{ id: field.labelId, defaultMessage: field.defaultLabel }}
                name={field.name}
                value={values.address[field.name]}
                onChange={(e) => setAddressValue(field.name)(e.target.value)}
              />
            </div>
          ))}
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
            <a href={LOCATION_GROUP_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(LocationGroupForm);

LocationGroupForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      locationGroupId: PropTypes.string,
    }),
  }).isRequired,
};
