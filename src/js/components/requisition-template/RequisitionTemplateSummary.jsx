import React from 'react';

import PropTypes from 'prop-types';

import { REQUISITION_TEMPLATE_URL, STOCKLIST_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const RequisitionTemplateSummary = ({ template }) => (
  <div className="box p-3 border rounded bg-white mb-3">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <h2 id="description" className="mb-1">{template.name}</h2>
        <div className="text-muted">
          <span id="origin" className="mr-3">
            <Translate id="react.requisitionTemplate.origin.label" defaultMessage="Origin" />
            {': '}
            <b>{template.originName || 'None'}</b>
          </span>
          <span id="destination" className="mr-3">
            <Translate id="react.requisitionTemplate.destination.label" defaultMessage="Destination" />
            {': '}
            <b>{template.destinationName || template.sessionWarehouseName}</b>
          </span>
          <span className="request-items mr-3">
            <Translate id="react.requisitionTemplate.requisitionItems.label" defaultMessage="Requisition items" />
            {': '}
            <b>{template.requisitionItemCount}</b>
          </span>
          <span id="recipientProgram">
            <Translate id="react.requisitionTemplate.commodityClass.label" defaultMessage="Commodity class" />
            {': '}
            <b>{template.commodityClassLabel || 'None'}</b>
          </span>
        </div>
      </div>
      <div>
        {template.isPublished ? (
          <span className="badge badge-warning p-2">
            <Translate id="react.requisitionTemplate.published.label" defaultMessage="Published" />
          </span>
        ) : (
          <span className="badge badge-danger p-2">
            <Translate id="react.requisitionTemplate.draft.label" defaultMessage="Draft" />
          </span>
        )}
      </div>
    </div>
    <div className="d-flex flex-wrap align-items-center mt-3" style={{ gap: '0.25rem' }}>
      <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.list()}>
        <Translate id="react.requisitionTemplate.listStocklists.label" defaultMessage="List stocklists" />
      </a>
      {template.isUserAdmin && (
        <a className="btn btn-sm btn-outline-secondary" href={`${REQUISITION_TEMPLATE_URL.create()}?type=STOCK`}>
          <Translate id="react.requisitionTemplate.createStocklist.label" defaultMessage="Create stocklist" />
        </a>
      )}
      <div className="ml-auto d-flex flex-wrap" style={{ gap: '0.25rem' }}>
        {template.isUserAdmin && (
          <>
            <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.show(template.id)}>
              <Translate id="react.default.button.show.label" defaultMessage="Show" />
            </a>
            <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.editHeader(template.id)}>
              <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
            </a>
            <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.edit(template.id)}>
              <Translate id="react.default.button.add.label" defaultMessage="Add" />
            </a>
            <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.batch(template.id)}>
              <Translate id="react.default.button.import.label" defaultMessage="Import" />
            </a>
            <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.export(template.id)}>
              <Translate id="react.default.button.export.label" defaultMessage="Export" />
            </a>
            {!template.isPublished ? (
              <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.publish(template.id)}>
                <Translate id="react.requisitionTemplate.publish.label" defaultMessage="Publish" />
              </a>
            ) : (
              <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.unpublish(template.id)}>
                <Translate id="react.requisitionTemplate.unpublish.label" defaultMessage="Unpublish" />
              </a>
            )}
          </>
        )}
        <a className="btn btn-sm btn-outline-secondary" href={REQUISITION_TEMPLATE_URL.sendMail(template.id)}>
          <Translate id="react.requisitionTemplate.email.label" defaultMessage="Email" />
        </a>
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            data-toggle="dropdown"
          >
            <Translate id="react.default.button.download.label" defaultMessage="Download" />
          </button>
          <div className="dropdown-menu dropdown-menu-right">
            <a className="dropdown-item" href={STOCKLIST_URL.html(template.id)} target="_blank" rel="noopener noreferrer">
              <Translate id="react.requisitionTemplate.preview.label" defaultMessage="Preview" />
            </a>
            <a className="dropdown-item" href={STOCKLIST_URL.pdf(template.id)}>
              <Translate id="react.requisitionTemplate.downloadPdf.label" defaultMessage="Download PDF" />
            </a>
            <a className="dropdown-item" href={STOCKLIST_URL.csv(template.id)}>
              <Translate id="react.requisitionTemplate.downloadXls.label" defaultMessage="Download XLS" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

RequisitionTemplateSummary.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    originName: PropTypes.string,
    destinationName: PropTypes.string,
    sessionWarehouseName: PropTypes.string,
    requisitionItemCount: PropTypes.number,
    commodityClassLabel: PropTypes.string,
    isPublished: PropTypes.bool,
    isUserAdmin: PropTypes.bool,
  }).isRequired,
};

export default RequisitionTemplateSummary;
