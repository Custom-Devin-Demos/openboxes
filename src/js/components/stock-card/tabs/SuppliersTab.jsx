import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import Translate from 'utils/Translate';

const SuppliersTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getSuppliers(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  const visibleSuppliers = data?.productSuppliers?.filter((supplier) => !supplier.hidden) || [];

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Source Code"><Translate id="react.stockCard.sourceCode.label" defaultMessage="Source Code" /></th>
            <th aria-label="Source Name"><Translate id="react.stockCard.sourceName.label" defaultMessage="Source Name" /></th>
            <th aria-label="Supplier"><Translate id="react.stockCard.supplier.label" defaultMessage="Supplier" /></th>
            <th aria-label="Supplier Code"><Translate id="react.stockCard.supplierCode.label" defaultMessage="Supplier Code" /></th>
            <th aria-label="Manufacturer"><Translate id="react.stockCard.manufacturer.label" defaultMessage="Manufacturer" /></th>
            <th aria-label="Manufacturer Code"><Translate id="react.stockCard.manufacturerCode.label" defaultMessage="Manufacturer Code" /></th>
            <th aria-label="Preference Type"><Translate id="react.stockCard.preferenceType.label" defaultMessage="Preference Type" /></th>
            <th aria-label="Min Order Qty" className="text-right"><Translate id="react.stockCard.minOrderQuantity.label" defaultMessage="Min Order Qty" /></th>
            {data?.hasRoleFinance && (
              <th aria-label="Package Price" className="text-right"><Translate id="react.stockCard.packagePrice.label" defaultMessage="Package Price" /></th>
            )}
            {data?.hasRoleFinance && (
              <th aria-label="Each Price" className="text-right"><Translate id="react.stockCard.eachPrice.label" defaultMessage="Each Price" /></th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleSuppliers.length === 0 && (
            <tr>
              <td colSpan={data?.hasRoleFinance ? 10 : 8} className="text-center">
                <Translate id="react.stockCard.noProductSources.message" defaultMessage="No product sources" />
              </td>
            </tr>
          )}
          {visibleSuppliers.map((supplier) => (
            <tr key={supplier.code}>
              <td>{supplier.code}</td>
              <td>{supplier.name}</td>
              <td>{supplier.supplier}</td>
              <td>{supplier.supplierCode}</td>
              <td>{supplier.manufacturer}</td>
              <td>{supplier.manufacturerCode}</td>
              <td>{supplier.preferenceType}</td>
              <td className="text-right">{supplier.minOrderQuantity}</td>
              {data?.hasRoleFinance && (
                <td className="text-right">
                  {supplier.packagePrice != null ? `${supplier.packagePrice} ${data.currencyCode}` : ''}
                </td>
              )}
              {data?.hasRoleFinance && (
                <td className="text-right">
                  {supplier.eachPrice != null ? `${supplier.eachPrice} ${data.currencyCode}` : ''}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuppliersTab;

SuppliersTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
