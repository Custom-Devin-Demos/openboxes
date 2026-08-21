import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import partyTypeApi from 'api/services/PartyTypeApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PARTY_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PartyTypeShow = () => {
  useTranslation('partyType', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [partyType, setPartyType] = useState(null);

  useEffect(() => {
    spinner.show();
    partyTypeApi.getPartyType(id)
      .then((response) => setPartyType(response.data.data))
      .catch(() => history.push(PARTY_TYPE_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deletePartyType = async (onClose) => {
    try {
      await partyTypeApi.deletePartyType(id);
      notification(NotificationType.SUCCESS)({
        message: `Party type ${id} deleted`,
      });
      history.push(PARTY_TYPE_URL.list());
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

  const rows = partyType ? [
    {
      key: 'id',
      label: translate({ id: 'react.partyType.column.id.label', defaultMessage: 'Id' }),
      value: partyType.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.partyType.name.label', defaultMessage: 'Name' }),
      value: partyType.name,
    },
    {
      key: 'description',
      label: translate({ id: 'react.partyType.description.label', defaultMessage: 'Description' }),
      value: partyType.description,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.partyType.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: partyType.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.partyType.column.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: partyType.lastUpdated,
    },
    {
      key: 'partyTypeCode',
      label: translate({ id: 'react.partyType.column.partyTypeCode.label', defaultMessage: 'Party Type Code' }),
      value: partyType.partyTypeCode,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.partyType.showPartyType.label',
          defaultMessage: 'Show PartyType',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.partyType.listPartyTypes.label"
            defaultLabel="List party types"
            variant="secondary"
            onClick={() => history.push(PARTY_TYPE_URL.list())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {partyType && (
        <div className="p-3">
          <h2>{partyType.name}</h2>
          <table className="table table-sm w-50">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-weight-bold">{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PARTY_TYPE_URL.edit(id))}
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

export default PartyTypeShow;
