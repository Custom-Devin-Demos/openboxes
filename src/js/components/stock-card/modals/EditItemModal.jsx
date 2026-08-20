import React, { useState } from 'react';

import moment from 'moment';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import notification from 'components/Layout/notifications/notification';
import { submitLegacyForm } from 'components/stock-card/legacyForm';
import StockCardModal from 'components/stock-card/modals/StockCardModal';
import NotificationType from 'consts/notificationTypes';
import Translate from 'utils/Translate';

const EditItemModal = ({
  entry, details, onClose, onSuccess,
}) => {
  const isSuperuser = useSelector((state) => state.session.isSuperuser);
  const [lotNumber, setLotNumber] = useState(entry.inventoryItem?.lotNumber || '');
  const [expirationDate, setExpirationDate] = useState(
    entry.inventoryItem?.expirationDate
      ? moment(entry.inventoryItem.expirationDate).format('YYYY-MM-DD')
      : '',
  );
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const lotAndExpiryControl = details?.product?.lotAndExpiryControl;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (lotAndExpiryControl && (!lotNumber || !expirationDate)) {
      notification(NotificationType.ERROR)({
        message: 'Both lot number and expiry date are required for this item.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const { success } = await submitLegacyForm('update', {
        id: entry.inventoryItem?.id,
        'product.id': details?.product?.id,
        'inventoryItem.id': entry.inventoryItem?.id,
        lotNumber,
        expirationDate: expirationDate ? moment(expirationDate).format('MM/DD/YYYY') : '',
        comments,
      });
      if (success) {
        notification(NotificationType.SUCCESS)({ message: 'Inventory item updated' });
        onSuccess();
        onClose();
      } else {
        notification(NotificationType.ERROR)({ message: 'Unable to update inventory item' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StockCardModal
      title={<Translate id="react.stockCard.editItem.label" defaultMessage="Edit inventory item" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="EditItemModal-product" aria-label="Product"><Translate id="react.stockCard.product.label" defaultMessage="Product" /></label>
          <div>{details?.product?.displayName || details?.product?.name}</div>
        </div>
        {entry.binLocation && (
          <div className="form-group">
            <label htmlFor="EditItemModal-binLocation" aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></label>
            <div>{entry.binLocation?.name}</div>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="EditItemModal-lotNumber" aria-label="Lot number"><Translate id="react.stockCard.lotNumber.label" defaultMessage="Lot number" /></label>
          {isSuperuser ? (
            <input
              id="EditItemModal-lotNumber"
              type="text"
              className="form-control"
              value={lotNumber}
              onChange={(event) => setLotNumber(event.target.value)}
            />
          ) : (
            <div>{lotNumber}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="EditItemModal-expirationDate" aria-label="Expiration date"><Translate id="react.stockCard.expirationDate.label" defaultMessage="Expiration date" /></label>
          <input
            id="EditItemModal-expirationDate"
            type="date"
            className="form-control"
            value={expirationDate}
            onChange={(event) => setExpirationDate(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="EditItemModal-comments" aria-label="Comments"><Translate id="react.default.comments.label" defaultMessage="Comments" /></label>
          <textarea
            id="EditItemModal-comments"
            className="form-control"
            value={comments}
            onChange={(event) => setComments(event.target.value)}
            rows="3"
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Translate id="react.default.button.save.label" defaultMessage="Save" />
          </button>
        </div>
      </form>
    </StockCardModal>
  );
};

export default EditItemModal;

EditItemModal.propTypes = {
  entry: PropTypes.shape({
    inventoryItem: PropTypes.shape({}),
    binLocation: PropTypes.shape({}),
  }).isRequired,
  details: PropTypes.shape({
    product: PropTypes.shape({}),
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

EditItemModal.defaultProps = {
  details: null,
};
