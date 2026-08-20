import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import AddToShipmentModal from 'components/stock-card/modals/AddToShipmentModal';
import AdjustStockModal from 'components/stock-card/modals/AdjustStockModal';
import EditItemModal from 'components/stock-card/modals/EditItemModal';
import ReturnStockModal from 'components/stock-card/modals/ReturnStockModal';
import TransferStockModal from 'components/stock-card/modals/TransferStockModal';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const CurrentStockTab = ({ productId, details, onRefresh }) => {
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);

  const fetchData = () => {
    StockCardApi.getCurrentStock(productId)
      .then((response) => setData(response.data));
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const refresh = () => {
    fetchData();
    onRefresh();
  };

  const permissions = details?.permissions || {};
  const unitOfMeasure = details?.product?.unitOfMeasure || 'EA';

  const openModal = (type, item) => setModal({ type, item });
  const closeModal = () => setModal(null);

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Actions" className="text-center"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
            <th aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></th>
            <th aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
            <th aria-label="Expires"><Translate id="react.stockCard.expires.label" defaultMessage="Expires" /></th>
            <th aria-label="On Hand" className="text-right"><Translate id="react.stockCard.onHand.label" defaultMessage="On Hand" /></th>
            <th aria-label="Available" className="text-right"><Translate id="react.stockCard.available.label" defaultMessage="Available" /></th>
            <th aria-label="Status"><Translate id="react.stockCard.status.label" defaultMessage="Status" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.availableItems?.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center">
                <Translate
                  id="react.stockCard.noItemsCurrentlyInStock.message"
                  defaultMessage="There are no items currently in stock."
                />
              </td>
            </tr>
          )}
          {data?.availableItems?.map((entry) => (
            <tr
              key={`${entry.inventoryItem?.id}-${entry.binLocation?.id || 'default'}`}
              className={`${entry.recalled ? 'recalled' : ''} ${entry.onHold ? 'restricted' : ''}`}
            >
              <td className="text-center stock-card-row-actions">
                <div className="dropdown">
                  <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle" data-toggle="dropdown">
                    <Translate id="react.default.actions.label" defaultMessage="Actions" />
                  </button>
                  <div className="dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={() => openModal('edit', entry)}>
                      <Translate id="react.stockCard.editItem.label" defaultMessage="Edit inventory item" />
                    </button>
                    {permissions.canAdjustInventory && (
                      <button type="button" className="dropdown-item" onClick={() => openModal('adjust', entry)}>
                        <Translate id="react.stockCard.adjustStock.label" defaultMessage="Adjust stock" />
                      </button>
                    )}
                    <button type="button" className="dropdown-item" onClick={() => openModal('transfer', entry)}>
                      <Translate id="react.stockCard.transferStock.label" defaultMessage="Transfer stock" />
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => openModal('return', entry)}>
                      <Translate id="react.stockCard.returnStock.label" defaultMessage="Return stock" />
                    </button>
                    <button type="button" className="dropdown-item" onClick={() => openModal('addToShipment', entry)}>
                      <Translate id="react.stockCard.addToShipment.label" defaultMessage="Add to shipment" />
                    </button>
                  </div>
                </div>
              </td>
              <td>{entry.binLocation?.name || <Translate id="react.default.default.label" defaultMessage="Default" />}</td>
              <td>{entry.inventoryItem?.lotNumber || ''}</td>
              <td>
                {entry.inventoryItem?.expirationDate
                  ? formatDate(entry.inventoryItem.expirationDate)
                  : <span className="text-muted"><Translate id="react.default.never.label" defaultMessage="Never" /></span>}
              </td>
              <td className="text-right">{entry.quantityOnHand}</td>
              <td className="text-right">{entry.quantityAvailable}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
        {data?.availableItems?.length > 0 && (
          <tfoot>
            <tr className="font-weight-bold">
              <td colSpan="4" className="text-right">
                <Translate id="react.stockCard.total.label" defaultMessage="Total" />
              </td>
              <td className="text-right">
                {data.totalQuantity}
                {' '}
                {unitOfMeasure}
              </td>
              <td className="text-right">
                {data.totalQuantityAvailableToPromise}
                {' '}
                {unitOfMeasure}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
      {modal?.type === 'edit' && (
        <EditItemModal
          entry={modal.item}
          details={details}
          onClose={closeModal}
          onSuccess={refresh}
        />
      )}
      {modal?.type === 'adjust' && (
        <AdjustStockModal
          entry={modal.item}
          details={details}
          onClose={closeModal}
          onSuccess={refresh}
        />
      )}
      {modal?.type === 'transfer' && (
        <TransferStockModal
          entry={modal.item}
          details={details}
          onClose={closeModal}
          onSuccess={refresh}
        />
      )}
      {modal?.type === 'return' && (
        <ReturnStockModal
          entry={modal.item}
          details={details}
          onClose={closeModal}
          onSuccess={refresh}
        />
      )}
      {modal?.type === 'addToShipment' && (
        <AddToShipmentModal
          entry={modal.item}
          details={details}
          onClose={closeModal}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

export default CurrentStockTab;

CurrentStockTab.propTypes = {
  productId: PropTypes.string.isRequired,
  details: PropTypes.shape({
    permissions: PropTypes.shape({}),
    product: PropTypes.shape({}),
  }),
  onRefresh: PropTypes.func.isRequired,
};

CurrentStockTab.defaultProps = {
  details: null,
};
