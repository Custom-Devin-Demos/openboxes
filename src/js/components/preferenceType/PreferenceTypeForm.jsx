import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import preferenceTypeApi from 'api/services/PreferenceTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { PREFERENCE_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const PreferenceTypeForm = ({ match }) => {
  useTranslation('preferenceType');
  const { preferenceTypeId } = match.params;
  const isEdit = Boolean(preferenceTypeId);

  const [values, setValues] = useState({
    name: '',
    validationCode: null,
  });
  const [validationCodeOptions, setValidationCodeOptions] = useState([]);

  useEffect(() => {
    preferenceTypeApi.getValidationCodeOptions()
      .then((response) => {
        setValidationCodeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      preferenceTypeApi.getPreferenceType(preferenceTypeId)
        .then((response) => {
          const preferenceType = response.data.data;
          setValues({
            name: preferenceType.name || '',
            validationCode: preferenceType.validationCode ? {
              id: preferenceType.validationCode,
              value: preferenceType.validationCode,
              label: preferenceType.validationCode,
            } : null,
          });
        });
    }
  }, [preferenceTypeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: values.name,
      validationCode: values.validationCode?.id || null,
    };
    if (isEdit) {
      await preferenceTypeApi.updatePreferenceType(preferenceTypeId, payload);
      notification(NotificationType.SUCCESS)({
        message: `Preference type ${preferenceTypeId} updated`,
      });
      window.location = PREFERENCE_TYPE_URL.list();
    } else {
      const response = await preferenceTypeApi.createPreferenceType(payload);
      notification(NotificationType.SUCCESS)({
        message: `Preference type ${response.data.data.id} created`,
      });
      window.location = PREFERENCE_TYPE_URL.edit(response.data.data.id);
    }
  };

  const deletePreferenceType = async (onClose) => {
    try {
      await preferenceTypeApi.deletePreferenceType(preferenceTypeId);
      notification(NotificationType.SUCCESS)({
        message: `Preference type ${preferenceTypeId} deleted`,
      });
      window.location = PREFERENCE_TYPE_URL.list();
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
      onClick: () => deletePreferenceType(onClose),
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
            ? <Translate id="react.preferenceType.editPreferenceType.label" defaultMessage="Edit Preference Type" />
            : <Translate id="react.preferenceType.createPreferenceType.label" defaultMessage="Create Preference Type" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.preferenceType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.preferenceType.validationCode.label', defaultMessage: 'Validation Code' }}
              name="validationCode"
              options={validationCodeOptions}
              defaultValue={values.validationCode}
              onChange={setValue('validationCode')}
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
            <a href={PREFERENCE_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(PreferenceTypeForm);

PreferenceTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      preferenceTypeId: PropTypes.string,
    }),
  }).isRequired,
};
