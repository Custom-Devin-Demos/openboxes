import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_API, REQUISITION_TEMPLATE_BY_ID } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import {
  COMMODITY_CLASSES,
  REQUISITION_TYPE_LABELS,
  useRequisitionSelectFetch,
} from './requisition-utils';

const formatDate = (date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

const CreateStockRequisitionPage = ({ history, match }) => {
  const { currentLocation, user, debouncedPeopleFetch } = useRequisitionSelectFetch();

  const [template, setTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [requestedBy, setRequestedBy] = useState(null);
  const [dateRequested, setDateRequested] = useState(formatDate(new Date()));
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_TEMPLATE_BY_ID(match.params.templateId))
      .then((response) => {
        setTemplate(response.data.data);
        setItems(response.data.data.requisitionItems.map((item) => ({
          ...item,
          maxQuantity: item.quantity,
        })));
      });
  }, [match.params.templateId]);

  const updateItemQuantity = (index, quantity) => {
    setItems(items.map((item, itemIndex) =>
      (itemIndex === index ? { ...item, quantity } : item)));
  };

  const save = () => {
    setSaving(true);
    apiClient.post(REQUISITION_API, {
      status: 'CREATED',
      type: template?.type,
      originId: currentLocation?.id,
      destinationId: template?.destinationId,
      commodityClass: template?.commodityClass || null,
      requestedById: requestedBy?.id || null,
      createdById: user?.id,
      dateRequested,
      description: description || null,
      requisitionItems: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        productPackageId: item.productPackageId,
        orderIndex: item.orderIndex,
      })),
    }).then((response) => {
      if (response.data.success) {
        history.push(REQUISITION_URL.edit(response.data.data.id));
      } else {
        setErrors(response.data.errors || []);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  const commodityClassLabel = COMMODITY_CLASSES
    .find((commodityClass) => commodityClass.value === template?.commodityClass)?.label
    || template?.commodityClass;

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.details.label" defaultMessage="Requisition details" />
        </h2>
        <table className="table table-sm mt-3">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.requisitionType.label" defaultMessage="Requisition type" />
              </td>
              <td className="value">
                {REQUISITION_TYPE_LABELS[template?.type] || template?.type || ''}
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.origin.label" defaultMessage="Origin" />
              </td>
              <td className="value">{currentLocation?.name}</td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.destination.label" defaultMessage="Destination" />
              </td>
              <td className="value">{template?.destinationName}</td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.commodityClass.label" defaultMessage="Commodity class" />
              </td>
              <td className="value">{commodityClassLabel}</td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" />
              </td>
              <td className="value">
                <Select
                  id="requestedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={requestedBy}
                  onChange={setRequestedBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.dateRequested.label" defaultMessage="Date requested" />
              </td>
              <td className="value">
                <input
                  id="dateRequested"
                  type="text"
                  className="form-control"
                  placeholder="MM/dd/yyyy"
                  value={dateRequested}
                  onChange={(event) => setDateRequested(event.target.value)}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.createdBy.label" defaultMessage="Created by" />
              </td>
              <td className="value">{user?.name}</td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.description.label" defaultMessage="Comments" />
              </td>
              <td className="value">
                <textarea
                  id="description"
                  className="form-control"
                  rows="2"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <h3>
          <Translate id="react.requisition.requisitionItems.label" defaultMessage="Requisition items" />
        </h3>
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Code"><Translate id="react.requisition.productCode.label" defaultMessage="Code" /></th>
              <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
              <th aria-label="Max quantity"><Translate id="react.requisition.maxQuantity.label" defaultMessage="Max quantity" /></th>
              <th aria-label="Quantity"><Translate id="react.requisition.quantity.label" defaultMessage="Quantity" /></th>
              <th aria-label="Package"><Translate id="react.requisition.productPackage.label" defaultMessage="UOM" /></th>
              <th aria-label="Sort order"><Translate id="react.requisition.orderIndex.label" defaultMessage="Sort order" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.productId}>
                <td>{item.productCode}</td>
                <td>{item.productName}</td>
                <td>{item.maxQuantity}</td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    size="5"
                    value={item.quantity ?? ''}
                    onChange={(event) => updateItemQuantity(index, event.target.value.replace(/[^\d]/g, ''))}
                  />
                </td>
                <td>{item.productPackageName || 'EA/1'}</td>
                <td>{item.orderIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.chooseTemplate()}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </button>
        </div>
      </div>
    </div>
  );
};

CreateStockRequisitionPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default CreateStockRequisitionPage;
