import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import CategoryApi from 'api/services/CategoryApi';
import ProductScreenApi from 'api/services/ProductScreenApi';
import UserApi from 'api/services/UserApi';
import notification from 'components/Layout/notifications/notification';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const TEXT_FILTERS = [
  { name: 'name', label: 'react.product.name.label', defaultMessage: 'Name' },
  {
    name: 'productCode', label: 'react.product.productCode.label', defaultMessage: 'Code', nullable: true,
  },
  {
    name: 'unitOfMeasure', label: 'react.product.unitOfMeasure.label', defaultMessage: 'Unit of measure', nullable: true,
  },
  {
    name: 'brandName', label: 'react.product.brandName.label', defaultMessage: 'Brand', nullable: true,
  },
  {
    name: 'manufacturer', label: 'react.product.manufacturer.label', defaultMessage: 'Manufacturer', nullable: true,
  },
  {
    name: 'manufacturerCode', label: 'react.product.manufacturerCode.label', defaultMessage: 'Manufacturer code', nullable: true,
  },
  {
    name: 'vendor', label: 'react.product.vendor.label', defaultMessage: 'Vendor', nullable: true,
  },
  {
    name: 'vendorCode', label: 'react.product.vendorCode.label', defaultMessage: 'Vendor code', nullable: true,
  },
];

const BatchEditPage = () => {
  useTranslation('product', 'default');

  const location = useLocation();
  const history = useHistory();
  const parsedQuery = queryString.parse(location.search);

  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: parsedQuery.categoryId || '',
    includeCategoryChildren: parsedQuery.includeCategoryChildren === 'on',
    name: parsedQuery.name || '',
    productCode: parsedQuery.productCode || '',
    productCodeIsNull: parsedQuery.productCodeIsNull === 'on',
    unitOfMeasure: parsedQuery.unitOfMeasure || '',
    unitOfMeasureIsNull: parsedQuery.unitOfMeasureIsNull === 'on',
    brandName: parsedQuery.brandName || '',
    brandNameIsNull: parsedQuery.brandNameIsNull === 'on',
    manufacturer: parsedQuery.manufacturer || '',
    manufacturerIsNull: parsedQuery.manufacturerIsNull === 'on',
    manufacturerCode: parsedQuery.manufacturerCode || '',
    manufacturerCodeIsNull: parsedQuery.manufacturerCodeIsNull === 'on',
    vendor: parsedQuery.vendor || '',
    vendorIsNull: parsedQuery.vendorIsNull === 'on',
    vendorCode: parsedQuery.vendorCode || '',
    vendorCodeIsNull: parsedQuery.vendorCodeIsNull === 'on',
    createdById: parsedQuery.createdById || '',
    updatedById: parsedQuery.updatedById || '',
  });
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    CategoryApi.getCategoryOptions()
      .then((response) => setCategories(response.data.data || []));
    UserApi.getUsersOptions()
      .then((response) => setUsers(response.data.data || []));
  }, []);

  const buildSearchParams = () => {
    const searchParams = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value === true) {
        searchParams[key] = 'on';
      } else if (value) {
        searchParams[key] = value;
      }
    });
    return searchParams;
  };

  useEffect(() => {
    if (!parsedQuery.categoryId) {
      setProducts([]);
      setLoaded(false);
      return;
    }
    ProductScreenApi.getBatchEditData({ params: parsedQuery })
      .then((response) => {
        setProducts(response.data.products || []);
        setLoaded(true);
      });
  }, [location.search]);

  const handleSearch = (event) => {
    event.preventDefault();
    history.push({ search: queryString.stringify(buildSearchParams()) });
  };

  const updateProduct = (index, field, value) => {
    setProducts((previous) => previous.map((product, productIndex) =>
      (productIndex === index ? { ...product, [field]: value } : product)));
  };

  const handleSave = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      const response = await ProductScreenApi.batchSave({
        products: products.map((product) => ({
          id: product.id,
          productCode: product.productCode,
          name: product.name,
          categoryId: product.category?.id,
          manufacturer: product.manufacturer,
          manufacturerCode: product.manufacturerCode,
          brandName: product.brandName,
          unitOfMeasure: product.unitOfMeasure,
          coldChain: product.coldChain,
        })),
      });
      notification(NotificationType.SUCCESS)({ message: response.data.message });
    } catch (err) {
      setErrors(err?.response?.data?.errorMessages || ['Unable to save products']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.product.batchEdit.label" defaultMessage="Batch edit product" />
        </h1>
        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="m-0">
              {errors.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </div>
        )}
        <div className="row">
          <div className="col-md-3">
            <div className="box">
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label htmlFor="filter-category">
                    <Translate id="react.product.category.label" defaultMessage="Category" />
                  </label>
                  <select
                    id="filter-category"
                    className="form-control"
                    value={filters.categoryId}
                    onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}
                  >
                    <option value="">
                      Choose category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label || category.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-check">
                    <input
                      id="filter-include-children"
                      className="form-check-input"
                      type="checkbox"
                      checked={filters.includeCategoryChildren}
                      onChange={(event) =>
                        setFilters({ ...filters, includeCategoryChildren: event.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="filter-include-children">
                      <Translate id="react.product.includeCategoryChildren.label" defaultMessage="Include category children" />
                    </label>
                  </div>
                </div>
                {TEXT_FILTERS.map((filter) => (
                  <div className="form-group" key={filter.name}>
                    <label htmlFor={`filter-${filter.name}`}>
                      <Translate id={filter.label} defaultMessage={filter.defaultMessage} />
                    </label>
                    <input
                      id={`filter-${filter.name}`}
                      className="form-control"
                      type="text"
                      value={filters[filter.name]}
                      onChange={(event) =>
                        setFilters({ ...filters, [filter.name]: event.target.value })}
                    />
                    {filter.nullable && (
                      <div className="form-check">
                        <input
                          id={`filter-${filter.name}-is-null`}
                          className="form-check-input"
                          type="checkbox"
                          checked={filters[`${filter.name}IsNull`]}
                          onChange={(event) =>
                            setFilters({ ...filters, [`${filter.name}IsNull`]: event.target.checked })}
                        />
                        <label className="form-check-label" htmlFor={`filter-${filter.name}-is-null`}>
                          <Translate id="react.default.empty.label" defaultMessage="Empty" />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor="filter-created-by">
                    <Translate id="react.product.createdBy.label" defaultMessage="Created by" />
                  </label>
                  <select
                    id="filter-created-by"
                    className="form-control"
                    value={filters.createdById}
                    onChange={(event) =>
                      setFilters({ ...filters, createdById: event.target.value })}
                  >
                    <option value="" aria-label="Empty" />
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.label || user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="filter-updated-by">
                    <Translate id="react.product.updatedBy.label" defaultMessage="Updated by" />
                  </label>
                  <select
                    id="filter-updated-by"
                    className="form-control"
                    value={filters.updatedById}
                    onChange={(event) =>
                      setFilters({ ...filters, updatedById: event.target.value })}
                  >
                    <option value="" aria-label="Empty" />
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.label || user.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  <Translate id="react.default.button.search.label" defaultMessage="Search" />
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-9">
            <div className="box">
              {!loaded && (
                <p>
                  <Translate
                    id="react.product.batchEdit.chooseCategory.message"
                    defaultMessage="Choose a category to edit products"
                  />
                </p>
              )}
              {loaded && (
                <>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th aria-label="Code"><Translate id="react.product.productCode.label" defaultMessage="Code" /></th>
                          <th aria-label="Name"><Translate id="react.product.name.label" defaultMessage="Name" /></th>
                          <th aria-label="Category"><Translate id="react.product.category.label" defaultMessage="Category" /></th>
                          <th aria-label="Manufacturer"><Translate id="react.product.manufacturer.label" defaultMessage="Manufacturer" /></th>
                          <th aria-label="Manufacturer code"><Translate id="react.product.manufacturerCode.label" defaultMessage="Manufacturer code" /></th>
                          <th aria-label="Brand"><Translate id="react.product.brandName.label" defaultMessage="Brand" /></th>
                          <th aria-label="Unit of measure"><Translate id="react.product.unitOfMeasure.label" defaultMessage="Unit of measure" /></th>
                          <th aria-label="Cold chain"><Translate id="react.product.coldChain.label" defaultMessage="Cold chain" /></th>
                          <th aria-label="Updated by"><Translate id="react.product.updatedBy.label" defaultMessage="Updated by" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 && (
                          <tr>
                            <td colSpan="9">
                              <Translate id="react.default.noResults.message" defaultMessage="No results" />
                            </td>
                          </tr>
                        )}
                        {products.map((product, index) => (
                          <tr key={product.id}>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.productCode || ''}
                                onChange={(event) => updateProduct(index, 'productCode', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.name || ''}
                                onChange={(event) => updateProduct(index, 'name', event.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className="form-control form-control-sm"
                                value={product.category?.id || ''}
                                onChange={(event) => updateProduct(index, 'category', { id: event.target.value })}
                              >
                                <option value="" aria-label="Empty" />
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.label || category.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.manufacturer || ''}
                                onChange={(event) => updateProduct(index, 'manufacturer', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.manufacturerCode || ''}
                                onChange={(event) => updateProduct(index, 'manufacturerCode', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.brandName || ''}
                                onChange={(event) => updateProduct(index, 'brandName', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                type="text"
                                value={product.unitOfMeasure || ''}
                                onChange={(event) => updateProduct(index, 'unitOfMeasure', event.target.value)}
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={product.coldChain || false}
                                onChange={(event) => updateProduct(index, 'coldChain', event.target.checked)}
                              />
                            </td>
                            <td>{product.updatedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={handleSave}
                    >
                      <Translate id="react.default.button.save.label" defaultMessage="Save" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default BatchEditPage;
