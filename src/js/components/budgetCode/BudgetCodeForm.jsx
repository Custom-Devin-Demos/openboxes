import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import budgetCodeApi from 'api/services/BudgetCodeApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { BUDGET_CODE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const ORGANIZATION_ROLE_TYPES = ['ROLE_ORGANIZATION', 'ROLE_SUPPLIER', 'ROLE_MANUFACTURER'];

const BudgetCodeForm = ({ match }) => {
  useTranslation('budgetCode');
  const { budgetCodeId } = match.params;
  const isEdit = Boolean(budgetCodeId);

  const [values, setValues] = useState({
    active: true,
    code: '',
    name: '',
    description: '',
    organization: null,
  });
  const [organizationOptions, setOrganizationOptions] = useState([]);

  useEffect(() => {
    const roleTypeParams = ORGANIZATION_ROLE_TYPES.map((roleType) => `roleType=${roleType}`).join('&');
    apiClient.get(`/api/organizations?${roleTypeParams}`)
      .then((response) => {
        setOrganizationOptions(response.data.data.map((organization) => ({
          id: organization.id,
          value: organization.id,
          label: organization.name,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      budgetCodeApi.getBudgetCode(budgetCodeId)
        .then((response) => {
          const budgetCode = response.data.data;
          setValues({
            active: Boolean(budgetCode.active),
            code: budgetCode.code || '',
            name: budgetCode.name || '',
            description: budgetCode.description || '',
            organization: budgetCode.organization ? {
              id: budgetCode.organization.id,
              value: budgetCode.organization.id,
              label: budgetCode.organization.name,
            } : null,
          });
        });
    }
  }, [budgetCodeId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      active: values.active,
      code: values.code,
      name: values.name,
      description: values.description,
      'organization.id': values.organization?.id || null,
    };
    if (isEdit) {
      await budgetCodeApi.updateBudgetCode(budgetCodeId, payload);
      notification(NotificationType.SUCCESS)({
        message: `Budget code ${budgetCodeId} updated`,
      });
    } else {
      const response = await budgetCodeApi.createBudgetCode(payload);
      notification(NotificationType.SUCCESS)({
        message: `Budget code ${response.data.data.id} created`,
      });
    }
    window.location = BUDGET_CODE_URL.list();
  };

  const deleteBudgetCode = async (onClose) => {
    try {
      await budgetCodeApi.deleteBudgetCode(budgetCodeId);
      notification(NotificationType.SUCCESS)({
        message: `Budget code ${budgetCodeId} deleted`,
      });
      window.location = BUDGET_CODE_URL.list();
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
      onClick: () => deleteBudgetCode(onClose),
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
            ? <Translate id="react.budgetCode.editBudgetCode.label" defaultMessage="Edit Budget Code" />
            : <Translate id="react.budgetCode.createBudgetCode.label" defaultMessage="Create Budget Code" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <Checkbox
              title={{ id: 'react.budgetCode.active.label', defaultMessage: 'Active' }}
              name="active"
              value={values.active}
              onChange={(e) => setValue('active')(e.target.checked)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.budgetCode.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.budgetCode.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.budgetCode.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.budgetCode.organization.label', defaultMessage: 'Organization' }}
              name="organization"
              options={organizationOptions}
              defaultValue={values.organization}
              onChange={setValue('organization')}
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
            <a href={BUDGET_CODE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(BudgetCodeForm);

BudgetCodeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      budgetCodeId: PropTypes.string,
    }),
  }).isRequired,
};
