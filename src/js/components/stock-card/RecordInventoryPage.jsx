import React, { useEffect, useState } from 'react';

import moment from 'moment';
import queryString from 'query-string';
import { useSelector } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import notification from 'components/Layout/notifications/notification';
import { formatDate } from 'components/stock-card/utils';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

const RecordInventoryPage = () => {
  useTranslation('stockCard', 'default');

  const params = useParams();
  const location = useLocation();
  const history = useHistory();
  const parsedQuery = queryString.parse(location.search);
  const productId = params.id || parsedQuery['product.id'];

  const currentLocation = useSelector((state) => state.session.currentLocation);
  const user = useSelector((state) => state.session.user);

  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [binLocations, setBinLocations] = useState([]);
  const [transactionDate, setTransactionDate] = useState(moment().format('YYYY-MM-DDTHH:mm'));
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }
    StockCardApi.getRecordInventory({ params: { 'product.id': productId } })
      .then((response) => {
        setData(response.data);
        const existingRows = (response.data.recordInventoryRows || []).map((row) => ({
          id: row.id,
          lotNumber: row.lotNumber || '',
          binLocationId: row.binLocation?.id || '',
          binLocationName: row.binLocation?.name || '',
          expirationDate: row.expirationDate ? moment(row.expirationDate).format('YYYY-MM-DD') : '',
          oldQuantity: row.oldQuantity || 0,
          newQuantity: row.newQuantity ?? row.oldQuantity ?? 0,
          comment: row.comment || '',
          existing: Boolean(row.oldQuantity),
        }));
        setRows(existingRows.length ? existingRows : [{
          id: '', lotNumber: '', binLocationId: '', binLocationName: '', expirationDate: '', oldQuantity: 0, newQuantity: 0, comment: '', existing: false,
        }]);
      });
    StockCardApi.getBinLocations()
      .then((response) => setBinLocations(response.data.binLocations || []));
  }, [productId]);

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, {
      id: '', lotNumber: '', binLocationId: '', binLocationName: '', expirationDate: '', oldQuantity: 0, newQuantity: 0, comment: '', existing: false,
    }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const body = new URLSearchParams();
      body.append('product.id', productId);
      body.append('inventory.id', data?.inventory?.id || '');
      body.append('comment', comment);
      const parsedDate = moment(transactionDate);
      body.append('transactionDate', 'date.struct');
      body.append('transactionDate_year', parsedDate.format('YYYY'));
      body.append('transactionDate_month', parsedDate.format('M'));
      body.append('transactionDate_day', parsedDate.format('D'));
      body.append('transactionDate_hour', parsedDate.format('H'));
      body.append('transactionDate_minute', parsedDate.format('m'));
      rows.forEach((row, index) => {
        body.append(`recordInventoryRows[${index}].id`, row.id || '');
        body.append(`recordInventoryRows[${index}].binLocation.id`, row.binLocationId || '');
        body.append(`recordInventoryRows[${index}].lotNumber`, row.lotNumber || '');
        body.append(`recordInventoryRows[${index}].expirationDate`, row.expirationDate ? moment(row.expirationDate).format('MM/DD/YYYY') : '');
        body.append(`recordInventoryRows[${index}].oldQuantity`, row.oldQuantity ?? '');
        body.append(`recordInventoryRows[${index}].newQuantity`, row.newQuantity ?? '');
        body.append(`recordInventoryRows[${index}].comment`, row.comment || '');
      });
      const response = await apiClient.post(`${window.CONTEXT_PATH}/inventoryItem/saveRecordInventory`, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const finalUrl = response?.request?.responseURL || '';
      if (finalUrl.includes('/inventoryItem/showStockCard')) {
        notification(NotificationType.SUCCESS)({ message: 'Inventory recorded' });
        history.push(`${window.CONTEXT_PATH}/inventoryItem/showStockCard/${productId}`);
      } else {
        notification(NotificationType.ERROR)({
          message: 'Unable to record inventory. Please check lot numbers, expiration dates, and quantities.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="stock-card-page">
        <form onSubmit={handleSubmit}>
          <div className="box p-3">
            <h2><Translate id="react.stockCard.recordStock.label" defaultMessage="Record Stock" /></h2>
            <table className="table table-sm stock-card-table">
              <tbody>
                <tr>
                  <td><Translate id="react.stockCard.product.label" defaultMessage="Product" /></td>
                  <td>
                    {data?.product && `${data.product.productCode} ${data.product.displayName || data.product.name}`}
                  </td>
                </tr>
                <tr>
                  <td><Translate id="react.stockCard.location.label" defaultMessage="Location" /></td>
                  <td>{currentLocation?.name}</td>
                </tr>
                <tr>
                  <td><Translate id="react.stockCard.createdBy.label" defaultMessage="Created by" /></td>
                  <td>{user?.name}</td>
                </tr>
                <tr>
                  <td><Translate id="react.stockCard.transactionDate.label" defaultMessage="Transaction date" /></td>
                  <td>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={transactionDate}
                      onChange={(event) => setTransactionDate(event.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td><Translate id="react.default.comments.label" defaultMessage="Comments" /></td>
                  <td>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="box p-3">
            <h2><Translate id="react.stockCard.lineItems.label" defaultMessage="Line Items" /></h2>
            <table className="table table-sm stock-card-table">
              <thead>
                <tr>
                  <th aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></th>
                  <th aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
                  <th aria-label="Expires"><Translate id="react.stockCard.expires.label" defaultMessage="Expires" /></th>
                  <th aria-label="Previous Quantity" className="text-center"><Translate id="react.stockCard.oldQuantity.label" defaultMessage="Previous Quantity" /></th>
                  <th aria-label="New Quantity" className="text-center"><Translate id="react.stockCard.newQuantity.label" defaultMessage="New Quantity" /></th>
                  <th aria-label="Comments" className="text-center"><Translate id="react.default.comments.label" defaultMessage="Comments" /></th>
                  <th aria-label="Actions" className="text-center"><Translate id="react.default.actions.label" defaultMessage="Actions" /></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={index}>
                    <td>
                      {row.existing ? (row.binLocationName || '') : (
                        <select
                          className="form-control"
                          value={row.binLocationId}
                          onChange={(event) => updateRow(index, 'binLocationId', event.target.value)}
                        >
                          <option value="" aria-label="None" />
                          {binLocations.map((bin) => (
                            <option key={bin.id} value={bin.id}>{bin.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {row.existing ? (row.lotNumber || '') : (
                        <input
                          type="text"
                          className="form-control"
                          value={row.lotNumber}
                          onChange={(event) => updateRow(index, 'lotNumber', event.target.value)}
                        />
                      )}
                    </td>
                    <td>
                      {!row.existing && (
                        <input
                          type="date"
                          className="form-control"
                          value={row.expirationDate}
                          onChange={(event) => updateRow(index, 'expirationDate', event.target.value)}
                        />
                      )}
                      {row.existing && row.expirationDate && formatDate(row.expirationDate)}
                      {row.existing && !row.expirationDate && (
                        <span className="text-muted"><Translate id="react.default.never.label" defaultMessage="Never" /></span>
                      )}
                    </td>
                    <td className="text-center align-middle">{row.oldQuantity}</td>
                    <td className="text-center">
                      <input
                        type="number"
                        className="form-control text-center"
                        value={row.newQuantity}
                        onChange={(event) => updateRow(index, 'newQuantity', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={row.comment}
                        onChange={(event) => updateRow(index, 'comment', event.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      {!row.existing && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(index)}>
                          <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="7">
                    <button type="button" className="btn btn-outline-primary" onClick={addRow}>
                      <Translate id="react.stockCard.addInventoryItem.label" defaultMessage="Add another inventory item" />
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan="7">
                    <button type="submit" className="btn btn-primary mr-2" disabled={submitting}>
                      <Translate id="react.default.button.save.label" defaultMessage="Save" />
                    </button>
                    <a className="btn btn-outline-danger" href={INVENTORY_ITEM_URL.showStockCard(productId)}>
                      <Translate id="react.default.button.discard.label" defaultMessage="Discard" />
                    </a>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default RecordInventoryPage;
