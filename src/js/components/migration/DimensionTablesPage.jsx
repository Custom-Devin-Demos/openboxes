import React, { useEffect, useState } from 'react';

import { MIGRATION_DIMENSION_TABLES } from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const DimensionTablesPage = () => {
  useTranslation('default');
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get(MIGRATION_DIMENSION_TABLES)
      .then((response) => setData(response.data.data));
  }, []);

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.dimensionTables.label" defaultMessage="Dimension" />
          </h2>
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr className="prop">
                <td className="name">Date Dimension</td>
                <td className="value">{data?.dateDimensionCount}</td>
              </tr>
              <tr className="prop">
                <td className="name">Location Dimension</td>
                <td className="value">{data?.locationDimensionCount}</td>
              </tr>
              <tr className="prop">
                <td className="name">Lot Dimension</td>
                <td className="value">{data?.lotDimensionCount}</td>
              </tr>
              <tr className="prop">
                <td className="name">Product Dimension</td>
                <td className="value">{data?.productDimensionCount}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>
                  <div className="button-container">
                    <a className="button mr-2" href={REPORT_URL.truncateDimensions()}>Truncate</a>
                    <a className="button" href={REPORT_URL.buildDimensions()}>Build</a>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default DimensionTablesPage;
