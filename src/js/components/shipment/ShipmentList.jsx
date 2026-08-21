/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { useSelector } from 'react-redux';

import { SHIPMENT_LIST } from 'api/urls';
import { CONTEXT_PATH, SHIPMENT_URL } from 'consts/applicationUrls';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const ShipmentTable = ({
  shipments, statusCode, isSuperuser, selectedIds, onToggle, onBulkAction,
}) => (
  <div className="box">
    <h2><Translate id="react.shipment.shipments.label" defaultMessage="Shipments" /></h2>
    <table className="dataTable">
      <thead>
        <tr>
          <th />
          <th />
          <th><Translate id="react.default.status.label" defaultMessage="Status" /></th>
          <th className="center"><Translate id="react.shipment.shipmentNumber.label" defaultMessage="Shipment number" /></th>
          <th><Translate id="react.shipment.shipment.label" defaultMessage="Shipment" /></th>
          <th className="center"><Translate id="react.shipment.items.label" defaultMessage="Items" /></th>
          <th><Translate id="react.shipment.origin.label" defaultMessage="Origin" /></th>
          <th><Translate id="react.shipment.destination.label" defaultMessage="Destination" /></th>
          <th><Translate id="react.shipment.shipped.label" defaultMessage="Shipped" /></th>
          <th><Translate id="react.shipment.received.label" defaultMessage="Received" /></th>
          <th><Translate id="react.default.lastUpdated.label" defaultMessage="Last updated" /></th>
        </tr>
      </thead>
      <tbody>
        {shipments.map((shipment) => (
          <tr key={shipment.id}>
            <td>
              <input
                type="checkbox"
                className={`shipment-item ${shipment.statusCode}`}
                name="shipment.id"
                value={shipment.id}
                checked={selectedIds.includes(shipment.id)}
                onChange={() => onToggle(shipment.id)}
              />
            </td>
            <td className="center middle">
              {shipment.shipmentType && (
                <img
                  src={`${CONTEXT_PATH}/static/images/icons/shipmentType/ShipmentType${shipment.shipmentType.defaultName}.png`}
                  alt={shipment.shipmentType.name}
                  style={{ verticalAlign: 'middle', width: '24px', height: '24px' }}
                />
              )}
            </td>
            <td className="middle">{shipment.statusName}</td>
            <td className="middle center">
              <a href={SHIPMENT_URL.showDetailsOverride(shipment.id)}>
                {shipment.shipmentNumber}
              </a>
            </td>
            <td className="middle left shipment-name">
              <a href={SHIPMENT_URL.showDetailsOverride(shipment.id)}>
                {shipment.name}
              </a>
            </td>
            <td className="middle center">{shipment.shipmentItemCount}</td>
            <td className="middle">{shipment.origin}</td>
            <td className="middle">{shipment.destination}</td>
            <td className="middle">
              {shipment.actualShippingDate
                ? (
                  <div title={shipment.actualShippingDate.title}>
                    {shipment.actualShippingDate.pretty}
                  </div>
                )
                : (
                  <div title={shipment.expectedShippingDate?.title}>
                    Expected
                    {' '}
                    {shipment.expectedShippingDate?.pretty}
                  </div>
                )}
            </td>
            <td className="middle">
              {shipment.actualDeliveryDate
                ? (
                  <div title={shipment.actualDeliveryDate.title}>
                    {shipment.actualDeliveryDate.pretty}
                  </div>
                )
                : (
                  <div title={shipment.expectedDeliveryDate?.title}>
                    Expected
                    {' '}
                    {shipment.expectedDeliveryDate?.pretty}
                  </div>
                )}
            </td>
            <td className="middle center">
              <div title={shipment.lastUpdated?.title}>{shipment.lastUpdated?.pretty}</div>
            </td>
          </tr>
        ))}
      </tbody>
      {isSuperuser && (
        <tfoot>
          <tr>
            <td />
            <td colSpan="11" className="left">
              <div className="bulk-actions">
                {statusCode === 'SHIPPED' && (
                  <>
                    <div className="button-group">
                      <button type="button" className="button icon approve" onClick={() => onBulkAction('bulkReceiveShipments')}>
                        <Translate id="react.shipment.bulkReceive.label" defaultMessage="Bulk Receive" />
                      </button>
                      <button type="button" className="button icon tag" onClick={() => onBulkAction('bulkMarkAsReceived')}>
                        <Translate id="react.shipment.bulkMarkAsReceived.label" defaultMessage="Bulk Mark as Received" />
                      </button>
                    </div>
                    <div className="button-group">
                      <button type="button" className="button icon loop" onClick={() => onBulkAction('bulkRollbackShipments')}>
                        <Translate id="react.shipment.bulkRollback.label" defaultMessage="Bulk Rollback" />
                      </button>
                    </div>
                  </>
                )}
                {statusCode === 'RECEIVED' && (
                  <div className="button-group">
                    <button type="button" className="button icon loop" onClick={() => onBulkAction('bulkRollbackShipments')}>
                      <Translate id="react.shipment.bulkRollback.label" defaultMessage="Bulk Rollback" />
                    </button>
                  </div>
                )}
                <div className="button-group">
                  <button type="button" className="button icon remove" onClick={() => onBulkAction('bulkDeleteShipments')}>
                    <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

ShipmentTable.propTypes = {
  shipments: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  statusCode: PropTypes.string.isRequired,
  isSuperuser: PropTypes.bool.isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggle: PropTypes.func.isRequired,
  onBulkAction: PropTypes.func.isRequired,
};

const ShipmentList = ({ location }) => {
  const queryParams = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    terms: queryParams.terms || '',
    status: queryParams.status || '',
    type: queryParams.type || 'outgoing',
    shipmentType: queryParams.shipmentType || '',
    origin: queryParams.origin || '',
    destination: queryParams.destination || '',
    max: queryParams.max || '',
  });
  const isSuperuser = useSelector((state) => state.session.isSuperuser);

  useEffect(() => {
    apiClient.get(SHIPMENT_LIST, { params: queryParams })
      .then((response) => {
        setData(response.data.data);
        setSelectedTab(null);
        setSelectedIds([]);
      });
  }, [location.search]);

  const onToggle = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    ));
  };

  const onBulkAction = (action) => {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = SHIPMENT_URL.bulkAction(action);
    if (data?.incoming) {
      const typeInput = document.createElement('input');
      typeInput.type = 'hidden';
      typeInput.name = 'type';
      typeInput.value = 'incoming';
      form.appendChild(typeInput);
    }
    selectedIds.forEach((id) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'shipment.id';
      input.value = id;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const onSearch = (event) => {
    event.preventDefault();
    const query = Object.entries(filters)
      .filter(([, value]) => value !== '' && value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    window.location.href = SHIPMENT_URL.list(query);
  };

  const sortedShipments = data
    ? [...data.shipments].sort((a, b) => a.statusCode.localeCompare(b.statusCode))
    : [];
  const shipmentsByStatus = sortedShipments.reduce((acc, shipment) => ({
    ...acc,
    [shipment.statusCode]: [...(acc[shipment.statusCode] || []), shipment],
  }), {});
  const statusCodes = Object.keys(shipmentsByStatus);
  const activeTab = selectedTab && statusCodes.includes(selectedTab)
    ? selectedTab : statusCodes[0];

  return (
    <div className="body">
      {data && data.maxReached && (
        <div className="message" role="status" aria-label="message">
          <ul>
            <li>
              <Translate
                id="react.shipment.limitHasBeenReached.message"
                defaultMessage={`Your search returned more than ${data.max} records. Please refine your search or use the export feature.`}
                data={{ max: data.max }}
              />
            </li>
          </ul>
        </div>
      )}
      <div className="yui-gf">
        <div className="yui-u first">
          <div>
            <form method="GET" onSubmit={onSearch}>
              <div className="box">
                <h2><Translate id="react.default.filters.label" defaultMessage="Filters" /></h2>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <div>
                          <label><Translate id="react.default.searchTerms.label" defaultMessage="Search terms" /></label>
                        </div>
                        <div>
                          <input
                            type="text"
                            name="terms"
                            value={filters.terms}
                            onChange={(e) => setFilters({ ...filters, terms: e.target.value })}
                            style={{ width: '100%' }}
                            className="text medium"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td>
                        <div>
                          <div>
                            <label><Translate id="react.shipment.status.label" defaultMessage="Status" /></label>
                          </div>
                          <div>
                            <select
                              name="status"
                              value={filters.status}
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                              <option value="" />
                              {data?.filterOptions?.statuses?.map((status) => (
                                <option key={status.id} value={status.id}>{status.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td>
                        <div>
                          <label><Translate id="react.shipment.directionType.label" defaultMessage="Direction Type" /></label>
                        </div>
                        <div>
                          <select
                            name="type"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                          >
                            <option value="outgoing">Outbound</option>
                            <option value="incoming">Inbound</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td>
                        <div>
                          <div>
                            <label><Translate id="react.shipment.shipmentType.label" defaultMessage="Shipment type" /></label>
                          </div>
                          <div>
                            <select
                              name="shipmentType"
                              value={filters.shipmentType}
                              onChange={(e) => setFilters({
                                ...filters, shipmentType: e.target.value,
                              })}
                            >
                              <option value="" />
                              {data?.filterOptions?.shipmentTypes?.map((shipmentType) => (
                                <option key={shipmentType.id} value={shipmentType.id}>
                                  {shipmentType.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td>
                        {data?.incoming ? (
                          <>
                            <label><Translate id="react.shipment.origin.label" defaultMessage="Origin" /></label>
                            <div>
                              <select
                                name="origin"
                                value={filters.origin}
                                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                              >
                                <option value="" />
                                {data?.filterOptions?.locations?.map((loc) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <label><Translate id="react.shipment.destination.label" defaultMessage="Destination" /></label>
                            <div>
                              <select
                                name="destination"
                                value={filters.destination}
                                onChange={(e) => setFilters({
                                  ...filters, destination: e.target.value,
                                })}
                              >
                                <option value="" />
                                {data?.filterOptions?.locations?.map((loc) => (
                                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                    <tr className="prop">
                      <td className="left">
                        <label><Translate id="react.default.limit.label" defaultMessage="Limit" /></label>
                        <select
                          name="max"
                          value={filters.max}
                          onChange={(e) => setFilters({ ...filters, max: e.target.value })}
                        >
                          <option value="" />
                          {[10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000].map((max) => (
                            <option key={max} value={max}>{max}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr className="prop">
                      <td colSpan="2">
                        <div className="center">
                          <button type="submit" className="button icon search" name="search" value="true">
                            <Translate id="react.default.button.search.label" defaultMessage="Search" />
                          </button>
                          {' '}
                          <a href={SHIPMENT_URL.list()} className="button icon reload">
                            <Translate id="react.default.button.reset.label" defaultMessage="Reset" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
          </div>
        </div>
        <div className="yui-u">
          {data && sortedShipments.length > 0 && (
            <div className="tabs">
              <ul>
                {statusCodes.map((statusCode) => (
                  <li key={statusCode} className={statusCode === activeTab ? 'ui-tabs-selected ui-state-active' : ''}>
                    <a
                      href={`#${statusCode}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTab(statusCode);
                      }}
                    >
                      {shipmentsByStatus[statusCode][0].statusName}
                      {' '}
                      <span className="fade">
                        (
                        {shipmentsByStatus[statusCode].length}
                        )
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              {activeTab && (
                <div id={activeTab} style={{ padding: '10px' }}>
                  <ShipmentTable
                    shipments={shipmentsByStatus[activeTab]}
                    statusCode={activeTab}
                    isSuperuser={isSuperuser}
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                    onBulkAction={onBulkAction}
                  />
                </div>
              )}
            </div>
          )}
          {data && sortedShipments.length === 0 && (
            <div className="box">
              <h2><Translate id="react.shipment.shipments.label" defaultMessage="Shipments" /></h2>
              <div className="center empty">
                <Translate
                  id="react.shipment.noShipmentsMatchingConditions.message"
                  defaultMessage="There are no shipments matching the given conditions"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentList;

ShipmentList.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};
