import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { REQUISITION_ITEM_CHANGE } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import { debounceProductsFetch } from 'utils/option-utils';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import RequisitionHeader from './RequisitionHeader';

// Same values and ordering as the legacy requisitionItem/change.gsp reason code select
const REASON_CODES = [
  'Package size',
  'Stock out',
  'Substituted',
  'Damaged',
  'Expired',
  'Reserved',
  'Cancelled by requestor',
  'Clinical adjustment',
  'Other',
];

const TABS = [
  { id: 'change', label: 'react.requisitionItem.change.label', defaultMessage: 'Modify requisition item' },
  { id: 'substitution', label: 'react.requisitionItem.substitute.label', defaultMessage: 'Substitute another item' },
  { id: 'cancelation', label: 'react.requisitionItem.cancel.label', defaultMessage: 'Cancel this item' },
  { id: 'addition', label: 'react.requisitionItem.addition.label', defaultMessage: 'Add a supplemental item' },
];

const ChangeRequisitionItemPage = ({ match }) => {
  const {
    currentLocation, debounceTime, minSearchLength,
  } = useSelector((state) => ({
    currentLocation: state.session.currentLocation,
    debounceTime: state.session.searchConfig.debounceTime,
    minSearchLength: state.session.searchConfig.minSearchLength,
  }));
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('change');
  const [quantity, setQuantity] = useState('');
  const [productPackageId, setProductPackageId] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [substituteProduct, setSubstituteProduct] = useState(null);
  const [substituteQuantity, setSubstituteQuantity] = useState('');
  const [substituteReasonCode, setSubstituteReasonCode] = useState('');
  const [additionProduct, setAdditionProduct] = useState(null);
  const [additionQuantity, setAdditionQuantity] = useState('');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  const debouncedProductsFetch = debounceProductsFetch(
    debounceTime, minSearchLength, currentLocation?.id,
  );

  useEffect(() => {
    apiClient.get(REQUISITION_ITEM_CHANGE(match.params.itemId))
      .then((response) => {
        setData(response.data.data);
        const { item } = response.data.data;
        setQuantity(item.quantity ?? '');
        setProductPackageId(item.productPackageId || '');
        setReasonCode(item.cancelReasonCode || '');
        setSubstituteReasonCode(item.cancelReasonCode || '');
      });
  }, [match.params.itemId]);

  const saveQuantityChange = () => {
    setErrors([]);
    setSaving(true);
    apiClient.post(REQUISITION_ITEM_CHANGE(data.item.id), {
      quantity,
      productPackageId: productPackageId || null,
      reasonCode: reasonCode || null,
      comments: null,
    }).then((response) => {
      if (response.data.success) {
        window.location.assign(REQUISITION_URL.review(data.requisition.id));
      } else {
        setErrors(response.data.errors || ['An error occurred while changing the requisition item']);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  if (!data) {
    return null;
  }

  const { requisition, item } = data;
  const changes = item.changes || [];

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionHeader requisition={requisition} currentStep="review" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          {item.productCode}
          {' - '}
          {item.productName}
          {' '}
          (
          {item.productPackageLabel}
          )
        </h2>
        <div className="d-flex" style={{ gap: '1rem' }}>
          <div className="border rounded p-2">
            <div className="font-weight-bold">
              <Translate id="react.requisitionItem.quantityRequested.label" defaultMessage="Quantity requested" />
            </div>
            <div>
              {item.quantity}
              {' '}
              {item.unitOfMeasure}
            </div>
          </div>
          <div className="border rounded p-2">
            <div className="font-weight-bold">
              <Translate id="react.requisitionItem.quantityCanceled.label" defaultMessage="Quantity canceled" />
            </div>
            <div>
              {item.quantityCanceled}
              {' '}
              {item.unitOfMeasure}
              {item.cancelReasonCode ? ` ${item.cancelReasonCode}` : ''}
            </div>
          </div>
          <div className="border rounded p-2">
            <div className="font-weight-bold">
              <Translate id="react.requisition.quantityOnHand.label" defaultMessage="Quantity on hand" />
            </div>
            <div>
              {item.quantityOnHand}
              {' '}
              {item.unitOfMeasure}
            </div>
          </div>
        </div>
        <table className="table table-sm table-striped mt-3">
          <thead>
            <tr>
              <th aria-label="Product code"> </th>
              <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
              <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              <th aria-label="Quantity"><Translate id="react.requisition.quantity.label" defaultMessage="Quantity" /></th>
            </tr>
          </thead>
          <tbody>
            {changes.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  <Translate id="react.requisitionItem.noChanges.message" defaultMessage="No changes have been made to this requisition item" />
                </td>
              </tr>
            )}
            {changes.map((change, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index}>
                <td>{change.productCode}</td>
                <td>{change.productName}</td>
                <td>{change.unitOfMeasure}</td>
                <td>{change.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex mt-3" style={{ gap: '1rem' }}>
          <ul className="nav flex-column nav-pills" style={{ minWidth: '240px' }}>
            {TABS.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button
                  type="button"
                  className={`nav-link btn btn-link text-left w-100 ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Translate id={tab.label} defaultMessage={tab.defaultMessage} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex-grow-1">
            {activeTab === 'change' && (
              !item.quantityCanceled ? (
                <div>
                  <h3>
                    <Translate id="react.requisitionItem.changeQuantityOrPackageSize.label" defaultMessage="Change quantity or package size" />
                  </h3>
                  <div className="form-inline" style={{ gap: '0.5rem' }}>
                    <span>{item.productName}</span>
                    <select
                      id="productPackage"
                      className="form-control"
                      value={productPackageId}
                      onChange={(event) => setProductPackageId(event.target.value)}
                    >
                      <option value="">EA/1</option>
                      {(item.productPackages || []).map((productPackage) => (
                        <option key={productPackage.id} value={productPackage.id}>
                          {productPackage.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="quantity"
                      type="text"
                      className="form-control"
                      style={{ width: '100px' }}
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                    <select
                      id="reasonCode"
                      className="form-control"
                      value={reasonCode}
                      onChange={(event) => setReasonCode(event.target.value)}
                    >
                      <option value="" aria-label="No reason code" />
                      {REASON_CODES.map((code) => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary" disabled={saving} onClick={saveQuantityChange}>
                      <Translate id="react.default.button.save.label" defaultMessage="Save" />
                    </button>
                  </div>
                </div>
              ) : (
                <Translate id="react.requisition.requisitionItemHasBeenCanceled.message" defaultMessage="Requisition item has been canceled" />
              )
            )}
            {activeTab === 'substitution' && (
              !item.quantityCanceled ? (
                <div>
                  <h3>
                    <Translate id="react.requisitionItem.addSubstitution.label" defaultMessage="Add substitution" />
                  </h3>
                  <form method="post" action={`${REQUISITION_URL.base}/addSubstitution`}>
                    <input type="hidden" name="id" value={requisition.id} />
                    <input type="hidden" name="requisitionItem.id" value={item.id} />
                    <input type="hidden" name="product.id" value={substituteProduct?.id || ''} />
                    <div className="form-inline" style={{ gap: '0.5rem' }}>
                      <div style={{ minWidth: '300px' }}>
                        <Select
                          id="substituteProduct"
                          async
                          loadOptions={debouncedProductsFetch}
                          cache={false}
                          options={[]}
                          value={substituteProduct}
                          onChange={setSubstituteProduct}
                        />
                      </div>
                      <input
                        name="quantity"
                        type="text"
                        className="form-control"
                        style={{ width: '100px' }}
                        value={substituteQuantity}
                        onChange={(event) => setSubstituteQuantity(event.target.value)}
                      />
                      <select
                        name="requisitionItem.cancelReasonCode"
                        className="form-control"
                        value={substituteReasonCode}
                        onChange={(event) => setSubstituteReasonCode(event.target.value)}
                      >
                        <option value="" aria-label="No reason code" />
                        {REASON_CODES.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-primary">
                        <Translate id="react.default.button.save.label" defaultMessage="Save" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <Translate id="react.requisition.requisitionItemHasBeenCanceled.message" defaultMessage="Requisition item has been canceled" />
              )
            )}
            {activeTab === 'cancelation' && (
              <div />
            )}
            {activeTab === 'addition' && (
              <div>
                <h3>
                  <Translate id="react.requisitionItem.addAddition.label" defaultMessage="Add supplemental item" />
                </h3>
                <form method="post" action={`${REQUISITION_URL.base}/addAddition`}>
                  <input type="hidden" name="id" value={requisition.id} />
                  <input type="hidden" name="requisitionItem.id" value={item.id} />
                  <input type="hidden" name="product.id" value={additionProduct?.id || ''} />
                  <div className="form-inline" style={{ gap: '0.5rem' }}>
                    <div style={{ minWidth: '300px' }}>
                      <Select
                        id="additionProduct"
                        async
                        loadOptions={debouncedProductsFetch}
                        cache={false}
                        options={[]}
                        value={additionProduct}
                        onChange={setAdditionProduct}
                      />
                    </div>
                    <input
                      name="quantity"
                      type="text"
                      className="form-control"
                      style={{ width: '100px' }}
                      value={additionQuantity}
                      onChange={(event) => setAdditionQuantity(event.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      <Translate id="react.default.button.save.label" defaultMessage="Save" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-center mt-3">
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.review(requisition.id)}>
            <Translate id="react.requisition.backToItems.label" defaultMessage="Back to requisition items" />
          </a>
        </div>
      </div>
    </div>
  );
};

ChangeRequisitionItemPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      itemId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ChangeRequisitionItemPage;
