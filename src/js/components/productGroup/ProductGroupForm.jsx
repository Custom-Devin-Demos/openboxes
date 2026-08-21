import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import categoryApi from 'api/services/CategoryApi';
import productGroupApi from 'api/services/ProductGroupApi';
import Button from 'components/form-elements/Button';
import SelectField from 'components/form-elements/v2/SelectField';
import TextInput from 'components/form-elements/v2/TextInput';
import notification from 'components/Layout/notifications/notification';
import ProductSelect from 'components/product-select/ProductSelect';
import { INVENTORY_ITEM_URL, PRODUCT_GROUP_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import confirmationModal from 'utils/confirmationModalUtils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const ProductGroupForm = ({ match }) => {
  useTranslation('productGroup', 'default');
  const productGroupId = match.params.productGroupId || match.params.id;
  const isEdit = Boolean(productGroupId);

  const [values, setValues] = useState({
    name: '',
    description: '',
    category: null,
    version: null,
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [productToAdd, setProductToAdd] = useState(null);
  const [siblingToAdd, setSiblingToAdd] = useState(null);

  useEffect(() => {
    categoryApi.getCategoryOptions()
      .then((response) => {
        setCategoryOptions(response.data.data.map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label ?? option.name,
        })));
      });
  }, []);

  const applyProductGroup = (productGroup) => {
    setValues({
      name: productGroup.name || '',
      description: productGroup.description || '',
      category: productGroup.category ? {
        id: productGroup.category.id,
        value: productGroup.category.id,
        label: productGroup.category.name,
      } : null,
      version: productGroup.version,
    });
    setProducts(productGroup.products || []);
    setSiblings(productGroup.siblings || []);
  };

  useEffect(() => {
    if (isEdit) {
      productGroupApi.getProductGroupDetails(productGroupId)
        .then((response) => applyProductGroup(response.data.data));
    }
  }, [productGroupId]);

  const setValue = (field) => (value) => setValues((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: values.name,
      description: values.description,
      category: values.category?.id || null,
    };
    if (isEdit) {
      const response = await productGroupApi.updateProductGroup(productGroupId, {
        ...payload,
        version: values.version,
      });
      applyProductGroup(response.data.data);
      notification(NotificationType.SUCCESS)({
        message: `Product group ${values.name} updated`,
      });
    } else {
      const response = await productGroupApi.createProductGroup(payload);
      notification(NotificationType.SUCCESS)({
        message: `Product group ${response.data.data.name} created`,
      });
      window.location = PRODUCT_GROUP_URL.edit(response.data.data.id);
    }
  };

  const deleteProductGroup = async (onClose) => {
    try {
      await productGroupApi.deleteProductGroup(productGroupId);
      notification(NotificationType.SUCCESS)({
        message: `Product group ${values.name} deleted`,
      });
      window.location = PRODUCT_GROUP_URL.list();
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
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
      onClick: () => deleteProductGroup(onClose),
    },
  ]);

  const onDelete = () => confirmationModal({
    buttons: deleteConfirmationModalButtons,
    title: {
      label: 'react.default.areYouSure.label',
      default: 'Are you sure?',
    },
  });

  const addProduct = async (product, isProductFamily) => {
    if (!product?.id) {
      return;
    }
    try {
      const response = await productGroupApi.addProductToProductGroup(productGroupId, {
        product: { id: product.id },
        isProductFamily,
      });
      applyProductGroup(response.data.data);
      if (isProductFamily) {
        setSiblingToAdd(null);
      } else {
        setProductToAdd(null);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.errorMessage;
      if (errorMessage) {
        notification(NotificationType.ERROR)({ message: errorMessage });
      }
    }
  };

  const removeProduct = async (productId, isProductFamily) => {
    const response = await productGroupApi.removeProductFromProductGroup(
      productGroupId, productId, isProductFamily,
    );
    applyProductGroup(response.data.data);
  };

  const renderProductsTable = (rows, isProductFamily) => (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>{Translate({ id: 'react.productGroup.column.productCode.label', defaultMessage: 'Code' })}</th>
          <th>{Translate({ id: 'react.productGroup.column.product.label', defaultMessage: 'Product' })}</th>
          <th>{Translate({ id: 'react.productGroup.column.category.label', defaultMessage: 'Category' })}</th>
          <th>{Translate({ id: 'react.productGroup.column.unitOfMeasure.label', defaultMessage: 'Unit of Measure' })}</th>
          <th>{Translate({ id: 'react.productGroup.column.manufacturer.label', defaultMessage: 'Manufacturer' })}</th>
          <th>{Translate({ id: 'react.productGroup.column.vendor.label', defaultMessage: 'Vendor' })}</th>
          <th>{Translate({ id: 'react.default.actions.label', defaultMessage: 'Actions' })}</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan="7">
              <Translate id="react.productGroup.noProducts.label" defaultMessage="No products" />
            </td>
          </tr>
        )}
        {rows.map((product) => (
          <tr key={product.id}>
            <td>{product.productCode}</td>
            <td>
              <a href={INVENTORY_ITEM_URL.showStockCard(product.id)}>{product.name}</a>
            </td>
            <td>{product.category}</td>
            <td>{product.unitOfMeasure}</td>
            <td>{product.manufacturer}</td>
            <td>{product.vendor}</td>
            <td>
              <Button
                type="button"
                variant="danger"
                label="react.default.button.delete.label"
                defaultLabel="Delete"
                onClick={() => removeProduct(product.id, isProductFamily)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <PageWrapper>
      <div className="d-flex flex-column m-3">
        <h1 className="mb-3">
          {isEdit
            ? <Translate id="react.productGroup.editProductGroup.label" defaultMessage="Edit Product Group" />
            : <Translate id="react.productGroup.createProductGroup.label" defaultMessage="Create Product Group" />}
        </h1>
        {isEdit && (
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <Translate id="react.productGroup.details.label" defaultMessage="Details" />
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Translate id="react.productGroup.products.label" defaultMessage="Products" />
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link ${activeTab === 'siblings' ? 'active' : ''}`}
                onClick={() => setActiveTab('siblings')}
              >
                <Translate id="react.productGroup.siblings.label" defaultMessage="Siblings" />
              </button>
            </li>
          </ul>
        )}
        {(!isEdit || activeTab === 'details') && (
          <form onSubmit={onSubmit} className="w-50">
            <div className="mb-3">
              <TextInput
                title={{ id: 'react.productGroup.name.label', defaultMessage: 'Name' }}
                name="name"
                value={values.name}
                onChange={(e) => setValue('name')(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <SelectField
                title={{ id: 'react.productGroup.category.label', defaultMessage: 'Category' }}
                name="category"
                options={categoryOptions}
                value={values.category}
                onChange={setValue('category')}
              />
            </div>
            <div className="mb-3">
              <TextInput
                title={{ id: 'react.productGroup.description.label', defaultMessage: 'Description' }}
                name="description"
                value={values.description}
                onChange={(e) => setValue('description')(e.target.value)}
              />
            </div>
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
              <a href={PRODUCT_GROUP_URL.list()} className="ml-2">
                <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
              </a>
            </div>
          </form>
        )}
        {isEdit && activeTab === 'products' && (
          <div>
            {renderProductsTable(products, false)}
            <div className="d-flex align-items-end w-50">
              <div className="flex-grow-1 mr-2">
                <ProductSelect
                  value={productToAdd}
                  onChange={setProductToAdd}
                />
              </div>
              <Button
                type="button"
                label="react.productGroup.addProduct.label"
                defaultLabel="Add Product"
                onClick={() => addProduct(productToAdd, false)}
              />
            </div>
          </div>
        )}
        {isEdit && activeTab === 'siblings' && (
          <div>
            {renderProductsTable(siblings, true)}
            <div className="d-flex align-items-end w-50">
              <div className="flex-grow-1 mr-2">
                <ProductSelect
                  value={siblingToAdd}
                  onChange={setSiblingToAdd}
                />
              </div>
              <Button
                type="button"
                label="react.productGroup.addProduct.label"
                defaultLabel="Add Product"
                onClick={() => addProduct(siblingToAdd, true)}
              />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(ProductGroupForm);

ProductGroupForm.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      productGroupId: PropTypes.string,
      id: PropTypes.string,
    }),
  }).isRequired,
};
