import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import InventoryLevelApi from 'api/services/InventoryLevelApi';
import { formatDate } from 'components/stock-card/utils';
import { INVENTORY_LEVEL_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/inventory/inventoryLegacy.scss';

const MAX_RESULTS = 10;

const InventoryLevelList = ({ history, location }) => {
  useTranslation('inventoryLevel', 'inventory', 'product', 'default');

  const query = queryString.parse(location.search);
  const offset = parseInt(query.offset, 10) || 0;

  const [data, setData] = useState(null);
  const [q, setQ] = useState(query.q || '');
  const [locationId, setLocationId] = useState(query['location.id'] || '');

  const fetchData = useCallback(() => {
    InventoryLevelApi.search({
      params: { max: MAX_RESULTS, ...queryString.parse(location.search) },
    }).then((response) => setData(response.data));
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pushQuery = (params) => {
    history.push({
      pathname: location.pathname,
      search: queryString.stringify(params),
    });
  };

  const onSearch = (event) => {
    event.preventDefault();
    pushQuery({
      q: q || undefined,
      'location.id': locationId || undefined,
    });
  };

  const onSort = (property) => {
    const order = query.sort === property && query.order === 'asc' ? 'desc' : 'asc';
    pushQuery({
      ...query,
      sort: property,
      order,
    });
  };

  const downloadHref = queryString.stringifyUrl({
    url: INVENTORY_LEVEL_URL.list(),
    query: {
      q: q || undefined,
      'location.id': locationId || undefined,
      format: 'csv',
    },
  });

  const totalCount = data?.totalCount || 0;
  const pageCount = Math.ceil(totalCount / MAX_RESULTS);
  const currentPage = Math.floor(offset / MAX_RESULTS);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <div className="d-flex justify-content-between align-items-center">
          <h2>
            <Translate id="react.inventoryLevel.list.label" defaultMessage="List Inventory Levels" />
          </h2>
          <a className="btn btn-outline-secondary btn-sm" href={INVENTORY_LEVEL_URL.create()}>
            <Translate id="react.inventoryLevel.add.label" defaultMessage="Add Inventory Level" />
          </a>
        </div>
        <form onSubmit={onSearch}>
          <div className="form-row align-items-end">
            <div className="form-group col-md-4">
              <label htmlFor="q">
                <Translate id="react.inventory.product.label" defaultMessage="Product" />
              </label>
              <input
                id="q"
                type="text"
                className="form-control"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
            <div className="form-group col-md-4">
              <label htmlFor="locationId">
                <Translate id="react.inventoryLevel.inventory.label" defaultMessage="Inventory" />
              </label>
              <select
                id="locationId"
                className="form-control"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                <option value="" aria-label="None" />
                {data?.locations?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-4 text-right">
              <button type="submit" className="btn btn-primary btn-sm mr-2">
                <Translate id="react.default.button.search.label" defaultMessage="Search" />
              </button>
              <a className="btn btn-outline-secondary btn-sm" href={downloadHref}>
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </a>
            </div>
          </div>
        </form>
      </div>
      <div className="box p-3">
        <h2><Translate id="react.default.results.label" defaultMessage="Results" /></h2>
        <table className="table table-striped table-sm">
          <thead>
            <tr>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('status')}>
                  <Translate id="react.inventoryLevel.status.label" defaultMessage="Status" />
                </button>
              </th>
              <th aria-label="Product Code">
                <Translate id="react.inventory.productCode.label" defaultMessage="Product Code" />
              </th>
              <th aria-label="Product">
                <Translate id="react.inventory.product.label" defaultMessage="Product" />
              </th>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('inventory')}>
                  <Translate id="react.inventoryLevel.inventory.label" defaultMessage="Inventory" />
                </button>
              </th>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('minQuantity')}>
                  <Translate id="react.inventory.minQuantity.label" defaultMessage="Min Quantity" />
                </button>
              </th>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('reorderQuantity')}>
                  <Translate id="react.inventory.reorderQuantity.label" defaultMessage="Reorder Quantity" />
                </button>
              </th>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('maxQuantity')}>
                  <Translate id="react.inventory.maxQuantity.label" defaultMessage="Max Quantity" />
                </button>
              </th>
              <th>
                <button type="button" className="btn btn-link p-0" onClick={() => onSort('dateCreated')}>
                  <Translate id="react.inventoryLevel.dateCreated.label" defaultMessage="Date Created" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data && !data.inventoryLevels?.length && (
              <tr>
                <td colSpan="8" className="text-center">
                  <Translate id="react.default.noResults.label" defaultMessage="No results" />
                </td>
              </tr>
            )}
            {data?.inventoryLevels?.map((inventoryLevel) => (
              <tr key={inventoryLevel.id}>
                <td>{inventoryLevel.status}</td>
                <td>
                  <a href={INVENTORY_LEVEL_URL.edit(inventoryLevel.id)}>
                    {inventoryLevel.product?.productCode}
                  </a>
                </td>
                <td>
                  <a href={INVENTORY_LEVEL_URL.edit(inventoryLevel.id)}>
                    {inventoryLevel.product?.name}
                  </a>
                </td>
                <td>{inventoryLevel.inventory}</td>
                <td>{inventoryLevel.minQuantity}</td>
                <td>{inventoryLevel.reorderQuantity}</td>
                <td>{inventoryLevel.maxQuantity}</td>
                <td>{formatDate(inventoryLevel.dateCreated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageCount > 1 && (
          <div className="d-flex">
            {Array.from({ length: pageCount }, (unused, page) => (
              <button
                // eslint-disable-next-line react/no-array-index-key
                key={page}
                type="button"
                className={`btn btn-sm mr-1 ${
                  page === currentPage ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => pushQuery({
                  ...query, offset: page * MAX_RESULTS, max: MAX_RESULTS,
                })}
              >
                {page + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default withRouter(InventoryLevelList);

InventoryLevelList.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
