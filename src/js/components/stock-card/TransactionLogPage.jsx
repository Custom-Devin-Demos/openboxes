import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import StockCardApi from 'api/services/StockCardApi';
import { formatDateTime } from 'components/stock-card/utils';
import { INVENTORY_ITEM_URL, INVENTORY_URL, SHIPMENT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/stock-card/stockCard.scss';

const TransactionLogPage = () => {
  useTranslation('stockCard', 'inventory', 'default');

  const params = useParams();
  const location = useLocation();
  const history = useHistory();
  const parsedQuery = queryString.parse(location.search);
  const productId = params.id || parsedQuery['product.id'];

  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(parsedQuery.startDate || '');
  const [endDate, setEndDate] = useState(parsedQuery.endDate || '');
  const [transactionTypeId, setTransactionTypeId] = useState(parsedQuery['transactionType.id'] || '0');

  useEffect(() => {
    if (productId) {
      StockCardApi.getTransactionLog(productId, {
        params: queryString.parse(location.search),
      }).then((response) => setData(response.data));
    }
  }, [productId, location.search]);

  const onFilter = (event) => {
    event.preventDefault();
    history.push({
      pathname: location.pathname,
      search: queryString.stringify({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        'transactionType.id': transactionTypeId,
      }),
    });
  };

  const showAllHref = INVENTORY_ITEM_URL.showTransactionLog(productId, { disableFilter: true });

  return (
    <PageWrapper>
      <div className="stock-card-page">
        <div className="d-flex justify-content-between align-items-center p-2">
          <h2>
            <Translate id="react.stockCard.transactionLog.label" defaultMessage="Transaction Log" />
            {data?.product && ` › ${data.product.productCode} ${data.product.displayName || data.product.name}`}
          </h2>
          <a className="btn btn-outline-secondary" href={INVENTORY_ITEM_URL.showStockCard(productId)}>
            <Translate id="react.stockCard.backToStockCard.label" defaultMessage="Back to stock card" />
          </a>
        </div>
        <div className="stock-card-table-container">
          <form onSubmit={onFilter} className="form-inline p-2">
            <label htmlFor="startDate" className="mr-2">
              <Translate id="react.stockCard.transactionLog.from.label" defaultMessage="From" />
            </label>
            <input
              id="startDate"
              type="date"
              className="form-control mr-2"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <label htmlFor="endDate" className="mr-2">
              <Translate id="react.stockCard.transactionLog.to.label" defaultMessage="To" />
            </label>
            <input
              id="endDate"
              type="date"
              className="form-control mr-2"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <select
              aria-label="Transaction type"
              className="form-control mr-2"
              value={transactionTypeId}
              onChange={(event) => setTransactionTypeId(event.target.value)}
            >
              <option value="0">
                All
              </option>
              {data?.transactionTypes?.map((transactionType) => (
                <option key={transactionType.id} value={transactionType.id}>
                  {transactionType.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">
              <Translate id="react.default.button.filter.label" defaultMessage="Filter" />
            </button>
          </form>
          <table className="table table-sm stock-card-table">
            <thead>
              <tr>
                <th aria-label="Date"><Translate id="react.default.date.label" defaultMessage="Date" /></th>
                <th aria-label="Type"><Translate id="react.default.type.label" defaultMessage="Type" /></th>
                <th aria-label="Shipment"><Translate id="react.stockCard.shipment.label" defaultMessage="Shipment" /></th>
                <th aria-label="Source"><Translate id="react.stockCard.source.label" defaultMessage="Source" /></th>
                <th aria-label="Destination"><Translate id="react.stockCard.destination.label" defaultMessage="Destination" /></th>
                <th aria-label="Quantity Change" className="text-center">
                  <Translate id="react.stockCard.quantityChange.label" defaultMessage="Quantity Change" />
                </th>
              </tr>
            </thead>
            <tbody>
              {data && !data.transactions?.length && (
                <tr>
                  <td colSpan="6" className="text-center">
                    <Translate
                      id="react.stockCard.noTransactions.message"
                      defaultMessage="There are no transactions for this product"
                    />
                  </td>
                </tr>
              )}
              {data?.transactions?.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="text-nowrap">{formatDateTime(transaction.transactionDate)}</td>
                  <td>
                    <span className={transaction.transactionType?.transactionCode}>
                      <a href={`${INVENTORY_URL.showTransaction(transaction.id)}?product.id=${productId}`}>
                        {transaction.transactionType?.name}
                      </a>
                    </span>
                  </td>
                  <td>
                    {transaction.shipment
                      ? (
                        <a href={SHIPMENT_URL.showDetails(transaction.shipment.id)}>
                          {transaction.shipment.name}
                        </a>
                      )
                      : <span className="text-muted"><Translate id="react.default.none.label" defaultMessage="None" /></span>}
                  </td>
                  <td>{transaction.source}</td>
                  <td>{transaction.destination}</td>
                  <td className="text-center">
                    <span className={transaction.transactionType?.transactionCode}>
                      {transaction.quantityChange}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2">
            <Translate id="react.stockCard.showing.label" defaultMessage="Showing" />
            {` ${data?.shownCount ?? 0} `}
            <Translate id="react.stockCard.of.label" defaultMessage="of" />
            {` ${data?.totalCount ?? 0} `}
            <Translate id="react.stockCard.transactions.label" defaultMessage="transactions" />
            {data?.totalCount > data?.shownCount && (
              <>
                {' | '}
                <a href={showAllHref}>
                  <Translate id="react.stockCard.showAllTransactions.label" defaultMessage="Show all transactions" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default TransactionLogPage;
