import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_EDIT } from 'api/urls';
import ProductSelect from 'components/product-select/ProductSelect';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { useRequisitionSelectFetch } from './requisition-utils';
import RequisitionHeader from './RequisitionHeader';

const newItem = () => ({
  id: null,
  productId: null,
  productName: '',
  quantity: '',
  status: '',
});

const EditRequisitionPage = ({ match }) => {
  const { currentLocation } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_EDIT(match.params.requisitionId))
      .then((response) => {
        setRequisition(response.data.data);
        setItems(response.data.data.requisitionItems || []);
      });
  }, [match.params.requisitionId]);

  const updateItem = (index, values) => {
    setItems(items.map((item, itemIndex) =>
      (itemIndex === index ? { ...item, ...values } : item)));
  };

  const removeItem = (index) => {
    setItems(items.filter((item, itemIndex) => itemIndex !== index));
  };

  const save = () => {
    const invalidItems = items.filter((item) => !item.productId
      || !item.quantity || Number(item.quantity) < 1);
    if (invalidItems.length) {
      setErrors(['Product is required and quantity must be greater than or equal to 1']);
      return;
    }
    setSaving(true);
    const stripNulls = (obj) => Object.entries(obj)
      .reduce((acc, [key, value]) => (value == null ? acc : { ...acc, [key]: value }), {});
    apiClient.post(REQUISITION_URL.saveRequisitionItems(), stripNulls({
      id: requisition.id,
      name: requisition.name,
      type: requisition.type,
      'origin.id': requisition.originId,
      'destination.id': requisition.destinationId,
      dateRequested: requisition.dateRequested,
      'requestedBy.id': requisition.requestedById,
      description: requisition.description,
      requisitionItems: items.map((item, index) => stripNulls({
        id: item.id,
        'product.id': item.productId,
        quantity: item.quantity,
        'productPackage.id': item.productPackageId,
        orderIndex: index,
      })),
    })).then((response) => {
      if (response.data.success) {
        // Review is still a legacy GSP screen, so leave the SPA
        window.location.assign(REQUISITION_URL.review(response.data.data.id));
      } else {
        setErrors([response.data.message || 'An error occurred while saving the requisition']);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionHeader requisition={requisition} currentStep="edit" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.addRequisitionItems.label" defaultMessage="Add requisition items" />
        </h2>
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Requisition items"><Translate id="react.requisition.requisitionItems.label" defaultMessage="Requisition items" /></th>
              <th aria-label="Quantity" className="text-center"><Translate id="react.requisition.quantity.label" defaultMessage="Quantity" /></th>
              <th aria-label="Status"><Translate id="react.requisition.status.label" defaultMessage="Status" /></th>
              <th aria-label="Delete" className="text-center"><Translate id="react.default.button.delete.label" defaultMessage="Delete" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={item.id || `new-${index}`}>
                <td style={{ minWidth: '400px' }}>
                  {item.id ? item.productName : (
                    <ProductSelect
                      locationId={currentLocation?.id}
                      value={item.productId ? {
                        id: item.productId,
                        label: item.productName,
                      } : null}
                      onChange={(product) => updateItem(index, {
                        productId: product?.id || null,
                        productName: product?.label || '',
                      })}
                    />
                  )}
                </td>
                <td className="text-center">
                  <input
                    type="text"
                    className="form-control text-center"
                    size="10"
                    value={item.quantity ?? ''}
                    onChange={(event) => updateItem(index, {
                      quantity: event.target.value.replace(/[^\d]/g, ''),
                    })}
                  />
                </td>
                <td>{item.status}</td>
                <td className="text-center">
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(index)}>
                    <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-end mb-2">
          <button
            type="button"
            id="addRequisitionItemRow"
            className="btn btn-outline-primary"
            onClick={() => setItems([...items, newItem()])}
          >
            <Translate id="react.requisition.addNewItem.label" defaultMessage="Add new item" />
          </button>
        </div>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.show(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <button type="button" id="save-requisition" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </button>
        </div>
      </div>
    </div>
  );
};

EditRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default EditRequisitionPage;
