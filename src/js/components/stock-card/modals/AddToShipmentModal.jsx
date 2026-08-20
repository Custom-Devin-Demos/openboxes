import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import StockCardModal from 'components/stock-card/modals/StockCardModal';
import { formatDate } from 'components/stock-card/utils';
import NotificationType from 'consts/notificationTypes';
import Translate from 'utils/Translate';

const AddToShipmentModal = ({
  entry, details, onClose, onSuccess,
}) => {
  const currentLocation = useSelector((state) => state.session.currentLocation);
  const [shipments, setShipments] = useState([]);
  const [shipmentContainer, setShipmentContainer] = useState('');
  const [quantity, setQuantity] = useState(entry.quantityAvailable);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    StockCardApi.getActionContext()
      .then((response) => setShipments(response.data.pendingShipments || []));
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
    body.append('shipmentContainer', shipmentContainer);
    body.append('quantity', quantity);
    try {
      const response = await StockCardApi.addToShipment(body);
      notification(NotificationType.SUCCESS)({
        message: response.data?.message || 'Item added to shipment',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(err?.response?.data?.errors || ['Unable to add item to shipment']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StockCardModal
      title={<Translate id="react.stockCard.addToShipment.label" defaultMessage="Add to shipment" />}
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
          <label htmlFor="AddToShipmentModal-lotSerialNo" aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></label>
          <div>{entry.inventoryItem?.lotNumber || ''}</div>
        </div>
        <div className="form-group">
          <label htmlFor="AddToShipmentModal-binLocation" aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></label>
          <div>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</div>
        </div>
        <div className="form-group">
          <label htmlFor="AddToShipmentModal-shipment" aria-label="Shipment"><Translate id="react.stockCard.shipment.label" defaultMessage="Shipment" /></label>
          <select
            id="AddToShipmentModal-shipment"
            className="form-control"
            value={shipmentContainer}
            onChange={(event) => setShipmentContainer(event.target.value)}
            required
          >
            <option value="" aria-label="None" />
            {shipments.map((shipment) => (
              <optgroup
                key={shipment.id}
                label={`${shipment.shipmentNumber} - ${shipment.name} to ${shipment.destination}, departing ${formatDate(shipment.expectedShippingDate)}`}
              >
                <option value={`${shipment.id}:0`}>
                  {`Loose items › ${shipment.looseItemCount} items`}
                </option>
                {shipment.containers.map((container) => (
                  <option key={container.id} value={`${shipment.id}:${container.id}`}>
                    {`${container.name} › ${container.itemCount} items`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="AddToShipmentModal-quantity" aria-label="Quantity"><Translate id="react.stockCard.quantity.label" defaultMessage="Quantity" /></label>
          <input
            id="AddToShipmentModal-quantity"
            type="number"
            className="form-control"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Translate id="react.stockCard.addToShipment.label" defaultMessage="Add to shipment" />
          </button>
        </div>
      </form>
    </StockCardModal>
  );
};

export default AddToShipmentModal;

AddToShipmentModal.propTypes = {
  entry: PropTypes.shape({
    inventoryItem: PropTypes.shape({}),
    binLocation: PropTypes.shape({}),
    quantityAvailable: PropTypes.number,
  }).isRequired,
  details: PropTypes.shape({
    product: PropTypes.shape({}),
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

AddToShipmentModal.defaultProps = {
  details: null,
};
