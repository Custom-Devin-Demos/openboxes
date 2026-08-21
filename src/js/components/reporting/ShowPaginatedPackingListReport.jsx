/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';

import { SHIPMENT_SELECT_OPTIONS } from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import PaginatedPackingListReport from './PaginatedPackingListReport';

const ShowPaginatedPackingListReport = ({ location, history }) => {
  useTranslation('report', 'default');

  const params = queryString.parse(location.search);
  const shipmentId = params['shipment.id'] || '';

  const [shipmentOptions, setShipmentOptions] = useState([]);

  useEffect(() => {
    apiClient.get(SHIPMENT_SELECT_OPTIONS)
      .then((response) => setShipmentOptions(response.data.data || []));
  }, []);

  const onShipmentChange = (event) => {
    const { value } = event.target;
    history.push({
      pathname: location.pathname,
      search: value ? queryString.stringify({ 'shipment.id': value }) : '',
    });
  };

  return (
    <PageWrapper>
      <div className="box p-3 mb-2">
        <div className="form-group">
          <label htmlFor="shipment">
            <Translate id="react.report.shipment.label" defaultMessage="Shipment" />
          </label>
          <select
            id="shipment"
            name="shipment.id"
            className="form-control"
            value={shipmentId}
            onChange={onShipmentChange}
          >
            <option value="" />
            {shipmentOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="font-weight-bold mr-2">
            <Translate id="react.report.exportAs.label" defaultMessage="Export as" />
          </span>
          {shipmentId
            ? (
              <>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${REPORT_URL.showShippingReport()}?print=true&shipment.id=${shipmentId}`}
                >
                  <Translate id="react.report.exportAs.html.label" defaultMessage="HTML" />
                </a>
                {' | '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${REPORT_URL.downloadShippingReport()}?format=pdf&url=${encodeURIComponent(location.pathname)}&shipment.id=${shipmentId}`}
                >
                  <Translate id="react.report.exportAs.pdf.label" defaultMessage="PDF" />
                </a>
              </>
            )
            : <Translate id="react.report.selectShipment.label" defaultMessage="Please select a shipment" />}
        </div>
      </div>
      {shipmentId && <PaginatedPackingListReport location={location} />}
    </PageWrapper>
  );
};

export default ShowPaginatedPackingListReport;

ShowPaginatedPackingListReport.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
    pathname: PropTypes.string,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
};
