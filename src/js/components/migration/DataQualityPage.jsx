import React, { useEffect, useState } from 'react';

import {
  MIGRATION_RECEIPTS_WITHOUT_TRANSACTION,
  MIGRATION_SHIPMENTS_WITHOUT_TRANSACTIONS,
  MIGRATION_STOCK_MOVEMENTS_WITHOUT_SHIPMENT_ITEMS,
} from 'api/urls';
import { STOCK_MOVEMENT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const indicators = [
  {
    key: 'receiptsWithoutTransaction',
    label: "Receipts that have been received but don't have an inbound transaction associated with them",
    url: MIGRATION_RECEIPTS_WITHOUT_TRANSACTION,
    columns: [
      { key: 'shipmentNumber', label: 'Shipment Number', linkKey: 'shipmentId' },
      { key: 'shipmentStatus', label: 'Shipment Status' },
      { key: 'shipmentName', label: 'Shipment Name' },
      { key: 'receiptNumber', label: 'Receipt Number' },
      { key: 'receiptStatus', label: 'Receipt Status' },
    ],
  },
  {
    key: 'shipmentsWithoutTransactions',
    label: "Shipments with status shipped but don't have an outbound transaction associated with them",
    url: MIGRATION_SHIPMENTS_WITHOUT_TRANSACTIONS,
    columns: [
      { key: 'shipmentNumber', label: 'Shipment Number', linkKey: 'shipmentId' },
      { key: 'shipmentStatus', label: 'Shipment Status' },
      { key: 'origin', label: 'Origin' },
      { key: 'destination', label: 'Destination' },
    ],
  },
  {
    key: 'stockMovementsWithoutShipmentItems',
    label: 'Stock movements with status issued without shipment items',
    url: MIGRATION_STOCK_MOVEMENTS_WITHOUT_SHIPMENT_ITEMS,
    columns: [
      { key: 'identifier', label: 'Identifier', linkKey: 'id' },
      { key: 'status', label: 'Status' },
      { key: 'dateCreated', label: 'Date Created' },
      { key: 'origin', label: 'Origin' },
      { key: 'requested', label: 'Requested' },
      { key: 'picked', label: 'Picked' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'issued', label: 'Issued' },
    ],
  },
];

const DataQualityPage = () => {
  useTranslation('default');
  const [counts, setCounts] = useState({});
  const [details, setDetails] = useState({});

  useEffect(() => {
    indicators.forEach((indicator) => {
      apiClient.get(indicator.url, { params: { format: 'count' } })
        .then((response) => setCounts((prev) => ({
          ...prev,
          [indicator.key]: response.data.count,
        })));
    });
  }, []);

  const showDetails = (indicator) => async () => {
    const response = await apiClient.get(indicator.url);
    setDetails((prev) => ({ ...prev, [indicator.key]: response.data.data }));
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.dataQuality.label" defaultMessage="Data Quality" />
          </h2>
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((indicator) => (
                <tr className="prop" key={indicator.key}>
                  <td className="name">{indicator.label}</td>
                  <td className="value">
                    {counts[indicator.key] != null ? counts[indicator.key] : '...'}
                  </td>
                  <td>
                    <button type="button" className="button" onClick={showDetails(indicator)}>
                      <Translate id="react.default.button.list.label" defaultMessage="List" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {indicators.map((indicator) => (
            details[indicator.key] ? (
              <div key={indicator.key} className="box mt-3">
                <h2>{indicator.label}</h2>
                <table>
                  <thead>
                    <tr>
                      {indicator.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {details[indicator.key].map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr className="prop" key={index}>
                        {indicator.columns.map((column) => (
                          <td key={column.key}>
                            {column.linkKey && row[column.linkKey] ? (
                              <a target="_blank" rel="noopener noreferrer" href={STOCK_MOVEMENT_URL.show(row[column.linkKey])}>
                                {row[column.key]}
                              </a>
                            ) : `${row[column.key] != null ? row[column.key] : ''}`}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default DataQualityPage;
