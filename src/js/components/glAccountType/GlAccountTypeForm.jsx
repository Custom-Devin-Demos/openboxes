import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import glAccountTypeApi from 'api/services/GlAccountTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { GL_ACCOUNT_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const GlAccountTypeForm = ({ match }) => {
  useTranslation('glAccountType');
  const { glAccountTypeId } = match.params;
  const isEdit = Boolean(glAccountTypeId);

  const [values, setValues] = useState({
    code: '',
    name: '',
    glAccountTypeCode: null,
  });
  const [glAccountTypeCodeOptions, setGlAccountTypeCodeOptions] = useState([]);

  useEffect(() => {
    glAccountTypeApi.getGlAccountTypeCodeOptions()
      .then((response) => {
        setGlAccountTypeCodeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      glAccountTypeApi.getGlAccountType(glAccountTypeId)
        .then((response) => {
          const glAccountType = response.data.data;
          setValues({
            code: glAccountType.code || '',
            name: glAccountType.name || '',
            glAccountTypeCode: glAccountType.glAccountTypeCode ? {
              id: glAccountType.glAccountTypeCode,
              value: glAccountType.glAccountTypeCode,
              label: glAccountType.glAccountTypeCode,
            } : null,
          });
        });
    }
  }, [glAccountTypeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      code: values.code,
      name: values.name,
      glAccountTypeCode: values.glAccountTypeCode?.id || null,
    };
    if (isEdit) {
      await glAccountTypeApi.updateGlAccountType(glAccountTypeId, payload);
      notification(NotificationType.SUCCESS)({
        message: `GL account type ${glAccountTypeId} updated`,
      });
      window.location = GL_ACCOUNT_TYPE_URL.list();
    } else {
      const response = await glAccountTypeApi.createGlAccountType(payload);
      notification(NotificationType.SUCCESS)({
        message: `GL account type ${response.data.data.id} created`,
      });
      window.location = GL_ACCOUNT_TYPE_URL.edit(response.data.data.id);
    }
  };

  const deleteGlAccountType = async (onClose) => {
    try {
      await glAccountTypeApi.deleteGlAccountType(glAccountTypeId);
      notification(NotificationType.SUCCESS)({
        message: `GL account type ${glAccountTypeId} deleted`,
      });
      window.location = GL_ACCOUNT_TYPE_URL.list();
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
      onClick: () => deleteGlAccountType(onClose),
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
            ? <Translate id="react.glAccountType.editGlAccountType.label" defaultMessage="Edit GL Account Type" />
            : <Translate id="react.glAccountType.createGlAccountType.label" defaultMessage="Create GL Account Type" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.glAccountType.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.glAccountType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.glAccountType.glAccountTypeCode.label', defaultMessage: 'GL Account Type Code' }}
              name="glAccountTypeCode"
              options={glAccountTypeCodeOptions}
              defaultValue={values.glAccountTypeCode}
              onChange={setValue('glAccountTypeCode')}
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
            <a href={GL_ACCOUNT_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(GlAccountTypeForm);

GlAccountTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      glAccountTypeId: PropTypes.string,
    }),
  }).isRequired,
};
