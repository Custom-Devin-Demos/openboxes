import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import productCatalogApi from 'api/services/ProductCatalogApi';
import Button from 'components/form-elements/Button';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_CATALOG_URL, PRODUCT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import RoleType from 'consts/roleType';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import useUserHasPermissions from 'hooks/useUserHasPermissions';
import confirmationModal from 'utils/confirmationModalUtils';
import { formatISODate } from 'utils/dateUtils';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductCatalogShow = () => {
  useTranslation('productCatalog', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const [productCatalog, setProductCatalog] = useState(null);

  const isUserSuperuser = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_SUPERUSER,
  });

  useEffect(() => {
    spinner.show();
    productCatalogApi.getProductCatalog(id)
      .then((response) => setProductCatalog(response.data))
      .catch(() => history.push(PRODUCT_CATALOG_URL.list()))
      .finally(() => spinner.hide());
  }, [id]);

  const deleteProductCatalog = async (onClose) => {
    try {
      await productCatalogApi.deleteProductCatalog(id);
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.productCatalog.deleted.label',
          defaultMessage: `Product Catalog ${id} deleted`,
          data: { id },
        }),
      });
      history.push(PRODUCT_CATALOG_URL.list());
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
      onClick: () => deleteProductCatalog(onClose),
    },
  ]);

  const openDeleteConfirmationModal = () => {
    confirmationModal({
      buttons: deleteConfirmationModalButtons,
      title: {
        label: 'react.productCatalog.deleteConfirmation.title.label',
        default: 'Are you sure?',
      },
      content: {
        label: 'react.productCatalog.deleteConfirmation.content.label',
        default: 'Are you sure you want to delete this Product Catalog?',
      },
    });
  };

  const yesNo = (value) => (value
    ? translate({ id: 'react.default.yes.label', defaultMessage: 'Yes' })
    : translate({ id: 'react.default.no.label', defaultMessage: 'No' }));

  const rows = productCatalog ? [
    {
      key: 'id',
      label: translate({ id: 'react.productCatalog.column.id.label', defaultMessage: 'Id' }),
      value: productCatalog.id,
    },
    {
      key: 'code',
      label: translate({ id: 'react.productCatalog.column.code.label', defaultMessage: 'Code' }),
      value: productCatalog.code,
    },
    {
      key: 'name',
      label: translate({ id: 'react.productCatalog.column.name.label', defaultMessage: 'Name' }),
      value: productCatalog.name,
    },
    {
      key: 'description',
      label: translate({ id: 'react.productCatalog.column.description.label', defaultMessage: 'Description' }),
      value: productCatalog.description,
    },
    {
      key: 'active',
      label: translate({ id: 'react.productCatalog.column.active.label', defaultMessage: 'Active' }),
      value: yesNo(productCatalog.active),
    },
    {
      key: 'color',
      label: translate({ id: 'react.productCatalog.column.color.label', defaultMessage: 'Color' }),
      value: <span style={{ color: productCatalog.color }}>{productCatalog.color}</span>,
    },
    {
      key: 'dateCreated',
      label: translate({ id: 'react.productCatalog.column.dateCreated.label', defaultMessage: 'Date Created' }),
      value: productCatalog.dateCreated
        ? formatISODate(productCatalog.dateCreated, 'MMM dd, yyyy hh:mm a') : null,
    },
    {
      key: 'lastUpdated',
      label: translate({ id: 'react.productCatalog.lastUpdated.label', defaultMessage: 'Last Updated' }),
      value: productCatalog.lastUpdated
        ? formatISODate(productCatalog.lastUpdated, 'MMM dd, yyyy hh:mm a') : null,
    },
  ] : [];

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productCatalog.showProductCatalog.label',
          defaultMessage: 'Show Product Catalog',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productCatalog.listProductCatalogs.label"
            defaultLabel="List Product Catalogs"
            variant="secondary"
            onClick={() => history.push(PRODUCT_CATALOG_URL.list())}
          />
          {isUserSuperuser && (
            <Button
              label="react.productCatalog.createProductCatalog.label"
              defaultLabel="Create Product Catalog"
              onClick={() => history.push(PRODUCT_CATALOG_URL.create())}
            />
          )}
          <Button
            label="react.productCatalog.exportProductCatalog.label"
            defaultLabel="Export Product Catalog"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_CATALOG_URL.export(id);
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      {productCatalog && (
        <div className="p-3">
          <h2>{productCatalog.name}</h2>
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
            {translate({ id: 'react.productCatalog.products.label', defaultMessage: 'Products' })}
          </h3>
          <ul>
            {(productCatalog.productCatalogItems ?? []).map((item) => (
              <li key={item.id}>
                <a href={PRODUCT_URL.edit(item.product?.id)}>
                  {item.product?.productCode}
                  {' '}
                  {item.product?.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="d-flex">
            <Button
              label="react.default.button.edit.label"
              defaultLabel="Edit"
              onClick={() => history.push(PRODUCT_CATALOG_URL.edit(id))}
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

export default ProductCatalogShow;
