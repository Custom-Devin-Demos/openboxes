import React from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const HeaderRow = ({ label, defaultMessage, children }) => (
  <tr>
    <td className="name pr-2 text-muted">
      <Translate id={label} defaultMessage={defaultMessage} />
    </td>
    <td className="value">{children}</td>
  </tr>
);

HeaderRow.propTypes = {
  label: PropTypes.string.isRequired,
  defaultMessage: PropTypes.string.isRequired,
  children: PropTypes.node,
};

HeaderRow.defaultProps = {
  children: null,
};

const workflowSteps = [
  { action: 'show', label: 'react.requisition.workflow.show.label', defaultMessage: 'View' },
  { action: 'edit', label: 'react.requisition.workflow.edit.label', defaultMessage: 'Edit' },
  { action: 'review', label: 'react.requisition.workflow.review.label', defaultMessage: 'Review' },
  { action: 'pick', label: 'react.requisition.workflow.pick.label', defaultMessage: 'Pick' },
  { action: 'confirm', label: 'react.requisition.workflow.confirm.label', defaultMessage: 'Confirm' },
  { action: 'transfer', label: 'react.requisition.workflow.transfer.label', defaultMessage: 'Transfer' },
];

const RequisitionHeader = ({ requisition, currentStep }) => (
  <div className="box p-3 border rounded bg-white mb-3">
    <div className="d-flex justify-content-between align-items-center">
      <h2 className="mb-0">
        {requisition.requestNumber}
        {' '}
        {requisition.name}
      </h2>
      <span className="badge badge-secondary">{requisition.status}</span>
    </div>
    <div className="d-flex my-2" style={{ gap: '0.5rem' }}>
      {workflowSteps.map((step) => (
        <a
          key={step.action}
          className={`btn btn-sm ${step.action === currentStep ? 'btn-primary' : 'btn-outline-primary'}`}
          href={REQUISITION_URL[step.action](requisition.id)}
        >
          <Translate id={step.label} defaultMessage={step.defaultMessage} />
        </a>
      ))}
    </div>
    <table className="table table-sm table-borderless mb-0">
      <tbody>
        <HeaderRow label="react.requisition.status.label" defaultMessage="Status">
          {requisition.status}
        </HeaderRow>
        <HeaderRow label="react.requisition.requisitionType.label" defaultMessage="Requisition type">
          {requisition.type}
        </HeaderRow>
        <HeaderRow label="react.requisition.commodityClass.label" defaultMessage="Commodity class">
          {requisition.commodityClass}
        </HeaderRow>
        <HeaderRow label="react.requisition.origin.label" defaultMessage="Origin">
          {requisition.originName}
        </HeaderRow>
        <HeaderRow label="react.requisition.destination.label" defaultMessage="Destination">
          {requisition.destinationName}
        </HeaderRow>
        <HeaderRow label="react.requisition.dateRequested.label" defaultMessage="Date requested">
          {requisition.dateRequested}
        </HeaderRow>
        <HeaderRow label="react.requisition.requestedBy.label" defaultMessage="Requested by">
          {requisition.requestedByName}
        </HeaderRow>
        <HeaderRow label="react.requisition.createdBy.label" defaultMessage="Created by">
          {requisition.createdByName}
        </HeaderRow>
        <HeaderRow label="react.requisition.lastUpdated.label" defaultMessage="Last updated">
          {requisition.lastUpdated}
        </HeaderRow>
        {requisition.description && (
          <HeaderRow label="react.requisition.description.label" defaultMessage="Description">
            {requisition.description}
          </HeaderRow>
        )}
      </tbody>
    </table>
  </div>
);

RequisitionHeader.propTypes = {
  requisition: PropTypes.shape({
    id: PropTypes.string,
    requestNumber: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.string,
    type: PropTypes.string,
    commodityClass: PropTypes.string,
    originName: PropTypes.string,
    destinationName: PropTypes.string,
    dateRequested: PropTypes.string,
    requestedByName: PropTypes.string,
    createdByName: PropTypes.string,
    lastUpdated: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  currentStep: PropTypes.string.isRequired,
};

export default RequisitionHeader;
