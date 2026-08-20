import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import { INVENTORY_BROWSE } from 'api/urls';
import { INVENTORY_ITEM_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const InventoryBrowser = ({ history, location }) => {
  useTranslation('inventory', 'product', 'default');

  const query = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [searchTerms, setSearchTerms] = useState(query.searchTerms || '');
  const [categoryId, setCategoryId] = useState(query.categoryId || '');
  const [tags, setTags] = useState([].concat(query.tags || []));
  const [catalogs, setCatalogs] = useState([].concat(query.catalogs || []));
  const [productTypes, setProductTypes] = useState([].concat(query['productTypes.id'] || []));
  const [showOutOfStockProducts, setShowOutOfStockProducts] = useState(
    query.showOutOfStockProducts !== 'false',
  );

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_BROWSE, { params: queryString.parse(location.search) })
      .then((response) => setData(response.data));
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateQuery = (newParams) => {
    const params = { ...queryString.parse(location.search), ...newParams };
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === undefined || params[key] === null
        || (Array.isArray(params[key]) && !params[key].length)) {
        delete params[key];
      }
    });
    history.push({ pathname: location.pathname, search: queryString.stringify(params) });
  };

  const onSearch = (event) => {
    event.preventDefault();
    updateQuery({
      searchTerms,
      categoryId,
      tags,
      catalogs,
      'productTypes.id': productTypes,
      showOutOfStockProducts,
      offset: 0,
    });
  };

  const max = parseInt(data?.maxResults || query.max || 10, 10);
  const offset = parseInt(data?.offset || query.offset || 0, 10);
  const totalCount = data?.totalCount || 0;

  const onPageChange = (newOffset) => {
    updateQuery({ max, offset: newOffset });
  };

  const onMaxChange = (event) => {
    updateQuery({ max: event.target.value, offset: 0 });
  };

  const multiSelectValues = (event) => Array.from(event.target.selectedOptions)
    .map((option) => option.value);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.browse.label" defaultMessage="Browse inventory" />
        </h2>
        <form onSubmit={onSearch} className="inventory-browser-filters">
          <div className="form-row align-items-end">
            <div className="form-group col-md-3">
              <label htmlFor="searchTerms">
                <Translate id="react.inventory.searchTerms.label" defaultMessage="Search" />
              </label>
              <input
                id="searchTerms"
                name="searchTerms"
                className="form-control"
                type="text"
                value={searchTerms}
                onChange={(event) => setSearchTerms(event.target.value)}
              />
            </div>
            <div className="form-group col-md-2">
              <label htmlFor="categoryId">
                <Translate id="react.inventory.category.label" defaultMessage="Category" />
              </label>
              <select
                id="categoryId"
                name="categoryId"
                className="form-control"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="" aria-label="empty" />
                {data?.filterOptions?.categories?.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-2">
              <label htmlFor="tags">
                <Translate id="react.inventory.tags.label" defaultMessage="Tags" />
              </label>
              <select
                id="tags"
                name="tags"
                className="form-control"
                multiple
                value={tags}
                onChange={(event) => setTags(multiSelectValues(event))}
              >
                {data?.filterOptions?.tags?.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-2">
              <label htmlFor="catalogs">
                <Translate id="react.inventory.catalogs.label" defaultMessage="Catalogs" />
              </label>
              <select
                id="catalogs"
                name="catalogs"
                className="form-control"
                multiple
                value={catalogs}
                onChange={(event) => setCatalogs(multiSelectValues(event))}
              >
                {data?.filterOptions?.catalogs?.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>{catalog.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-2">
              <label htmlFor="productTypes">
                <Translate id="react.inventory.productTypes.label" defaultMessage="Product types" />
              </label>
              <select
                id="productTypes"
                name="productTypes.id"
                className="form-control"
                multiple
                value={productTypes}
                onChange={(event) => setProductTypes(multiSelectValues(event))}
              >
                {data?.filterOptions?.productTypes?.map((productType) => (
                  <option key={productType.id} value={productType.id}>{productType.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-1">
              <div className="form-check">
                <input
                  id="showOutOfStockProducts"
                  className="form-check-input"
                  type="checkbox"
                  checked={showOutOfStockProducts}
                  onChange={(event) => setShowOutOfStockProducts(event.target.checked)}
                />
                <label className="form-check-label" htmlFor="showOutOfStockProducts">
                  <Translate id="react.inventory.showOutOfStockProducts.label" defaultMessage="Show out of stock" />
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-sm mt-1">
                <Translate id="react.default.button.search.label" defaultMessage="Search" />
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="box p-3">
        <div className="d-flex justify-content-between align-items-center">
          {totalCount ? (
            <span>
              <Translate
                id="react.inventory.browseTab.label"
                defaultMessage={`Showing ${offset + 1} to ${Math.min(offset + max, totalCount)} of ${totalCount} results`}
                data={{
                  rangeBegin: offset + 1,
                  rangeEnd: Math.min(offset + max, totalCount),
                  totalResults: totalCount,
                }}
              />
            </span>
          ) : (
            <span>
              <Translate id="react.inventory.showingNoResults.label" defaultMessage="Showing 0 results" />
            </span>
          )}
          <div>
            <label htmlFor="maxResults" className="mr-1">
              <Translate id="react.inventory.browseResultsPerPage.label" defaultMessage="Results per page" />
            </label>
            <select id="maxResults" value={max} onChange={onMaxChange}>
              {[10, 25, 50, 100].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        <table id="inventoryBrowserTable" className="table table-striped table-sm mt-2">
          <thead>
            <tr>
              <th>
                <Translate id="react.inventory.product.label" defaultMessage="Product" />
              </th>
              <th>
                <Translate id="react.inventory.productType.label" defaultMessage="Product type" />
              </th>
              <th>
                <Translate id="react.inventory.category.label" defaultMessage="Category" />
              </th>
              <th>
                <Translate id="react.inventory.tag.label" defaultMessage="Tags" />
              </th>
              <th>
                <Translate id="react.inventory.productCatalog.label" defaultMessage="Formulary" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.qty.label" defaultMessage="Quantity" />
              </th>
            </tr>
          </thead>
          <tbody>
            {data && !data.searchResults?.length && (
              <tr>
                <td colSpan="6" className="text-center">
                  <Translate
                    id="react.inventory.searchNoMatch.message"
                    defaultMessage="No products match your search criteria"
                  />
                </td>
              </tr>
            )}
            {data?.searchResults?.map((item) => (
              <tr key={item.id}>
                <td>
                  <a href={INVENTORY_ITEM_URL.showStockCard(item.id)}>
                    {item.productCode}
                    {' '}
                    {item.name}
                  </a>
                </td>
                <td>{item.productType?.name}</td>
                <td>{item.category?.name}</td>
                <td>
                  {item.tags?.map((tag) => (
                    <span key={tag.id} className="badge badge-secondary mr-1">{tag.tag}</span>
                  ))}
                </td>
                <td>
                  {item.catalogs?.map((catalog) => (
                    <span key={catalog.id} className="badge badge-info mr-1">{catalog.name}</span>
                  ))}
                </td>
                <td className="text-right">{item.quantityOnHand}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mr-2"
            disabled={offset <= 0}
            onClick={() => onPageChange(Math.max(offset - max, 0))}
          >
            <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={offset + max >= totalCount}
            onClick={() => onPageChange(offset + max)}
          >
            <Translate id="react.default.button.next.label" defaultMessage="Next" />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(InventoryBrowser);

InventoryBrowser.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
