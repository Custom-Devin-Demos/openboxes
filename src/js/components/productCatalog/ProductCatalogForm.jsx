import React, { useEffect, useRef, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { useHistory, useParams } from 'react-router-dom';

import productCatalogApi from 'api/services/ProductCatalogApi';
import Button from 'components/form-elements/Button';
import Checkbox from 'components/form-elements/v2/Checkbox';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ListTitle from 'components/listPagesUtils/ListTitle';
import ProductSelect from 'components/product-select/ProductSelect';
import { PRODUCT_CATALOG_URL, PRODUCT_URL } from 'consts/applicationUrls';
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

const TABS = {
  DETAILS: 'DETAILS',
  ITEMS: 'ITEMS',
};

const ProductCatalogForm = () => {
  useTranslation('productCatalog', 'default');
  const { id } = useParams();
  const history = useHistory();
  const spinner = useSpinner();
  const fileInputRef = useRef(null);
  const [version, setVersion] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.DETAILS);
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isUserSuperuser = useUserHasPermissions({
    minRequiredRole: RoleType.ROLE_SUPERUSER,
  });

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      color: '',
      active: true,
    },
  });

  const fetchProductCatalog = () => {
    spinner.show();
    productCatalogApi.getProductCatalog(id)
      .then((response) => {
        const productCatalog = response.data;
        setVersion(productCatalog.version);
        setCatalogItems(productCatalog.productCatalogItems ?? []);
        reset({
          code: productCatalog.code ?? '',
          name: productCatalog.name ?? '',
          description: productCatalog.description ?? '',
          color: productCatalog.color ?? '',
          active: Boolean(productCatalog.active),
        });
      })
      .catch(() => history.push(PRODUCT_CATALOG_URL.list()))
      .finally(() => spinner.hide());
  };

  useEffect(() => {
    if (id) {
      fetchProductCatalog();
    }
  }, [id]);

  const onSubmit = async (values) => {
    const payload = {
      ...(id ? { id, version } : {}),
      code: values.code,
      name: values.name,
      description: values.description,
      active: values.active,
      ...(id ? { color: values.color } : {}),
    };
    spinner.show();
    try {
      const response = await productCatalogApi.saveProductCatalog(payload);
      const savedId = response.data?.id;
      notification(NotificationType.SUCCESS)({
        message: translate({
          id: 'react.productCatalog.saved.label',
          defaultMessage: `Product Catalog ${savedId} saved`,
          data: { id: savedId },
        }),
      });
      history.push(PRODUCT_CATALOG_URL.edit(savedId));
    } finally {
      spinner.hide();
    }
  };

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

  const addCatalogItem = async () => {
    if (!selectedProduct) {
      return;
    }
    spinner.show();
    try {
      await productCatalogApi.addProductCatalogItem({
        productCatalog: { id },
        product: { id: selectedProduct.id },
      });
      setSelectedProduct(null);
      fetchProductCatalog();
    } finally {
      spinner.hide();
    }
  };

  const removeCatalogItem = async (itemId) => {
    spinner.show();
    try {
      await productCatalogApi.removeProductCatalogItem(itemId);
      fetchProductCatalog();
    } finally {
      spinner.hide();
    }
  };

  const onImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append('importFile', file);
    spinner.show();
    try {
      const response = await productCatalogApi.importProductCatalogItems(id, formData);
      notification(NotificationType.SUCCESS)({
        message: response.data?.message,
      });
      fetchProductCatalog();
    } finally {
      spinner.hide();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={id
          ? { id: 'react.productCatalog.editProductCatalog.label', defaultMessage: 'Edit Product Catalog' }
          : { id: 'react.productCatalog.createProductCatalog.header.label', defaultMessage: 'Create Product Catalog' }}
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
          {id && isUserSuperuser && (
            <Button
              label="react.productCatalog.importProductCatalog.label"
              defaultLabel="Import Product Catalog"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            />
          )}
          {id && (
            <Button
              label="react.productCatalog.exportProductCatalog.label"
              defaultLabel="Export Product Catalog"
              variant="secondary"
              onClick={() => {
                window.location = PRODUCT_CATALOG_URL.export(id);
              }}
            />
          )}
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="d-none"
        onChange={onImportFileChange}
      />
      {id && (
        <ul className="nav nav-tabs px-3 pt-2">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn btn-link ${activeTab === TABS.DETAILS ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.DETAILS)}
            >
              {translate({ id: 'react.productCatalog.label', defaultMessage: 'Product Catalog' })}
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn btn-link ${activeTab === TABS.ITEMS ? 'active' : ''}`}
              onClick={() => setActiveTab(TABS.ITEMS)}
            >
              {translate({ id: 'react.productCatalog.productCatalogItems.label', defaultMessage: 'Product Catalog Items' })}
            </button>
          </li>
        </ul>
      )}
      {activeTab === TABS.DETAILS && (
        <form className="p-3 w-50" onSubmit={handleSubmit(onSubmit)}>
          <div className="pt-2">
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextInput
                  title={{ id: 'react.productCatalog.code.label', defaultMessage: 'Code' }}
                  {...field}
                />
              )}
            />
          </div>
          <div className="pt-2">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextInput
                  title={{ id: 'react.productCatalog.name.label', defaultMessage: 'Name' }}
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
                  title={{ id: 'react.productCatalog.description.label', defaultMessage: 'Description' }}
                  {...field}
                />
              )}
            />
          </div>
          {id && (
            <div className="pt-2">
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextInput
                    title={{ id: 'react.productCatalog.color.label', defaultMessage: 'Color' }}
                    {...field}
                  />
                )}
              />
            </div>
          )}
          <div className="pt-2">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  title={{ id: 'react.productCatalog.active.label', defaultMessage: 'Active' }}
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
              onClick={() => history.push(PRODUCT_CATALOG_URL.list())}
            />
          </div>
        </form>
      )}
      {id && activeTab === TABS.ITEMS && (
        <div className="p-3">
          <div className="d-flex align-items-center pb-3" style={{ maxWidth: '500px' }}>
            <div className="flex-grow-1 mr-2">
              <ProductSelect
                value={selectedProduct}
                onChange={(value) => setSelectedProduct(value)}
              />
            </div>
            <Button
              type="button"
              label="react.default.button.add.label"
              defaultLabel="Add"
              onClick={addCatalogItem}
            />
          </div>
          <table className="table table-sm w-75">
            <thead>
              <tr>
                <th>{translate({ id: 'react.productCatalog.column.productCode.label', defaultMessage: 'Code' })}</th>
                <th>{translate({ id: 'react.productCatalog.column.productName.label', defaultMessage: 'Name' })}</th>
                <th>{translate({ id: 'react.productCatalog.column.category.label', defaultMessage: 'Category' })}</th>
                <th>{translate({ id: 'react.productCatalog.column.actions.label', defaultMessage: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {catalogItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.product?.productCode}</td>
                  <td>
                    <a href={PRODUCT_URL.edit(item.product?.id)}>
                      {item.product?.name}
                    </a>
                  </td>
                  <td>{item.product?.categoryName}</td>
                  <td>
                    <Button
                      type="button"
                      variant="danger"
                      label="react.default.button.delete.label"
                      defaultLabel="Delete"
                      onClick={() => removeCatalogItem(item.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};

export default ProductCatalogForm;
