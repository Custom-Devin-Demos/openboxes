import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import { INVENTORY_LIST } from 'api/urls';
import { INVENTORY_ITEM_URL, INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const InventoryList = ({ history, location }) => {
  useTranslation('inventory', 'product', 'default');

  const query = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([].concat(query.categories || []));
  const [includeSubcategories, setIncludeSubcategories] = useState(
    !query._includeSubcategories || query.includeSubcategories === 'on',
  );

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_LIST, { params: queryString.parse(location.search) })
      .then((response) => setData(response.data));
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRunReport = (event) => {
    event.preventDefault();
    const params = {
      categories,
      _includeSubcategories: '',
      ...(includeSubcategories ? { includeSubcategories: 'on' } : {}),
    };
    history.push({ pathname: location.pathname, search: queryString.stringify(params) });
  };

  const downloadUrl = queryString.stringifyUrl({
    url: INVENTORY_URL.list(),
    query: {
      ...queryString.parse(location.search),
      button: 'download',
    },
  });

  const hasRoleFinance = data?.hasRoleFinance;

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate id="react.inventory.currentInventory.label" defaultMessage="Current inventory" />
        </h2>
        <form onSubmit={onRunReport}>
          <div className="form-row align-items-end">
            <div className="form-group col-md-4">
              <label htmlFor="categories">
                <Translate id="react.inventory.category.label" defaultMessage="Category" />
              </label>
              <select
                id="categories"
                name="categories"
                className="form-control"
                multiple
                value={categories}
                onChange={(event) => setCategories(
                  Array.from(event.target.selectedOptions).map((option) => option.value),
                )}
              >
                {data?.categories?.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-md-3">
              <div className="form-check">
                <input
                  id="includeSubcategories"
                  className="form-check-input"
                  type="checkbox"
                  checked={includeSubcategories}
                  onChange={(event) => setIncludeSubcategories(event.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeSubcategories">
                  <Translate id="react.inventory.includeSubcategories.label" defaultMessage="Include subcategories" />
                </label>
              </div>
            </div>
            <div className="form-group col-md-5 text-right">
              <button type="submit" className="btn btn-primary btn-sm mr-2">
                <Translate id="react.default.button.runReport.label" defaultMessage="Run report" />
              </button>
              <a className="btn btn-outline-secondary btn-sm" href={downloadUrl}>
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </a>
            </div>
          </div>
        </form>
      </div>
      <div className="box p-3">
        <table id="inventoryTable" className="table table-striped table-sm">
          <thead>
            <tr>
              <th>
                <Translate id="react.inventory.status.label" defaultMessage="Status" />
              </th>
              <th>
                <Translate id="react.inventory.productCode.label" defaultMessage="Code" />
              </th>
              <th>
                <Translate id="react.inventory.product.label" defaultMessage="Product" />
              </th>
              <th>
                <Translate id="react.inventory.productFamily.label" defaultMessage="Product family" />
              </th>
              <th>
                <Translate id="react.inventory.category.label" defaultMessage="Category" />
              </th>
              <th>
                <Translate id="react.inventory.abcClass.label" defaultMessage="ABC" />
              </th>
              <th>
                <Translate id="react.inventory.unitOfMeasure.label" defaultMessage="Unit" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.minQuantity.label" defaultMessage="Min" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.reorderQuantity.label" defaultMessage="Reorder" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.maxQuantity.label" defaultMessage="Max" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.quantityOnHand.label" defaultMessage="QoH" />
              </th>
              <th className="text-right">
                <Translate id="react.inventory.quantityAvailableToPromise.label" defaultMessage="Available" />
              </th>
              {hasRoleFinance && (
                <th className="text-right">
                  <Translate id="react.inventory.unitPrice.label" defaultMessage="Unit price" />
                </th>
              )}
              {hasRoleFinance && (
                <th className="text-right">
                  <Translate id="react.inventory.totalValue.label" defaultMessage="Total value" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data && !data.data?.length && (
              <tr>
                <td colSpan={hasRoleFinance ? 14 : 12} className="text-center">
                  <Translate id="react.default.noResults.label" defaultMessage="No results" />
                </td>
              </tr>
            )}
            {data?.data?.map((item) => (
              <tr key={item.product.id}>
                <td>{item.status}</td>
                <td>{item.product.productCode}</td>
                <td>
                  <a href={INVENTORY_ITEM_URL.showStockCard(item.product.id)}>
                    {item.product.name}
                  </a>
                </td>
                <td>{item.product.productGroups?.join(', ')}</td>
                <td>{item.product.category}</td>
                <td>{item.product.abcClass}</td>
                <td>{item.product.unitOfMeasure}</td>
                <td className="text-right">{item.minQuantity}</td>
                <td className="text-right">{item.reorderQuantity}</td>
                <td className="text-right">{item.maxQuantity}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{item.quantityAvailableToPromise}</td>
                {hasRoleFinance && (
                  <td className="text-right">{item.product.pricePerUnit}</td>
                )}
                {hasRoleFinance && (
                  <td className="text-right">{item.totalValue}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default withRouter(InventoryList);

InventoryList.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
};
