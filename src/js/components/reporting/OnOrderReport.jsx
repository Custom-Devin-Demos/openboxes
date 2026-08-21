import React, { useCallback, useEffect, useState } from 'react';

import {
  REPORT_ON_ORDER_DETAILED,
  REPORT_ON_ORDER_SUMMARY,
} from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

const SUMMARY_COLUMNS = [
  { key: 'productCode', label: 'Code', translationId: 'react.report.onOrder.productCode.label' },
  { key: 'productName', label: 'Product', translationId: 'react.report.onOrder.product.label' },
  { key: 'qtyOrderedNotShipped', label: 'Qty Ordered Not Shipped', translationId: 'react.report.onOrder.qtyOrderedNotShipped.label' },
  { key: 'qtyShippedNotReceived', label: 'Qty Shipped Not Received', translationId: 'react.report.onOrder.qtyShippedNotReceived.label' },
  { key: 'totalOnOrder', label: 'Total On Order', translationId: 'react.report.onOrder.totalOnOrder.label' },
  { key: 'totalOnHand', label: 'Total On Hand', translationId: 'react.report.onOrder.totalOnHand.label' },
  { key: 'totalOnHandAndOnOrder', label: 'Total On Hand and On Order', translationId: 'react.report.onOrder.totalOnHandAndOnOrder.label' },
];

const DETAILED_COLUMNS = [
  { key: 'productCode', label: 'Code', translationId: 'react.report.onOrder.productCode.label' },
  { key: 'productName', label: 'Product', translationId: 'react.report.onOrder.product.label' },
  { key: 'qtyOrderedNotShipped', label: 'Qty Ordered Not Shipped', translationId: 'react.report.onOrder.qtyOrderedNotShipped.label' },
  { key: 'qtyShippedNotReceived', label: 'Qty Shipped Not Received', translationId: 'react.report.onOrder.qtyShippedNotReceived.label' },
  { key: 'orderNumber', label: 'PO #', translationId: 'react.report.onOrder.orderNumber.label' },
  { key: 'orderDescription', label: 'PO Description', translationId: 'react.report.onOrder.orderDescription.label' },
  { key: 'supplierOrganization', label: 'Supplier Organization', translationId: 'react.report.onOrder.supplierOrganization.label' },
  { key: 'supplierLocation', label: 'Supplier Location', translationId: 'react.report.onOrder.supplierLocation.label' },
  { key: 'supplierLocationGroup', label: 'Supplier Location Group', translationId: 'react.report.onOrder.supplierLocationGroup.label' },
  { key: 'estimatedGoodsReadyDate', label: 'Estimated Goods Ready Date', translationId: 'react.report.onOrder.estimatedGoodsReadyDate.label' },
  { key: 'shipmentNumber', label: 'Shipment Number', translationId: 'react.report.onOrder.shipmentNumber.label' },
  { key: 'shipDate', label: 'Ship Date', translationId: 'react.report.onOrder.shipDate.label' },
  { key: 'shipmentType', label: 'Shipment Type', translationId: 'react.report.onOrder.shipmentType.label' },
];

const OnOrderReport = () => {
  useTranslation('report', 'default');

  const [report, setReport] = useState('detailedReport');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const runReport = useCallback((reportType) => {
    setReport(reportType);
    setLoading(true);
    const url = reportType === 'summaryReport' ? REPORT_ON_ORDER_SUMMARY : REPORT_ON_ORDER_DETAILED;
    apiClient.get(url)
      .then((response) => setItems(response.data.aaData || []))
      .finally(() => setLoading(false));
  }, []);

  // Legacy screen loads the detailed report on page load by default
  useEffect(() => {
    runReport('detailedReport');
  }, [runReport]);

  const download = (downloadAction) => {
    // Legacy CSV downloads stay on the original controller action
    window.location.href = `${REPORT_URL.showOnOrderReport()}?downloadAction=${downloadAction}`;
  };

  const columns = report === 'summaryReport' ? SUMMARY_COLUMNS : DETAILED_COLUMNS;

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <h2><Translate id="react.default.button.download.label" defaultMessage="Download" /></h2>
            <div className="btn-group-vertical w-100 mb-2">
              <button type="button" className="btn btn-primary mb-1" onClick={() => runReport('summaryReport')}>
                <Translate id="react.report.onOrder.runSummary.label" defaultMessage="Run On Order Report Summary" />
              </button>
              <button type="button" className="btn btn-primary mb-1" onClick={() => runReport('detailedReport')}>
                <Translate id="react.report.onOrder.runDetails.label" defaultMessage="Run On Order Report Details" />
              </button>
              <button type="button" className="btn btn-secondary mb-1" onClick={() => download('downloadSummaryOnOrderReport')}>
                <Translate id="react.report.onOrder.downloadSummary.label" defaultMessage="Download On Order Report Summary" />
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => download('downloadOnOrderReport')}>
                <Translate id="react.report.onOrder.downloadDetails.label" defaultMessage="Download On Order Report Details" />
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              {report === 'summaryReport'
                ? <Translate id="react.report.onOrderReportSummary.label" defaultMessage="On Order Report Summary" />
                : <Translate id="react.report.onOrderReportDetails.label" defaultMessage="On Order Report Details" />}
            </h2>
            {loading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
            <table id="orderReportTable" className="table table-striped table-bordered">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="text-center">
                      <Translate id={column.translationId} defaultMessage={column.label} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!items.length && (
                  <tr>
                    <td colSpan={columns.length} className="text-center">
                      <Translate id="react.report.noData.message" defaultMessage="No records found" />
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={`${item.productCode}-${index}`}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={['qtyOrderedNotShipped', 'qtyShippedNotReceived'].includes(column.key) ? 'text-center' : ''}
                        title={column.key === 'productName' && item.displayName ? item.productName : undefined}
                      >
                        {column.key === 'productName'
                          ? (item.displayName ?? item.productName)
                          : item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default OnOrderReport;
