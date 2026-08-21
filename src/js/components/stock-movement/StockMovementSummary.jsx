import React from 'react';

import PropTypes from 'prop-types';

import { STOCK_MOVEMENT_URL } from 'consts/applicationUrls';

const StockMovementSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  return (
    <div id="stock-movement-summary" className="summary p-3">
      <div className="title">
        <small className="font-weight-bold">{summary.identifier}</small>
        &nbsp;
        <a href={STOCK_MOVEMENT_URL.show(summary.id)}>{summary.name || summary.identifier}</a>
        &nbsp;
        {summary.statusLabel
          && <span className="tag" data-testid="status">{summary.statusLabel}</span>}
      </div>
      <div>
        {summary.originName}
        {' → '}
        {summary.destinationName}
      </div>
    </div>
  );
};

export default StockMovementSummary;

StockMovementSummary.propTypes = {
  summary: PropTypes.shape({
    id: PropTypes.string,
    identifier: PropTypes.string,
    name: PropTypes.string,
    statusLabel: PropTypes.string,
    originName: PropTypes.string,
    destinationName: PropTypes.string,
  }),
};

StockMovementSummary.defaultProps = {
  summary: null,
};
