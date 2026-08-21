import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import partyTypeApi from 'api/services/PartyTypeApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyTypeForm = ({ match }) => {
  useTranslation('partyType', 'default');
  const { id } = match.params;
  const isEdit = Boolean(id);

  const [values, setValues] = useState({
    code: '',
    name: '',
    description: '',
    partyTypeCode: null,
    version: null,
  });
  const [partyTypeCodeOptions, setPartyTypeCodeOptions] = useState([]);

  useEffect(() => {
    partyTypeApi.getPartyTypeCodeOptions()
      .then((response) => {
        setPartyTypeCodeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      partyTypeApi.getPartyType(id)
        .then((response) => {
          const partyType = response.data.data;
          setValues({
            code: partyType.code || '',
            name: partyType.name || '',
            description: partyType.description || '',
            partyTypeCode: partyType.partyTypeCode ? {
              id: partyType.partyTypeCode,
              value: partyType.partyTypeCode,
              label: partyType.partyTypeCode,
            } : null,
            version: partyType.version,
          });
        })
        .catch(() => {
          window.location = PARTY_TYPE_URL.list();
        });
    }
  }, [id]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description,
      partyTypeCode: values.partyTypeCode?.id || null,
    };
    if (isEdit) {
      await partyTypeApi.updatePartyType(id, {
        ...payload,
        version: values.version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Party type ${values.name} updated`,
      });
    } else {
      const response = await partyTypeApi.createPartyType(payload);
      notification(NotificationType.SUCCESS)({
        message: `Party type ${response.data.data.name} created`,
      });
    }
    window.location = PARTY_TYPE_URL.list();
  };

  const deletePartyType = async (onClose) => {
    try {
      await partyTypeApi.deletePartyType(id);
      notification(NotificationType.SUCCESS)({
        message: `Party type ${values.name} deleted`,
      });
      window.location = PARTY_TYPE_URL.list();
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
      onClick: () => deletePartyType(onClose),
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
      <HeaderWrapper>
        <ListTitle label={isEdit
          ? { id: 'react.partyType.editPartyType.label', defaultMessage: 'Edit PartyType' }
          : { id: 'react.partyType.createPartyType.label', defaultMessage: 'Create PartyType' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyType.listPartyTypes.label"
            defaultLabel="List party types"
            variant="secondary"
            onClick={() => {
              window.location = PARTY_TYPE_URL.list();
            }}
          />
          <Button
            label="react.partyType.addPartyType.label"
            defaultLabel="Add party type"
            onClick={() => {
              window.location = PARTY_TYPE_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.partyType.code.label', defaultMessage: 'Code' }}
              name="code"
              value={values.code}
              onChange={(e) => setValue('code')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.partyType.name.label', defaultMessage: 'Name' }}
              name="name"
              value={values.name}
              onChange={(e) => setValue('name')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.partyType.description.label', defaultMessage: 'Description' }}
              name="description"
              value={values.description}
              onChange={(e) => setValue('description')(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.partyType.partyTypeCode.label', defaultMessage: 'Party Type Code' }}
              name="partyTypeCode"
              options={partyTypeCodeOptions}
              defaultValue={values.partyTypeCode}
              onChange={setValue('partyTypeCode')}
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
            <a href={PARTY_TYPE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(PartyTypeForm);

PartyTypeForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
