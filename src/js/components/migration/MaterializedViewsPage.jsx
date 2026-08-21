import React, { useEffect, useState } from 'react';

import { MIGRATION_MATERIALIZED_VIEWS } from 'api/urls';
import { MIGRATION_URL, REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const MaterializedViewsPage = () => {
  useTranslation('default');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');

  const fetchData = () => {
    apiClient.get(MIGRATION_MATERIALIZED_VIEWS)
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
            <Translate id="react.migration.materializedViews.label" defaultMessage="Materialized Views" />
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
                <td className="name">Product Demand</td>
                <td className="value">{data?.productDemandCount}</td>
                <td>
                  <button type="button" className="button" onClick={refresh(REPORT_URL.refreshProductDemand())}>Refresh</button>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Product Availability</td>
                <td className="value">{data?.productAvailabilityCount}</td>
                <td>
                  <div className="button-group">
                    <a className="button mr-2" href={MIGRATION_URL.productAvailability()}>
                      <Translate id="react.default.button.list.label" defaultMessage="List" />
                    </a>
                    <button type="button" className="button" onClick={refresh(REPORT_URL.refreshProductAvailability())}>Refresh</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MaterializedViewsPage;
