import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_CONFIRM, REQUISITION_DETAILS } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import { useRequisitionSelectFetch } from './requisition-utils';
import RequisitionHeader from './RequisitionHeader';

const ConfirmRequisitionPage = ({ match }) => {
  const { debouncedPeopleFetch } = useRequisitionSelectFetch();
  const [requisition, setRequisition] = useState(null);
  const [checkedBy, setCheckedBy] = useState(null);
  const [dateChecked, setDateChecked] = useState('');
  const [saving, setSaving] = useState(false);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_CONFIRM(match.params.requisitionId))
      .then((response) => {
        const { data } = response.data;
        setRequisition(data);
        setDateChecked(data.dateChecked || '');
        setCheckedBy(data.checkedById
          ? { id: data.checkedById, value: data.checkedById, label: data.checkedByName }
          : null);
      });
  }, [match.params.requisitionId]);

  const saveDetails = () => {
    setSaving(true);
    apiClient.post(REQUISITION_DETAILS(requisition.id), {
      checkedById: checkedBy?.id || null,
      dateChecked: dateChecked || null,
    }).finally(() => setSaving(false));
  };

  if (!requisition) {
    return null;
  }

  return (
    <div className="d-flex flex-column list-page-main p-3">
      <RequisitionHeader requisition={requisition} currentStep="confirm" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.check.label" defaultMessage="Check requisition" />
        </h2>
        <table className="table table-sm w-auto">
          <tbody>
            <tr>
              <td className="name">
                <Translate id="react.requisition.checkedBy.label" defaultMessage="Checked by" />
              </td>
              <td className="value" style={{ minWidth: '300px' }}>
                <Select
                  id="checkedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={checkedBy}
                  onChange={setCheckedBy}
                />
              </td>
            </tr>
            <tr>
              <td className="name">
                <Translate id="react.requisition.dateChecked.label" defaultMessage="Date checked" />
              </td>
              <td className="value d-flex" style={{ gap: '0.5rem' }}>
                <input
                  id="dateChecked"
                  type="text"
                  className="form-control"
                  placeholder="MM/dd/yyyy"
                  value={dateChecked}
                  onChange={(event) => setDateChecked(event.target.value)}
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
              <th aria-label="Bin Location"><Translate id="react.requisition.binLocation.label" defaultMessage="Bin Location" /></th>
              <th aria-label="Lot Number"><Translate id="react.requisition.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
              <th aria-label="Requested" className="text-right"><Translate id="react.requisition.requested.label" defaultMessage="Requested" /></th>
              <th aria-label="Picked" className="text-right"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
              <th aria-label="Canceled" className="text-right"><Translate id="react.requisition.canceled.label" defaultMessage="Canceled" /></th>
              <th aria-label="Remaining" className="text-right"><Translate id="react.requisition.remaining.label" defaultMessage="Remaining" /></th>
              <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              <th aria-label="Reason code"><Translate id="react.requisition.reasonCode.label" defaultMessage="Reason code" /></th>
            </tr>
          </thead>
          <tbody>
            {(requisition.rows || []).map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={index} className={row.status === 'Canceled' ? 'text-muted' : ''}>
                <td>{index + 1}</td>
                <td>{row.status}</td>
                <td>
                  {row.isSubstitution && (
                    <div style={{ textDecoration: 'line-through' }}>
                      {row.requestedProductCode}
                      {' '}
                      {row.requestedProductName}
                    </div>
                  )}
                  {row.productCode}
                  {' '}
                  {row.productName}
                </td>
                <td>{row.binLocationName}</td>
                <td>{row.lotNumber}</td>
                <td className="text-right">{row.quantityRequested}</td>
                <td className="text-right">{row.quantityPicked}</td>
                <td className="text-right">{row.quantityCanceled}</td>
                <td className="text-right">{row.quantityRemaining}</td>
                <td>{row.unitOfMeasure}</td>
                <td>
                  {row.cancelReasonCode}
                  {row.cancelComments ? ` ${row.cancelComments}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.pick(requisition.id)}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <a className="btn btn-primary" href={REQUISITION_URL.transfer(requisition.id)}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </a>
        </div>
      </div>
    </div>
  );
};

ConfirmRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ConfirmRequisitionPage;
