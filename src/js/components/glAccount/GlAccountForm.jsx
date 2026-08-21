import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import glAccountApi from 'api/services/GlAccountApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { GL_ACCOUNT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const GlAccountForm = ({ match }) => {
  useTranslation('glAccount');
  const { glAccountId } = match.params;
  const isEdit = Boolean(glAccountId);

  const [values, setValues] = useState({
    active: true,
    code: '',
    name: '',
    description: '',
    glAccountType: null,
  });
  const [glAccountTypeOptions, setGlAccountTypeOptions] = useState([]);

  useEffect(() => {
    glAccountApi.getGlAccountTypeOptions()
      .then((response) => {
        setGlAccountTypeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      glAccountApi.getGlAccount(glAccountId)
        .then((response) => {
          const glAccount = response.data.data;
          setValues({
            active: Boolean(glAccount.active),
            code: glAccount.code || '',
            name: glAccount.name || '',
            description: glAccount.description || '',
            glAccountType: glAccount.glAccountType ? {
              id: glAccount.glAccountType.id,
              value: glAccount.glAccountType.id,
              label: glAccount.glAccountType.code,
            } : null,
          });
        });
    }
  }, [glAccountId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description,
      'glAccountType.id': values.glAccountType?.id || null,
    };
    if (isEdit) {
      await glAccountApi.updateGlAccount(glAccountId, {
        ...payload,
        active: values.active,
      });
      notification(NotificationType.SUCCESS)({
        message: `GL account ${glAccountId} updated`,
      });
      window.location = GL_ACCOUNT_URL.list();
    } else {
      const response = await glAccountApi.createGlAccount(payload);
      notification(NotificationType.SUCCESS)({
        message: `GL account ${response.data.data.id} created`,
      });
      window.location = GL_ACCOUNT_URL.edit(response.data.data.id);
    }
  };

  const deleteGlAccount = async (onClose) => {
    try {
      await glAccountApi.deleteGlAccount(glAccountId);
      notification(NotificationType.SUCCESS)({
        message: `GL account ${glAccountId} deleted`,
      });
      window.location = GL_ACCOUNT_URL.list();
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
      onClick: () => deleteGlAccount(onClose),
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
            ? <Translate id="react.glAccount.editGlAccount.label" defaultMessage="Edit GL Account" />
            : <Translate id="react.glAccount.createGlAccount.label" defaultMessage="Create GL Account" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          {isEdit && (
            <div className="mb-3">
              <Checkbox
                title={{ id: 'react.glAccount.active.label', defaultMessage: 'Active' }}
                name="active"
                value={values.active}
                onChange={(e) => setValue('active')(e.target.checked)}
              />
            </div>
          )}
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.glAccount.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.glAccount.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.glAccount.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.glAccount.glAccountType.label', defaultMessage: 'GL Account Type' }}
              name="glAccountType"
              options={glAccountTypeOptions}
              defaultValue={values.glAccountType}
              onChange={setValue('glAccountType')}
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
            <a href={GL_ACCOUNT_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(GlAccountForm);

GlAccountForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      glAccountId: PropTypes.string,
    }),
  }).isRequired,
};
