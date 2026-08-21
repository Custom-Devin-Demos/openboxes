import React from 'react';

import { INVENTORY_LIST_EXPIRING_STOCK } from 'api/urls';
import ExpirationStockList from 'components/inventory/ExpirationStockList';
import { INVENTORY_URL } from 'consts/applicationUrls';

const ExpiringStockList = () => (
  <ExpirationStockList
    titleId="react.inventory.expiringStock.label"
    titleDefaultMessage="Expiring stock"
    apiUrl={INVENTORY_LIST_EXPIRING_STOCK}
    legacyUrl={INVENTORY_URL.listExpiringStock()}
    showStatusFilter
    noResultsMessageId="react.inventory.noExpiringStock.label"
    noResultsDefaultMessage="No expiring stock"
  />
);

export default ExpiringStockList;
