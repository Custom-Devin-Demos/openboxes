export const keyOf = (record, attributes) =>
  attributes.map((attribute) => (record[attribute] ?? '')).join(' \u2022 ');

// Builds a pivot table model summing `valueAttribute` grouped by
// rowAttributes x colAttributes (same shape as the legacy pivottable output)
export const buildPivot = (data, rowAttributes, colAttributes, valueAttribute) => {
  const rowKeys = [];
  const colKeys = [];
  const cells = {};
  const rowTotals = {};
  const colTotals = {};
  let grandTotal = 0;

  data.forEach((record) => {
    const rowKey = keyOf(record, rowAttributes);
    const colKey = keyOf(record, colAttributes);
    if (!(rowKey in rowTotals)) {
      rowKeys.push(rowKey);
      rowTotals[rowKey] = 0;
    }
    if (!(colKey in colTotals)) {
      colKeys.push(colKey);
      colTotals[colKey] = 0;
    }
    const value = Number(record[valueAttribute]) || 0;
    const cellKey = `${rowKey}\u0000${colKey}`;
    cells[cellKey] = (cells[cellKey] || 0) + value;
    rowTotals[rowKey] += value;
    colTotals[colKey] += value;
    grandTotal += value;
  });

  rowKeys.sort();
  colKeys.sort();

  return {
    rowKeys,
    colKeys,
    rowTotals,
    colTotals,
    grandTotal,
    cellValue: (rowKey, colKey) => cells[`${rowKey}\u0000${colKey}`],
  };
};

export default buildPivot;
