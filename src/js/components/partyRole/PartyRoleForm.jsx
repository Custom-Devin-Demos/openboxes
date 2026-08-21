import React, { useEffect, useState } from 'react';

import moment from 'moment';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import partyApi from 'api/services/PartyApi';
import partyRoleApi from 'api/services/PartyRoleApi';
import Button from 'components/form-elements/Button';
import DateField from 'components/form-elements/v2/DateField';
import SelectField from 'components/form-elements/v2/SelectField';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_ROLE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const toIsoString = (value) => (value ? moment(value).toISOString() : null);

const PartyRoleForm = ({ match, location }) => {
  useTranslation('partyRole', 'default');
  const { id } = match.params;
  const isEdit = Boolean(id);
  const preselectedPartyId = new URLSearchParams(location.search).get('party.id');

  const [party, setParty] = useState(null);
  const [roleType, setRoleType] = useState(null);
  const [roleTypes, setRoleTypes] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [version, setVersion] = useState(null);
  const [partyOptions, setPartyOptions] = useState([]);
  const [roleTypeOptions, setRoleTypeOptions] = useState([]);

  useEffect(() => {
    partyApi.getPartyOptions()
      .then((response) => {
        const options = response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        }));
        setPartyOptions(options);
        if (!isEdit && preselectedPartyId) {
          setParty(options.find((option) => option.id === preselectedPartyId) ?? null);
        }
      });
    partyRoleApi.getRoleTypeOptions()
      .then((response) => {
        setRoleTypeOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      partyRoleApi.getPartyRole(id)
        .then((response) => {
          const partyRole = response.data.data;
          setParty(partyRole.party ? {
            id: partyRole.party.id,
            value: partyRole.party.id,
            label: partyRole.party.name,
          } : null);
          setRoleType(partyRole.roleType ? {
            id: partyRole.roleType,
            value: partyRole.roleType,
            label: partyRole.roleType,
          } : null);
          setStartDate(partyRole.startDate ?? null);
          setEndDate(partyRole.endDate ?? null);
          setVersion(partyRole.version);
        })
        .catch(() => {
          window.location = PARTY_ROLE_URL.list();
        });
    }
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isEdit) {
      await partyRoleApi.updatePartyRole(id, {
        party: party?.id || null,
        roleType: roleType?.id || null,
        startDate: toIsoString(startDate),
        endDate: toIsoString(endDate),
        version,
      });
      notification(NotificationType.SUCCESS)({
        message: `Party role ${id} updated`,
      });
    } else {
      const selectedRoleTypes = roleTypes?.length ? roleTypes : [null];
      // Legacy create screen allows selecting multiple role types; a party role
      // is created for each selected role type.
      // eslint-disable-next-line no-restricted-syntax
      for (const selectedRoleType of selectedRoleTypes) {
        // eslint-disable-next-line no-await-in-loop
        const response = await partyRoleApi.createPartyRole({
          party: party?.id || null,
          roleType: selectedRoleType?.id || null,
        });
        notification(NotificationType.SUCCESS)({
          message: `Party role ${response.data.data.id} created`,
        });
      }
    }
    window.location = PARTY_ROLE_URL.list();
  };

  const deletePartyRole = async (onClose) => {
    try {
      await partyRoleApi.deletePartyRole(id);
      notification(NotificationType.SUCCESS)({
        message: `Party role ${id} deleted`,
      });
      window.location = PARTY_ROLE_URL.list();
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
      onClick: () => deletePartyRole(onClose),
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
          ? { id: 'react.partyRole.editPartyRole.label', defaultMessage: 'Edit PartyRole' }
          : { id: 'react.partyRole.createPartyRole.label', defaultMessage: 'Create PartyRole' }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyRole.listPartyRoles.label"
            defaultLabel="List party roles"
            variant="secondary"
            onClick={() => {
              window.location = PARTY_ROLE_URL.list();
            }}
          />
          <Button
            label="react.partyRole.addPartyRole.label"
            defaultLabel="Add party role"
            onClick={() => {
              window.location = PARTY_ROLE_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <SelectField
              title={{ id: 'react.partyRole.party.label', defaultMessage: 'Party' }}
              name="party"
              options={partyOptions}
              defaultValue={party}
              onChange={setParty}
            />
          </div>
          <div className="mb-3">
            {isEdit ? (
              <SelectField
                title={{ id: 'react.partyRole.roleType.label', defaultMessage: 'Role Type' }}
                name="roleType"
                options={roleTypeOptions}
                defaultValue={roleType}
                onChange={setRoleType}
              />
            ) : (
              <SelectField
                title={{ id: 'react.partyRole.roleType.label', defaultMessage: 'Role Type' }}
                name="roleType"
                multiple
                options={roleTypeOptions}
                defaultValue={roleTypes}
                onChange={setRoleTypes}
              />
            )}
          </div>
          {isEdit && (
            <>
              <div className="mb-3">
                <DateField
                  title={{ id: 'react.partyRole.startDate.label', defaultMessage: 'Start Date' }}
                  name="startDate"
                  showTimeSelect
                  clearable
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <div className="mb-3">
                <DateField
                  title={{ id: 'react.partyRole.endDate.label', defaultMessage: 'End Date' }}
                  name="endDate"
                  showTimeSelect
                  clearable
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </>
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
            <a href={PARTY_ROLE_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(PartyRoleForm);

PartyRoleForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
