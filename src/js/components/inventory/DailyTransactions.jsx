import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { Link, withRouter } from 'react-router-dom';

import { INVENTORY_LIST_DAILY_TRANSACTIONS } from 'api/urls';
import { INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

// Renders a dd/MM/yyyy date string like the legacy screen, e.g. "Friday, August 21, 2026"
const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const DailyTransactions = ({ location }) => {
  useTranslation('inventory', 'default');

  const [data, setData] = useState(null);

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_LIST_DAILY_TRANSACTIONS, {
      params: queryString.parse(location.search),
    }).then((response) => setData(response.data));
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.dailyTransactions.label" defaultMessage="Daily transactions" />
          {' '}
          <span className="text-muted">{formatDate(data?.dateSelected)}</span>
        </h2>
        <div className="row">
          <div className="col-md-3">
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>
                    <Translate id="react.inventory.dates.label" defaultMessage="Dates" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data && !data.transactionsByDate?.length && (
                  <tr>
                    <td>
                      <Translate id="react.inventory.noTransactions.label" defaultMessage="No transactions" />
                    </td>
                  </tr>
                )}
                {data?.transactionsByDate?.map((entry) => (
                  <tr key={entry.date}>
                    <td>
                      {entry.date === data.dateSelected ? (
                        <span className="font-weight-bold">{formatDate(entry.date)}</span>
                      ) : (
                        <Link to={{
                          pathname: location.pathname,
                          search: queryString.stringify({ date: entry.date }),
                        }}
                        >
                          {formatDate(entry.date)}
                        </Link>
                      )}
                      {` (${entry.count})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-9">
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>
                    <Translate id="react.inventory.dateTime.label" defaultMessage="Date and time" />
                  </th>
                  <th>
                    <Translate id="react.inventory.transactionId.label" defaultMessage="Transaction ID" />
                  </th>
                  <th>
                    <Translate id="react.inventory.transactionType.label" defaultMessage="Type" />
                  </th>
                  <th>
                    <Translate id="react.inventory.product.label" defaultMessage="Product" />
                  </th>
                  <th>
                    <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventory.quantity.label" defaultMessage="Quantity" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions?.map((transaction) => (
                  transaction.entries?.map((entry, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={`${transaction.id}-${index}`}>
                      <td>{transaction.dateCreated}</td>
                      <td>
                        <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                          {transaction.transactionNumber}
                        </a>
                      </td>
                      <td>
                        {transaction.transactionType}
                        {transaction.source ? ` from ${transaction.source}` : ''}
                        {transaction.destination ? ` to ${transaction.destination}` : ''}
                      </td>
                      <td>{entry.product?.name}</td>
                      <td>{entry.lotNumber}</td>
                      <td className="text-right">{entry.quantity}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(DailyTransactions);

DailyTransactions.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
