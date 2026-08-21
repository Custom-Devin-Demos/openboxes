import React from 'react';

import PropTypes from 'prop-types';

import Translate from 'utils/Translate';

import { formatCurrency } from './requisition-template-utils';

const DetailRow = ({ label, defaultMessage, children }) => (
  <tr>
    <td className="name pr-2 text-muted" style={{ width: '180px' }}>
      <Translate id={label} defaultMessage={defaultMessage} />
    </td>
    <td className="value">{children}</td>
  </tr>
);

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  defaultMessage: PropTypes.string.isRequired,
  children: PropTypes.node,
};

DetailRow.defaultProps = {
  children: null,
};

const RequisitionTemplateHeaderPanel = ({ template }) => (
  <>
    <div className="box p-3 border rounded bg-white mb-3">
      <h2>
        <Translate id="react.requisitionTemplate.label" defaultMessage="Stock list" />
      </h2>
      <table className="table table-sm table-borderless w-auto mb-0">
        <tbody>
          <DetailRow label="react.requisitionTemplate.name.label" defaultMessage="Name">
            <span id="name">{template.name}</span>
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.origin.label" defaultMessage="Origin">
            {template.originName}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.destination.label" defaultMessage="Destination">
            {template.destinationName}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.requestedBy.label" defaultMessage="Managed by">
            {template.requestedByName}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.replenishmentPeriod.label" defaultMessage="Replenishment period">
            {template.replenishmentPeriod
              ? (
                <span>
                  {template.replenishmentPeriod}
                  {' '}
                  <Translate id="react.requisitionTemplate.replenishmentPeriodUnit.label" defaultMessage="days" />
                </span>
              )
              : <span className="text-muted">None</span>}
          </DetailRow>
          {template.hasRoleFinance && (
            <DetailRow label="react.requisitionTemplate.totalValue.label" defaultMessage="Total value">
              {formatCurrency(template.totalCost)}
              {' '}
              {template.currencyCode}
            </DetailRow>
          )}
          <DetailRow label="react.requisitionTemplate.sortByCode.label" defaultMessage="Sort order">
            {template.sortByCodeLabel || <span className="text-muted">None</span>}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.comments.label" defaultMessage="Comments">
            {template.description || 'None'}
          </DetailRow>
        </tbody>
      </table>
    </div>
    <div className="box p-3 border rounded bg-white mb-3">
      <h2>
        <Translate id="react.requisitionTemplate.auditing.label" defaultMessage="Auditing" />
      </h2>
      <table className="table table-sm table-borderless w-auto mb-0">
        <tbody>
          <DetailRow label="react.requisitionTemplate.version.label" defaultMessage="Version">
            v
            {template.version}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.published.label" defaultMessage="Published">
            {String(Boolean(template.isPublished))}
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.createdBy.label" defaultMessage="Created by">
            {template.createdByName}
            <div className="text-muted">{template.dateCreated}</div>
          </DetailRow>
          <DetailRow label="react.requisitionTemplate.updatedBy.label" defaultMessage="Updated by">
            {template.updatedByName}
            <div className="text-muted">{template.lastUpdated}</div>
          </DetailRow>
        </tbody>
      </table>
    </div>
  </>
);

RequisitionTemplateHeaderPanel.propTypes = {
  template: PropTypes.shape({
    name: PropTypes.string,
    originName: PropTypes.string,
    destinationName: PropTypes.string,
    requestedByName: PropTypes.string,
    replenishmentPeriod: PropTypes.number,
    hasRoleFinance: PropTypes.bool,
    totalCost: PropTypes.number,
    currencyCode: PropTypes.string,
    sortByCodeLabel: PropTypes.string,
    description: PropTypes.string,
    version: PropTypes.number,
    isPublished: PropTypes.bool,
    createdByName: PropTypes.string,
    dateCreated: PropTypes.string,
    updatedByName: PropTypes.string,
    lastUpdated: PropTypes.string,
  }).isRequired,
};

export default RequisitionTemplateHeaderPanel;
