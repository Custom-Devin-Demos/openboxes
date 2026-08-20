import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StockCardApi from 'api/services/StockCardApi';
import { formatDate } from 'components/stock-card/utils';
import Translate from 'utils/Translate';

const StockHistoryTab = ({ productId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    StockCardApi.getStockHistory(productId)
      .then((response) => setData(response.data));
  }, [productId]);

  const renderReference = (reference) => {
    if (!reference) {
      return null;
    }
    return (
      <span className="stock-history-reference">
        {reference.number}
        {reference.name ? ` - ${reference.name}` : ''}
      </span>
    );
  };

  return (
    <div className="stock-card-table-container">
      <table className="table table-sm stock-card-table">
        <thead>
          <tr>
            <th aria-label="Date"><Translate id="react.stockCard.date.label" defaultMessage="Date" /></th>
            <th aria-label="Transaction"><Translate id="react.stockCard.transaction.label" defaultMessage="Transaction" /></th>
            <th aria-label="Reference"><Translate id="react.stockCard.reference.label" defaultMessage="Reference" /></th>
            <th aria-label="Bin Location"><Translate id="react.stockCard.binLocation.label" defaultMessage="Bin Location" /></th>
            <th aria-label="Lot/Serial No."><Translate id="react.stockCard.lotSerialNo.label" defaultMessage="Lot/Serial No." /></th>
            <th aria-label="Debit" className="text-right"><Translate id="react.stockCard.debit.label" defaultMessage="Debit" /></th>
            <th aria-label="Credit" className="text-right"><Translate id="react.stockCard.credit.label" defaultMessage="Credit" /></th>
            <th aria-label="Balance" className="text-right"><Translate id="react.stockCard.balance.label" defaultMessage="Balance" /></th>
          </tr>
        </thead>
        {data && Object.keys(data.stockHistoryList || {}).map((year) => (
          <tbody key={year}>
            {Object.keys(data.stockHistoryList[year]).map((month) => (
              <React.Fragment key={`${year}-${month}`}>
                <tr className="stock-history-month-header">
                  <td colSpan="8" className="font-weight-bold">
                    {`${month} ${year}`}
                  </td>
                </tr>
                {data.stockHistoryList[year][month].map((entry, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={`${year}-${month}-${index}`} className={entry.isInternal ? 'internal-transaction' : ''}>
                    <td>{formatDate(entry.transaction?.transactionDate)}</td>
                    <td>
                      {entry.isSameTransaction ? '' : entry.transaction?.transactionType?.name}
                    </td>
                    <td>{renderReference(entry.reference)}</td>
                    <td>{entry.binLocation?.name || ''}</td>
                    <td>{entry.inventoryItem?.lotNumber || ''}</td>
                    <td className="text-right">{entry.isDebit ? entry.quantity : ''}</td>
                    <td className="text-right">{entry.isCredit ? entry.quantity : ''}</td>
                    <td className="text-right">{entry.balance}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        ))}
        {data && (
          <tfoot>
            <tr className="font-weight-bold">
              <td colSpan="5" className="text-right">
                <Translate id="react.stockCard.total.label" defaultMessage="Total" />
              </td>
              <td className="text-right">{data.totalDebit}</td>
              <td className="text-right">{data.totalCredit}</td>
              <td className="text-right">{data.totalBalance}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default StockHistoryTab;

StockHistoryTab.propTypes = {
  productId: PropTypes.string.isRequired,
};
