import React from 'react';

import { INVENTORY_LIST_REORDER_STOCK } from 'api/urls';
import StockListReport from 'components/inventory/StockListReport';
import { INVENTORY_URL } from 'consts/applicationUrls';

const ReorderStockList = () => (
  <StockListReport
    titleId="react.inventory.reorderStock.label"
    titleDefaultMessage="Reorder stock"
    apiUrl={INVENTORY_LIST_REORDER_STOCK}
    downloadUrl={INVENTORY_URL.listReorderStock()}
  />
);

export default ReorderStockList;
