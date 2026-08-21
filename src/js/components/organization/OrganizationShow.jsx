import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import organizationApi from 'api/services/OrganizationApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ORGANIZATION_URL, PARTY_ROLE_URL, PARTY_TYPE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const OrganizationShow = () => {
  useTranslation('organization', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    spinner.show();
    organizationApi.getOrganizationDetails(id)
      .then((response) => setOrganization(response.data.data))
      .catch(() => history.push(ORGANIZATION_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteOrganization = async (onClose) => {
    try {
      await organizationApi.deleteOrganization(id);
      notification(NotificationType.SUCCESS)({
        message: `Organization ${id} deleted`,
      });
      history.push(ORGANIZATION_URL.list());
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
      onClick: () => deleteOrganization(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = organization ? [
    {
      key: 'id',
      label: translate({ id: 'react.organization.column.id.label', defaultMessage: 'Id' }),
      value: organization.id,
    },
    {
      key: 'partyType',
      label: translate({ id: 'react.organization.partyType.label', defaultMessage: 'Party Type' }),
      value: organization.partyType ? (
        <a href={PARTY_TYPE_URL.show(organization.partyType.id)}>
          {organization.partyType.name}
        </a>
      ) : null,
    },
    {
      key: 'name',
      label: translate({ id: 'react.organization.name.label', defaultMessage: 'Name' }),
      value: organization.name,
    },
    {
      key: 'description',
      label: translate({ id: 'react.organization.description.label', defaultMessage: 'Description' }),
      value: organization.description,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.organization.dateCreated.label', defaultMessage: 'Date Created' }),
      value: organization.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.organization.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: organization.lastUpdated,
    },
    {
      key: 'roles',
      label: translate({ id: 'react.organization.roles.label', defaultMessage: 'Roles' }),
      value: (
        <ul className="list-unstyled mb-0">
          {(organization.roles || []).map((role) => (
            <li key={role.id}>
              <a href={PARTY_ROLE_URL.show(role.id)}>{role.name}</a>
            </li>
          ))}
        </ul>
      ),
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.organization.showOrganization.label',
          defaultMessage: 'Show Organization',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.organization.listOrganizations.label"
            defaultLabel="List Organizations"
            variant="secondary"
            onClick={() => history.push(ORGANIZATION_URL.list())}
          />
          <Button
            label="react.organization.createOrganization.label"
            defaultLabel="Add Organization"
            onClick={() => {
              window.location = ORGANIZATION_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {organization && (
        <div className="p-3">
          <h2>{organization.name}</h2>
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
              onClick={() => {
                window.location = ORGANIZATION_URL.edit(id);
              }}
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

export default OrganizationShow;
