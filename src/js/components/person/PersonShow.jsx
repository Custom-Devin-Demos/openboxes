import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import personApi from 'api/services/PersonApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PERSON_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const PersonShow = () => {
  useTranslation('person', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    spinner.show();
    personApi.getPerson(id)
      .then((response) => setPerson(response.data))
      .catch(() => history.push(PERSON_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deletePerson = async (onClose) => {
    try {
      await personApi.deletePerson(id);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.person.deleted.label',
          defaultMessage: `Person ${id} deleted`,
          data: { id },
        }),
      });
      history.push(PERSON_URL.list());
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
      onClick: () => deletePerson(onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.person.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.person.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Person?',
      },
    });
  };

  const rows = person ? [
    {
      key: 'id',
      label: translate({ id: 'react.person.id.label', defaultMessage: 'Id' }),
      value: person.id,
    },
    {
      key: 'type',
      label: translate({ id: 'react.person.column.type.label', defaultMessage: 'Type' }),
      value: person.type ? translate({
        id: `react.person.type.${person.type}.label`,
        defaultMessage: person.type,
      }) : '',
    },
    {
      key: 'name',
      label: translate({ id: 'react.person.column.name.label', defaultMessage: 'Name' }),
      value: person.name,
    },
    {
      key: 'firstName',
      label: translate({ id: 'react.person.firstName.label', defaultMessage: 'First Name' }),
      value: person.firstName,
    },
    {
      key: 'lastName',
      label: translate({ id: 'react.person.lastName.label', defaultMessage: 'Last Name' }),
      value: person.lastName,
    },
    {
      key: 'email',
      label: translate({ id: 'react.person.email.label', defaultMessage: 'Email' }),
      value: person.email,
    },
    {
      key: 'phoneNumber',
      label: translate({ id: 'react.person.phoneNumber.label', defaultMessage: 'Phone Number' }),
      value: person.phoneNumber,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.person.dateCreated.label', defaultMessage: 'Date Created' }),
      value: person.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.person.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: person.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.person.showPerson.label',
          defaultMessage: 'Show Person',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.person.listPersons.label"
            defaultLabel="List persons"
            variant="secondary"
            onClick={() => history.push(PERSON_URL.list())}
          />
          <Button
            label="react.person.createPerson.label"
            defaultLabel="Add person"
            onClick={() => history.push(PERSON_URL.create())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {person && (
        <div className="p-3">
          <h2>{person.name}</h2>
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
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PERSON_URL.edit(id))}
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

export default PersonShow;
