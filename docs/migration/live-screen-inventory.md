# OpenBoxes Live-Screen Inventory (GSP Dead-Screen Audit)

Phase 0, task 0.2 of the GSP-to-React modernization program.
Audit of all GSP views under `grails-app/views` on branch `develop`.

## Summary

| Classification | Count | Meaning |
|---|---|---|
| LIVE | 286 | Full screens reachable via controller actions, URL mappings, megamenu, or React SPA links |
| TEMPLATE | 226 | Partials/layouts included by a live view, controller, taglib, or service (email/print bodies) |
| UNCERTAIN | 29 | Referenced only dynamically (e.g. `render(template: params.templateName)`); see evidence column |
| DEAD | 77 | No static or dynamic references found |
| **Total** | **618** | |

## Methodology

Static analysis performed by `scripts/migration/audit_gsp.py` (rerunnable). A GSP is
considered reachable if any of the following evidence exists:

1. **Implicit view resolution** — a controller action with the same name as
   `views/<controller>/<action>.gsp` (the default URL mapping `/$controller/$action?/$id?`
   makes every controller action URL-reachable). Scaffolded controllers
   (`static scaffold = Domain`) contribute the implicit CRUD actions.
2. **Explicit renders** — `render(view: ...)` / `render(template: ...)` in controllers.
3. **Webflow states** — `views/<controller>/<flowName>/<state>.gsp` for controllers
   defining `def <flowName>Flow` (createShipmentWorkflow, receiveOrderWorkflow).
4. **URL mappings** — explicit controller/action pairs in `UrlMappings.groovy`.
5. **Megamenu/navigation** — `href` entries in `grails-app/conf/runtime.groovy`.
6. **Template inclusion** — `<g:render template=...>`, `<g:include ...>`, layout `<meta>`
   tags, and `render(template:)`/view-path strings in controllers, taglibs, services,
   and jobs (covers email and PDF/print bodies). Inclusion is propagated transitively
   from live roots only, so partials referenced solely by dead views stay dead.
7. **React SPA links** — hard links from `src/js` to GSP URLs (`/openboxes/<ctrl>/<action>`).

Views referenced only through dynamic expressions (e.g. product/stock-card tabs loaded via
`render(template: params.templateName)`) are classified **UNCERTAIN**, with the dynamic
reference recorded in the evidence column of `gsp-audit.csv`. `quartz/list.gsp` is a view
override for the quartz-monitor plugin controller and is kept LIVE.

Notes:

- Many high-traffic workflows (stock movements, putaway, receiving, invoicing, purchase
  orders) already render the React SPA host (`common/react.gsp`); their remaining GSPs are
  mostly legacy detail/print/support screens.
- LIVE includes non-UI-migratable screens (error pages, mobile mini-app, admin utilities);
  batches flag these so the coordinator can deprioritize or drop them.

## Proposed React-Migration Module Batches

286 live screens grouped into 58 batches of 2-6 related
screens. One migration child session can be spawned per batch; batches within the same
module prefix share domain context and are best done in order.

| Batch | Screens | Controllers involved | Complexity notes |
|---|---|---|---|
| admin-config-1 | admin/cache.gsp<br>admin/controllerActions.gsp<br>admin/index.gsp<br>admin/plugins.gsp<br>admin/sendMail.gsp<br>admin/showSettings.gsp | AdminController | 4 other, 1 tables, 1 detail views |
| admin-config-2 | admin/showUpgrade.gsp<br>admin/status.gsp<br>batch/importData.gsp<br>dataExport/index.gsp<br>jobs/show.gsp<br>localization/create.gsp | AdminController, BatchController, DataExportController, JobsController, LocalizationController | 2 detail views, 2 forms, 1 other, 1 tables |
| admin-config-3 | localization/edit.gsp<br>localization/list.gsp<br>localization/show.gsp<br>migration/dataMigration.gsp<br>migration/dataQuality.gsp<br>migration/dimensionTables.gsp | LocalizationController, MigrationController | 3 other, 1 forms, 1 tables, 1 detail views |
| admin-config-4 | migration/factTables.gsp<br>migration/index.gsp<br>migration/materializedViews.gsp<br>migration/productAvailability.gsp<br>quartz/list.gsp | MigrationController, QuartzController | 3 other, 2 tables |
| dashboard-auth | auth/login.gsp<br>auth/signup.gsp<br>common/react.gsp<br>dashboard/chooseLocation.gsp<br>dashboard/megamenu.gsp | AuthController, CommonController, DashboardController | 5 other |
| errors-misc | error.gsp<br>errors/accessDenied.gsp<br>errors/dataAccess.gsp<br>errors/methodNotAllowed.gsp<br>errors/notFound.gsp | ErrorsController | 5 other |
| finance-config-1 | budgetCode/create.gsp<br>budgetCode/edit.gsp<br>budgetCode/list.gsp<br>eventType/create.gsp<br>eventType/edit.gsp | BudgetCodeController, EventTypeController | 4 forms, 1 tables |
| finance-config-2 | eventType/list.gsp<br>eventType/show.gsp<br>glAccount/create.gsp<br>glAccount/edit.gsp<br>glAccount/list.gsp | EventTypeController, GlAccountController | 2 tables, 2 forms, 1 detail views |
| finance-config-3 | glAccountType/create.gsp<br>glAccountType/edit.gsp<br>glAccountType/list.gsp<br>paymentTerm/create.gsp<br>paymentTerm/edit.gsp | GlAccountTypeController, PaymentTermController | 4 forms, 1 tables |
| finance-config-4 | paymentTerm/list.gsp<br>preferenceType/create.gsp<br>preferenceType/edit.gsp<br>preferenceType/list.gsp | PaymentTermController, PreferenceTypeController | 2 tables, 2 forms |
| inventory-1 | inventory/browse.gsp<br>inventory/createTransaction.gsp<br>inventory/editBinLocation.gsp<br>inventory/editTransaction.gsp<br>inventory/list.gsp | InventoryController | 3 forms, 2 tables |
| inventory-2 | inventory/listDailyTransactions.gsp<br>inventory/listExpiredStock.gsp<br>inventory/listExpiringStock.gsp<br>inventory/listLowStock.gsp<br>inventory/listReorderStock.gsp | InventoryController | 5 tables |
| inventory-3 | inventory/listTransactions.gsp<br>inventory/manage.gsp<br>inventory/showProducts.gsp<br>inventory/showTransaction.gsp<br>inventory/upload.gsp | InventoryController | 2 detail views, 1 tables, 1 other, 1 forms |
| inventory-4 | inventoryBrowser/list.gsp<br>inventorySnapshot/edit.gsp<br>inventorySnapshot/list.gsp<br>inventorySnapshot/show.gsp | InventoryBrowserController, InventorySnapshotController | 2 tables, 1 forms, 1 detail views |
| invoicing | invoice/addDocument.gsp<br>invoice/list.gsp<br>invoice/show.gsp | InvoiceController | 1 forms, 1 tables, 1 detail views |
| locations-orgs-1 | location/edit.gsp<br>location/list.gsp<br>location/showBinLocations.gsp<br>location/showContents.gsp<br>location/showZoneLocations.gsp<br>location/uploadLogo.gsp | LocationController | 3 detail views, 2 forms, 1 tables |
| locations-orgs-2 | locationGroup/create.gsp<br>locationGroup/edit.gsp<br>locationGroup/list.gsp<br>locationGroup/show.gsp<br>locationType/create.gsp<br>locationType/edit.gsp | LocationGroupController, LocationTypeController | 4 forms, 1 tables, 1 detail views |
| locations-orgs-3 | locationType/list.gsp<br>locationType/show.gsp<br>organization/create.gsp<br>organization/edit.gsp<br>organization/list.gsp<br>organization/show.gsp | LocationTypeController, OrganizationController | 2 tables, 2 detail views, 2 forms |
| locations-orgs-4 | party/create.gsp<br>party/edit.gsp<br>party/list.gsp<br>party/show.gsp<br>partyRole/create.gsp<br>partyRole/edit.gsp | PartyController, PartyRoleController | 4 forms, 1 tables, 1 detail views |
| locations-orgs-5 | partyRole/list.gsp<br>partyRole/show.gsp<br>partyType/create.gsp<br>partyType/edit.gsp<br>partyType/list.gsp<br>partyType/show.gsp | PartyRoleController, PartyTypeController | 2 tables, 2 detail views, 2 forms |
| locations-orgs-6 | supplier/list.gsp<br>supplier/show.gsp | SupplierController | 1 tables, 1 detail views |
| mobile-1 | mobile/chooseLocation.gsp<br>mobile/error.gsp<br>mobile/index.gsp<br>mobile/login.gsp | MobileController | 3 other, 1 tables |
| mobile-2 | mobile/menu.gsp<br>mobile/outboundList.gsp<br>mobile/productDetails.gsp<br>mobile/productList.gsp | MobileController | 2 other, 2 tables |
| orders-1 | order/addComment.gsp<br>order/addDocument.gsp<br>order/editAdjustment.gsp<br>order/list.gsp<br>order/listOrderItems.gsp<br>order/orderItemSummaryList.gsp | OrderController | 3 forms, 3 tables |
| orders-2 | order/orderSummaryList.gsp<br>order/print.gsp<br>order/show.gsp<br>orderAdjustmentType/create.gsp<br>orderAdjustmentType/edit.gsp<br>orderAdjustmentType/list.gsp | OrderAdjustmentTypeController, OrderController | 2 tables, 2 forms, 1 print views, 1 detail views |
| picking | picklist/print.gsp<br>picklist/returnPrint.gsp<br>replenishment/print.gsp | PicklistController, ReplenishmentController | 3 print views |
| print-documents-1 | deliveryNote/print.gsp<br>deliveryNote/printOutboundReturn.gsp<br>document/create.gsp<br>document/edit.gsp | DeliveryNoteController, DocumentController | 2 print views, 2 forms |
| print-documents-2 | document/list.gsp<br>document/show.gsp<br>document/upload.gsp<br>goodsReceiptNote/print.gsp | DocumentController, GoodsReceiptNoteController | 1 tables, 1 detail views, 1 forms, 1 print views |
| product-catalog-1 | attribute/edit.gsp<br>attribute/list.gsp<br>attribute/show.gsp<br>category/create.gsp<br>category/edit.gsp<br>category/tree.gsp | AttributeController, CategoryController | 3 forms, 1 tables, 1 detail views, 1 other |
| product-catalog-2 | product/addDocument.gsp<br>product/batchEdit.gsp<br>product/batchEditProperties.gsp<br>product/edit.gsp<br>product/importAsCsv.gsp<br>product/list.gsp | ProductController | 5 forms, 1 tables |
| product-catalog-3 | product/productMergeLogs.gsp<br>product/search.gsp<br>product/show.gsp<br>product/upnDatabase.gsp<br>productAssociation/create.gsp<br>productAssociation/edit.gsp | ProductAssociationController, ProductController | 3 other, 2 forms, 1 detail views |
| product-catalog-4 | productAssociation/list.gsp<br>productAssociation/show.gsp<br>productCatalog/create.gsp<br>productCatalog/edit.gsp<br>productCatalog/list.gsp<br>productCatalog/show.gsp | ProductAssociationController, ProductCatalogController | 2 tables, 2 detail views, 2 forms |
| product-catalog-5 | productComponent/index.gsp<br>productGroup/create.gsp<br>productGroup/edit.gsp<br>productGroup/list.gsp<br>productGroup/show.gsp<br>productSupplier/create.gsp | ProductComponentController, ProductGroupController, ProductSupplierController | 3 forms, 2 tables, 1 detail views |
| product-catalog-6 | productSupplier/edit.gsp<br>productSupplier/list.gsp<br>productSupplier/show.gsp<br>productType/create.gsp<br>productType/edit.gsp<br>productType/list.gsp | ProductSupplierController, ProductTypeController | 3 forms, 2 tables, 1 detail views |
| product-catalog-7 | productType/show.gsp<br>tag/create.gsp<br>tag/edit.gsp<br>tag/list.gsp<br>tag/show.gsp<br>unitOfMeasureConversion/create.gsp | ProductTypeController, TagController, UnitOfMeasureConversionController | 3 forms, 2 detail views, 1 tables |
| product-catalog-8 | unitOfMeasureConversion/edit.gsp<br>unitOfMeasureConversion/list.gsp | UnitOfMeasureConversionController | 1 forms, 1 tables |
| receiving | partialReceiving/create.gsp<br>receiveOrderWorkflow/receiveOrder/confirmOrderReceipt.gsp<br>receiveOrderWorkflow/receiveOrder/enterShipmentDetails.gsp<br>receiveOrderWorkflow/receiveOrder/processOrderItems.gsp | PartialReceivingController, ReceiveOrderWorkflowController | 3 other, 1 forms |
| reporting-1 | consumption/list.gsp<br>consumption/pivot.gsp<br>consumption/show.gsp<br>json/createPerson.gsp<br>report/printPaginatedPackingListReport.gsp | ConsumptionController, JsonController, ReportController | 1 tables, 1 other, 1 detail views, 1 forms, 1 print views |
| reporting-2 | report/printPickListReport.gsp<br>report/printShippingReport.gsp<br>report/showBinLocationReport.gsp<br>report/showCycleCountReport.gsp<br>report/showForecastReport.gsp | ReportController | 3 detail views, 2 print views |
| reporting-3 | report/showInventoryByLocationReport.gsp<br>report/showInventoryReport.gsp<br>report/showOnOrderReport.gsp<br>report/showPaginatedPackingListReport.gsp<br>report/showRequestDetailReport.gsp | ReportController | 4 detail views, 1 tables |
| reporting-4 | report/showTransactionReport.gsp<br>transactionEntry/create.gsp<br>transactionEntry/edit.gsp<br>transactionEntry/list.gsp<br>transactionEntry/show.gsp | ReportController, TransactionEntryController | 2 detail views, 2 forms, 1 tables |
| requisitions-1 | requisition/chooseTemplate.gsp<br>requisition/confirm.gsp<br>requisition/create.gsp<br>requisition/createNonStock.gsp<br>requisition/createStock.gsp<br>requisition/edit.gsp | RequisitionController | 4 forms, 2 other |
| requisitions-2 | requisition/editHeader.gsp<br>requisition/list.gsp<br>requisition/pick.gsp<br>requisition/printDraft.gsp<br>requisition/process.gsp<br>requisition/review.gsp | RequisitionController | 3 other, 1 forms, 1 tables, 1 print views |
| requisitions-3 | requisition/show.gsp<br>requisition/transfer.gsp<br>requisitionItem/change.gsp<br>requisitionItem/list.gsp | RequisitionController, RequisitionItemController | 2 other, 1 detail views, 1 tables |
| shipment-workflow | createShipmentWorkflow/createShipment/enterContainerDetails.gsp<br>createShipmentWorkflow/createShipment/enterShipmentDetails.gsp<br>createShipmentWorkflow/createShipment/enterTrackingDetails.gsp<br>createShipmentWorkflow/createShipment/pickShipmentItems.gsp<br>createShipmentWorkflow/createShipment/sendShipment.gsp | CreateShipmentWorkflowController | 5 other |
| shipments-1 | shipment/addComment.gsp<br>shipment/addDocument.gsp<br>shipment/addToShipment.gsp<br>shipment/deleteShipment.gsp<br>shipment/editEvent.gsp | ShipmentController | 4 forms, 1 other |
| shipments-2 | shipment/list.gsp<br>shipment/receiveShipment.gsp<br>shipment/sendShipment.gsp<br>shipment/showDetails.gsp<br>shipment/showPackingList.gsp | ShipmentController | 2 tables, 2 other, 1 detail views |
| shipments-3 | shipmentItem/create.gsp<br>shipmentItem/edit.gsp<br>shipmentItem/list.gsp<br>shipmentItem/pick.gsp<br>shipmentItem/show.gsp | ShipmentItemController | 2 forms, 1 tables, 1 other, 1 detail views |
| shipments-4 | shipmentItem/split.gsp<br>shipmentWorkflow/create.gsp<br>shipmentWorkflow/edit.gsp<br>shipmentWorkflow/list.gsp<br>shipmentWorkflow/show.gsp | ShipmentItemController, ShipmentWorkflowController | 2 forms, 1 other, 1 tables, 1 detail views |
| stock-card-1 | inventoryItem/editInventoryLevel.gsp<br>inventoryItem/showGraph.gsp<br>inventoryItem/showLotNumbers.gsp<br>inventoryItem/showRecordInventory.gsp<br>inventoryItem/showStockCard.gsp | InventoryItemController | 4 detail views, 1 forms |
| stock-card-2 | inventoryItem/showTransactionLog.gsp<br>inventoryLevel/create.gsp<br>inventoryLevel/edit.gsp<br>inventoryLevel/list.gsp<br>inventoryLevel/show.gsp | InventoryItemController, InventoryLevelController | 2 detail views, 2 forms, 1 tables |
| stock-movements | stockMovement/addComment.gsp<br>stockMovement/addDocument.gsp<br>stockMovement/list.gsp<br>stockMovement/show.gsp | StockMovementController | 2 forms, 1 tables, 1 detail views |
| stock-transfers | returns/show.gsp<br>stockTransfer/list.gsp<br>stockTransfer/print.gsp<br>stockTransfer/show.gsp | ReturnsController, StockTransferController | 2 detail views, 1 tables, 1 print views |
| stocklists-1 | requisitionTemplate/batch.gsp<br>requisitionTemplate/create.gsp<br>requisitionTemplate/edit.gsp<br>requisitionTemplate/editHeader.gsp | RequisitionTemplateController | 4 forms |
| stocklists-2 | requisitionTemplate/list.gsp<br>requisitionTemplate/sendMail.gsp<br>requisitionTemplate/show.gsp<br>stocklist/show.gsp | RequisitionTemplateController, StocklistController | 2 detail views, 1 tables, 1 other |
| users-security-1 | person/create.gsp<br>person/edit.gsp<br>person/list.gsp<br>person/show.gsp<br>role/create.gsp | PersonController, RoleController | 3 forms, 1 tables, 1 detail views |
| users-security-2 | role/edit.gsp<br>role/index.gsp<br>role/show.gsp<br>user/changePhoto.gsp<br>user/create.gsp | RoleController, UserController | 2 forms, 1 tables, 1 detail views, 1 other |
| users-security-3 | user/cropPhoto.gsp<br>user/edit.gsp<br>user/list.gsp<br>user/show.gsp | UserController | 1 other, 1 forms, 1 tables, 1 detail views |

## Files

- `docs/migration/gsp-audit.csv` — one row per GSP: path, classification, evidence,
  proposed batch (LIVE only).
- `docs/migration/gsp-audit-summary.json` — machine-readable counts and batch definitions.
- `scripts/migration/audit_gsp.py` — audit script (run from repo root, then
  `scripts/migration/generate_inventory_md.py` to regenerate this document).
