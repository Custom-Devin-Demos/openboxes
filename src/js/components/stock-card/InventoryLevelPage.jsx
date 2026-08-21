import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

const InventoryLevelPage = () => {
  useTranslation('stockCard', 'default');

  const location = useLocation();
  const history = useHistory();
  const parsedQuery = queryString.parse(location.search);
  const productId = parsedQuery['product.id'];
  const inventoryId = parsedQuery['inventory.id'];

  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }
    StockCardApi.getInventoryLevel({
      params: { 'product.id': productId, 'inventory.id': inventoryId },
    })
      .then((response) => {
        setData(response.data);
        setStatus(response.data.inventoryLevel?.status || '');
      });
  }, [productId, inventoryId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    try {
      const body = new URLSearchParams();
      body.append('id', data?.inventoryLevel?.id || '');
      body.append('inventory.id', data?.inventory?.id || '');
      body.append('product.id', productId);
      body.append('status', status);
      const response = await StockCardApi.updateInventoryLevel(body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      notification(NotificationType.SUCCESS)({ message: response.data.message });
      history.push(`${window.CONTEXT_PATH}/inventoryItem/showStockCard/${productId}`);
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to update inventory level']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="stock-card-page">
        <div className="p-3">
          <h1>
            {data?.product && `${data.product.productCode} ${data.product.displayName || data.product.name}`}
          </h1>
          {errors.length > 0 && (
            <div className="alert alert-danger">
              <ul className="m-0">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <table className="table table-sm stock-card-table">
              <tbody>
                <tr>
                  <td><Translate id="react.stockCard.inventory.label" defaultMessage="Inventory" /></td>
                  <td>{data?.inventory?.name}</td>
                </tr>
                <tr>
                  <td><Translate id="react.stockCard.product.label" defaultMessage="Product" /></td>
                  <td>
                    {data?.product && `${data.product.productCode} ${data.product.displayName || data.product.name}`}
                  </td>
                </tr>
                <tr>
                  <td><Translate id="react.stockCard.status.label" defaultMessage="Status" /></td>
                  <td>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      <option value="">
                        Choose status
                      </option>
                      {data?.statusOptions?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td />
                  <td>
                    <button type="submit" className="btn btn-primary mr-2" disabled={submitting}>
                      <Translate id="react.default.button.save.label" defaultMessage="Save" />
                    </button>
                    <a className="btn btn-outline-danger" href={INVENTORY_ITEM_URL.showStockCard(productId)}>
                      <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default InventoryLevelPage;
