import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import partyApi from 'api/services/PartyApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { CONTEXT_PATH, PARTY_ROLE_URL, PARTY_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyShow = () => {
  useTranslation('party', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [party, setParty] = useState(null);

  useEffect(() => {
    spinner.show();
    partyApi.getParty(id)
      .then((response) => setParty(response.data.data))
      .catch(() => history.push(PARTY_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteParty = async (onClose) => {
    try {
      await partyApi.deleteParty(id);
      notification(NotificationType.SUCCESS)({
        message: `Party ${id} deleted`,
      });
      history.push(PARTY_URL.list());
    } finally {
      onClose?.();
    }
  };

  const deleteConfirmationModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'Cancel',
      label: 'react.default.button.cancel.label',
      onClick: onClose,
    },
    {
      variant: 'danger',
      defaultLabel: 'Delete',
      label: 'react.default.button.delete.label',
      onClick: () => deleteParty(onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.default.areYouSure.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.party.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Party?',
      },
    });
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.party.showParty.label',
          defaultMessage: 'Show Party',
        }}
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
      {party && (
        <div className="p-3">
          <table className="table table-sm w-50">
            <tbody>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.party.id.label" defaultMessage="Id" />
                </td>
                <td>{party.id}</td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.party.partyType.label" defaultMessage="Party Type" />
                </td>
                <td>
                  {party.partyType ? (
                    <a href={`${CONTEXT_PATH}/partyType/show/${party.partyType.id}`}>
                      {party.partyType.name}
                    </a>
                  ) : null}
                </td>
              </tr>
              <tr>
                <td className="font-weight-bold">
                  <Translate id="react.party.roles.label" defaultMessage="Roles" />
                </td>
                <td>
                  <ul className="mb-0">
                    {(party.roles ?? []).map((role) => (
                      <li key={role.id}>
                        <a href={PARTY_ROLE_URL.show(role.id)}>{role.name}</a>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PARTY_URL.edit(id))}
            />
            <Button
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={openDeleteConfirmationModal}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default PartyShow;
