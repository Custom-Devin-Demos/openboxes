/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import { REPORT_CYCLE_COUNT } from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const CycleCountReport = () => {
  useTranslation('report', 'default');

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.get(REPORT_CYCLE_COUNT)
      .then((response) => setRows(response.data.data))
      .catch(() => setError(true));
  }, []);

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.report.cycleCountReport.header.label" defaultMessage="Cycle Count Report" />
        </h1>
        <div className="border rounded p-3 mb-3">
          <div>
            <Translate
              id="react.report.cycleCountReport.welcome.label"
              defaultMessage="Welcome to the Cycle Count Report."
            />
          </div>
          <div>
            <Translate
              id="react.report.cycleCountReport.instructions.label"
              defaultMessage="Download the report to get a template for performing a cycle count."
            />
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">
              <Translate id="react.report.cycleCountReport.header.label" defaultMessage="Cycle Count Report" />
            </h5>
            <a className="btn btn-outline-secondary btn-sm" href={`${REPORT_URL.base}/showCycleCountReport?print=true`}>
              <Translate id="react.default.button.download.label" defaultMessage="Download" />
            </a>
          </div>
          {error && (
            <div className="alert alert-danger">
              <Translate id="react.default.errorOccurred.label" defaultMessage="An unexpected error has occurred" />
            </div>
          )}
          {!error && !rows && (
            <Translate id="react.default.loading.label" defaultMessage="Loading..." />
          )}
          {!error && rows && (
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th><Translate id="react.report.productCode.label" defaultMessage="Code" /></th>
                  <th><Translate id="react.report.product.label" defaultMessage="Product" /></th>
                  <th><Translate id="react.report.productFamily.label" defaultMessage="Product Family" /></th>
                  <th><Translate id="react.report.category.label" defaultMessage="Category" /></th>
                  <th><Translate id="react.report.formularies.label" defaultMessage="Formularies" /></th>
                  <th><Translate id="react.report.lotNumber.label" defaultMessage="Lot Number" /></th>
                  <th><Translate id="react.report.expirationDate.label" defaultMessage="Expiration Date" /></th>
                  <th><Translate id="react.report.abcClassification.label" defaultMessage="ABC Classification" /></th>
                  <th><Translate id="react.report.binLocation.label" defaultMessage="Bin Location" /></th>
                  <th><Translate id="react.report.status.label" defaultMessage="Status" /></th>
                  <th><Translate id="react.report.lastInventoryDate.label" defaultMessage="Last Inventory Date" /></th>
                  <th className="text-right"><Translate id="react.report.quantityOnHand.label" defaultMessage="QoH" /></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={index}>
                    <td>{row.productCode}</td>
                    <td>{row.productName}</td>
                    <td>{row.productFamily}</td>
                    <td>{row.category}</td>
                    <td>{row.formularies}</td>
                    <td>{row.lotNumber}</td>
                    <td>{row.expirationDate}</td>
                    <td>{row.abcClassification}</td>
                    <td>{row.binLocation}</td>
                    <td>{row.status}</td>
                    <td>{row.lastInventoryDate}</td>
                    <td className="text-right">{row.quantityOnHand}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={12}>
                      <Translate id="react.default.noResultsFound.label" defaultMessage="No results found" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default CycleCountReport;
