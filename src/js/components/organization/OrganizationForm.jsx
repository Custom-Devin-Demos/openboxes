import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import organizationApi from 'api/services/OrganizationApi';
import partyApi from 'api/services/PartyApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import { ORGANIZATION_URL, PARTY_ROLE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const OrganizationForm = ({ match }) => {
  useTranslation('organization', 'default');
  const translate = useTranslate();
  const { organizationId } = match.params;
  const isEdit = Boolean(organizationId);

  const [values, setValues] = useState({
    active: true,
    code: '',
    name: '',
    description: '',
    partyType: null,
    defaultLocation: null,
    sequences: {},
    version: null,
  });
  const [details, setDetails] = useState(null);
  const [partyTypeOptions, setPartyTypeOptions] = useState([]);
  const [nameError, setNameError] = useState(null);

  useEffect(() => {
    partyApi.getPartyTypeOptions()
      .then((response) => {
        setPartyTypeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      organizationApi.getOrganizationDetails(organizationId)
        .then((response) => {
          const organization = response.data.data;
          setDetails(organization);
          setValues({
            active: organization.active,
            code: organization.code || '',
            name: organization.name || '',
            description: organization.description || '',
            partyType: organization.partyType ? {
              id: organization.partyType.id,
              value: organization.partyType.id,
              label: organization.partyType.name,
            } : null,
            defaultLocation: organization.defaultLocation ? {
              id: organization.defaultLocation.id,
              value: organization.defaultLocation.id,
              label: organization.defaultLocation.name,
            } : null,
            sequences: organization.sequences || {},
            version: organization.version,
          });
        });
    }
  }, [organizationId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const isSuperuser = details?.isSuperuser;
  const codeDisabled = isEdit && details?.hasPurchaseOrders && !isSuperuser;

  const locationOptions = (details?.locations || []).map((location) => ({
    id: location.id,
    value: location.id,
    label: location.name,
  }));

  const submitForm = async () => {
    if (isEdit) {
      const payload = {
        active: values.active,
        code: values.code,
        name: values.name,
        description: values.description,
        partyType: values.partyType?.id || null,
        defaultLocation: values.defaultLocation?.id || null,
        version: values.version,
        ...(isSuperuser ? { sequences: values.sequences } : {}),
      };
      await organizationApi.updateOrganization(organizationId, payload);
      notification(NotificationType.SUCCESS)({
        message: `Organization ${values.name} updated`,
      });
      window.location = ORGANIZATION_URL.edit(organizationId);
    } else {
      const payload = {
        code: values.code || null,
        name: values.name,
        description: values.description,
        partyType: values.partyType ? { id: values.partyType.id } : null,
      };
      const response = await organizationApi.createOrganization(payload);
      notification(NotificationType.SUCCESS)({
        message: `Organization ${values.name} created`,
      });
      window.location = ORGANIZATION_URL.edit(response.data.data.id);
    }
  };

  const inactiveConfirmationModalButtons = (onClose) => ([
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
      onClick: () => {
        onClose?.();
        submitForm();
      },
    },
  ]);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!values.name?.trim()) {
      setNameError(translate('react.default.error.requiredField.label', 'This field is required'));
      return;
    }
    setNameError(null);
    if (isEdit && details?.active && !values.active) {
      confirmationModal({
        buttons: inactiveConfirmationModalButtons,
        title: {
          label: 'react.organization.confirm.inactive.label',
          default: 'Are you sure you want to set this organization inactive?',
        },
      });
      return;
    }
    submitForm();
  };

  const deleteOrganization = async (onClose) => {
    try {
      await organizationApi.deleteOrganization(organizationId);
      notification(NotificationType.SUCCESS)({
        message: `Organization ${values.name} deleted`,
      });
      window.location = ORGANIZATION_URL.list();
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
      onClick: () => deleteOrganization(onClose),
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
            ? <Translate id="react.organization.editOrganization.label" defaultMessage="Edit Organization" />
            : <Translate id="react.organization.createOrganization.label" defaultMessage="Add Organization" />}
        </h1>
        <form onSubmit={onSubmit} className="w-50">
          {isEdit && (
            <div className="mb-3">
              <Checkbox
                title={{ id: 'react.organization.active.label', defaultMessage: 'Active' }}
                name="active"
                value={Boolean(values.active)}
                onChange={(e) => setValue('active')(e.target.checked)}
              />
            </div>
          )}
          {isEdit && (
            <div className="mb-3">
              <TextInput
                title={{ id: 'react.organization.column.id.label', defaultMessage: 'Id' }}
                name="id"
                value={organizationId}
                disabled
              />
            </div>
          )}
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.organization.partyType.label', defaultMessage: 'Party Type' }}
              name="partyType"
              options={partyTypeOptions}
              defaultValue={values.partyType}
              onChange={setValue('partyType')}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.organization.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              disabled={codeDisabled}
              placeholder="Leave blank to generate code from name"
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.organization.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              errorMessage={nameError}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.organization.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          {isEdit && (
            <div className="mb-3">
              <div className="font-weight-bold mb-1">
                <Translate id="react.organization.roles.label" defaultMessage="Roles" />
              </div>
              <ul className="list-unstyled mb-1">
                {(details?.roles || []).map((role) => (
                  <li key={role.id}>
                    <a href={PARTY_ROLE_URL.show(role.id)}>{role.name}</a>
                  </li>
                ))}
              </ul>
              <a href={PARTY_ROLE_URL.create(organizationId)}>
                <Translate id="react.organization.addPartyRole.label" defaultMessage="Add Party Role" />
              </a>
            </div>
          )}
          {isEdit && (
            <div className="mb-3">
              <SelectField
                title={{ id: 'react.organization.defaultLocation.label', defaultMessage: 'Default Location' }}
                name="defaultLocation"
                options={locationOptions}
                defaultValue={values.defaultLocation}
                onChange={setValue('defaultLocation')}
              />
            </div>
          )}
          {isEdit && details?.maxPurchaseOrderNumber && (
            <div className="mb-3">
              <div className="font-weight-bold mb-1">
                <Translate id="react.organization.maxPurchaseOrderNumber.label" defaultMessage="Last Purchase Order Number" />
              </div>
              <span>{details.maxPurchaseOrderNumber}</span>
            </div>
          )}
          {isEdit && (
            <div className="mb-3">
              <div className="font-weight-bold mb-1">
                <Translate id="react.organization.sequences.label" defaultMessage="Sequences" />
              </div>
              {isSuperuser ? (details?.sequenceTypes || []).map((sequenceType) => (
                <div className="mb-2" key={sequenceType}>
                  <TextInput
                    title={{ id: `react.organization.sequences.${sequenceType}.label`, defaultMessage: sequenceType }}
                    name={`sequences.${sequenceType}`}
                    value={values.sequences?.[sequenceType] || ''}
                    onChange={(e) => setValues((prev) => ({
                      ...prev,
                      sequences: { ...prev.sequences, [sequenceType]: e.target.value },
                    }))}
                  />
                </div>
              )) : (
                <span>
                  {Object.entries(values.sequences || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}
                </span>
              )}
            </div>
          )}
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
            <a href={ORGANIZATION_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(OrganizationForm);

OrganizationForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      organizationId: PropTypes.string,
    }),
  }).isRequired,
};
