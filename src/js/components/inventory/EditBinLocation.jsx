import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import { INVENTORY_ADJUST_STOCK, INVENTORY_EDIT_BIN_LOCATION } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const EditBinLocation = ({ history, location }) => {
  useTranslation('inventory', 'default');

  const query = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState([]);

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_EDIT_BIN_LOCATION, {
      params: {
        productCode: query.productCode,
        binLocation: query.binLocation,
        lotNumber: query.lotNumber,
      },
    }).then((response) => {
      setData(response.data);
      setNewQuantity(response.data?.quantity ?? '');
    });
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onCancel = () => {
    if (query.redirectUri) {
      window.location = query.redirectUri;
      return;
    }
    history.goBack();
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setErrors([]);
    const params = new URLSearchParams();
    params.append('product.id', data?.inventoryItem?.product?.id || '');
    params.append('location.id', data?.location?.id || '');
    params.append('binLocation.id', data?.binLocation?.id || '');
    params.append('inventoryItem.id', data?.inventoryItem?.id || '');
    params.append('currentQuantity', data?.quantity ?? '');
    params.append('newQuantity', newQuantity);
    params.append('reasonCode', reasonCode);
    params.append('comment', comment);
    apiClient.post(INVENTORY_ADJUST_STOCK, params)
      .then(() => {
        onCancel();
      })
      .catch((error) => {
        setErrors(error.response?.data?.errors || []);
      });
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.adjustStock.label" defaultMessage="Adjust stock" />
        </h2>
        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert" aria-label="error-message">
            <ul className="mb-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <table className="table table-sm">
            <tbody>
              <tr>
                <td>
                  <Translate id="react.inventory.product.label" defaultMessage="Product" />
                </td>
                <td>
                  {data?.inventoryItem?.product?.productCode}
                  {' '}
                  {data?.inventoryItem?.product?.name}
                </td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.binLocation.label" defaultMessage="Bin location" />
                </td>
                <td>{data?.binLocation?.name || <Translate id="react.default.label" defaultMessage="Default" />}</td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
                </td>
                <td>{data?.inventoryItem?.lotNumber}</td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.expirationDate.label" defaultMessage="Expiration date" />
                </td>
                <td>{data?.inventoryItem?.expirationDate}</td>
              </tr>
              <tr>
                <td>
                  <Translate id="react.inventory.currentQuantity.label" defaultMessage="Current quantity" />
                </td>
                <td>{data?.quantity}</td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="newQuantity">
                    <Translate id="react.inventory.newQuantity.label" defaultMessage="New quantity" />
                  </label>
                </td>
                <td>
                  <input
                    id="newQuantity"
                    name="newQuantity"
                    type="number"
                    className="form-control w-25"
                    value={newQuantity}
                    onChange={(event) => setNewQuantity(event.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="reasonCode">
                    <Translate id="react.inventory.reasonCode.label" defaultMessage="Reason code" />
                  </label>
                </td>
                <td>
                  <select
                    id="reasonCode"
                    name="reasonCode"
                    className="form-control w-50"
                    value={reasonCode}
                    onChange={(event) => setReasonCode(event.target.value)}
                  >
                    <option value="" aria-label="empty" />
                    {data?.reasonCodes?.map((code) => (
                      <option key={code.id} value={code.id}>{code.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="comment">
                    <Translate id="react.inventory.comment.label" defaultMessage="Comment" />
                  </label>
                </td>
                <td>
                  <textarea
                    id="comment"
                    name="comment"
                    className="form-control"
                    rows="2"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-primary btn-sm mr-2">
              <Translate id="react.default.button.save.label" defaultMessage="Save" />
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel}>
              <Translate id="react.default.button.cancel.label" defaultMessage="Cancel" />
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default withRouter(EditBinLocation);

EditBinLocation.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
