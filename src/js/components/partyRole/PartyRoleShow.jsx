import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import partyRoleApi from 'api/services/PartyRoleApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_ROLE_URL, PARTY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyRoleShow = () => {
  useTranslation('partyRole', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [partyRole, setPartyRole] = useState(null);

  useEffect(() => {
    spinner.show();
    partyRoleApi.getPartyRole(id)
      .then((response) => setPartyRole(response.data.data))
      .catch(() => history.push(PARTY_ROLE_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deletePartyRole = async (onClose) => {
    try {
      await partyRoleApi.deletePartyRole(id);
      notification(NotificationType.SUCCESS)({
        message: `Party role ${id} deleted`,
      });
      history.push(PARTY_ROLE_URL.list());
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
        <ListTitle label={{
          id: 'react.partyRole.showPartyRole.label',
          defaultMessage: 'Show PartyRole',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyRole.listPartyRoles.label"
            defaultLabel="List party roles"
            variant="secondary"
            onClick={() => history.push(PARTY_ROLE_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {partyRole && (
        <div className="p-3">
          <table className="table table-sm w-50">
            <tbody>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.partyRole.column.id.label" defaultMessage="Id" />
                </td>
                <td>{partyRole.id}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.partyRole.party.label" defaultMessage="Party" />
                </td>
                <td>
                  {partyRole.party ? (
                    <a href={PARTY_URL.show(partyRole.party.id)}>
                      {partyRole.party.name}
                    </a>
                  ) : null}
                </td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.partyRole.roleType.label" defaultMessage="Role Type" />
                </td>
                <td>{partyRole.roleType}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.partyRole.startDate.label" defaultMessage="Start Date" />
                </td>
                <td>{partyRole.startDate}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.partyRole.endDate.label" defaultMessage="End Date" />
                </td>
                <td>{partyRole.endDate}</td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PARTY_ROLE_URL.edit(id))}
            />
            <Button
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={onDelete}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default PartyRoleShow;
