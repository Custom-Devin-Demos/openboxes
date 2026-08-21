import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import StockCardModal from 'components/stock-card/modals/StockCardModal';
import NotificationType from 'consts/notificationTypes';
import Translate from 'utils/Translate';

const ReturnStockModal = ({
  entry, details, onClose, onSuccess,
}) => {
  const currentLocation = useSelector((state) => state.session.currentLocation);
  const [sources, setSources] = useState([]);
  const [sourceBins, setSourceBins] = useState([]);
  const [source, setSource] = useState('');
  const [sourceBin, setSourceBin] = useState('');
  const [quantity, setQuantity] = useState(entry.quantityAvailable);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    StockCardApi.getActionContext()
      .then((response) => setSources(response.data.transactionSources || []));
  }, []);

  useEffect(() => {
    if (!source) {
      setSourceBins([]);
      return;
    }
    StockCardApi.getBinLocations({ params: { 'location.id': source } })
      .then((response) => setSourceBins(response.data.binLocations || []));
  }, [source]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    const body = new URLSearchParams();
    body.append('id', entry.inventoryItem?.id || '');
    body.append('product.id', details?.product?.id || '');
    body.append('inventoryItem.id', entry.inventoryItem?.id || '');
    body.append('location.id', currentLocation?.id || '');
    body.append('binLocation.id', entry.binLocation?.id || '');
    body.append('transferOut', 'false');
    body.append('otherLocation.id', source);
    body.append('otherBinLocation.id', sourceBin);
    body.append('quantity', quantity);
    try {
      const response = await StockCardApi.transferStock(body);
      notification(NotificationType.SUCCESS)({
        message: response.data?.message || 'Stock returned successfully',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(err?.response?.data?.errors || ['Unable to return stock']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StockCardModal
      title={<Translate id="react.stockCard.returnStock.label" defaultMessage="Return stock" />}
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
          <label htmlFor="ReturnStockModal-source" aria-label="Source"><Translate id="react.stockCard.source.label" defaultMessage="Source" /></label>
          <select
            id="ReturnStockModal-source"
            className="form-control"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            required
          >
            <option value="" aria-label="None" />
            {sources.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.locationType ? ` [${option.locationType}]` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ReturnStockModal-sourceBinLocation" aria-label="Bin Location"><Translate id="react.stockCard.sourceBinLocation.label" defaultMessage="Bin Location" /></label>
          <select
            id="ReturnStockModal-sourceBinLocation"
            className="form-control"
            value={sourceBin}
            onChange={(event) => setSourceBin(event.target.value)}
          >
            <option value="" aria-label="None" />
            {sourceBins.map((bin) => (
              <option key={bin.id} value={bin.id}>{bin.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ReturnStockModal-destination" aria-label="Destination"><Translate id="react.stockCard.destination.label" defaultMessage="Destination" /></label>
          <div>{currentLocation?.name}</div>
        </div>
        <div className="form-group">
          <label htmlFor="ReturnStockModal-binLocation" aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></label>
          <div>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</div>
        </div>
        <div className="form-group">
          <label htmlFor="ReturnStockModal-quantityOnHand" aria-label="Quantity on Hand"><Translate id="react.stockCard.quantityOnHand.label" defaultMessage="Quantity on Hand" /></label>
          <div>
            {entry.quantityAvailable}
            {' '}
            {details?.product?.unitOfMeasure || 'EA'}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="ReturnStockModal-quantityToReturn" aria-label="Quantity to return"><Translate id="react.stockCard.quantityToReturn.label" defaultMessage="Quantity to return" /></label>
          <input
            id="ReturnStockModal-quantityToReturn"
            type="number"
            className="form-control"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Translate id="react.stockCard.returnStock.label" defaultMessage="Return stock" />
          </button>
        </div>
      </form>
    </StockCardModal>
  );
};

export default ReturnStockModal;

ReturnStockModal.propTypes = {
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

ReturnStockModal.defaultProps = {
  details: null,
};
