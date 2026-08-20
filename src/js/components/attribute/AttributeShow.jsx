import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import attributeApi from 'api/services/AttributeApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { ATTRIBUTE_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const AttributeShow = () => {
  useTranslation('attribute', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [attribute, setAttribute] = useState(null);

  const isUserAdmin = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_ADMIN,
  });

  useEffect(() => {
    spinner.show();
    attributeApi.getAttribute(id)
      .then((response) => setAttribute(response.data))
      .catch(() => history.push(ATTRIBUTE_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteAttribute = async (onClose) => {
    try {
      await attributeApi.deleteAttribute(id);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.attribute.deleted.label',
          defaultMessage: `Attribute ${id} deleted`,
          data: { id },
        }),
      });
      history.push(ATTRIBUTE_URL.list());
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
      onClick: () => deleteAttribute(onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.attribute.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.attribute.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Attribute?',
      },
    });
  };

  const booleanLabel = (value) => (value
    ? translate({ id: 'react.default.boolean.true', defaultMessage: 'True' })
    : translate({ id: 'react.default.boolean.false', defaultMessage: 'False' }));

  const rows = attribute ? [
    {
      key: 'id',
      label: translate({ id: 'react.attribute.id.label', defaultMessage: 'Id' }),
      value: attribute.id,
    },
    {
      key: 'name',
      label: translate({ id: 'react.attribute.name.label', defaultMessage: 'Name' }),
      value: attribute.name,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.attribute.dateCreated.label', defaultMessage: 'Date Created' }),
      value: attribute.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.attribute.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: attribute.lastUpdated,
    },
    {
      key: 'allowOther',
      label: translate({ id: 'react.attribute.allowOther.label', defaultMessage: 'Allow Free-Text' }),
      value: booleanLabel(attribute.allowOther),
    },
    {
      key: 'options',
      label: translate({ id: 'react.attribute.options.label', defaultMessage: 'Options' }),
      value: (attribute.options ?? []).join(', '),
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.attribute.showAttribute.label',
          defaultMessage: 'Show Attribute',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.attribute.listAttributes.label"
            defaultLabel="List attributes"
            variant="secondary"
            onClick={() => history.push(ATTRIBUTE_URL.list())}
          />
          {isUserAdmin && (
            <Button
              label="react.attribute.createAttribute.label"
              defaultLabel="Add attribute"
              onClick={() => history.push(ATTRIBUTE_URL.create())}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {attribute && (
        <div className="p-3">
          <h2>{attribute.name}</h2>
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
              onClick={() => history.push(ATTRIBUTE_URL.edit(id))}
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

export default AttributeShow;
