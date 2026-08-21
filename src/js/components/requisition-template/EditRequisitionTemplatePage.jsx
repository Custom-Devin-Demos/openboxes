import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  JSON_ADD_TO_REQUISITION_ITEMS,
  JSON_GET_REQUISITION_ITEMS,
  JSON_REMOVE_REQUISITION_ITEM,
  JSON_UPDATE_REQUISITION_ITEMS,
} from 'api/urls';
import ProductSelect from 'components/product-select/ProductSelect';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { formatCurrency, useTemplateDetails } from './requisition-template-utils';
import RequisitionTemplateHeaderPanel from './RequisitionTemplateHeaderPanel';
import RequisitionTemplateSummary from './RequisitionTemplateSummary';

const duplicateRowStyle = { backgroundColor: 'rgba(255, 0, 0, 0.31)' };

const EditRequisitionTemplatePage = ({ match }) => {
  const { template, refetchTemplate } = useTemplateDetails(match.params.templateId);
  const currentLocation = useSelector((state) => state.session.currentLocation);
  const [items, setItems] = useState([]);
  const [newProduct, setNewProduct] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState([]);

  useTranslation('requisitionTemplate');

  const fetchItems = () => {
    apiClient.get(JSON_GET_REQUISITION_ITEMS(match.params.templateId))
      .then((response) => {
        setItems((response.data.aaData || []).map((item) => ({
          ...item,
          quantity: item.quantity != null ? String(item.quantity) : '',
          productPackageId: item.productPackageId || '',
        })));
      });
  };

  useEffect(() => {
    fetchItems();
  }, [match.params.templateId]);

  if (!template) {
    return null;
  }

  const isPull = template.replenishmentTypeCode === 'PULL';
  const isAdmin = template.isUserAdmin;
  const hasFinance = template.hasRoleFinance;

  const productCounts = items.reduce((acc, item) => ({
    ...acc, [item.product.id]: (acc[item.product.id] || 0) + 1,
  }), {});
  const isDuplicate = (item) => productCounts[item.product.id] > 1;
  const newProductIsDuplicate = newProduct && items.some(
    (item) => item.product.id === newProduct.id,
  );

  const updateItem = (id, values) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...values } : item)));
  };

  const addItem = () => {
    if (!newProduct) {
      return;
    }
    const params = {
      'product.id': newProduct.id,
      'requisition.id': template.id,
      orderIndex: items.length,
    };
    if (isPull) {
      params.quantity = 0;
    } else if (newQuantity) {
      params.quantity = newQuantity;
    } else {
      return;
    }
    apiClient.get(JSON_ADD_TO_REQUISITION_ITEMS, { params })
      .then((response) => {
        if (response.data.success) {
          setNewProduct(null);
          setNewQuantity('');
          fetchItems();
          refetchTemplate();
        }
      })
      .catch((error) => setErrors(error.response?.data?.errors || []));
  };

  const removeItem = (id) => {
    apiClient.delete(JSON_REMOVE_REQUISITION_ITEM(id))
      .then(() => {
        fetchItems();
        refetchTemplate();
      })
      .catch((error) => setErrors(error.response?.data?.errors || []));
  };

  const save = () => {
    setMessage(null);
    setErrors([]);
    apiClient.post(JSON_UPDATE_REQUISITION_ITEMS(template.id), {
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        productPackageId: item.productPackageId || '',
      })),
    }).then(() => {
      setMessage('Requisition updated');
      fetchItems();
      refetchTemplate();
    }).catch((error) => setErrors(error.response?.data?.errors || []));
  };

  const productCell = (item) => (
    <a
      style={{ color: item.product.color || undefined }}
      href={INVENTORY_ITEM_URL.showStockCard(item.product.id)}
      target="_blank"
      rel="noopener noreferrer"
      title={item.product.displayName ? item.product.name : undefined}
    >
      {item.product.displayName || item.product.name}
    </a>
  );

  const packageSelect = (item) => (
    <select
      id={`productPackage-${item.id}`}
      className="form-control"
      value={item.productPackageId}
      onChange={(event) => updateItem(item.id, { productPackageId: event.target.value })}
    >
      <option value="">EA/1</option>
      {(item.product.packages || []).map((pkg) => (
        <option key={pkg.id} value={pkg.id}>
          {`${pkg.uom.code}/${pkg.quantity} -- ${pkg.uom.name}`}
        </option>
      ))}
    </select>
  );

  const rowProps = (item) => ({
    style: isDuplicate(item) || (newProductIsDuplicate && item.product.id === newProduct.id)
      ? duplicateRowStyle : undefined,
    className: !item.product.active ? 'text-muted' : undefined,
    title: !item.product.active
      ? 'This product has been discontinued. Please remove it from the stock list' : undefined,
  });

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {message && <div className="alert alert-success" role="alert">{message}</div>}
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionTemplateSummary template={template} />
      <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
        <div style={{ minWidth: '320px' }}>
          <RequisitionTemplateHeaderPanel template={template} />
        </div>
        <div className="flex-grow-1">
          <div className="box p-3 border rounded bg-white">
            <h2>
              <Translate id="react.requisitionTemplate.requisitionItems.label" defaultMessage="Stocklist items" />
            </h2>
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th aria-label="Code" className="text-center"><Translate id="react.requisitionTemplate.productCode.label" defaultMessage="Code" /></th>
                  <th aria-label="Product"><Translate id="react.requisitionTemplate.product.label" defaultMessage="Product" /></th>
                  <th aria-label="Category"><Translate id="react.requisitionTemplate.category.label" defaultMessage="Category" /></th>
                  {!isPull && (
                    <th aria-label="Max quantity" className="text-center"><Translate id="react.requisitionTemplate.maxQuantity.label" defaultMessage="Max quantity" /></th>
                  )}
                  <th aria-label="Unit of measure" className="text-center"><Translate id="react.requisitionTemplate.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                  {!isPull && (
                    <th aria-label="Monthly quantity" className="text-center"><Translate id="react.requisitionTemplate.monthlyQuantity.label" defaultMessage="Monthly quantity" /></th>
                  )}
                  {hasFinance && (
                    <th aria-label="Unit cost" className="text-center"><Translate id="react.requisitionTemplate.unitCost.label" defaultMessage="Unit cost" /></th>
                  )}
                  {!isPull && hasFinance && (
                    <th aria-label="Total cost" className="text-center"><Translate id="react.requisitionTemplate.totalCost.label" defaultMessage="Total cost" /></th>
                  )}
                  {isAdmin && (
                    <th aria-label="Actions"><Translate id="react.requisitionTemplate.actions.label" defaultMessage="Actions" /></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} {...rowProps(item)}>
                    <td className="text-center" style={{ color: item.product.color || undefined }}>
                      {item.product.productCode}
                    </td>
                    <td>{productCell(item)}</td>
                    <td>{item.product.category}</td>
                    {!isPull && (
                      <td className="text-center">
                        <input
                          id={`quantity-${item.id}`}
                          type="text"
                          className="form-control text-center"
                          size="6"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, {
                            quantity: event.target.value.replace(/[^\d]/g, ''),
                          })}
                        />
                      </td>
                    )}
                    <td className="text-center">{packageSelect(item)}</td>
                    {!isPull && (
                      <td className="text-center">
                        {item.monthlyDemand === null
                          ? <Translate id="react.requisitionTemplate.noReplenishmentPeriod.message" defaultMessage="No replenishment period" />
                          : `${item.monthlyDemand} ${item.product.unitOfMeasure || 'each'}`}
                      </td>
                    )}
                    {hasFinance && (
                      <td className="text-center">
                        {formatCurrency(item.product.pricePerUnit)}
                        {' '}
                        {template.currencyCode}
                      </td>
                    )}
                    {!isPull && hasFinance && (
                      <td className="text-center">
                        {formatCurrency(item.totalCost)}
                        {' '}
                        {template.currencyCode}
                      </td>
                    )}
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          id={`delete-${item.id}`}
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeItem(item.id)}
                        >
                          <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {isAdmin && (
                  <tr id="new-row" style={newProductIsDuplicate ? duplicateRowStyle : undefined}>
                    <td />
                    <td style={{ minWidth: '300px' }}>
                      <ProductSelect
                        locationId={currentLocation?.id}
                        value={newProduct ? { id: newProduct.id, label: newProduct.label } : null}
                        onChange={(product) => setNewProduct(product || null)}
                      />
                    </td>
                    <td />
                    {!isPull && (
                      <td className="text-center">
                        <input
                          id="quantity"
                          type="text"
                          className="form-control text-center"
                          size="6"
                          value={newQuantity}
                          onChange={(event) => setNewQuantity(event.target.value.replace(/[^\d]/g, ''))}
                        />
                      </td>
                    )}
                    <td className="text-center">
                      <select className="form-control" value="">
                        <option value="">EA/1</option>
                      </select>
                    </td>
                    {!isPull && <td />}
                    {hasFinance && <td />}
                    {!isPull && hasFinance && <td />}
                    <td>
                      <button
                        type="button"
                        id="add-requisition-item"
                        className="btn btn-sm btn-outline-primary"
                        disabled={newProductIsDuplicate}
                        title={newProductIsDuplicate ? 'Item already exists in the stocklist' : undefined}
                        onClick={addItem}
                      >
                        <Translate id="react.default.button.add.label" defaultMessage="Add" />
                      </button>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
            <div className="d-flex">
              <button type="button" id="update-requisition" className="btn btn-primary" onClick={save}>
                <Translate id="react.default.button.save.label" defaultMessage="Save" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EditRequisitionTemplatePage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default EditRequisitionTemplatePage;
