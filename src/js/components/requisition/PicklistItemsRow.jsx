import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_ITEM_PICKLIST_ITEMS, REQUISITION_UPDATE_PICKLIST_ITEMS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const PicklistItemsRow = ({
  requisitionId, requisitionItemId, onSaved, onClose,
}) => {
  const [data, setData] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_ITEM_PICKLIST_ITEMS(requisitionId, requisitionItemId))
      .then((response) => {
        const details = response.data.data;
        setData(details);
        setQuantities((details.availableItems || []).reduce((acc, availableItem, index) => ({
          ...acc,
          [index]: availableItem.quantityPicked || 0,
        }), {}));
      });
  }, [requisitionId, requisitionItemId]);

  const save = () => {
    setSaving(true);
    apiClient.post(REQUISITION_UPDATE_PICKLIST_ITEMS(requisitionId), {
      requisitionItemId,
      picklistItems: (data.availableItems || []).map((availableItem, index) => ({
        id: availableItem.picklistItemId,
        inventoryItemId: availableItem.inventoryItemId,
        binLocationId: availableItem.binLocationId,
        quantity: Number(quantities[index]) || 0,
      })),
    }).then((response) => {
      if (response.data.success) {
        onSaved();
      }
    }).finally(() => setSaving(false));
  };

  if (!data) {
    return null;
  }

  return (
    <tr>
      <td colSpan={8}>
        <div className="border rounded p-3 bg-light">
          {data.cannotPick ? (
            <div className="alert alert-warning mb-2">
              <Translate id="react.requisition.cannotPick.label" defaultMessage="Cannot pick a requisition item that has been canceled, substituted or changed" />
            </div>
          ) : (
            <table className="table table-sm mb-2">
              <thead>
                <tr>
                  <th aria-label="Bin Location"><Translate id="react.requisition.binLocation.label" defaultMessage="Bin Location" /></th>
                  <th aria-label="Serial / Lot Number"><Translate id="react.requisition.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
                  <th aria-label="Expiration date"><Translate id="react.requisition.expirationDate.label" defaultMessage="Expiration date" /></th>
                  <th aria-label="Available" className="text-right"><Translate id="react.requisition.available.label" defaultMessage="Available" /></th>
                  <th aria-label="Picked" className="text-right"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
                </tr>
              </thead>
              <tbody>
                {(data.availableItems || []).map((availableItem, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={index}>
                    <td>{availableItem.binLocationName || 'Default'}</td>
                    <td>{availableItem.lotNumber}</td>
                    <td>{availableItem.expirationDate}</td>
                    <td className="text-right">{availableItem.quantityAvailable}</td>
                    <td className="text-right" style={{ width: '120px' }}>
                      <input
                        type="text"
                        className="form-control text-right"
                        value={quantities[index] ?? ''}
                        onChange={(event) => setQuantities({
                          ...quantities,
                          [index]: event.target.value.replace(/[^\d]/g, ''),
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="d-flex" style={{ gap: '0.5rem' }}>
            {!data.cannotPick && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
                <Translate id="react.default.button.save.label" defaultMessage="Save" />
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              <Translate id="react.default.button.close.label" defaultMessage="Close" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

PicklistItemsRow.propTypes = {
  requisitionId: PropTypes.string.isRequired,
  requisitionItemId: PropTypes.string.isRequired,
  onSaved: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PicklistItemsRow;
