import React, { useCallback, useEffect, useState } from 'react';

import { INVENTORY_SHOW_PRODUCTS } from 'api/urls';
import { INVENTORY_ITEM_URL, INVENTORY_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

const ShowProducts = () => {
  useTranslation('inventory', 'default');

  const [data, setData] = useState(null);

  const productCount = data?.categories
    ?.reduce((acc, category) => acc + (category.products?.length ?? 0), 0) ?? 0;

  const fetchData = useCallback(() => {
    apiClient.get(INVENTORY_SHOW_PRODUCTS)
      .then((response) => setData(response.data));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <h2>
          <Translate
            id="react.inventory.showProducts.label"
            defaultMessage="Products without default inventory items"
          />
          {' '}
          <span className="text-muted">{`(${productCount})`}</span>
        </h2>
        <div className="mb-2">
          <a
            className="btn btn-outline-secondary btn-sm"
            href={INVENTORY_URL.createDefaultInventoryItems()}
          >
            <Translate
              id="react.inventory.createDefaultInventoryItems.label"
              defaultMessage="Create default inventory items"
            />
          </a>
        </div>
        {data?.categories?.map((category) => (
          <div key={category.name || 'uncategorized'} className="mb-3">
            <h3>{category.name}</h3>
            <table className="table table-striped table-sm">
              <tbody>
                {category.products?.map((product) => (
                  <tr key={product.id}>
                    <td>{product.productCode}</td>
                    <td>
                      <a href={INVENTORY_ITEM_URL.showStockCard(product.id)}>
                        {product.name}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
};

export default ShowProducts;
