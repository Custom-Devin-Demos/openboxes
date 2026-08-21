import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { INVENTORY_ADJUST_STOCK } from 'api/urls';
import notification from 'components/Layout/notifications/notification';
import StockCardModal from 'components/stock-card/modals/StockCardModal';
import NotificationType from 'consts/notificationTypes';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const AdjustStockModal = ({
  entry, details, onClose, onSuccess,
}) => {
  const currentLocation = useSelector((state) => state.session.currentLocation);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [newQuantity, setNewQuantity] = useState(entry.quantityOnHand);
  const [reasonCode, setReasonCode] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get('/api/reasonCodes?activityCode=ADJUST_INVENTORY')
      .then((response) => setReasonCodes(response.data.data || []));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    const body = new URLSearchParams();
    body.append('product.id', details?.product?.id || '');
    body.append('location.id', currentLocation?.id || '');
    body.append('binLocation.id', entry.binLocation?.id || '');
    body.append('inventoryItem.id', entry.inventoryItem?.id || '');
    body.append('currentQuantity', entry.quantityOnHand ?? '');
    body.append('newQuantity', newQuantity);
    body.append('reasonCode', reasonCode);
    body.append('comment', comment);
    try {
      const response = await apiClient.post(INVENTORY_ADJUST_STOCK, body);
      notification(NotificationType.SUCCESS)({ message: response.data?.message || 'Stock adjusted successfully' });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(err?.response?.data?.errors || ['Unable to adjust stock']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StockCardModal
      title={<Translate id="react.stockCard.adjustStock.label" defaultMessage="Adjust stock" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="m-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="AdjustStockModal-lotSerialNo" aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></label>
          <div>{entry.inventoryItem?.lotNumber || ''}</div>
        </div>
        <div className="form-group">
          <label htmlFor="AdjustStockModal-binLocation" aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></label>
          <div>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</div>
        </div>
        <div className="form-group">
          <label htmlFor="AdjustStockModal-currentQuantity" aria-label="Current quantity"><Translate id="react.stockCard.currentQuantity.label" defaultMessage="Current quantity" /></label>
          <div>{entry.quantityOnHand}</div>
        </div>
        <div className="form-group">
          <label htmlFor="AdjustStockModal-newQuantity" aria-label="New quantity"><Translate id="react.stockCard.newQuantity.label" defaultMessage="New quantity" /></label>
          <input
            id="AdjustStockModal-newQuantity"
            type="number"
            className="form-control"
            value={newQuantity}
            onChange={(event) => setNewQuantity(event.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="AdjustStockModal-reasonCode" aria-label="Reason code"><Translate id="react.stockCard.reasonCode.label" defaultMessage="Reason code" /></label>
          <select
            id="AdjustStockModal-reasonCode"
            className="form-control"
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value)}
            required
          >
            <option value="" aria-label="None" />
            {reasonCodes.map((code) => (
              <option key={code.id} value={code.id}>{code.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="AdjustStockModal-comments" aria-label="Comments"><Translate id="react.default.comments.label" defaultMessage="Comments" /></label>
          <textarea
            id="AdjustStockModal-comments"
            className="form-control"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows="3"
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Translate id="react.stockCard.adjustStock.label" defaultMessage="Adjust stock" />
          </button>
        </div>
      </form>
    </StockCardModal>
  );
};

export default AdjustStockModal;

AdjustStockModal.propTypes = {
  entry: PropTypes.shape({
    inventoryItem: PropTypes.shape({}),
    binLocation: PropTypes.shape({}),
    quantityOnHand: PropTypes.number,
  }).isRequired,
  details: PropTypes.shape({
    product: PropTypes.shape({}),
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

AdjustStockModal.defaultProps = {
  details: null,
};
