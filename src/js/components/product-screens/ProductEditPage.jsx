import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import CategoryApi from 'api/services/CategoryApi';
import GlAccountApi from 'api/services/GlAccountApi';
import ProductScreenApi from 'api/services/ProductScreenApi';
import notification from 'components/Layout/notifications/notification';
import { INVENTORY_ITEM_URL, PRODUCT_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const TEXT_FIELDS = [
  {
    name: 'unitOfMeasure', field: 'UNIT_OF_MEASURE', label: 'react.product.unitOfMeasure.label', defaultMessage: 'Unit of measure',
  },
  {
    name: 'brandName', field: 'BRAND_NAME', label: 'react.product.brandName.label', defaultMessage: 'Brand',
  },
  {
    name: 'manufacturer', field: 'MANUFACTURER', label: 'react.product.manufacturer.label', defaultMessage: 'Manufacturer',
  },
  {
    name: 'manufacturerCode', field: 'MANUFACTURER_CODE', label: 'react.product.manufacturerCode.label', defaultMessage: 'Manufacturer code',
  },
  {
    name: 'manufacturerName', field: 'MANUFACTURER_NAME', label: 'react.product.manufacturerName.label', defaultMessage: 'Manufacturer name',
  },
  {
    name: 'modelNumber', field: 'MODEL_NUMBER', label: 'react.product.modelNumber.label', defaultMessage: 'Model number',
  },
  {
    name: 'vendor', field: 'VENDOR', label: 'react.product.vendor.label', defaultMessage: 'Vendor',
  },
  {
    name: 'vendorCode', field: 'VENDOR_CODE', label: 'react.product.vendorCode.label', defaultMessage: 'Vendor code',
  },
  {
    name: 'vendorName', field: 'VENDOR_NAME', label: 'react.product.vendorName.label', defaultMessage: 'Vendor name',
  },
  {
    name: 'upc', field: 'UPC', label: 'react.product.upc.label', defaultMessage: 'UPC',
  },
  {
    name: 'ndc', field: 'NDC', label: 'react.product.ndc.label', defaultMessage: 'NDC',
  },
];

const CHECKBOX_FIELDS = [
  {
    name: 'coldChain', field: 'COLD_CHAIN', label: 'react.product.coldChain.label', defaultMessage: 'Cold chain',
  },
  {
    name: 'controlledSubstance', field: 'CONTROLLED_SUBSTANCE', label: 'react.product.controlledSubstance.label', defaultMessage: 'Controlled substance',
  },
  {
    name: 'hazardousMaterial', field: 'HAZARDOUS_MATERIAL', label: 'react.product.hazardousMaterial.label', defaultMessage: 'Hazardous material',
  },
  {
    name: 'reconditioned', field: 'RECONDITIONED', label: 'react.product.reconditioned.label', defaultMessage: 'Reconditioned',
  },
  {
    name: 'lotAndExpiryControl', field: 'LOT_AND_EXPIRY_CONTROL', label: 'react.product.lotAndExpiryControl.label', defaultMessage: 'Lot and expiry control',
  },
];

const TABS = [
  { key: 'details', label: 'react.product.details.label', defaultMessage: 'Details' },
  { key: 'suppliers', label: 'react.product.sources.label', defaultMessage: 'Sources' },
  { key: 'inventoryLevels', label: 'react.product.inventoryLevels.label', defaultMessage: 'Inventory levels' },
  { key: 'documents', label: 'react.product.documents.label', defaultMessage: 'Documents' },
  { key: 'associations', label: 'react.product.associations.label', defaultMessage: 'Associations' },
  { key: 'packages', label: 'react.product.packages.label', defaultMessage: 'Packages' },
  { key: 'productGroups', label: 'react.product.productGroups.label', defaultMessage: 'Product family' },
  { key: 'synonyms', label: 'react.product.synonyms.label', defaultMessage: 'Synonyms' },
];

const ProductEditPage = () => {
  useTranslation('product', 'default');

  const { id } = useParams();
  const history = useHistory();

  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [form, setForm] = useState({
    active: true,
    productTypeId: '',
    productCode: '',
    name: '',
    categoryId: '',
    glAccountId: '',
    unitOfMeasure: '',
    pricePerUnit: '',
    description: '',
    tagsToBeAdded: '',
    abcClass: '',
    coldChain: false,
    controlledSubstance: false,
    hazardousMaterial: false,
    reconditioned: false,
    lotAndExpiryControl: false,
    brandName: '',
    manufacturer: '',
    manufacturerCode: '',
    manufacturerName: '',
    modelNumber: '',
    vendor: '',
    vendorCode: '',
    vendorName: '',
    upc: '',
    ndc: '',
  });
  const [attributeValues, setAttributeValues] = useState({});
  const [activeTab, setActiveTab] = useState('details');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [synonymForm, setSynonymForm] = useState({ synonymTypeCode: '', locale: '', synonym: '' });

  const loadData = () => {
    ProductScreenApi.getEditData(id)
      .then((response) => {
        const { product } = response.data;
        setData(response.data);
        if (product) {
          setForm({
            active: product.active !== false,
            productTypeId: product.productType?.id || '',
            productCode: product.productCode || '',
            name: product.name || '',
            categoryId: product.category?.id || '',
            glAccountId: product.glAccount?.id || '',
            unitOfMeasure: product.unitOfMeasure || '',
            pricePerUnit: product.pricePerUnit != null ? String(product.pricePerUnit) : '',
            description: product.description || '',
            tagsToBeAdded: product.tags || '',
            abcClass: product.abcClass || '',
            coldChain: product.coldChain || false,
            controlledSubstance: product.controlledSubstance || false,
            hazardousMaterial: product.hazardousMaterial || false,
            reconditioned: product.reconditioned || false,
            lotAndExpiryControl: product.lotAndExpiryControl || false,
            brandName: product.brandName || '',
            manufacturer: product.manufacturer || '',
            manufacturerCode: product.manufacturerCode || '',
            manufacturerName: product.manufacturerName || '',
            modelNumber: product.modelNumber || '',
            vendor: product.vendor || '',
            vendorCode: product.vendorCode || '',
            vendorName: product.vendorName || '',
            upc: product.upc || '',
            ndc: product.ndc || '',
          });
          const values = {};
          response.data.attributes?.forEach((attribute) => {
            values[attribute.id] = attribute.value || '';
          });
          setAttributeValues(values);
        } else {
          setForm((previous) => ({
            ...previous,
            productTypeId: response.data.defaultProductTypeId || '',
          }));
        }
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    CategoryApi.getCategoryOptions()
      .then((response) => setCategories(response.data.data || []));
    GlAccountApi.getGlAccountOptions()
      .then((response) => setGlAccounts(response.data.data || []));
  }, []);

  const selectedProductType = data?.productTypes?.find(
    (productType) => productType.id === form.productTypeId,
  );
  const isFieldDisplayed = (field) =>
    !selectedProductType || selectedProductType.displayedFields?.includes(field);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    try {
      const body = new URLSearchParams();
      if (id) {
        body.append('id', id);
        body.append('version', String(data?.product?.version ?? ''));
      }
      body.append('active', form.active ? 'true' : 'false');
      body.append('productType.id', form.productTypeId);
      body.append('productCode', form.productCode);
      body.append('name', form.name);
      body.append('category.id', form.categoryId);
      body.append('glAccount.id', form.glAccountId);
      body.append('unitOfMeasure', form.unitOfMeasure);
      if (data?.permissions?.hasRoleFinance) {
        body.append('pricePerUnit', form.pricePerUnit);
      }
      body.append('description', form.description);
      body.append('tagsToBeAdded', form.tagsToBeAdded);
      body.append('abcClass', form.abcClass);
      CHECKBOX_FIELDS.forEach((checkbox) => {
        body.append(checkbox.name, form[checkbox.name] ? 'true' : 'false');
      });
      TEXT_FIELDS.forEach((field) => {
        body.append(field.name, form[field.name]);
      });
      Object.entries(attributeValues).forEach(([attributeId, value]) => {
        body.append(`productAttributes.${attributeId}.value`, value);
      });
      const response = await ProductScreenApi.saveDetails(body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      notification(NotificationType.SUCCESS)({ message: response.data.message });
      if (!id) {
        history.push(PRODUCT_URL.edit(response.data.id));
      } else {
        loadData();
      }
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to save product']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSynonym = async (event) => {
    event.preventDefault();
    setErrors([]);
    try {
      const body = new URLSearchParams();
      body.append('synonymTypeCode', synonymForm.synonymTypeCode);
      body.append('locale', synonymForm.locale);
      body.append('synonym', synonymForm.synonym);
      await ProductScreenApi.addSynonym(id, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setSynonymForm({ synonymTypeCode: '', locale: '', synonym: '' });
      loadData();
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to add synonym']);
    }
  };

  const product = data?.product;

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          {id
            ? (
              <>
                <Translate id="react.product.editProduct.label" defaultMessage="Edit product" />
                {product && ` ${product.productCode} ${product.name}`}
              </>
            )
            : <Translate id="react.product.createProduct.label" defaultMessage="Create product" />}
        </h1>
        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="m-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        {id && (
          <ul className="nav nav-tabs mb-3">
            {TABS.map((tab) => (
              <li className="nav-item" key={tab.key}>
                <button
                  type="button"
                  className={`nav-link btn btn-link ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Translate id={tab.label} defaultMessage={tab.defaultMessage} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {activeTab === 'details' && (
          <form onSubmit={handleSubmit} className="w-75">
            <div className="form-check mb-2">
              <input
                id="product-active"
                className="form-check-input"
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              <label className="form-check-label" htmlFor="product-active">
                <Translate id="react.product.active.label" defaultMessage="Active" />
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="product-type">
                <Translate id="react.product.productType.label" defaultMessage="Product type" />
              </label>
              <select
                id="product-type"
                className="form-control"
                value={form.productTypeId}
                onChange={(event) => setForm({ ...form, productTypeId: event.target.value })}
              >
                {data?.productTypes?.map((productType) => (
                  <option key={productType.id} value={productType.id}>{productType.name}</option>
                ))}
              </select>
            </div>
            {isFieldDisplayed('PRODUCT_CODE') && (
              <div className="form-group">
                <label htmlFor="product-code">
                  <Translate id="react.product.productCode.label" defaultMessage="Code" />
                </label>
                <input
                  id="product-code"
                  className="form-control"
                  type="text"
                  value={form.productCode}
                  onChange={(event) => setForm({ ...form, productCode: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('NAME') && (
              <div className="form-group">
                <label htmlFor="product-name">
                  <Translate id="react.product.name.label" defaultMessage="Name" />
                </label>
                <input
                  id="product-name"
                  className="form-control"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('CATEGORY') && (
              <div className="form-group">
                <label htmlFor="product-category">
                  <Translate id="react.product.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="product-category"
                  className="form-control"
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                >
                  <option value="" aria-label="Empty" />
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}
            {isFieldDisplayed('GL_ACCOUNT') && (
              <div className="form-group">
                <label htmlFor="product-gl-account">
                  <Translate id="react.product.glAccount.label" defaultMessage="GL account" />
                </label>
                <select
                  id="product-gl-account"
                  className="form-control"
                  value={form.glAccountId}
                  onChange={(event) => setForm({ ...form, glAccountId: event.target.value })}
                >
                  <option value="" aria-label="Empty" />
                  {glAccounts.map((glAccount) => (
                    <option key={glAccount.id} value={glAccount.id}>
                      {glAccount.label || glAccount.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isFieldDisplayed('UNIT_OF_MEASURE') && (
              <div className="form-group">
                <label htmlFor="product-uom">
                  <Translate id="react.product.unitOfMeasure.label" defaultMessage="Unit of measure" />
                </label>
                <input
                  id="product-uom"
                  className="form-control"
                  type="text"
                  value={form.unitOfMeasure}
                  onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('PRICE_PER_UNIT') && data?.permissions?.hasRoleFinance && (
              <div className="form-group">
                <label htmlFor="product-price">
                  <Translate id="react.product.pricePerUnit.label" defaultMessage="Price per unit" />
                </label>
                <input
                  id="product-price"
                  className="form-control"
                  type="text"
                  value={form.pricePerUnit}
                  onChange={(event) => setForm({ ...form, pricePerUnit: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('DESCRIPTION') && (
              <div className="form-group">
                <label htmlFor="product-description">
                  <Translate id="react.product.description.label" defaultMessage="Description" />
                </label>
                <textarea
                  id="product-description"
                  className="form-control"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('TAGS') && (
              <div className="form-group">
                <label htmlFor="product-tags">
                  <Translate id="react.product.tags.label" defaultMessage="Tags" />
                </label>
                <input
                  id="product-tags"
                  className="form-control"
                  type="text"
                  value={form.tagsToBeAdded}
                  onChange={(event) => setForm({ ...form, tagsToBeAdded: event.target.value })}
                />
              </div>
            )}
            {isFieldDisplayed('ABC_CLASS') && (
              <div className="form-group">
                <label htmlFor="product-abc-class">
                  <Translate id="react.product.abcClass.label" defaultMessage="ABC class" />
                </label>
                <input
                  id="product-abc-class"
                  className="form-control"
                  type="text"
                  value={form.abcClass}
                  onChange={(event) => setForm({ ...form, abcClass: event.target.value })}
                />
              </div>
            )}
            {CHECKBOX_FIELDS.map((checkbox) => isFieldDisplayed(checkbox.field) && (
              <div className="form-check mb-2" key={checkbox.name}>
                <input
                  id={`product-${checkbox.name}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={form[checkbox.name]}
                  onChange={(event) => setForm({ ...form, [checkbox.name]: event.target.checked })}
                />
                <label className="form-check-label" htmlFor={`product-${checkbox.name}`}>
                  <Translate id={checkbox.label} defaultMessage={checkbox.defaultMessage} />
                </label>
              </div>
            ))}
            {data?.attributes?.map((attribute) => (
              <div className="form-group" key={attribute.id}>
                <label htmlFor={`product-attribute-${attribute.id}`}>
                  {attribute.name}
                  {attribute.required && ' *'}
                </label>
                {attribute.options?.length > 0 ? (
                  <select
                    id={`product-attribute-${attribute.id}`}
                    className="form-control"
                    value={attributeValues[attribute.id] || ''}
                    onChange={(event) => setAttributeValues({
                      ...attributeValues, [attribute.id]: event.target.value,
                    })}
                  >
                    <option value="" aria-label="Empty" />
                    {attribute.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`product-attribute-${attribute.id}`}
                    className="form-control"
                    type="text"
                    value={attributeValues[attribute.id] || ''}
                    onChange={(event) => setAttributeValues({
                      ...attributeValues, [attribute.id]: event.target.value,
                    })}
                  />
                )}
              </div>
            ))}
            {TEXT_FIELDS.filter((field) => field.name !== 'unitOfMeasure').map((field) =>
              isFieldDisplayed(field.field) && (
              <div className="form-group" key={field.name}>
                <label htmlFor={`product-${field.name}`}>
                  <Translate id={field.label} defaultMessage={field.defaultMessage} />
                </label>
                <input
                  id={`product-${field.name}`}
                  className="form-control"
                  type="text"
                  value={form[field.name]}
                  onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                />
              </div>
              ))}
            <button type="submit" className="btn btn-primary mr-2" disabled={submitting}>
              <Translate id="react.default.button.save.label" defaultMessage="Save" />
            </button>
            <a
              className="btn btn-outline-danger"
              href={id ? INVENTORY_ITEM_URL.showStockCard(id) : PRODUCT_URL.list()}
            >
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </a>
          </form>
        )}
        {activeTab === 'suppliers' && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th aria-label="Source code"><Translate id="react.product.sourceCode.label" defaultMessage="Source code" /></th>
                  <th aria-label="Source name"><Translate id="react.product.sourceName.label" defaultMessage="Source name" /></th>
                  <th aria-label="Supplier"><Translate id="react.product.supplier.label" defaultMessage="Supplier" /></th>
                  <th aria-label="Supplier code"><Translate id="react.product.supplierCode.label" defaultMessage="Supplier code" /></th>
                  <th aria-label="Manufacturer"><Translate id="react.product.manufacturer.label" defaultMessage="Manufacturer" /></th>
                  <th aria-label="Manufacturer code"><Translate id="react.product.manufacturerCode.label" defaultMessage="Manufacturer code" /></th>
                  <th aria-label="Unit of measure"><Translate id="react.product.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                  <th aria-label="Package price"><Translate id="react.product.packagePrice.label" defaultMessage="Package price" /></th>
                  <th aria-label="Unit price"><Translate id="react.product.unitPrice.label" defaultMessage="Unit price" /></th>
                </tr>
              </thead>
              <tbody>
                {product?.suppliers?.length === 0 && (
                  <tr>
                    <td colSpan="9">
                      <Translate id="react.default.noResults.message" defaultMessage="No results" />
                    </td>
                  </tr>
                )}
                {product?.suppliers?.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.code}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.supplier}</td>
                    <td>{supplier.supplierCode}</td>
                    <td>{supplier.manufacturer}</td>
                    <td>{supplier.manufacturerCode}</td>
                    <td>{supplier.unitOfMeasure}</td>
                    <td>{supplier.packagePrice}</td>
                    <td>{supplier.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'inventoryLevels' && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th aria-label="Status"><Translate id="react.product.status.label" defaultMessage="Status" /></th>
                  <th aria-label="Location"><Translate id="react.product.location.label" defaultMessage="Location" /></th>
                  <th aria-label="ABC class"><Translate id="react.product.abcClass.label" defaultMessage="ABC class" /></th>
                  <th aria-label="Min quantity"><Translate id="react.product.minQuantity.label" defaultMessage="Min quantity" /></th>
                  <th aria-label="Reorder quantity"><Translate id="react.product.reorderQuantity.label" defaultMessage="Reorder quantity" /></th>
                  <th aria-label="Max quantity"><Translate id="react.product.maxQuantity.label" defaultMessage="Max quantity" /></th>
                  <th aria-label="Comments"><Translate id="react.product.comments.label" defaultMessage="Comments" /></th>
                </tr>
              </thead>
              <tbody>
                {product?.inventoryLevels?.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <Translate id="react.default.noResults.message" defaultMessage="No results" />
                    </td>
                  </tr>
                )}
                {product?.inventoryLevels?.map((level) => (
                  <tr key={level.id}>
                    <td>{level.status}</td>
                    <td>{level.location}</td>
                    <td>{level.abcClass}</td>
                    <td>{level.minQuantity}</td>
                    <td>{level.reorderQuantity}</td>
                    <td>{level.maxQuantity}</td>
                    <td>{level.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'documents' && (
          <div>
            <a className="btn btn-primary mb-2" href={PRODUCT_URL.addDocument(id)}>
              <Translate id="react.product.addDocument.label" defaultMessage="Add document to product" />
            </a>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th aria-label="Name"><Translate id="react.product.name.label" defaultMessage="Name" /></th>
                    <th aria-label="Filename"><Translate id="react.product.filename.label" defaultMessage="Filename" /></th>
                    <th aria-label="Content type"><Translate id="react.product.contentType.label" defaultMessage="Content type" /></th>
                    <th aria-label="Last updated"><Translate id="react.product.lastUpdated.label" defaultMessage="Last updated" /></th>
                  </tr>
                </thead>
                <tbody>
                  {product?.documents?.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        <Translate id="react.default.noResults.message" defaultMessage="No results" />
                      </td>
                    </tr>
                  )}
                  {product?.documents?.map((document) => (
                    <tr key={document.id}>
                      <td>
                        {document.fileUri
                          ? <a href={document.fileUri} target="_blank" rel="noopener noreferrer">{document.name}</a>
                          : (
                            <a href={`${window.CONTEXT_PATH}/document/download/${document.id}`}>
                              {document.name}
                            </a>
                          )}
                      </td>
                      <td>{document.filename || document.fileUri}</td>
                      <td>{document.contentType}</td>
                      <td>{document.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'associations' && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th aria-label="Association type"><Translate id="react.product.associationType.label" defaultMessage="Association type" /></th>
                  <th aria-label="Product"><Translate id="react.product.product.label" defaultMessage="Product" /></th>
                  <th aria-label="Quantity"><Translate id="react.product.quantity.label" defaultMessage="Quantity" /></th>
                  <th aria-label="Comments"><Translate id="react.product.comments.label" defaultMessage="Comments" /></th>
                </tr>
              </thead>
              <tbody>
                {product?.associations?.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <Translate id="react.default.noResults.message" defaultMessage="No results" />
                    </td>
                  </tr>
                )}
                {product?.associations?.map((association) => (
                  <tr key={association.id}>
                    <td>{association.code}</td>
                    <td>
                      {association.associatedProduct
                        && `${association.associatedProduct.productCode} ${association.associatedProduct.name}`}
                    </td>
                    <td>{association.quantity}</td>
                    <td>{association.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'packages' && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th aria-label="Name"><Translate id="react.product.name.label" defaultMessage="Name" /></th>
                  <th aria-label="Unit of measure"><Translate id="react.product.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                  <th aria-label="Quantity"><Translate id="react.product.quantity.label" defaultMessage="Quantity" /></th>
                  <th aria-label="Supplier"><Translate id="react.product.supplier.label" defaultMessage="Supplier" /></th>
                  <th>GTIN</th>
                  <th aria-label="Price"><Translate id="react.product.price.label" defaultMessage="Price" /></th>
                </tr>
              </thead>
              <tbody>
                {product?.packages?.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <Translate id="react.default.noResults.message" defaultMessage="No results" />
                    </td>
                  </tr>
                )}
                {product?.packages?.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>{pkg.name}</td>
                    <td>{pkg.uom?.name}</td>
                    <td>{pkg.quantity}</td>
                    <td>{pkg.productSupplier}</td>
                    <td>{pkg.gtin}</td>
                    <td>{pkg.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'productGroups' && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th aria-label="Name"><Translate id="react.product.name.label" defaultMessage="Name" /></th>
                  <th aria-label="Products"><Translate id="react.product.products.label" defaultMessage="Products" /></th>
                </tr>
              </thead>
              <tbody>
                {product?.productGroups?.length === 0 && (
                  <tr>
                    <td colSpan="2">
                      <Translate id="react.default.noResults.message" defaultMessage="No results" />
                    </td>
                  </tr>
                )}
                {product?.productGroups?.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>
                      {group.products?.map((groupProduct) =>
                        `${groupProduct.productCode} ${groupProduct.name}`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'synonyms' && (
          <div>
            <form onSubmit={handleAddSynonym} className="form-inline mb-3">
              <select
                className="form-control mr-2"
                value={synonymForm.synonymTypeCode}
                onChange={(event) =>
                  setSynonymForm({ ...synonymForm, synonymTypeCode: event.target.value })}
              >
                <option value="">
                  Choose type
                </option>
                {data?.synonymTypeCodes?.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <select
                className="form-control mr-2"
                value={synonymForm.locale}
                onChange={(event) => setSynonymForm({ ...synonymForm, locale: event.target.value })}
              >
                <option value="">
                  Choose locale
                </option>
                {data?.supportedLocales?.map((locale) => (
                  <option key={locale} value={locale}>{locale}</option>
                ))}
              </select>
              <input
                className="form-control mr-2"
                type="text"
                placeholder="Synonym"
                value={synonymForm.synonym}
                onChange={(event) =>
                  setSynonymForm({ ...synonymForm, synonym: event.target.value })}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!synonymForm.synonymTypeCode
                  || !synonymForm.locale || !synonymForm.synonym}
              >
                <Translate id="react.default.button.add.label" defaultMessage="Add" />
              </button>
            </form>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th aria-label="Synonym"><Translate id="react.product.synonym.label" defaultMessage="Synonym" /></th>
                    <th aria-label="Locale"><Translate id="react.product.locale.label" defaultMessage="Locale" /></th>
                    <th aria-label="Classification"><Translate id="react.product.classification.label" defaultMessage="Classification" /></th>
                  </tr>
                </thead>
                <tbody>
                  {product?.synonyms?.length === 0 && (
                    <tr>
                      <td colSpan="3">
                        <Translate id="react.default.noResults.message" defaultMessage="No results" />
                      </td>
                    </tr>
                  )}
                  {product?.synonyms?.map((synonym) => (
                    <tr key={synonym.id}>
                      <td>{synonym.name}</td>
                      <td>{synonym.locale}</td>
                      <td>{synonym.synonymTypeCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ProductEditPage;
