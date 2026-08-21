import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import { submitLegacyForm } from 'components/stock-card/legacyForm';
import EditItemModal from 'components/stock-card/modals/EditItemModal';
import { formatDate } from 'components/stock-card/utils';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

const LotNumbersPage = () => {
  useTranslation('stockCard', 'default');

  const params = useParams();
  const location = useLocation();
  const parsedQuery = queryString.parse(location.search);
  const productId = params.id || parsedQuery['product.id'];

  const isSuperuser = useSelector((state) => state.session.isSuperuser);
  const isUserManager = useSelector((state) => state.session.isUserManager);

  const [data, setData] = useState(null);
  const [editedItem, setEditedItem] = useState(null);
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    StockCardApi.getLotNumbers(productId)
      .then((response) => setData(response.data));
  };

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const runLegacyAction = async (action, id, successMessage) => {
    await apiClient.get(`${window.CONTEXT_PATH}/inventoryItem/${action}/${id}`);
    notification(NotificationType.SUCCESS)({ message: successMessage });
    fetchData();
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitLegacyForm('create', {
        'product.id': productId,
        lotNumber: newLotNumber,
        expirationDate: newExpirationDate ? formatDate(newExpirationDate) : '',
      });
      notification(NotificationType.SUCCESS)({ message: 'Inventory item created' });
      setNewLotNumber('');
      setNewExpirationDate('');
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="stock-card-page">
        <div className="d-flex justify-content-between align-items-center p-2">
          <h2>
            <Translate id="react.stockCard.editLotNumbers.label" defaultMessage="Edit lot numbers" />
            {data?.product && ` › ${data.product.productCode} ${data.product.displayName || data.product.name}`}
          </h2>
          <a className="btn btn-outline-secondary" href={INVENTORY_ITEM_URL.showStockCard(productId)}>
            <Translate id="react.stockCard.backToStockCard.label" defaultMessage="Back to stock card" />
          </a>
        </div>
        <div className="stock-card-table-container">
          <form onSubmit={handleCreate}>
            <table className="table table-sm stock-card-table">
              <thead>
                <tr>
                  <th aria-label="Actions" className="text-center"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                  <th aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
                  <th aria-label="Expires"><Translate id="react.stockCard.expires.label" defaultMessage="Expires" /></th>
                </tr>
              </thead>
              <tbody>
                {data?.inventoryItems?.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center">
                      <Translate
                        id="react.stockCard.noItemsCurrentlyInStock.message"
                        defaultMessage="There are no items currently in stock."
                      />
                    </td>
                  </tr>
                )}
                {data?.inventoryItems?.map((item) => (
                  <tr key={item.id} className={item.recalled ? 'recalled' : ''}>
                    <td className="text-center stock-card-row-actions">
                      <div className="dropdown">
                        <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle" data-toggle="dropdown">
                          <Translate id="react.default.actions.label" defaultMessage="Actions" />
                        </button>
                        <div className="dropdown-menu">
                          <button type="button" className="dropdown-item" onClick={() => setEditedItem(item)}>
                            <Translate id="react.stockCard.editItem.label" defaultMessage="Edit inventory item" />
                          </button>
                          {isSuperuser && (
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => runLegacyAction('delete', item.id, 'Inventory item deleted')}
                            >
                              <Translate id="react.stockCard.deleteItem.label" defaultMessage="Delete inventory item" />
                            </button>
                          )}
                          {isSuperuser && item.lotNumber && !item.recalled && (
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => runLegacyAction('recall', item.id, 'Lot recalled')}
                            >
                              <Translate id="react.stockCard.recallLot.label" defaultMessage="Recall Lot" />
                            </button>
                          )}
                          {isSuperuser && item.lotNumber && item.recalled && (
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => runLegacyAction('revertRecall', item.id, 'Recall reverted')}
                            >
                              <Translate id="react.stockCard.revertRecall.label" defaultMessage="Revert Recall" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{item.lotNumber || <Translate id="react.default.default.label" defaultMessage="Default" />}</td>
                    <td>
                      {item.expirationDate
                        ? formatDate(item.expirationDate)
                        : <span className="text-muted"><Translate id="react.default.never.label" defaultMessage="Never" /></span>}
                    </td>
                  </tr>
                ))}
                {isUserManager && (
                  <tr>
                    <td className="text-center" />
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter lot number"
                        value={newLotNumber}
                        onChange={(event) => setNewLotNumber(event.target.value)}
                      />
                    </td>
                    <td className="d-flex">
                      <input
                        type="date"
                        className="form-control mr-2"
                        value={newExpirationDate}
                        onChange={(event) => setNewExpirationDate(event.target.value)}
                      />
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        <Translate id="react.default.button.save.label" defaultMessage="Save" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </form>
        </div>
      </div>
      {editedItem && (
        <EditItemModal
          entry={{ inventoryItem: editedItem }}
          details={{ product: data?.product }}
          onClose={() => setEditedItem(null)}
          onSuccess={fetchData}
        />
      )}
    </PageWrapper>
  );
};

export default LotNumbersPage;
