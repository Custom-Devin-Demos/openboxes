import React from 'react';

import { INVENTORY_LIST_EXPIRED_STOCK } from 'api/urls';
import ExpirationStockList from 'components/inventory/ExpirationStockList';
import { INVENTORY_URL } from 'consts/applicationUrls';

const ExpiredStockList = () => (
  <ExpirationStockList
    titleId="react.inventory.expiredStock.label"
    titleDefaultMessage="Expired stock"
    apiUrl={INVENTORY_LIST_EXPIRED_STOCK}
    legacyUrl={INVENTORY_URL.listExpiredStock()}
    noResultsMessageId="react.inventory.noExpiredStock.label"
    noResultsDefaultMessage="No expired stock"
  />
);

export default ExpiredStockList;
