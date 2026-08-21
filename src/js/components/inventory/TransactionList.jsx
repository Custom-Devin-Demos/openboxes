import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import { INVENTORY_DELETE_TRANSACTION, INVENTORY_LIST_TRANSACTIONS } from 'api/urls';
import { INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const TransactionList = ({ history, location }) => {
  useTranslation('inventory', 'default');

  const query = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [transactionNumber, setTransactionNumber] = useState(query.transactionNumber || '');
  const [transactionType, setTransactionType] = useState(query['transactionType.id'] || '');
  const [transactionDateFrom, setTransactionDateFrom] = useState(query.transactionDateFrom || '');
  const [transactionDateTo, setTransactionDateTo] = useState(query.transactionDateTo || '');

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_LIST_TRANSACTIONS, {
      params: queryString.parse(location.search),
    }).then((response) => setData(response.data));
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildSearch = (extraParams = {}) => queryString.stringify({
    transactionNumber: transactionNumber || undefined,
    'transactionType.id': transactionType || undefined,
    transactionDateFrom: transactionDateFrom || undefined,
    transactionDateTo: transactionDateTo || undefined,
    ...extraParams,
  });

  const onSearch = (event) => {
    event.preventDefault();
    history.push({ pathname: location.pathname, search: buildSearch() });
  };

  const onTransactionTypeChange = (value) => {
    setTransactionType(value);
    history.push({
      pathname: location.pathname,
      search: queryString.stringify({
        transactionNumber: transactionNumber || undefined,
        'transactionType.id': value || undefined,
        transactionDateFrom: transactionDateFrom || undefined,
        transactionDateTo: transactionDateTo || undefined,
      }),
    });
  };

  const onDelete = (transaction) => {
    apiClient.delete(INVENTORY_DELETE_TRANSACTION(transaction.id))
      .then((response) => {
        setMessage(response.data?.message || '');
        fetchData();
      })
      .catch((error) => {
        setMessage(error.response?.data?.message || '');
      });
  };

  const max = data?.max || 10;
  const offset = data?.offset || 0;
  const totalCount = data?.transactionCount || 0;

  const onPage = (newOffset) => {
    history.push({
      pathname: location.pathname,
      search: buildSearch({ offset: newOffset, max }),
    });
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      {message && <div className="alert alert-info m-2">{message}</div>}
      <div className="row m-0">
        <div className="col-md-3">
          <div className="box p-3">
            <h2>
              <Translate id="react.default.filters.label" defaultMessage="Filters" />
            </h2>
            <form onSubmit={onSearch}>
              <div className="form-group">
                <label htmlFor="inventoryName">
                  <Translate id="react.inventory.transactionInventory.label" defaultMessage="Inventory" />
                </label>
                <div id="inventoryName">{data?.warehouseName}</div>
              </div>
              <div className="form-group">
                <label htmlFor="transactionNumber">
                  <Translate id="react.inventory.transactionNumber.label" defaultMessage="Transaction number" />
                </label>
                <input
                  id="transactionNumber"
                  type="text"
                  className="form-control"
                  value={transactionNumber}
                  onChange={(event) => setTransactionNumber(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="transactionType">
                  <Translate id="react.inventory.transactionType.label" defaultMessage="Transaction type" />
                </label>
                <select
                  id="transactionType"
                  className="form-control"
                  value={transactionType}
                  onChange={(event) => onTransactionTypeChange(event.target.value)}
                >
                  <option value="" aria-label="empty" />
                  {data?.transactionTypes?.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="transactionDateFrom">
                  <Translate id="react.inventory.dateRange.label" defaultMessage="Date Range" />
                </label>
                <input
                  id="transactionDateFrom"
                  type="text"
                  className="form-control"
                  placeholder="From (MM/DD/YYYY)"
                  autoComplete="off"
                  value={transactionDateFrom}
                  onChange={(event) => setTransactionDateFrom(event.target.value)}
                />
              </div>
              <div className="form-group">
                <input
                  id="transactionDateTo"
                  type="text"
                  className="form-control"
                  placeholder="To (MM/DD/YYYY)"
                  autoComplete="off"
                  value={transactionDateTo}
                  onChange={(event) => setTransactionDateTo(event.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                <Translate id="react.default.button.search.label" defaultMessage="Search" />
              </button>
            </form>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              <Translate id="react.inventory.listTransactions.label" defaultMessage="Transaction Log" />
              {' '}
              <span className="text-muted">{`(${totalCount})`}</span>
            </h2>
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>
                    <Translate id="react.default.actions.label" defaultMessage="Actions" />
                  </th>
                  <th>
                    <Translate id="react.default.count.label" defaultMessage="Count" />
                  </th>
                  <th>
                    <Translate id="react.inventory.transactionNumber.label" defaultMessage="Transaction number" />
                  </th>
                  <th>
                    <Translate id="react.default.date.label" defaultMessage="Date" />
                  </th>
                  <th>
                    <Translate id="react.inventory.transactionType.label" defaultMessage="Type" />
                  </th>
                  <th>
                    <Translate id="react.inventory.inventory.label" defaultMessage="Inventory" />
                  </th>
                  <th className="text-center">
                    <Translate id="react.default.source.label" defaultMessage="Source" />
                    {' / '}
                    <Translate id="react.default.destination.label" defaultMessage="Destination" />
                  </th>
                  <th className="text-center">
                    <Translate id="react.default.createdBy.label" defaultMessage="Created by" />
                  </th>
                  <th className="text-center">
                    <Translate id="react.default.dateCreated.label" defaultMessage="Date created" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions?.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="text-nowrap">
                      <a
                        className="btn btn-outline-secondary btn-sm"
                        href={INVENTORY_URL.showTransaction(transaction.id)}
                      >
                        <Translate id="react.default.button.show.label" defaultMessage="Show" />
                      </a>
                      {data?.isSuperuser && (
                        <>
                          {' '}
                          <a
                            className="btn btn-outline-secondary btn-sm"
                            href={INVENTORY_URL.editTransaction(transaction.id)}
                          >
                            <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                          </a>
                          {' '}
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDelete(transaction)}
                          >
                            <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                          </button>
                        </>
                      )}
                    </td>
                    <td>{transaction.entryCount}</td>
                    <td>
                      <a href={INVENTORY_URL.showTransaction(transaction.id)}>
                        {transaction.transactionNumber}
                      </a>
                    </td>
                    <td>{transaction.transactionDate}</td>
                    <td>{transaction.transactionType}</td>
                    <td>{transaction.inventory}</td>
                    <td className="text-center">
                      {transaction.source || transaction.destination || (
                        <span className="text-muted">
                          <Translate id="react.default.na.label" defaultMessage="N/A" />
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {transaction.createdBy || (
                        <span className="text-muted">
                          <Translate id="react.default.nobody.label" defaultMessage="Nobody" />
                        </span>
                      )}
                    </td>
                    <td className="text-center">{transaction.dateCreated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-center">
              {offset > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm mr-2"
                  onClick={() => onPage(Math.max(offset - max, 0))}
                >
                  <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
                </button>
              )}
              {offset + max < totalCount && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => onPage(offset + max)}
                >
                  <Translate id="react.default.button.next.label" defaultMessage="Next" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(TransactionList);

TransactionList.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
