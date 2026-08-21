import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import tagApi from 'api/services/TagApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { TAG_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TagShow = () => {
  useTranslation('tag', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [tag, setTag] = useState(null);

  useEffect(() => {
    spinner.show();
    tagApi.getTag(id)
      .then((response) => setTag(response.data.data))
      .catch(() => {
        window.location = TAG_URL.list();
      })
      .finally(() => spinner.hide());
  }, [id]);

  const deleteTag = async (onClose) => {
    try {
      await tagApi.deleteTag(id);
      notification(NotificationType.SUCCESS)({
        message: `Tag ${tag?.tag} deleted`,
      });
      window.location = TAG_URL.list();
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
      onClick: () => deleteTag(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const rows = tag ? [
    {
      key: 'id',
      label: translate({ id: 'react.tag.column.id.label', defaultMessage: 'Id' }),
      value: tag.id,
    },
    {
      key: 'tag',
      label: translate({ id: 'react.tag.tag.label', defaultMessage: 'Tag' }),
      value: tag.tag,
    },
    {
      key: 'updatedBy',
      label: translate({ id: 'react.tag.column.updatedBy.label', defaultMessage: 'Updated By' }),
      value: tag.updatedBy,
    },
    {
      key: 'createdBy',
      label: translate({ id: 'react.tag.column.createdBy.label', defaultMessage: 'Created By' }),
      value: tag.createdBy,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.tag.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: tag.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.tag.column.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: tag.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.tag.showTag.label',
          defaultMessage: 'Show Tag',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.tag.listTags.label"
            defaultLabel="List tags"
            variant="secondary"
            onClick={() => {
              window.location = TAG_URL.list();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {tag && (
        <div className="p-3">
          <h2>{tag.tag}</h2>
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
          <h3>
            {translate({ id: 'react.tag.products.label', defaultMessage: 'Products' })}
          </h3>
          {tag.products?.length ? (
            <table className="table table-sm w-50">
              <tbody>
                {tag.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.productCode}</td>
                    <td>{product.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mb-3">
              {translate({ id: 'react.tag.noProducts.label', defaultMessage: 'There are no products associated with this tag' })}
            </div>
          )}
          <div className="d-flex gap-8">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(TAG_URL.edit(id))}
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

export default TagShow;
