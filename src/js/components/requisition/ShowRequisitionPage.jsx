import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_SHOW } from 'api/urls';
import { INVENTORY_ITEM_URL, REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import RequisitionHeader from './RequisitionHeader';

const canceledStyle = { textDecoration: 'line-through' };

const tagClassName = (statusTagClass) => {
  if (statusTagClass === 'tag-danger') {
    return 'badge badge-danger';
  }
  if (statusTagClass === 'tag-warning') {
    return 'badge badge-warning';
  }
  return 'badge badge-info';
};

const ShowRequisitionPage = ({ match }) => {
  const [requisition, setRequisition] = useState(null);
  const [message, setMessage] = useState(null);

  useTranslation('requisition');

  useEffect(() => {
    const flashMessage = window.sessionStorage.getItem('requisitionFlashMessage');
    if (flashMessage) {
      window.sessionStorage.removeItem('requisitionFlashMessage');
      setMessage(flashMessage);
    }
    apiClient.get(REQUISITION_SHOW(match.params.requisitionId))
      .then((response) => setRequisition(response.data.data));
  }, [match.params.requisitionId]);

  if (!requisition) {
    return null;
  }

  const items = requisition.showItems || [];

  return (
    <div className="d-flex flex-column list-page-main p-3">
      {message && (
        <div className="alert alert-success" role="alert">{message}</div>
      )}
      <RequisitionHeader requisition={requisition} currentStep="show" />
      <div className="box p-3 border rounded bg-white">
        <h2>
          <Translate id="react.requisition.show.label" defaultMessage="Requisition items" />
        </h2>
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th aria-label="Row"> </th>
              <th aria-label="Status"><Translate id="react.requisition.status.label" defaultMessage="Status" /></th>
              <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
              <th aria-label="UOM" className="text-center"><Translate id="react.requisition.uom.label" defaultMessage="UOM" /></th>
              <th aria-label="Requested" className="text-center"><Translate id="react.requisition.requested.label" defaultMessage="Requested" /></th>
              <th aria-label="Approved" className="text-center"><Translate id="react.requisition.approved.label" defaultMessage="Approved" /></th>
              <th aria-label="Picked" className="text-center"><Translate id="react.requisition.picked.label" defaultMessage="Picked" /></th>
              <th aria-label="Remaining" className="text-center"><Translate id="react.requisition.remaining.label" defaultMessage="Remaining" /></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center text-muted">
                  <Translate id="react.requisition.noRequisitionItems.message" defaultMessage="There are no requisition items" />
                </td>
              </tr>
            )}
            {items.map((item, index) => (
              <tr key={item.id} className={item.isCanceled ? 'text-muted' : ''}>
                <td className="text-center">{index + 1}</td>
                <td>
                  <span className={tagClassName(item.statusTagClass)}>{item.statusLabel}</span>
                </td>
                <td>
                  <div style={item.isCanceled || item.isSubstituted ? canceledStyle : {}}>
                    <a href={INVENTORY_ITEM_URL.showStockCard(item.productId)}>
                      {item.productCode}
                      {' '}
                      {item.productName}
                    </a>
                  </div>
                  {item.isSubstituted && (item.substitutionItems || []).map((substitutionItem) => (
                    <div key={`${item.id}-${substitutionItem.productId}`}>
                      <a href={INVENTORY_ITEM_URL.showStockCard(substitutionItem.productId)}>
                        {substitutionItem.productCode}
                        {' '}
                        {substitutionItem.productName}
                      </a>
                    </div>
                  ))}
                </td>
                <td className="text-center">{item.unitOfMeasure}</td>
                <td className="text-center">
                  {item.isSubstituted && !item.substitutionQuantitiesMatch ? (
                    <>
                      <div style={canceledStyle}>{item.quantity}</div>
                      {(item.substitutionItems || []).map((substitutionItem) => (
                        <div key={`${item.id}-qty-${substitutionItem.productId}`}>
                          {substitutionItem.quantity}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={item.isCanceled ? canceledStyle : {}}>{item.quantity}</div>
                  )}
                </td>
                <td className="text-center">
                  <div style={item.isCanceled ? canceledStyle : {}}>{item.quantityApproved}</div>
                </td>
                <td className="text-center">
                  <div style={item.isCanceled ? canceledStyle : {}}>{item.quantityPicked}</div>
                </td>
                <td className="text-center">
                  <div style={item.isCanceled ? canceledStyle : {}}>{item.quantityRemaining}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_URL.list()}>
            <Translate id="react.default.button.back.label" defaultMessage="Back" />
          </a>
          <a className="btn btn-primary" href={REQUISITION_URL.edit(requisition.id)}>
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </a>
        </div>
      </div>
    </div>
  );
};

ShowRequisitionPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      requisitionId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ShowRequisitionPage;
