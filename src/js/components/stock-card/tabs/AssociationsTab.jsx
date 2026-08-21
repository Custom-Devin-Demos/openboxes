import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import Translate from 'utils/Translate';

const AssociationsTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getAssociations(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Association Type"><Translate id="react.stockCard.associationType.label" defaultMessage="Association Type" /></th>
            <th aria-label="Product Code"><Translate id="react.stockCard.productCode.label" defaultMessage="Product Code" /></th>
            <th aria-label="Product"><Translate id="react.stockCard.product.label" defaultMessage="Product" /></th>
            <th aria-label="Comments"><Translate id="react.default.comments.label" defaultMessage="Comments" /></th>
            <th aria-label="Quantity Available" className="text-right"><Translate id="react.stockCard.quantityAvailable.label" defaultMessage="Quantity Available" /></th>
          </tr>
        </thead>
        <tbody>
          {data?.associations?.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                <Translate id="react.stockCard.noProductAssociations.message" defaultMessage="No product associations" />
              </td>
            </tr>
          )}
          {data?.associations?.map((association) => (
            <tr key={`${association.code}-${association.associatedProduct.id}`}>
              <td>{association.code}</td>
              <td>{association.associatedProduct.productCode}</td>
              <td>
                <a href={INVENTORY_ITEM_URL.showStockCard(association.associatedProduct.id)}>
                  {association.associatedProduct.displayName || association.associatedProduct.name}
                </a>
              </td>
              <td>{association.comments}</td>
              <td className="text-right">
                {association.quantityAvailable}
                {' '}
                {association.associatedProduct.unitOfMeasure || 'EA'}
              </td>
            </tr>
          ))}
        </tbody>
        {data?.associations?.length > 0 && (
          <tfoot>
            <tr className="font-weight-bold">
              <td colSpan="4" className="text-right">
                <Translate id="react.stockCard.total.label" defaultMessage="Total" />
              </td>
              <td className="text-right">
                {data.totalQuantity}
                {' '}
                {data.unitOfMeasure || 'EA'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default AssociationsTab;

AssociationsTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
