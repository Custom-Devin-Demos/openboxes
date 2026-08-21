import React from 'react';

import { INVENTORY_LIST_LOW_STOCK } from 'api/urls';
import StockListReport from 'components/inventory/StockListReport';
import { INVENTORY_URL } from 'consts/applicationUrls';

const LowStockList = () => (
  <StockListReport
    titleId="react.inventory.lowStock.label"
    titleDefaultMessage="Low stock"
    apiUrl={INVENTORY_LIST_LOW_STOCK}
    downloadUrl={INVENTORY_URL.listLowStock()}
  />
);

export default LowStockList;
