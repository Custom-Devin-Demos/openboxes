import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useHistory, withRouter } from 'react-router-dom';

import partyApi from 'api/services/PartyApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_ROLE_URL, PARTY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyForm = ({ match }) => {
  useTranslation('party', 'default');
  const history = useHistory();
  const { id } = match.params;
  const isEdit = Boolean(id);

  const [partyType, setPartyType] = useState(null);
  const [version, setVersion] = useState(null);
  const [roles, setRoles] = useState([]);
  const [partyTypeOptions, setPartyTypeOptions] = useState([]);

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
      partyApi.getParty(id)
        .then((response) => {
          const party = response.data.data;
          setPartyType(party.partyType ? {
            id: party.partyType.id,
            value: party.partyType.id,
            label: party.partyType.name,
          } : null);
          setVersion(party.version);
          setRoles(party.roles ?? []);
        })
        .catch(() => history.push(PARTY_URL.list()));
    }
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      partyType: partyType?.id || null,
    };
    if (isEdit) {
      await partyApi.updateParty(id, { ...payload, version });
      notification(NotificationType.SUCCESS)({
        message: `Party ${id} updated`,
      });
    } else {
      const response = await partyApi.createParty(payload);
      notification(NotificationType.SUCCESS)({
        message: `Party ${response.data.data.id} created`,
      });
    }
    window.location = PARTY_URL.list();
  };

  const deleteParty = async (onClose) => {
    try {
      await partyApi.deleteParty(id);
      notification(NotificationType.SUCCESS)({
        message: `Party ${id} deleted`,
      });
      window.location = PARTY_URL.list();
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
      onClick: () => deleteParty(onClose),
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
          ? { id: 'react.party.editParty.label', defaultMessage: 'Edit Party' }
          : { id: 'react.party.createParty.header.label', defaultMessage: 'Create Party' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.party.listParties.label"
            defaultLabel="List parties"
            variant="secondary"
            onClick={() => history.push(PARTY_URL.list())}
          />
          <Button
            label="react.party.createParty.label"
            defaultLabel="Add party"
            onClick={() => history.push(PARTY_URL.create())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.party.partyType.label', defaultMessage: 'Party Type' }}
              name="partyType"
              options={partyTypeOptions}
              defaultValue={partyType}
              onChange={setPartyType}
            />
          </div>
          {isEdit && (
            <div className="mb-3">
              <span className="font-weight-bold">
                <Translate id="react.party.roles.label" defaultMessage="Roles" />
              </span>
              <ul>
                {roles.map((role) => (
                  <li key={role.id}>
                    <a href={PARTY_ROLE_URL.show(role.id)}>{role.name}</a>
                  </li>
                ))}
              </ul>
              <a href={PARTY_ROLE_URL.create(id)}>
                <Translate id="react.party.addPartyRole.label" defaultMessage="Add PartyRole" />
              </a>
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
            <a href={PARTY_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(PartyForm);

PartyForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
