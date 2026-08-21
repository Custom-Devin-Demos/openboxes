import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_PRINT_DRAFT } from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const PrintDraftRequisitionPage = ({ match }) => {
  const [data, setData] = useState(null);

  useTranslation('requisition');

  useEffect(() => {
    apiClient.get(REQUISITION_PRINT_DRAFT(match.params.requisitionId))
      .then((response) => setData(response.data.data));
  }, [match.params.requisitionId]);

  useEffect(() => {
    if (data) {
      window.print();
    }
  }, [data]);

  if (!data) {
    return null;
  }

  return (
    <div className="p-4 bg-white">
      <div className="d-flex justify-content-between">
        <div>
          <h1>{data.name}</h1>
          <div>
            <Translate id="react.requisition.origin.label" defaultMessage="Origin" />
            {': '}
            {data.originName}
          </div>
          <div>
            <Translate id="react.requisition.dateRequested.label" defaultMessage="Date requested" />
            {': '}
            {data.dateRequested}
          </div>
          <div>
            <Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" />
            {': '}
            {data.requestedByName}
          </div>
        </div>
        <div className="text-right">
          <h2>{data.requestNumber}</h2>
        </div>
      </div>
      <table className="table table-sm table-bordered mt-3">
        <thead>
          <tr>
            <th aria-label="Row">#</th>
            <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
            <th aria-label="Serial / Lot Number"><Translate id="react.requisition.lotNumber.label" defaultMessage="Serial / Lot Number" /></th>
            <th aria-label="Expiration date"><Translate id="react.requisition.expirationDate.label" defaultMessage="Expiration date" /></th>
            <th aria-label="Requested" className="text-right"><Translate id="react.requisition.requested.label" defaultMessage="Requested" /></th>
            <th aria-label="UOM"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
            <th aria-label="Bin Location"><Translate id="react.requisition.binLocation.label" defaultMessage="Bin Location" /></th>
            <th aria-label="Picked" className="text-right"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
          </tr>
        </thead>
        <tbody>
          {(data.rows || []).map((row, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={index}>
              <td>{row.rowNumber}</td>
              <td>
                {row.productCode}
                {' '}
                {row.productName}
              </td>
              <td>{row.lotNumber}</td>
              <td>{row.expirationDate}</td>
              <td className="text-right">{row.quantityRequested}</td>
              <td>{row.unitOfMeasure}</td>
              <td>{row.binLocation}</td>
              <td className="text-right">{row.quantityPicked}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex justify-content-between mt-5">
        <div>
          <Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" />
          : ________________________
        </div>
        <div>
          <Translate id="react.requisition.pickedBy.label" defaultMessage="Picked by" />
          : ________________________
        </div>
        <div>
          <Translate id="react.requisition.checkedBy.label" defaultMessage="Checked by" />
          : ________________________
        </div>
      </div>
    </div>
  );
};

PrintDraftRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default PrintDraftRequisitionPage;
