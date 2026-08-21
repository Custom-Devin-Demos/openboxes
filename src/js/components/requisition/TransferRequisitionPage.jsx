import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_COMPLETE, REQUISITION_TRANSFER } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import { useRequisitionSelectFetch } from './requisition-utils';
import RequisitionHeader from './RequisitionHeader';

const TransferRequisitionPage = ({ match }) => {
  const { debouncedPeopleFetch } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [issuedBy, setIssuedBy] = useState(null);
  const [deliveredBy, setDeliveredBy] = useState(null);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_TRANSFER(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        setRequisition(data);
        setIssuedBy(data.issuedByDefaultId
          ? {
            id: data.issuedByDefaultId,
            value: data.issuedByDefaultId,
            label: data.issuedByDefaultName,
          }
          : null);
        setDeliveredBy(data.deliveredByDefaultId
          ? {
            id: data.deliveredByDefaultId,
            value: data.deliveredByDefaultId,
            label: data.deliveredByDefaultName,
          }
          : null);
      });
  }, [match.params.requisitionId]);

  const finish = () => {
    setErrors([]);
    setSaving(true);
    apiClient.post(REQUISITION_COMPLETE(requisition.id), {
      issuedById: issuedBy?.id || null,
      deliveredById: deliveredBy?.id || null,
      comments: comments || null,
    }).then((response) => {
      if (response.data.success) {
        window.sessionStorage.setItem('requisitionFlashMessage', response.data.message);
        window.location.assign(REQUISITION_URL.show(requisition.id));
      } else {
        setErrors(response.data.errors || ['An error occurred while issuing the requisition']);
        setSaving(false);
      }
    }).catch(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

  const picklistItems = requisition.picklistItems || [];

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <RequisitionHeader requisition={requisition} currentStep="transfer" />
      {requisition.isCompleted && (
        <div className="alert alert-warning" role="alert">
          <Translate id="react.requisition.hasAlreadyBeenCompleted.message" defaultMessage="This requisition has already been issued." />
        </div>
      )}
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.issue.label" defaultMessage="Issue requisition" />
        </h2>
        <table className="table table-sm w-auto">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.issuedBy.label" defaultMessage="Issued by" />
              </td>
              <td className="value" style={{ minWidth: '300px' }}>
                <Select
                  id="issuedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={issuedBy}
                  onChange={setIssuedBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.deliveredBy.label" defaultMessage="Delivered by" />
              </td>
              <td className="value" style={{ minWidth: '300px' }}>
                <Select
                  id="deliveredBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={deliveredBy}
                  onChange={setDeliveredBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.comments.label" defaultMessage="Comments" />
              </td>
              <td className="value">
                <textarea
                  id="comments"
                  className="form-control"
                  cols="80"
                  rows="6"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Row"> </th>
              <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
              <th aria-label="Bin location"><Translate id="react.requisition.binLocation.label" defaultMessage="Bin location" /></th>
              <th aria-label="Lot number"><Translate id="react.requisition.lotNumber.label" defaultMessage="Lot number" /></th>
              <th aria-label="Quantity"><Translate id="react.requisition.quantity.label" defaultMessage="Quantity" /></th>
              <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
            </tr>
          </thead>
          <tbody>
            {picklistItems.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  <Translate id="react.requisition.picklistItems.empty.label" defaultMessage="Picklist is empty" />
                </td>
              </tr>
            )}
            {picklistItems.map((picklistItem, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  {picklistItem.productCode}
                  {' '}
                  {picklistItem.productName}
                </td>
                <td>{picklistItem.binLocationName}</td>
                <td>{picklistItem.lotNumber}</td>
                <td>{picklistItem.quantity}</td>
                <td>{picklistItem.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.confirm(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          {!requisition.isCompleted && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={finish}>
              <Translate id="react.default.button.finish.label" defaultMessage="Finish" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

TransferRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default TransferRequisitionPage;
