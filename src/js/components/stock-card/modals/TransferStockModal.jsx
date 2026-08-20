import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import { submitLegacyForm } from 'components/stock-card/legacyForm';
import StockCardModal from 'components/stock-card/modals/StockCardModal';
import NotificationType from 'consts/notificationTypes';
import Translate from 'utils/Translate';

const TransferStockModal = ({
  entry, details, onClose, onSuccess,
}) => {
  const currentLocation = useSelector((state) => state.session.currentLocation);
  const [destinations, setDestinations] = useState([]);
  const [destinationBins, setDestinationBins] = useState([]);
  const [destination, setDestination] = useState('');
  const [destinationBin, setDestinationBin] = useState('');
  const [quantity, setQuantity] = useState(entry.quantityAvailable);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    StockCardApi.getActionContext()
      .then((response) => setDestinations(response.data.transactionDestinations || []));
  }, []);

  useEffect(() => {
    if (!destination) {
      setDestinationBins([]);
      return;
    }
    StockCardApi.getBinLocations({ params: { 'location.id': destination } })
      .then((response) => setDestinationBins(response.data.binLocations || []));
  }, [destination]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { success } = await submitLegacyForm('transferStock', {
        id: entry.inventoryItem?.id,
        'product.id': details?.product?.id,
        'inventoryItem.id': entry.inventoryItem?.id,
        'location.id': currentLocation?.id,
        'binLocation.id': entry.binLocation?.id,
        transferOut: 'true',
        'otherLocation.id': destination,
        'otherBinLocation.id': destinationBin,
        quantity,
      });
      if (success) {
        notification(NotificationType.SUCCESS)({ message: 'Stock transferred successfully' });
        onSuccess();
        onClose();
      } else {
        notification(NotificationType.ERROR)({ message: 'Unable to transfer stock' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StockCardModal
      title={<Translate id="react.stockCard.transferStock.label" defaultMessage="Transfer stock" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="TransferStockModal-source" aria-label="Source"><Translate id="react.stockCard.source.label" defaultMessage="Source" /></label>
          <div>{currentLocation?.name}</div>
        </div>
        <div className="form-group">
          <label htmlFor="TransferStockModal-binLocation" aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></label>
          <div>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</div>
        </div>
        <div className="form-group">
          <label htmlFor="TransferStockModal-quantityOnHand" aria-label="Quantity on Hand"><Translate id="react.stockCard.quantityOnHand.label" defaultMessage="Quantity on Hand" /></label>
          <div>
            {entry.quantityAvailable}
            {' '}
            {details?.product?.unitOfMeasure || 'EA'}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="TransferStockModal-destination" aria-label="Destination"><Translate id="react.stockCard.destination.label" defaultMessage="Destination" /></label>
          <select
            id="TransferStockModal-destination"
            className="form-control"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          >
            <option value="" aria-label="None" />
            {destinations.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.locationType ? ` [${option.locationType}]` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="TransferStockModal-destinationBinLocation" aria-label="Destination Bin Location"><Translate id="react.stockCard.destinationBinLocation.label" defaultMessage="Destination Bin Location" /></label>
          <select
            id="TransferStockModal-destinationBinLocation"
            className="form-control"
            value={destinationBin}
            onChange={(event) => setDestinationBin(event.target.value)}
          >
            <option value="" aria-label="None" />
            {destinationBins.map((bin) => (
              <option key={bin.id} value={bin.id}>{bin.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="TransferStockModal-quantityToTransfer" aria-label="Quantity to transfer"><Translate id="react.stockCard.quantityToTransfer.label" defaultMessage="Quantity to transfer" /></label>
          <input
            id="TransferStockModal-quantityToTransfer"
            type="number"
            className="form-control"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Translate id="react.stockCard.transferStock.label" defaultMessage="Transfer stock" />
          </button>
        </div>
      </form>
    </StockCardModal>
  );
};

export default TransferStockModal;

TransferStockModal.propTypes = {
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

TransferStockModal.defaultProps = {
  details: null,
};
