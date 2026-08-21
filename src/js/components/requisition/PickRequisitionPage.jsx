import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_DETAILS, REQUISITION_PICK } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import PicklistItemsRow from './PicklistItemsRow';
import { useRequisitionSelectFetch } from './requisition-utils';
import RequisitionHeader from './RequisitionHeader';

const PickRequisitionPage = ({ match }) => {
  const { debouncedPeopleFetch } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [verifiedByMissing, setVerifiedByMissing] = useState(null);
  const [picker, setPicker] = useState(null);
  const [datePicked, setDatePicked] = useState('');
  const [pickedItemId, setPickedItemId] = useState(null);
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  const fetchRequisition = useCallback(() => {
    apiClient.get(REQUISITION_PICK(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        if (data.verifiedByMissing) {
          setVerifiedByMissing(data.message);
          return;
        }
        setRequisition(data);
        setPicker(data.pickerId
          ? { id: data.pickerId, value: data.pickerId, label: data.pickerName }
          : null);
        setDatePicked(data.datePicked || '');
      });
  }, [match.params.requisitionId]);

  useEffect(() => {
    fetchRequisition();
  }, [fetchRequisition]);

  useEffect(() => {
    if (verifiedByMissing !== null) {
      window.sessionStorage.setItem('requisitionFlashError', verifiedByMissing);
      window.location.assign(REQUISITION_URL.review(match.params.requisitionId));
    }
  }, [verifiedByMissing, match.params.requisitionId]);

  const saveDetails = () => {
    setSaving(true);
    apiClient.post(REQUISITION_DETAILS(requisition.id), {
      pickerId: picker?.id || null,
      datePicked: datePicked || null,
    }).then(() => fetchRequisition())
      .finally(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

  return (
    <div className="d-flex flex-column list-page-main p-3">
      <RequisitionHeader requisition={requisition} currentStep="pick" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.pick.label" defaultMessage="Pick requisition items" />
        </h2>
        <table className="table table-sm w-auto">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.pickedBy.label" defaultMessage="Picked by" />
              </td>
              <td className="value" style={{ minWidth: '300px' }}>
                <Select
                  id="picker"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={picker}
                  onChange={setPicker}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.datePicked.label" defaultMessage="Date picked" />
              </td>
              <td className="value d-flex" style={{ gap: '0.5rem' }}>
                <input
                  id="datePicked"
                  type="text"
                  className="form-control"
                  placeholder="MM/dd/yyyy"
                  value={datePicked}
                  onChange={(event) => setDatePicked(event.target.value)}
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
              <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              <th aria-label="Requested" className="text-right"><Translate id="react.requisition.requested.label" defaultMessage="Requested" /></th>
              <th aria-label="Picked" className="text-right"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
              <th aria-label="Remaining" className="text-right"><Translate id="react.requisition.remaining.label" defaultMessage="Remaining" /></th>
              <th aria-label="Actions"> </th>
            </tr>
          </thead>
          <tbody>
            {(requisition.requisitionItems || []).map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={item.isCanceled ? 'text-muted' : ''}>
                  <td>{index + 1}</td>
                  <td>{item.statusLabel}</td>
                  <td>{item.productName}</td>
                  <td>{item.unitOfMeasure || 'EA'}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.quantityPicked}</td>
                  <td className="text-right">{item.quantityRemaining}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setPickedItemId(pickedItemId === item.id ? null : item.id)}
                    >
                      <Translate id="react.requisition.pick.button.label" defaultMessage="Pick" />
                    </button>
                  </td>
                </tr>
                {pickedItemId === item.id && (
                  <PicklistItemsRow
                    requisitionId={requisition.id}
                    requisitionItemId={item.id}
                    onSaved={() => {
                      setPickedItemId(null);
                      fetchRequisition();
                    }}
                    onClose={() => setPickedItemId(null)}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.review(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <a className="btn btn-primary" href={REQUISITION_URL.picked(requisition.id)}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </a>
        </div>
      </div>
    </div>
  );
};

PickRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default PickRequisitionPage;
