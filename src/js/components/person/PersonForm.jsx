import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import personApi from 'api/services/PersonApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import TextInput from 'components/form-elements/v2/TextInput';
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

const PersonForm = () => {
  useTranslation('person', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [version, setVersion] = useState(null);
  const [personType, setPersonType] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      active: true,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (id) {
      spinner.show();
      personApi.getPerson(id)
        .then((response) => {
          const person = response.data;
          setVersion(person.version);
          setPersonType(person.type);
          reset({
            active: Boolean(person.active),
            firstName: person.firstName ?? '',
            lastName: person.lastName ?? '',
            email: person.email ?? '',
            phoneNumber: person.phoneNumber ?? '',
          });
        })
        .catch(() => history.push(PERSON_URL.list()))
        .finally(() => spinner.hide());
    }
  }, [id]);

  const onSubmit = async (values) => {
    const payload = {
      active: values.active,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      version,
    };
    spinner.show();
    try {
      const response = id
        ? await personApi.updatePerson(id, payload)
        : await personApi.createPerson(payload);
      const savedId = response.data?.id;
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.person.saved.label',
          defaultMessage: `Person ${savedId} saved`,
          data: { id: savedId },
        }),
      });
      history.push(PERSON_URL.list());
    } finally {
      spinner.hide();
    }
  };

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

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={id
          ? { id: 'react.person.editPerson.label', defaultMessage: 'Edit Person' }
          : { id: 'react.person.createPerson.header.label', defaultMessage: 'Add Person' }}
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
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Checkbox
                title={{ id: 'react.person.active.label', defaultMessage: 'Active' }}
                {...field}
              />
            )}
          />
        </div>
        {id && personType && (
          <div className="pt-2">
            <span className="font-weight-bold">
              {translate({ id: 'react.person.column.type.label', defaultMessage: 'Type' })}
            </span>
            &nbsp;
            {translate({
              id: `react.person.type.${personType}.label`,
              defaultMessage: personType,
            })}
            &nbsp;
            {personType === 'Person' && (
              <a href={PERSON_URL.convertPersonToUser(id)}>
                {translate({ id: 'react.person.convertPersonToUser.label', defaultMessage: 'Convert to user' })}
              </a>
            )}
            {personType === 'User' && (
              <a href={PERSON_URL.convertUserToPerson(id)}>
                {translate({ id: 'react.person.convertUserToPerson.label', defaultMessage: 'Convert to person' })}
              </a>
            )}
          </div>
        )}
        <div className="pt-2">
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.person.firstName.label', defaultMessage: 'First Name' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.person.lastName.label', defaultMessage: 'Last Name' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.person.email.label', defaultMessage: 'Email' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.person.phoneNumber.label', defaultMessage: 'Phone Number' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label={id ? 'react.default.button.save.label' : 'react.default.button.create.label'}
            defaultLabel={id ? 'Save' : 'Create'}
          />
          {id && (
            <Button
              type="button"
              variant="danger"
              label="react.default.button.delete.label"
              defaultLabel="Delete"
              onClick={openDeleteConfirmationModal}
            />
          )}
          <Button
            type="button"
            variant="transparent"
            label="react.default.button.cancel.label"
            defaultLabel="Cancel"
            onClick={() => history.push(PERSON_URL.list())}
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default PersonForm;
