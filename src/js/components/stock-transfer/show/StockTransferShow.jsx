import React, { useEffect, useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import { STOCK_TRANSFER_SHOW_DETAILS } from 'api/urls';
import {
  CONTEXT_PATH,
  INVENTORY_ITEM_URL,
  REPLENISHMENT_URL,
  STOCK_TRANSFER_URL,
} from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/inventory/inventoryLegacy.scss';

const editUrl = (editAction, id) => {
  switch (editAction) {
    case 'createOutboundReturn':
      return STOCK_TRANSFER_URL.editOutbound(id);
    case 'createInboundReturn':
      return STOCK_TRANSFER_URL.editInbound(id);
    case 'replenishment':
      return REPLENISHMENT_URL.edit(id);
    default:
      return STOCK_TRANSFER_URL.createById(id);
  }
};

const StockTransferShow = () => {
  useTranslation('stockTransfer', 'default');

  const { stockTransferId } = useParams();
  const history = useHistory();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get(STOCK_TRANSFER_SHOW_DETAILS(stockTransferId))
      .then((response) => setData(response.data.data))
      .catch(() => history.push(STOCK_TRANSFER_URL.list()));
  }, [stockTransferId]);

  if (!data) {
    return (
      <PageWrapper className="inventory-legacy-page">
        <Translate id="react.default.loading.label" defaultMessage="Loading..." />
      </PageWrapper>
    );
  }

  const { labels } = data;

  const onDelete = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    if (window.confirm(labels.deleteConfirm)) {
      window.location.href = `${CONTEXT_PATH}/stockTransfer/eraseStockTransfer/${data.id}`;
    }
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div id="order-summary" className="summary d-flex justify-content-between align-items-start mb-2">
        <div className="title">
          <h2 className="d-inline-block mr-2 mb-0">{data.orderNumber}</h2>
          <small className="font-weight-bold">{data.dateCreated}</small>
        </div>
        <div className="tag tag-alert badge badge-danger">
          {data.statusLabel}
        </div>
      </div>
      <div className="buttonBar d-flex align-items-center mb-3">
        <a href={STOCK_TRANSFER_URL.list()} className="btn btn-outline-secondary btn-sm mr-2">
          {labels.listStockTransfers}
        </a>
        {data.editDisabled ? (
          <button type="button" className="btn btn-outline-secondary btn-sm mr-2" disabled title={data.editDisabledMessage}>
            {labels.editStockTransfer}
          </button>
        ) : (
          <a href={editUrl(data.editAction, data.id)} className="btn btn-outline-secondary btn-sm mr-2">
            {labels.editStockTransfer}
          </a>
        )}
        {data.canDelete && (
          <a
            href={`${CONTEXT_PATH}/stockTransfer/eraseStockTransfer/${data.id}`}
            className="btn btn-outline-secondary btn-sm mr-2"
            onClick={onDelete}
          >
            {labels.deleteButton}
          </a>
        )}
        <div className="ml-auto">
          <a
            href={STOCK_TRANSFER_URL.print(data.id)}
            className="btn btn-outline-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {labels.printStockTransfer}
          </a>
        </div>
      </div>
      <div className="row">
        <div className="col-md-4">
          <div id="details" className="box p-3 mb-3">
            <h2>{labels.orderHeader}</h2>
            <table className="table table-sm">
              <tbody>
                <tr>
                  <td className="font-weight-bold">{labels.orderNumber}</td>
                  <td>{data.orderNumber}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold">{labels.status}</td>
                  <td id="status">{data.statusLabel}</td>
                </tr>
                <tr>
                  <td className="font-weight-bold">{labels.location}</td>
                  <td>{data.originName}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="box p-3 mb-3">
            <h2>{labels.auditing}</h2>
            <table className="table table-sm">
              <tbody>
                <tr>
                  <td className="font-weight-bold">{labels.createdBy}</td>
                  <td>
                    <div>{data.createdByName}</div>
                    <small>{data.dateCreated}</small>
                  </td>
                </tr>
                <tr>
                  <td className="font-weight-bold">{labels.updatedBy}</td>
                  <td>
                    <div>{data.updatedByName}</div>
                    <small>{data.lastUpdated}</small>
                  </td>
                </tr>
                <tr>
                  <td className="font-weight-bold">{labels.completedBy}</td>
                  <td>
                    {data.completedByName ? (
                      <>
                        <div>{data.completedByName}</div>
                        <small>{data.dateCompleted}</small>
                      </>
                    ) : (
                      labels.none
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-8">
          <div className="box p-3">
            <h2>{labels.summary}</h2>
            {data.items && data.items.length ? (
              <table className="table table-sm order-items">
                <thead>
                  <tr>
                    <th>{labels.productCode}</th>
                    <th>{labels.productName}</th>
                    <th>{labels.lot}</th>
                    <th>{labels.expirationDate}</th>
                    <th>{labels.qtyTransferred}</th>
                    <th>{labels.transferredFrom}</th>
                    <th>{labels.transferredTo}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="order-item">
                      <td style={{ color: item.productColor }}>{item.productCode}</td>
                      <td>
                        <a
                          href={INVENTORY_ITEM_URL.showStockCard(item.productId)}
                          style={{ color: item.productColor }}
                        >
                          {item.productName}
                        </a>
                      </td>
                      <td>{item.lotNumber}</td>
                      <td>{item.expirationDate}</td>
                      <td>{item.quantity}</td>
                      <td>{item.originBin}</td>
                      <td>{item.destinationBin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="fade center empty">{labels.noItems}</div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StockTransferShow;
