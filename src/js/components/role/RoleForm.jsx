import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import roleApi from 'api/services/RoleApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ROLE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const RoleForm = () => {
  useTranslation('role', 'default');
  const history = useHistory();
  const spinner = useSpinner();
  const { roleId } = useParams();
  const isEdit = Boolean(roleId);
  const [roleTypeOptions, setRoleTypeOptions] = useState([]);
  const [version, setVersion] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      roleType: null,
      description: '',
    },
  });

  useEffect(() => {
    roleApi.getRoleTypeOptions()
      .then((response) => {
        setRoleTypeOptions((response.data?.data ?? []).map((option) => ({
          ...option,
          value: option.id,
        })));
      });
  }, []);

  useEffect(() => {
    if (isEdit) {
      spinner.show();
      roleApi.getRole(roleId)
        .then((response) => {
          const role = response.data?.data;
          setVersion(role.version);
          reset({
            name: role.name ?? '',
            roleType: role.roleType ? {
              id: role.roleType,
              value: role.roleType,
              label: role.roleType,
            } : null,
            description: role.description ?? '',
          });
        })
        .catch(() => history.push(ROLE_URL.index()))
        .finally(() => spinner.hide());
    }
  }, [roleId]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      roleType: values.roleType?.id ?? '',
      description: values.description,
    };
    spinner.show();
    try {
      if (isEdit) {
        await roleApi.updateRole(roleId, { ...payload, version });
        notification(NotificationType.SUCCESS)({
          message: translate({
            id: 'react.role.updated.label',
            defaultMessage: `Role ${roleId} updated`,
            data: { id: roleId },
          }),
        });
        history.push(ROLE_URL.show(roleId));
      } else {
        const response = await roleApi.createRole(payload);
        const savedId = response.data?.id;
        notification(NotificationType.SUCCESS)({
          message: translate({
            id: 'react.role.saved.label',
            defaultMessage: `Role ${savedId} created`,
            data: { id: savedId },
          }),
        });
        history.push(ROLE_URL.show(savedId));
      }
    } finally {
      spinner.hide();
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={isEdit ? {
          id: 'react.role.editRole.header.label',
          defaultMessage: 'Edit Role',
        } : {
          id: 'react.role.createRole.header.label',
          defaultMessage: 'Create Role',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.role.listRoles.label"
            defaultLabel="Role List"
            variant="secondary"
            onClick={() => { window.location.href = ROLE_URL.index(); }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
        <div className="pt-2">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.role.name.label', defaultMessage: 'Name' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="roleType"
            control={control}
            render={({ field }) => (
              <SelectField
                title={{ id: 'react.role.roleType.label', defaultMessage: 'Role Type' }}
                options={roleTypeOptions}
                {...field}
              />
            )}
          />
        </div>
        <div className="pt-2">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                title={{ id: 'react.role.description.label', defaultMessage: 'Description' }}
                {...field}
              />
            )}
          />
        </div>
        <div className="d-flex pt-3">
          <Button
            type="submit"
            label={isEdit ? 'react.default.button.update.label' : 'react.default.button.create.label'}
            defaultLabel={isEdit ? 'Update' : 'Create'}
          />
        </div>
      </form>
    </PageWrapper>
  );
};

export default RoleForm;
