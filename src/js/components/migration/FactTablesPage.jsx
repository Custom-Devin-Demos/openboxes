import React, { useEffect, useState } from 'react';

import { MIGRATION_FACT_TABLES } from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const FactTablesPage = () => {
  useTranslation('default');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');

  const fetchData = () => {
    apiClient.get(MIGRATION_FACT_TABLES)
      .then((response) => setData(response.data.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = (url) => () => {
    setStatus('Loading...');
    apiClient.get(url)
      .then(() => setStatus('Completed migration!'))
      .catch(() => setStatus('Error'))
      .finally(fetchData);
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.factTables.label" defaultMessage="Facts" />
          </h2>
          {status && <div className="tag tag-info">{status}</div>}
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="prop">
                <td className="name">Transaction Facts</td>
                <td className="value">{data?.transactionFactCount}</td>
                <td>
                  <button type="button" className="button" onClick={refresh(REPORT_URL.refreshTransactionFact())}>Refresh</button>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Consumption Facts</td>
                <td className="value">{data?.consumptionFactCount}</td>
                <td>
                  <button type="button" className="button" onClick={refresh(REPORT_URL.refreshConsumptionFact())}>Refresh</button>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Stockout Facts</td>
                <td className="value">{data?.stockoutFactCount}</td>
                <td>
                  <button type="button" className="button" onClick={refresh(REPORT_URL.refreshStockoutFact())}>Refresh</button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>
                  <div className="button-container">
                    <a className="button mr-2" href={REPORT_URL.truncateFacts()}>Truncate</a>
                    <a className="button" href={REPORT_URL.buildFacts()}>Build</a>
                  </div>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default FactTablesPage;
