import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { PICKLIST_SAVE, REQUISITION_PROCESS } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ProcessRequisitionPage = ({ match }) => {
  const [requisition, setRequisition] = useState(null);
  const [productInventoryItemsMap, setProductInventoryItemsMap] = useState({});
  const [picklistId, setPicklistId] = useState(null);
  // quantities keyed by `${requisitionItemId}:${inventoryItemId}` ->
  // { picklistItemId, quantity }
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_PROCESS(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        setRequisition(data.requisition);
        setProductInventoryItemsMap(data.productInventoryItemsMap || {});
        setPicklistId(data.picklist?.id || null);
        const initialQuantities = {};
        (data.picklist?.picklistItems || []).forEach((picklistItem) => {
          initialQuantities[`${picklistItem.requisitionItemId}:${picklistItem.inventoryItemId}`] = {
            picklistItemId: picklistItem.id,
            quantity: picklistItem.quantity || 0,
          };
        });
        setQuantities(initialQuantities);
      });
  }, [match.params.requisitionId]);

  const setQuantity = (requisitionItemId, inventoryItemId, value) => {
    const key = `${requisitionItemId}:${inventoryItemId}`;
    setQuantities({
      ...quantities,
      [key]: {
        ...(quantities[key] || {}),
        quantity: value.replace(/[^\d]/g, ''),
      },
    });
  };

  const save = () => {
    setSaving(true);
    setErrors([]);
    const picklistItems = [];
    (requisition.requisitionItems || []).forEach((requisitionItem) => {
      (productInventoryItemsMap[requisitionItem.productId] || []).forEach((inventoryItem) => {
        const key = `${requisitionItem.id}:${inventoryItem.inventoryItemId}`;
        const entry = quantities[key];
        const quantity = Number(entry?.quantity) || 0;
        if (quantity > 0 || entry?.picklistItemId) {
          picklistItems.push({
            id: entry?.picklistItemId || null,
            'requisitionItem.id': requisitionItem.id,
            'inventoryItem.id': inventoryItem.inventoryItemId,
            quantity,
          });
        }
      });
    });
    apiClient.post(PICKLIST_SAVE, {
      id: picklistId,
      'requisition.id': requisition.id,
      picklistItems,
    }).then((response) => {
      if (response.data.success) {
        window.location.assign(REQUISITION_URL.show(requisition.id));
      } else {
        setErrors(['An error occurred while saving the picklist']);
      }
    }).finally(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="box p-3 border rounded bg-white">
        <h2>
          {requisition.name}
          {' '}
          <small className="text-muted">{requisition.status}</small>
        </h2>
        {(requisition.requisitionItems || []).map((requisitionItem) => {
          const inventoryItems = productInventoryItemsMap[requisitionItem.productId] || [];
          const totalPicked = inventoryItems.reduce((sum, inventoryItem) => {
            const entry = quantities[`${requisitionItem.id}:${inventoryItem.inventoryItemId}`];
            return sum + (Number(entry?.quantity) || 0);
          }, 0);
          return (
            <div key={requisitionItem.id} className="mb-3 border rounded">
              <div className="d-flex justify-content-between p-2 bg-light">
                <strong>{requisitionItem.productName}</strong>
                <span>
                  <Translate id="react.requisition.requested.label" defaultMessage="Requested" />
                  {': '}
                  {requisitionItem.quantity}
                  {' | '}
                  <Translate id="react.requisition.picked.label" defaultMessage="Picked" />
                  {': '}
                  {totalPicked}
                </span>
              </div>
              {inventoryItems.length === 0 ? (
                <div className="p-2">
                  <Translate id="react.requisition.picklistItems.message" defaultMessage="No picklist items available" />
                </div>
              ) : (
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th aria-label="Serial / Lot Number"><Translate id="react.requisition.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
                      <th aria-label="Expiration date"><Translate id="react.requisition.expirationDate.label" defaultMessage="Expiration date" /></th>
                      <th aria-label="Quantity on hand" className="text-right"><Translate id="react.requisition.quantityOnHand.label" defaultMessage="Quantity on hand" /></th>
                      <th aria-label="Picked" className="text-right"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((inventoryItem) => {
                      const key = `${requisitionItem.id}:${inventoryItem.inventoryItemId}`;
                      return (
                        <tr key={inventoryItem.inventoryItemId}>
                          <td>{inventoryItem.lotNumber}</td>
                          <td>{inventoryItem.expirationDate}</td>
                          <td className="text-right">{inventoryItem.quantityOnHand}</td>
                          <td className="text-right" style={{ width: '120px' }}>
                            <input
                              type="text"
                              className="form-control text-right quantity-picked"
                              value={quantities[key]?.quantity ?? ''}
                              onChange={(event) => setQuantity(
                                requisitionItem.id,
                                inventoryItem.inventoryItemId,
                                event.target.value,
                              )}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.show(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.save.label" defaultMessage="Save" />
          </button>
        </div>
      </div>
    </div>
  );
};

ProcessRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ProcessRequisitionPage;
