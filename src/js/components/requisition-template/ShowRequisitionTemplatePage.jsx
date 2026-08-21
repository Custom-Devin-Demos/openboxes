import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { JSON_GET_REQUISITION_ITEMS } from 'api/urls';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

import { formatCurrency, useTemplateDetails } from './requisition-template-utils';
import RequisitionTemplateHeaderPanel from './RequisitionTemplateHeaderPanel';
import RequisitionTemplateSummary from './RequisitionTemplateSummary';

const uomLabel = (item) => {
  const pkg = (item.product.packages || []).find((p) => p.id === item.productPackageId);
  return pkg ? `${pkg.uom.code}/${pkg.quantity}` : 'EA/1';
};

const ShowRequisitionTemplatePage = ({ match }) => {
  const { template } = useTemplateDetails(match.params.templateId);
  const [items, setItems] = useState([]);

  useTranslation('requisitionTemplate');

  useEffect(() => {
    apiClient.get(JSON_GET_REQUISITION_ITEMS(match.params.templateId))
      .then((response) => {
        setItems(response.data.aaData || []);
      });
  }, [match.params.templateId]);

  if (!template) {
    return null;
  }

  const hasFinance = template.hasRoleFinance;
  const columnCount = hasFinance ? 7 : 5;

  return (
    <div className="d-flex flex-column list-page-main p-3">
      <RequisitionTemplateSummary template={template} />
      <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
        <div style={{ minWidth: '320px' }}>
          <RequisitionTemplateHeaderPanel template={template} />
        </div>
        <div className="flex-grow-1">
          <div className="box p-3 border rounded bg-white">
            <h2>
              <Translate id="react.requisitionTemplate.requisitionItems.label" defaultMessage="Stocklist items" />
            </h2>
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th aria-label="Code" className="text-center"><Translate id="react.requisitionTemplate.productCode.label" defaultMessage="Product code" /></th>
                  <th aria-label="Product"><Translate id="react.requisitionTemplate.product.label" defaultMessage="Product" /></th>
                  <th aria-label="Category"><Translate id="react.requisitionTemplate.category.label" defaultMessage="Category" /></th>
                  <th aria-label="Quantity" className="text-center"><Translate id="react.requisitionTemplate.quantity.label" defaultMessage="Quantity" /></th>
                  <th aria-label="Unit of measure" className="text-center"><Translate id="react.requisitionTemplate.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                  {hasFinance && (
                    <th aria-label="Unit cost" className="text-center"><Translate id="react.requisitionTemplate.unitCost.label" defaultMessage="Unit cost" /></th>
                  )}
                  {hasFinance && (
                    <th aria-label="Total cost" className="text-center"><Translate id="react.requisitionTemplate.totalCost.label" defaultMessage="Total cost" /></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    id={`requisitionItem_${item.id}`}
                    className={!item.product.active ? 'text-muted' : undefined}
                    title={!item.product.active
                      ? 'This product has been discontinued. Please remove it from the stock list' : undefined}
                  >
                    <td className="text-center" style={{ color: item.product.color || undefined }}>
                      {item.product.productCode}
                    </td>
                    <td>
                      <a
                        style={{ color: item.product.color || undefined }}
                        href={INVENTORY_ITEM_URL.showStockCard(item.product.id)}
                        title={item.product.displayName ? item.product.name : undefined}
                      >
                        {item.product.displayName || item.product.name}
                      </a>
                    </td>
                    <td>{item.product.category}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center">{uomLabel(item)}</td>
                    {hasFinance && (
                      <td className="text-center">
                        {formatCurrency(item.product.pricePerUnit)}
                        {' '}
                        {template.currencyCode}
                      </td>
                    )}
                    {hasFinance && (
                      <td className="text-center">
                        {formatCurrency(item.totalCost)}
                        {' '}
                        {template.currencyCode}
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={columnCount} className="text-center text-muted">
                      <Translate id="react.requisitionTemplate.noRequisitionItems.message" defaultMessage="No requisition items" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

ShowRequisitionTemplatePage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      templateId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ShowRequisitionTemplatePage;
