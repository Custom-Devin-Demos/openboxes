import React from 'react';

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Translate from 'utils/Translate';

const { CONTEXT_PATH } = window;

const StockCardHeader = ({ details, productId }) => {
  if (!details) {
    return <div className="stock-card-header" />;
  }

  const { product, permissions } = details;

  return (
    <div className="stock-card-header">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h1 className="stock-card-title">
            <span className="stock-card-product-code">{product?.productCode}</span>
            {' '}
            {product?.displayName || product?.name}
            {!product?.active && (
              <span className="badge badge-danger ml-2">
                <Translate id="react.stockCard.inactive.label" defaultMessage="Inactive" />
              </span>
            )}
          </h1>
          <div className="stock-card-subtitle">
            {product?.category?.name}
            {product?.unitOfMeasure ? ` | ${product.unitOfMeasure}` : ''}
            {permissions?.hasRoleFinance && product?.pricePerUnit != null
              ? ` | ${details.currencyCode || ''} ${product.pricePerUnit}` : ''}
          </div>
          {product?.description && (
            <div className="stock-card-description">{product.description}</div>
          )}
        </div>
        <div className="stock-card-summary text-right">
          <div>
            <Translate id="react.stockCard.quantityOnHand.label" defaultMessage="Quantity on hand" />
            {': '}
            <strong>{details.totalQuantity}</strong>
            {' '}
            {product?.unitOfMeasure || 'EA'}
          </div>
          <div>
            <Translate id="react.stockCard.quantityAvailable.label" defaultMessage="Quantity available" />
            {': '}
            <strong>{details.totalQuantityAvailableToPromise}</strong>
            {' '}
            {product?.unitOfMeasure || 'EA'}
          </div>
          {details.inventoryStatus && (
            <div>
              <Translate id="react.stockCard.status.label" defaultMessage="Status" />
              {': '}
              {details.inventoryStatus}
            </div>
          )}
        </div>
      </div>
      <div className="stock-card-actions mt-2">
        <Link
          className="btn btn-outline-primary btn-sm mr-2"
          to={`${CONTEXT_PATH}/inventoryItem/showRecordInventory?product.id=${productId}`}
        >
          <Translate id="react.stockCard.recordStock.label" defaultMessage="Record stock" />
        </Link>
        <Link
          className="btn btn-outline-primary btn-sm mr-2"
          to={`${CONTEXT_PATH}/inventoryItem/editInventoryLevel?product.id=${productId}`}
        >
          <Translate id="react.stockCard.editStockLevels.label" defaultMessage="Edit stock levels" />
        </Link>
        <Link
          className="btn btn-outline-primary btn-sm mr-2"
          to={`${CONTEXT_PATH}/inventoryItem/showLotNumbers?product.id=${productId}`}
        >
          <Translate id="react.stockCard.editLotNumbers.label" defaultMessage="Edit lot numbers" />
        </Link>
        <Link
          className="btn btn-outline-primary btn-sm mr-2"
          to={`${CONTEXT_PATH}/inventoryItem/showGraph?product.id=${productId}`}
        >
          <Translate id="react.stockCard.showGraph.label" defaultMessage="Show graph" />
        </Link>
        <a
          className="btn btn-outline-secondary btn-sm"
          href={`${CONTEXT_PATH}/product/edit/${productId}`}
        >
          <Translate id="react.stockCard.editProduct.label" defaultMessage="Edit product" />
        </a>
      </div>
    </div>
  );
};

export default StockCardHeader;

StockCardHeader.propTypes = {
  details: PropTypes.shape({
    product: PropTypes.shape({}),
    permissions: PropTypes.shape({}),
    totalQuantity: PropTypes.number,
    totalQuantityAvailableToPromise: PropTypes.number,
    inventoryStatus: PropTypes.string,
    currencyCode: PropTypes.string,
  }),
  productId: PropTypes.string.isRequired,
};

StockCardHeader.defaultProps = {
  details: null,
};
