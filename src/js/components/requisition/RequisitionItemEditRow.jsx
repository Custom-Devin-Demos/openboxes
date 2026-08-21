import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_ITEM_DETAILS } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const RequisitionItemEditRow = ({
  requisitionId, item, reasonCodes, onSave, onCancel, onClose,
}) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [productId, setProductId] = useState(item.productId);
  const [quantity, setQuantity] = useState(item.quantity);
  const [reasonCode, setReasonCode] = useState('');
  const [comments, setComments] = useState('');

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_ITEM_DETAILS(requisitionId, item.id))
      .then((response) => setRelatedProducts(response.data.data.relatedProducts || []));
  }, [requisitionId, item.id]);

  return (
    <tr>
      <td colSpan={9}>
        <div className="border rounded p-3 bg-light">
          <table className="table table-sm mb-2">
            <thead>
              <tr>
                <th aria-label="Select"> </th>
                <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
                <th aria-label="Quantity on hand" className="text-right"><Translate id="react.requisition.quantityOnHand.label" defaultMessage="Quantity on hand" /></th>
                <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              </tr>
            </thead>
            <tbody>
              {relatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input
                      type="radio"
                      name={`substitution-${item.id}`}
                      checked={productId === product.id}
                      onChange={() => setProductId(product.id)}
                    />
                  </td>
                  <td>
                    {product.productCode}
                    {' '}
                    {product.name}
                  </td>
                  <td className="text-right">{product.quantityOnHand}</td>
                  <td>{product.unitOfMeasure}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-row align-items-end">
            <div className="col-md-2">
              <label htmlFor={`quantity-${item.id}`}>
                <Translate id="react.requisition.quantity.label" defaultMessage="Quantity" />
              </label>
              <input
                id={`quantity-${item.id}`}
                type="text"
                className="form-control"
                value={quantity ?? ''}
                onChange={(event) => setQuantity(event.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor={`reasonCode-${item.id}`}>
                <Translate id="react.requisition.reasonCode.label" defaultMessage="Reason code" />
              </label>
              <select
                id={`reasonCode-${item.id}`}
                className="form-control"
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
              >
                <option value="" aria-label="None" />
                {reasonCodes.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor={`comments-${item.id}`}>
                <Translate id="react.requisition.comments.label" defaultMessage="Comments" />
              </label>
              <input
                id={`comments-${item.id}`}
                type="text"
                className="form-control"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex" style={{ gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSave({
                  productId,
                  quantity: quantity ? Number(quantity) : null,
                  reasonCode: reasonCode || null,
                  comments: comments || null,
                })}
              >
                <Translate id="react.default.button.save.label" defaultMessage="Save" />
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => onCancel({
                  reasonCode: reasonCode || null,
                  comments: comments || null,
                })}
              >
                <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                <Translate id="react.default.button.close.label" defaultMessage="Close" />
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

RequisitionItemEditRow.propTypes = {
  requisitionId: PropTypes.string.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string,
    productId: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  reasonCodes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
  })).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RequisitionItemEditRow;
