import React, { useMemo } from 'react';

import PropTypes from 'prop-types';

import { buildPivot } from 'components/reporting/consumption/pivotUtils';
import Translate from 'utils/Translate';

const ConsumptionPivotTable = ({
  data, rowAttributes, colAttributes, valueAttribute, rowLabel,
}) => {
  const pivot = useMemo(
    () => buildPivot(data, rowAttributes, colAttributes, valueAttribute),
    [data, rowAttributes, colAttributes, valueAttribute],
  );

  if (!data.length) {
    return (
      <div className="p-2">
        <Translate id="react.default.noResultsFound.label" defaultMessage="No results found" />
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>{rowLabel}</th>
            {pivot.colKeys.map((colKey) => (
              <th key={colKey} className="text-center">{colKey}</th>
            ))}
            <th className="text-center">
              <Translate id="react.consumption.totals.label" defaultMessage="Totals" />
            </th>
          </tr>
        </thead>
        <tbody>
          {pivot.rowKeys.map((rowKey) => (
            <tr key={rowKey}>
              <td>{rowKey}</td>
              {pivot.colKeys.map((colKey) => (
                <td key={colKey} className="text-center">
                  {pivot.cellValue(rowKey, colKey)}
                </td>
              ))}
              <td className="text-center font-weight-bold">{pivot.rowTotals[rowKey]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>
              <Translate id="react.consumption.totals.label" defaultMessage="Totals" />
            </th>
            {pivot.colKeys.map((colKey) => (
              <th key={colKey} className="text-center">{pivot.colTotals[colKey]}</th>
            ))}
            <th className="text-center">{pivot.grandTotal}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ConsumptionPivotTable;

ConsumptionPivotTable.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowAttributes: PropTypes.arrayOf(PropTypes.string).isRequired,
  colAttributes: PropTypes.arrayOf(PropTypes.string).isRequired,
  valueAttribute: PropTypes.string.isRequired,
  rowLabel: PropTypes.string,
};

ConsumptionPivotTable.defaultProps = {
  rowLabel: '',
};
