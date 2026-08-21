import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import roleApi from 'api/services/RoleApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ROLE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const RoleShow = () => {
  useTranslation('role', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [role, setRole] = useState(null);

  useEffect(() => {
    spinner.show();
    roleApi.getRole(id)
      .then((response) => setRole(response.data.data))
      .catch(() => history.push(ROLE_URL.index()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteRole = async (onClose) => {
    try {
      await roleApi.deleteRole(id);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.role.deleted.label',
          defaultMessage: `Role ${id} deleted`,
          data: { id },
        }),
      });
      history.push(ROLE_URL.index());
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
      onClick: () => deleteRole(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = role ? [
    {
      key: 'id',
      label: translate({ id: 'react.role.column.id.label', defaultMessage: 'Id' }),
      value: role.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.role.name.label', defaultMessage: 'Name' }),
      value: role.name,
    },
    {
      key: 'roleType',
      label: translate({ id: 'react.role.roleType.label', defaultMessage: 'Role Type' }),
      value: role.roleType,
    },
    {
      key: 'description',
      label: translate({ id: 'react.role.description.label', defaultMessage: 'Description' }),
      value: role.description,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.role.showRole.label',
          defaultMessage: 'Show Role',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.role.listRoles.label"
            defaultLabel="Role List"
            variant="secondary"
            onClick={() => history.push(ROLE_URL.index())}
          />
          <Button
            label="react.role.createRole.header.label"
            defaultLabel="Create Role"
            onClick={() => history.push(ROLE_URL.create())}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {role && (
        <div className="p-3">
          <h2>{role.name}</h2>
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
              onClick={() => history.push(ROLE_URL.edit(id))}
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

export default RoleShow;
