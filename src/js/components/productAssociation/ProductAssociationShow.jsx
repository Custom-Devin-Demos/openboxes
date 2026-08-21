import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import productAssociationApi from 'api/services/ProductAssociationApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_ASSOCIATION_URL, PRODUCT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductAssociationShow = () => {
  useTranslation('productAssociation', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [productAssociation, setProductAssociation] = useState(null);

  useEffect(() => {
    spinner.show();
    productAssociationApi.getProductAssociation(id)
      .then((response) => setProductAssociation(response.data))
      .catch(() => history.push(PRODUCT_ASSOCIATION_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteProductAssociation = async (mutualDelete, onClose) => {
    try {
      await productAssociationApi.deleteProductAssociation(id, mutualDelete);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.productAssociation.deleted.label',
          defaultMessage: `Product Association ${id} deleted`,
          data: { id },
        }),
      });
      window.location = PRODUCT_ASSOCIATION_URL.list();
    } finally {
      onClose?.();
    }
  };

  const mutualDeleteModalButtons = (onClose) => ([
    {
      variant: 'transparent',
      defaultLabel: 'Cancel',
      label: 'react.default.button.cancel.label',
      onClick: onClose,
    },
    {
      variant: 'secondary',
      defaultLabel: 'No, delete only this one',
      label: 'react.productAssociation.deleteMutual.no.label',
      onClick: () => deleteProductAssociation(false, onClose),
    },
    {
      variant: 'danger',
      defaultLabel: 'Yes, delete both',
      label: 'react.productAssociation.deleteMutual.yes.label',
      onClick: () => deleteProductAssociation(true, onClose),
    },
  ]);

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
      onClick: () => deleteProductAssociation(false, onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    if (productAssociation?.mutualAssociation) {
      confirmationModal({
        buttons: mutualDeleteModalButtons,
        title: {
          label: 'react.productAssociation.deleteMutual.title.label',
          default: 'Delete mutual association?',
        },
        content: {
          label: 'react.productAssociation.deleteMutual.content.label',
          default: 'This association is two-way. Do you want to delete the association in the other direction as well?',
        },
      });
      return;
    }
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.productAssociation.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.productAssociation.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Product Association?',
      },
    });
  };

  const productLink = (product) => (product ? (
    <a href={PRODUCT_URL.edit(product.id)}>
      {product.productCode}
      {' '}
      {product.name}
    </a>
  ) : null);

  const rows = productAssociation ? [
    {
      key: 'id',
      label: translate({ id: 'react.productAssociation.id.label', defaultMessage: 'Id' }),
      value: productAssociation.id,
    },
    {
      key: 'code',
      label: translate({ id: 'react.productAssociation.column.code.label', defaultMessage: 'Type Code' }),
      value: productAssociation.code,
    },
    {
      key: 'product',
      label: translate({ id: 'react.productAssociation.column.product.label', defaultMessage: 'Product' }),
      value: productLink(productAssociation.product),
    },
    {
      key: 'associatedProduct',
      label: translate({ id: 'react.productAssociation.column.associatedProduct.label', defaultMessage: 'Associated Product' }),
      value: productLink(productAssociation.associatedProduct),
    },
    {
      key: 'quantity',
      label: translate({ id: 'react.productAssociation.column.quantity.label', defaultMessage: 'Conversion' }),
      value: productAssociation.quantity,
    },
    {
      key: 'comments',
      label: translate({ id: 'react.productAssociation.column.comments.label', defaultMessage: 'Comments' }),
      value: productAssociation.comments,
    },
    {
      key: 'mutualAssociation',
      label: translate({ id: 'react.productAssociation.mutualAssociation.label', defaultMessage: 'Two-way association' }),
      value: productAssociation.mutualAssociation
        ? translate({ id: 'react.default.yes.label', defaultMessage: 'Yes' })
        : translate({ id: 'react.default.no.label', defaultMessage: 'No' }),
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.productAssociation.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: productAssociation.dateCreated,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.productAssociation.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: productAssociation.lastUpdated,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productAssociation.showProductAssociation.label',
          defaultMessage: 'Show Product Association',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productAssociation.listProductAssociations.label"
            defaultLabel="List Product Associations"
            variant="secondary"
            onClick={() => history.push(PRODUCT_ASSOCIATION_URL.list())}
          />
          <Button
            label="react.productAssociation.addProductAssociation.label"
            defaultLabel="Add Product Association"
            onClick={() => {
              window.location = PRODUCT_ASSOCIATION_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {productAssociation && (
        <div className="p-3">
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
                window.location = PRODUCT_ASSOCIATION_URL.edit(id);
              }}
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

export default ProductAssociationShow;
