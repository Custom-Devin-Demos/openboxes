import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_DETAILS, REQUISITION_ITEM_UPDATE, REQUISITION_REVIEW } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import { useRequisitionSelectFetch } from './requisition-utils';
import RequisitionHeader from './RequisitionHeader';
import RequisitionItemEditRow from './RequisitionItemEditRow';

const getQuantityApproved = (item) => {
  if (item.isSubstituted) {
    return item.substitutionQuantityApproved;
  }
  if (item.isChanged) {
    return item.modificationQuantityApproved;
  }
  return item.quantityApproved;
};

const ReviewRequisitionPage = ({ match }) => {
  const { debouncedPeopleFetch } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [verifiedBy, setVerifiedBy] = useState(null);
  const [dateVerified, setDateVerified] = useState('');
  const [editedItemId, setEditedItemId] = useState(null);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  const fetchRequisition = useCallback(() => {
    apiClient.get(REQUISITION_REVIEW(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        setRequisition(data);
        setVerifiedBy(data.verifiedById
          ? { id: data.verifiedById, value: data.verifiedById, label: data.verifiedByName }
          : null);
        setDateVerified(data.dateVerifiedInput || '');
      });
  }, [match.params.requisitionId]);

  useEffect(() => {
    const flashError = window.sessionStorage.getItem('requisitionFlashError');
    if (flashError) {
      window.sessionStorage.removeItem('requisitionFlashError');
      setErrors([flashError]);
    }
    fetchRequisition();
  }, [fetchRequisition]);

  const saveDetails = () => {
    setSaving(true);
    apiClient.post(REQUISITION_DETAILS(requisition.id), {
      verifiedById: verifiedBy?.id || null,
      dateVerified: dateVerified || null,
    }).then(() => fetchRequisition())
      .finally(() => setSaving(false));
  };

  const updateItem = (itemId, payload) => {
    setErrors([]);
    setMessage(null);
    apiClient.post(REQUISITION_ITEM_UPDATE(requisition.id, itemId), payload)
      .then((response) => {
        if (response.data.success) {
          setMessage(response.data.message);
          setEditedItemId(null);
          fetchRequisition();
        } else {
          setErrors(response.data.errors || ['An error occurred while updating the requisition item']);
        }
      });
  };

  if (!requisition) {
    return null;
  }

  const quantityOnHandMap = requisition.quantityOnHandMap || {};

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {errors.length > 0 && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="alert">{message}</div>
      )}
      <RequisitionHeader requisition={requisition} currentStep="review" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.review.label" defaultMessage="Review requisition" />
        </h2>
        <table className="table table-sm w-auto">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.verifiedBy.label" defaultMessage="Verified by" />
              </td>
              <td className="value" style={{ minWidth: '300px' }}>
                <Select
                  id="verifiedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={verifiedBy}
                  onChange={setVerifiedBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.dateVerified.label" defaultMessage="Date verified" />
              </td>
              <td className="value d-flex" style={{ gap: '0.5rem' }}>
                <input
                  id="dateVerified"
                  type="text"
                  className="form-control"
                  placeholder="MM/dd/yyyy"
                  value={dateVerified}
                  onChange={(event) => setDateVerified(event.target.value)}
                />
                <button type="button" className="btn btn-primary" disabled={saving} onClick={saveDetails}>
                  <Translate id="react.default.button.save.label" defaultMessage="Save" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Row"> </th>
              <th aria-label="Status"><Translate id="react.requisition.status.label" defaultMessage="Status" /></th>
              <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
              <th aria-label="Requested" className="text-right"><Translate id="react.requisition.requested.label" defaultMessage="Requested" /></th>
              <th aria-label="Approved" className="text-right"><Translate id="react.requisition.approved.label" defaultMessage="Approved" /></th>
              <th aria-label="Quantity on hand" className="text-right"><Translate id="react.requisition.quantityOnHand.label" defaultMessage="Quantity on hand" /></th>
              <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              <th aria-label="Reason code"><Translate id="react.requisition.reasonCode.label" defaultMessage="Reason code" /></th>
              <th aria-label="Actions"> </th>
            </tr>
          </thead>
          <tbody>
            {(requisition.requisitionItems || []).map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={item.isCanceled ? 'text-muted' : ''}>
                  <td>{index + 1}</td>
                  <td>{item.statusLabel}</td>
                  <td>
                    <span style={item.isCanceled || item.isSubstituted ? { textDecoration: 'line-through' } : {}}>
                      {item.productCode}
                      {' '}
                      {item.productName}
                    </span>
                    {item.isSubstituted && (
                      <div>
                        {item.substitutionProductCode}
                        {' '}
                        {item.substitutionProductName}
                      </div>
                    )}
                  </td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{getQuantityApproved(item)}</td>
                  <td className="text-right">{quantityOnHandMap[item.productId] ?? 0}</td>
                  <td>{item.unitOfMeasure}</td>
                  <td>
                    {item.cancelReasonCode}
                    {item.cancelComments ? ` ${item.cancelComments}` : ''}
                  </td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                    {item.canEdit && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mr-1"
                        onClick={() => setEditedItemId(editedItemId === item.id ? null : item.id)}
                      >
                        <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                      </button>
                    )}
                    {item.canEdit && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success mr-1"
                        onClick={() => updateItem(item.id, { action: 'approveQuantity' })}
                      >
                        <Translate id="react.requisition.approve.label" defaultMessage="Approve" />
                      </button>
                    )}
                    {item.canUndoChanges && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => updateItem(item.id, { action: 'undoChanges' })}
                      >
                        <Translate id="react.default.button.undo.label" defaultMessage="Undo" />
                      </button>
                    )}
                  </td>
                </tr>
                {editedItemId === item.id && (
                  <RequisitionItemEditRow
                    requisitionId={requisition.id}
                    item={item}
                    reasonCodes={requisition.reasonCodes || []}
                    onSave={(payload) => updateItem(item.id, { action: 'save', ...payload })}
                    onCancel={(payload) => updateItem(item.id, { action: 'cancelQuantity', ...payload })}
                    onClose={() => setEditedItemId(null)}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.edit(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <a className="btn btn-primary" href={REQUISITION_URL.pick(requisition.id)}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </a>
        </div>
      </div>
    </div>
  );
};

ReviewRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ReviewRequisitionPage;
