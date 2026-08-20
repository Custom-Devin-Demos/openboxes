/**
 * Read (GET) endpoints to snapshot, grouped by API controller.
 *
 * Placeholders in `path` ({facilityId}, {supplierId}, {productId}, {categoryId},
 * {organizationId}) are resolved at runtime from stable natural keys in the
 * seeded demo data — see fixtures.js.
 *
 * `sortArrays: true` marks endpoints whose underlying queries have no stable
 * ORDER BY; all arrays in their responses are sorted after normalization.
 */

module.exports = [
  // ApiController
  { name: 'api-status', controller: 'ApiController', path: '/api/status' },
  { name: 'api-getAppContext', controller: 'ApiController', path: '/api/getAppContext' },
  { name: 'api-getMenuConfig', controller: 'ApiController', path: '/api/getMenuConfig' },
  { name: 'api-getRequestTypes', controller: 'ApiController', path: '/api/getRequestTypes' },
  { name: 'api-supportLinks', controller: 'ApiController', path: '/api/supportLinks' },
  { name: 'api-resettingInstanceCommand', controller: 'ApiController', path: '/api/resettingInstance/command' },

  // AttributeApiController
  { name: 'attributes-list', controller: 'AttributeApiController', path: '/api/attributes' },

  // BinLocationApiController
  { name: 'binLocations-list', controller: 'BinLocationApiController', path: '/api/binLocations?location.id={facilityId}' },

  // CategoryApiController
  { name: 'categories-list', controller: 'CategoryApiController', path: '/api/categories' },
  { name: 'categories-read', controller: 'CategoryApiController', path: '/api/categories/{categoryId}' },

  // CombinedShipmentItemApiController
  { name: 'combinedShipmentItems-orderNumberOptions', controller: 'CombinedShipmentItemApiController', path: '/api/orderNumberOptions?vendor={supplierId}&destination={facilityId}' },
  { name: 'combinedShipmentItems-getProductsInOrders', controller: 'CombinedShipmentItemApiController', path: '/api/combinedShipmentItems/getProductsInOrders?vendor={supplierId}&destination={facilityId}&orderIds=' },

  // CycleCountApiController
  { name: 'cycleCounts-candidates', controller: 'CycleCountApiController', path: '/api/facilities/{facilityId}/cycle-counts/candidates', sortArrays: true },
  { name: 'cycleCounts-pendingRequests', controller: 'CycleCountApiController', path: '/api/facilities/{facilityId}/cycle-counts/requests/pending', sortArrays: true },
  { name: 'cycleCounts-list', controller: 'CycleCountApiController', path: '/api/facilities/{facilityId}/cycle-counts' },
  { name: 'cycleCounts-detailsReport', controller: 'CycleCountApiController', path: '/api/reports/cycle-count-details?facility.id={facilityId}' },
  { name: 'cycleCounts-summaryReport', controller: 'CycleCountApiController', path: '/api/reports/cycle-count-summary?facility.id={facilityId}' },

  // DashboardApiController
  { name: 'dashboard-config', controller: 'DashboardApiController', path: '/api/dashboard/personal/config' },
  { name: 'dashboard-subdashboardKeys', controller: 'DashboardApiController', path: '/api/dashboard/personal/subdashboardKeys' },
  { name: 'dashboard-inventoryByLotAndBin', controller: 'DashboardApiController', path: '/api/dashboard/inventoryByLotAndBin?locationId={facilityId}' },
  { name: 'dashboard-inProgressShipments', controller: 'DashboardApiController', path: '/api/dashboard/inProgressShipments?locationId={facilityId}' },
  { name: 'dashboard-inProgressPutaways', controller: 'DashboardApiController', path: '/api/dashboard/inProgressPutaways?locationId={facilityId}' },
  { name: 'dashboard-receivingBin', controller: 'DashboardApiController', path: '/api/dashboard/receivingBin?locationId={facilityId}' },
  { name: 'dashboard-itemsInventoried', controller: 'DashboardApiController', path: '/api/dashboard/itemsInventoried?locationId={facilityId}' },
  { name: 'dashboard-defaultBin', controller: 'DashboardApiController', path: '/api/dashboard/defaultBin?locationId={facilityId}' },
  { name: 'dashboard-expiredProductsInStock', controller: 'DashboardApiController', path: '/api/dashboard/expiredProductsInStock?locationId={facilityId}' },
  { name: 'dashboard-expirationSummary', controller: 'DashboardApiController', path: '/api/dashboard/expirationSummary?locationId={facilityId}' },
  { name: 'dashboard-fillRate', controller: 'DashboardApiController', path: '/api/dashboard/fillRate?locationId={facilityId}' },
  { name: 'dashboard-fillRateSnapshot', controller: 'DashboardApiController', path: '/api/dashboard/fillRateSnapshot?locationId={facilityId}' },
  { name: 'dashboard-fillRateDestinations', controller: 'DashboardApiController', path: '/api/dashboard/fillRateDestinations?locationId={facilityId}' },
  { name: 'dashboard-inventorySummary', controller: 'DashboardApiController', path: '/api/dashboard/inventorySummary?locationId={facilityId}' },
  { name: 'dashboard-requisitionsByYear', controller: 'DashboardApiController', path: '/api/dashboard/requisitionsByYear?locationId={facilityId}' },
  { name: 'dashboard-sentStockMovements', controller: 'DashboardApiController', path: '/api/dashboard/sentStockMovements?locationId={facilityId}' },
  { name: 'dashboard-receivedStockMovements', controller: 'DashboardApiController', path: '/api/dashboard/receivedStockMovements?locationId={facilityId}' },
  { name: 'dashboard-outgoingStock', controller: 'DashboardApiController', path: '/api/dashboard/outgoingStock?locationId={facilityId}' },
  { name: 'dashboard-incomingStock', controller: 'DashboardApiController', path: '/api/dashboard/incomingStock?locationId={facilityId}' },
  { name: 'dashboard-discrepancy', controller: 'DashboardApiController', path: '/api/dashboard/discrepancy?locationId={facilityId}' },
  { name: 'dashboard-delayedShipments', controller: 'DashboardApiController', path: '/api/dashboard/delayedShipments?locationId={facilityId}' },
  { name: 'dashboard-productWithNegativeInventory', controller: 'DashboardApiController', path: '/api/dashboard/productWithNegativeInventory?locationId={facilityId}' },
  { name: 'dashboard-lossCausedByExpiry', controller: 'DashboardApiController', path: '/api/dashboard/lossCausedByExpiry?locationId={facilityId}' },
  { name: 'dashboard-productsInventoried', controller: 'DashboardApiController', path: '/api/dashboard/productsInventoried?locationId={facilityId}' },
  { name: 'dashboard-percentageAdHoc', controller: 'DashboardApiController', path: '/api/dashboard/percentageAdHoc?locationId={facilityId}' },
  { name: 'dashboard-stockOutLastMonth', controller: 'DashboardApiController', path: '/api/dashboard/stockOutLastMonth?locationId={facilityId}' },
  { name: 'dashboard-openStockRequests', controller: 'DashboardApiController', path: '/api/dashboard/openStockRequests?locationId={facilityId}' },
  { name: 'dashboard-requestsPendingApproval', controller: 'DashboardApiController', path: '/api/dashboard/requestsPendingApproval?locationId={facilityId}' },
  { name: 'dashboard-inventoryValue', controller: 'DashboardApiController', path: '/api/dashboard/inventoryValue?locationId={facilityId}' },
  { name: 'dashboard-openPurchaseOrdersCount', controller: 'DashboardApiController', path: '/api/dashboard/openPurchaseOrdersCount?locationId={facilityId}' },
  { name: 'dashboard-backdatedOutboundShipments', controller: 'DashboardApiController', path: '/api/dashboard/backdatedOutboundShipments?locationId={facilityId}' },
  { name: 'dashboard-backdatedInboundShipments', controller: 'DashboardApiController', path: '/api/dashboard/backdatedInboundShipments?locationId={facilityId}' },
  { name: 'dashboard-itemsWithBackdatedShipments', controller: 'DashboardApiController', path: '/api/dashboard/itemsWithBackdatedShipments?locationId={facilityId}' },

  // GenericApiController
  { name: 'generic-product-list', controller: 'GenericApiController', path: '/api/generic/product/', sortArrays: true },
  { name: 'generic-location-list', controller: 'GenericApiController', path: '/api/generic/location/', sortArrays: true },
  { name: 'generic-product-read', controller: 'GenericApiController', path: '/api/generic/product/{productId}' },

  // HelpScoutApiController
  { name: 'helpscout-configuration', controller: 'HelpScoutApiController', path: '/api/helpscout/configuration' },

  // InternalLocationApiController
  { name: 'internalLocations-list', controller: 'InternalLocationApiController', path: '/api/internalLocations?location.id={facilityId}' },
  { name: 'internalLocations-search', controller: 'InternalLocationApiController', path: '/api/internalLocations/search?location.id={facilityId}' },
  { name: 'internalLocations-receiving', controller: 'InternalLocationApiController', path: '/api/internalLocations/receiving?location.id={facilityId}' },

  // InventoryApiController
  { name: 'inventories-reorderReport', controller: 'InventoryApiController', path: '/api/facilities/{facilityId}/inventories/reorderReport', sortArrays: true },
  { name: 'inventories-expirationHistoryReport', controller: 'InventoryApiController', path: '/api/inventories/expirationHistoryReport?facility.id={facilityId}&startDate=01/01/2020&endDate=12/31/2025' },

  // InventoryLevelApiController
  { name: 'inventoryLevels-list', controller: 'InventoryLevelApiController', path: '/api/facilities/{facilityId}/inventory-levels' },

  // InventoryTransactionSummaryApiController
  { name: 'inventoryTransactionsSummary', controller: 'InventoryTransactionSummaryApiController', path: '/api/reports/inventory-transactions-summary?facility.id={facilityId}&startDate=01/01/2020&endDate=12/31/2025' },

  // InvoiceApiController
  { name: 'invoices-list', controller: 'InvoiceApiController', path: '/api/invoices' },
  { name: 'invoices-statusOptions', controller: 'InvoiceApiController', path: '/api/invoiceStatuses' },
  { name: 'invoices-typeCodes', controller: 'InvoiceApiController', path: '/api/invoiceTypeCodes' },

  // LoadDataApiController
  { name: 'loadData-listOfDemoData', controller: 'LoadDataApiController', path: '/api/loadData/listOfDemoData' },

  // LocalizationApiController
  { name: 'localizations-list', controller: 'LocalizationApiController', path: '/api/localizations' },

  // LocationApiController
  { name: 'locations-list', controller: 'LocationApiController', path: '/api/locations', sortArrays: true },
  { name: 'locations-read', controller: 'LocationApiController', path: '/api/locations/{facilityId}' },
  { name: 'locations-locationTypes', controller: 'LocationApiController', path: '/api/locations/locationTypes' },
  { name: 'locations-supportedActivities', controller: 'LocationApiController', path: '/api/locations/supportedActivities' },

  // LocationGroupApiController
  { name: 'locationGroups-list', controller: 'LocationGroupApiController', path: '/api/locationGroups' },

  // NoopApiController
  { name: 'noops-list', controller: 'NoopApiController', path: '/api/noops' },

  // OrganizationApiController
  { name: 'organizations-list', controller: 'OrganizationApiController', path: '/api/organizations' },
  { name: 'organizations-read', controller: 'OrganizationApiController', path: '/api/organizations/{organizationId}' },

  // PartialReceivingApiController
  { name: 'partialReceiving-list', controller: 'PartialReceivingApiController', path: '/api/partialReceiving' },

  // PersonApiController
  { name: 'persons-list', controller: 'PersonApiController', path: '/api/persons' },

  // ProductApiController
  { name: 'products-list', controller: 'ProductApiController', path: '/api/products?max=100', sortArrays: true },
  { name: 'products-read', controller: 'ProductApiController', path: '/api/products/{productId}' },
  { name: 'products-search', controller: 'ProductApiController', path: '/api/products/search?name=a&location.id={facilityId}', sortArrays: true },
  { name: 'products-availableItems', controller: 'ProductApiController', path: '/api/products/availableItems?location.id={facilityId}&product.id={productId}' },
  { name: 'products-getLatestInventoryCountDate', controller: 'ProductApiController', path: '/api/products/getLatestInventoryCountDate?productIds={productId}' },
  { name: 'products-lotNumbersWithExpirationDate', controller: 'ProductApiController', path: '/api/products/inventoryItems/lotNumbersWithExpirationDate?product.id={productId}' },

  // ProductClassificationApiController
  { name: 'productClassifications-list', controller: 'ProductClassificationApiController', path: '/api/facilities/{facilityId}/products/classifications' },

  // ProductSupplierApiController
  { name: 'productSuppliers-list', controller: 'ProductSupplierApiController', path: '/api/productSuppliers' },

  // ProductsConfigurationApiController
  { name: 'productsConfiguration-categoriesCount', controller: 'ProductsConfigurationApiController', path: '/api/productsConfiguration/categoriesCount' },
  { name: 'productsConfiguration-categoryOptions', controller: 'ProductsConfigurationApiController', path: '/api/productsConfiguration/categoryOptions' },
  { name: 'productsConfiguration-productOptions', controller: 'ProductsConfigurationApiController', path: '/api/productsConfiguration/productOptions' },
  { name: 'productsConfiguration-downloadCategories', controller: 'ProductsConfigurationApiController', path: '/api/productsConfiguration/downloadCategories' },

  // PurchaseOrderApiController
  { name: 'purchaseOrders-list', controller: 'PurchaseOrderApiController', path: '/api/purchaseOrders' },
  { name: 'purchaseOrders-statusOptions', controller: 'PurchaseOrderApiController', path: '/api/orderSummaryStatus' },

  // PutawayApiController
  { name: 'putaways-list', controller: 'PutawayApiController', path: '/api/putaways?location.id={facilityId}' },

  // ReasonCodeApiController
  { name: 'reasonCodes-list', controller: 'ReasonCodeApiController', path: '/api/reasonCodes' },

  // ReplenishmentApiController
  { name: 'replenishments-requirements', controller: 'ReplenishmentApiController', path: '/api/requirements?location.id={facilityId}' },
  { name: 'replenishments-statusOptions', controller: 'ReplenishmentApiController', path: '/api/replenishments/statusOptions' },

  // SelectOptionsApiController
  { name: 'selectOptions-categoryOptions', controller: 'SelectOptionsApiController', path: '/api/categoryOptions' },
  { name: 'selectOptions-catalogOptions', controller: 'SelectOptionsApiController', path: '/api/catalogOptions' },
  { name: 'selectOptions-productGroupOptions', controller: 'SelectOptionsApiController', path: '/api/productGroupOptions' },
  { name: 'selectOptions-tagOptions', controller: 'SelectOptionsApiController', path: '/api/tagOptions' },
  { name: 'selectOptions-glAccountOptions', controller: 'SelectOptionsApiController', path: '/api/glAccountOptions' },
  { name: 'selectOptions-paymentTermOptions', controller: 'SelectOptionsApiController', path: '/api/paymentTermOptions' },
  { name: 'selectOptions-users', controller: 'SelectOptionsApiController', path: '/api/users' },
  { name: 'selectOptions-preferenceTypeOptions', controller: 'SelectOptionsApiController', path: '/api/preferenceTypeOptions' },
  { name: 'selectOptions-ratingTypeCodeOptions', controller: 'SelectOptionsApiController', path: '/api/ratingTypeCodeOptions' },
  { name: 'selectOptions-handlingRequirementsOptions', controller: 'SelectOptionsApiController', path: '/api/handlingRequirementsOptions' },
  { name: 'selectOptions-shipmentStatusCodes', controller: 'SelectOptionsApiController', path: '/api/stockMovements/shipmentStatusCodes' },

  // StockMovementApiController
  { name: 'stockMovements-list-inbound', controller: 'StockMovementApiController', path: '/api/stockMovements?direction=INBOUND&destination={facilityId}' },
  { name: 'stockMovements-list-outbound', controller: 'StockMovementApiController', path: '/api/stockMovements?direction=OUTBOUND&origin={facilityId}' },
  { name: 'stockMovements-requisitionStatusCodes', controller: 'StockMovementApiController', path: '/api/stockMovements/requisitionsStatusCodes' },
  { name: 'stockMovements-pendingRequisitionItems', controller: 'StockMovementApiController', path: '/api/stockMovements/pendingRequisitionItems?origin={facilityId}' },
  { name: 'stockMovements-shippedItems', controller: 'StockMovementApiController', path: '/api/stockMovements/shippedItems?destination={facilityId}' },

  // StockMovementItemApiController: all read endpoints require an existing stock
  // movement id; the seeded demo data contains none, so this controller is a
  // documented coverage gap (see docs/migration/characterization-api.md).

  // StockTransferApiController
  { name: 'stockTransfers-list', controller: 'StockTransferApiController', path: '/api/stockTransfers?location={facilityId}' },
  { name: 'stockTransfers-statusOptions', controller: 'StockTransferApiController', path: '/api/stockTransfers/statusOptions' },
  { name: 'stockTransfers-candidates', controller: 'StockTransferApiController', path: '/api/stockTransfers/candidates?location.id={facilityId}' },

  // StocklistApiController
  { name: 'stocklists-list', controller: 'StocklistApiController', path: '/api/stocklists' },

  // StocklistItemApiController
  { name: 'stocklistItems-availableStocklists', controller: 'StocklistItemApiController', path: '/api/stocklistItems/availableStocklists?product.id={productId}&location.id={facilityId}' },

  // UnitOfMeasureApiController
  { name: 'unitOfMeasure-currencies', controller: 'UnitOfMeasureApiController', path: '/api/unitOfMeasure/currencies' },
  { name: 'unitOfMeasure-uomOptions', controller: 'UnitOfMeasureApiController', path: '/api/unitOfMeasures/options' },

  // IndicatorApiController
  { name: 'indicators-productsInventoried', controller: 'IndicatorApiController', path: '/api/reports/indicators/productsInventoried?facility.id={facilityId}' },
  { name: 'indicators-inventoryAccuracy', controller: 'IndicatorApiController', path: '/api/reports/indicators/inventoryAccuracy?facility.id={facilityId}' },
  { name: 'indicators-inventoryShrinkage', controller: 'IndicatorApiController', path: '/api/reports/indicators/inventoryShrinkage?facility.id={facilityId}' },
];
