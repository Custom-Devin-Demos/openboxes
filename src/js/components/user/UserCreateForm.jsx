import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import userApi from 'api/services/UserApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { USER_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const UserCreateForm = () => {
  useTranslation('user', 'default');
  const spinner = useSpinner();
  const [localeOptions, setLocaleOptions] = useState([]);

  const {
    control,
    handleSubmit,
  } = useForm({
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      password: '',
      email: '',
      locale: null,
    },
  });

  useEffect(() => {
    userApi.getLocaleOptions()
      .then((response) => {
        setLocaleOptions((response.data?.data ?? []).map((option) => ({
          ...option,
          value: option.id,
        })));
      });
  }, []);

  const onSubmit = async (values) => {
    const payload = {
      username: values.username,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
      email: values.email,
      locale: values.locale?.id ?? '',
    };
    spinner.show();
    try {
      const response = await userApi.createUser(payload);
      const savedId = response.data?.data?.id;
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.user.saved.label',
          defaultMessage: `User ${savedId} created`,
          data: { id: savedId },
        }),
      });
      window.location.href = USER_URL.edit(savedId);
    } finally {
      spinner.hide();
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.user.createUser.header.label',
          defaultMessage: 'Create User',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.user.listUsers.label"
            defaultLabel="User List"
            variant="secondary"
            onClick={() => { window.location.href = USER_URL.list(); }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.user.username.label', defaultMessage: 'Username' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.user.firstName.label', defaultMessage: 'First Name' }}
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
                title={{ id: 'react.user.lastName.label', defaultMessage: 'Last Name' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextInput
                type="password"
                title={{ id: 'react.user.password.label', defaultMessage: 'Password' }}
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
                title={{ id: 'react.user.email.label', defaultMessage: 'Email' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="locale"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.user.locale.label', defaultMessage: 'Locale' }}
                options={localeOptions}
                {...field}
              />
            )}
          />
        </div>
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label="react.default.button.save.label"
            defaultLabel="Save"
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default UserCreateForm;
