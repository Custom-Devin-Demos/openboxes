import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import tagApi from 'api/services/TagApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { TAG_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const TagForm = ({ match }) => {
  useTranslation('tag', 'default');
  const { id } = match.params;
  const isEdit = Boolean(id);

  const [values, setValues] = useState({
    tag: '',
    isActive: true,
    version: null,
  });
  const [products, setProducts] = useState([]);
  const [productCodesToBeAdded, setProductCodesToBeAdded] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const fetchTag = () => tagApi.getTag(id)
    .then((response) => {
      const tag = response.data.data;
      setValues({
        tag: tag.tag || '',
        isActive: Boolean(tag.isActive),
        version: tag.version,
      });
      setProducts(tag.products || []);
    })
    .catch(() => {
      window.location = TAG_URL.list();
    });

  useEffect(() => {
    if (isEdit) {
      fetchTag();
    }
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isEdit) {
        await tagApi.updateTag(id, {
          tag: values.tag,
          isActive: values.isActive,
          version: values.version,
        });
        notification(NotificationType.SUCCESS)({
          message: `Tag ${values.tag} updated`,
        });
      } else {
        const response = await tagApi.createTag({ tag: values.tag });
        notification(NotificationType.SUCCESS)({
          message: `Tag ${response.data.data.tag} created`,
        });
      }
      window.location = TAG_URL.list();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  const deleteTag = async (onClose) => {
    try {
      await tagApi.deleteTag(id);
      notification(NotificationType.SUCCESS)({
        message: `Tag ${values.tag} deleted`,
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

  const onAddProducts = async () => {
    try {
      const productCodes = productCodesToBeAdded
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean);
      await tagApi.addProducts(id, { productCodes });
      setProductCodesToBeAdded('');
      await fetchTag();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  const onRemoveProducts = async () => {
    try {
      await tagApi.removeProducts(id, { productIds: selectedProductIds });
      setSelectedProductIds([]);
      await fetchTag();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => (prev.includes(productId)
      ? prev.filter((selectedId) => selectedId !== productId)
      : [...prev, productId]));
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={isEdit
          ? { id: 'react.tag.editTag.label', defaultMessage: 'Edit Tag' }
          : { id: 'react.tag.createTag.label', defaultMessage: 'Create Tag' }}
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
          <Button
            label="react.tag.addTag.label"
            defaultLabel="Add tag"
            onClick={() => {
              window.location = TAG_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="d-flex flex-column m-3">
        <form onSubmit={onSubmit} className="w-50">
          <div className="mb-3">
            <TextInput
              title={{ id: 'react.tag.tag.label', defaultMessage: 'Tag' }}
              name="tag"
              value={values.tag}
              onChange={(e) => {
                const { value } = e.target;
                setValues((prev) => ({ ...prev, tag: value }));
              }}
            />
          </div>
          {isEdit && (
            <div className="mb-3">
              <Checkbox
                title={{ id: 'react.tag.isActive.label', defaultMessage: 'Is active?' }}
                name="isActive"
                value={values.isActive}
                onChange={(e) => {
                  const { checked } = e.target;
                  setValues((prev) => ({ ...prev, isActive: checked }));
                }}
              />
            </div>
          )}
          <div className="d-flex gap-8 align-items-center">
            <Button
              type="submit"
              label={isEdit ? 'react.default.button.update.label' : 'react.default.button.create.label'}
              defaultLabel={isEdit ? 'Update' : 'Create'}
            />
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={onDelete}
              />
            )}
            <a href={TAG_URL.list()} className="ml-2">
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </div>
        </form>
        {isEdit && (
          <div className="w-50 mt-4">
            <h3>
              <Translate id="react.tag.products.label" defaultMessage="Products" />
            </h3>
            {products.length ? (
              <table className="table table-sm">
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                        />
                      </td>
                      <td>{product.productCode}</td>
                      <td>{product.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mb-3">
                <Translate id="react.tag.noProducts.label" defaultMessage="There are no products associated with this tag" />
              </div>
            )}
            {products.length > 0 && (
              <Button
                type="button"
                variant="danger"
                label="react.tag.removeSelectedProducts.label"
                defaultLabel="Remove selected products"
                onClick={onRemoveProducts}
              />
            )}
            <div className="mt-3">
              <TextInput
                title={{ id: 'react.tag.addProductsByCode.label', defaultMessage: 'Add products by product code (comma-separated)' }}
                name="productCodesToBeAdded"
                value={productCodesToBeAdded}
                onChange={(e) => setProductCodesToBeAdded(e.target.value)}
              />
              <div className="mt-2">
                <Button
                  type="button"
                  label="react.tag.addProducts.label"
                  defaultLabel="Add products"
                  onClick={onAddProducts}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(TagForm);

TagForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
};
