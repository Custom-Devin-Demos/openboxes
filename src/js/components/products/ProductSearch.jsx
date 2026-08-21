import React, { useEffect, useState } from 'react';

import { useHistory, useLocation } from 'react-router-dom';

import productScreenApi from 'api/services/ProductScreenApi';
import Button from 'components/form-elements/Button';
import ListTitle from 'components/listPagesUtils/ListTitle';
import { PRODUCT_URL } from 'consts/applicationUrls';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import translate from 'utils/Translate';
import HeaderButtonsWrapper from 'wrappers/HeaderButtonsWrapper';
import HeaderWrapper from 'wrappers/HeaderWrapper';
import PageWrapper from 'wrappers/PageWrapper';

const ProductSearch = () => {
  useTranslation('products', 'default');
  const history = useHistory();
  const location = useLocation();
  const spinner = useSpinner();
  const initialQuery = new URLSearchParams(location.search).get('q') ?? '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [products, setProducts] = useState([]);

  const fetchProducts = (query) => {
    if (!query) {
      setProducts([]);
      return;
    }
    spinner.show();
    productScreenApi.getSearchResults({ params: { q: query } })
      .then((response) => setProducts(response.data?.data ?? []))
      .finally(() => spinner.hide());
  };

  useEffect(() => {
    fetchProducts(initialQuery);
  }, [initialQuery]);

  const onSearch = (event) => {
    event.preventDefault();
    history.push({
      pathname: location.pathname,
      search: searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '',
    });
  };

  return (
    <PageWrapper>
      <HeaderWrapper>
        <ListTitle label={{
          id: 'react.productSearch.header.label',
          defaultMessage: 'List Products',
        }}
        />
        <HeaderButtonsWrapper>
          <Button
            label="react.productSearch.listProducts.label"
            defaultLabel="List products"
            variant="secondary"
            onClick={() => {
              window.location = PRODUCT_URL.list();
            }}
          />
          <Button
            label="react.productSearch.addProduct.label"
            defaultLabel="Add product"
            onClick={() => {
              window.location = PRODUCT_URL.create();
            }}
          />
        </HeaderButtonsWrapper>
      </HeaderWrapper>
      <div className="p-3">
        <form className="d-flex align-items-center pb-3" onSubmit={onSearch}>
          <label htmlFor="q" className="mb-0 mr-2">
            {translate({ id: 'react.productSearch.search.label', defaultMessage: 'Search products' })}
          </label>
          <input
            id="q"
            type="text"
            name="q"
            className="form-control w-25 mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            type="submit"
            label="react.default.button.find.label"
            defaultLabel="Find"
          />
        </form>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>{translate({ id: 'react.productSearch.column.barcode.label', defaultMessage: 'Barcode' })}</th>
              <th>{translate({ id: 'react.productSearch.column.image.label', defaultMessage: 'Image' })}</th>
              <th>{translate({ id: 'react.productSearch.column.manufacturer.label', defaultMessage: 'Manufacturer' })}</th>
              <th>{translate({ id: 'react.productSearch.column.description.label', defaultMessage: 'Description' })}</th>
              <th>{translate({ id: 'react.productSearch.column.upc.label', defaultMessage: 'UPC' })}</th>
              <th>{translate({ id: 'react.productSearch.column.category.label', defaultMessage: 'Category' })}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="text-center">
                  {product.upc && (
                    <img src={PRODUCT_URL.barcode(product.upc)} alt={product.upc} />
                  )}
                </td>
                <td className="text-center">
                  <img src={product.productCode} width="50" height="50" alt={product.productCode} />
                </td>
                <td className="text-center">{product.manufacturer}</td>
                <td>
                  <b>{product.name}</b>
                  <br />
                  {product.description}
                </td>
                <td className="text-center">{product.upc}</td>
                <td className="text-center">{product.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default ProductSearch;
