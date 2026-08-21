import React, { useEffect, useState } from 'react';

import { CONSUMPTION_AGGREGATE } from 'api/urls';
import ConsumptionButtonBar from 'components/reporting/consumption/ConsumptionButtonBar';
import ConsumptionPivotTable from 'components/reporting/consumption/ConsumptionPivotTable';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const ATTRIBUTES = ['productCode', 'productName', 'categoryName', 'year', 'month', 'day'];

const ConsumptionPivot = () => {
  useTranslation('consumption', 'default');

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [rowAttribute, setRowAttribute] = useState('productName');
  const [colAttributes, setColAttributes] = useState('year,month');

  useEffect(() => {
    apiClient.get(CONSUMPTION_AGGREGATE)
      .then((response) => setData(response.data.data))
      .catch(() => setError(true));
  }, []);

  return (
    <PageWrapper>
      <div className="p-3">
        <h1><Translate id="react.consumption.header.label" defaultMessage="Consumption" /></h1>
        <ConsumptionButtonBar />
        <div className="border rounded p-3">
          <h5><Translate id="react.consumption.label" defaultMessage="Consumption" /></h5>
          <div className="form-inline mb-3">
            <label className="mr-2" htmlFor="pivot-rows">
              <Translate id="react.consumption.pivot.rows.label" defaultMessage="Rows" />
            </label>
            <select
              id="pivot-rows"
              className="form-control form-control-sm mr-4"
              value={rowAttribute}
              onChange={(e) => setRowAttribute(e.target.value)}
            >
              {ATTRIBUTES.map((attribute) => (
                <option key={attribute} value={attribute}>{attribute}</option>
              ))}
            </select>
            <label className="mr-2" htmlFor="pivot-cols">
              <Translate id="react.consumption.pivot.columns.label" defaultMessage="Columns" />
            </label>
            <select
              id="pivot-cols"
              className="form-control form-control-sm"
              value={colAttributes}
              onChange={(e) => setColAttributes(e.target.value)}
            >
              <option value="year,month">year, month</option>
              <option value="year">year</option>
              <option value="year,month,day">year, month, day</option>
              <option value="categoryName">categoryName</option>
            </select>
          </div>
          {error && (
            <div className="alert alert-danger">
              <Translate id="react.default.errorOccurred.label" defaultMessage="An unexpected error has occurred" />
            </div>
          )}
          {!error && !data && <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
          {!error && data && (
            <ConsumptionPivotTable
              data={data}
              rowAttributes={[rowAttribute]}
              colAttributes={colAttributes.split(',')}
              valueAttribute="quantity"
              rowLabel={rowAttribute}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ConsumptionPivot;
