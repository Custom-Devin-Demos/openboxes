# Phase 4.4 — GSP screen-layer removal

All 58 GSP-to-React migration batches are merged; this pass removes the GSP screens that are no longer rendered at runtime.

## Method

`scripts/migration/phase4_dead_gsp.py` (refinement of the Phase 0 audit script) classifies every GSP. A GSP is **removable** only when no static reference remains: controller actions that now render the React host (`/common/react`) as their sole render no longer resolve their implicit view; explicit `render(view:/template:)` references, webflow states, UrlMappings view mappings, mail/print template references from Groovy code, and transitive `g:render`/layout/`g:include` inclusion from any retained view all force retention. Dynamically-referenced views (`render(template: params.x)` etc.) are retained (bias to safety). Full machine-readable result: `docs/migration/phase4-dead-gsps.json`.

**Totals: 618 GSPs audited — 298 removed, 320 retained.**

Also removed: 5 taglibs with no remaining tag usages (AutoSuggestSearchable, CategorySelect, ComboBox, SearchProduct, WordWrap), and legacy JS/CSS assets referenced only by removed GSPs (prototype, angular, jquery.cycle/tagcloud/validation, onScan, mobile/grails css, grails-branding images). Controller actions were **not** removed: legacy URLs must keep routing to the React host, and all retained actions keep their permission/ActivityCode checks unchanged.

## Per-module checklist

### admin-config — removed 21, retained 4

Removed:

- `admin/cache.gsp`
- `admin/controllerActions.gsp`
- `admin/index.gsp`
- `admin/plugins.gsp`
- `admin/sendMail.gsp`
- `admin/showSettings.gsp`
- `admin/showUpgrade.gsp`
- `admin/status.gsp`
- `api/index.gsp`
- `dataExport/index.gsp`
- `jobs/show.gsp`
- `localization/list.gsp`
- `localization/show.gsp`
- `migration/dataMigration.gsp`
- `migration/dataQuality.gsp`
- `migration/dimensionTables.gsp`
- `migration/factTables.gsp`
- `migration/index.gsp`
- `migration/materializedViews.gsp`
- `migration/productAvailability.gsp`
- `referenceNumberType/_local.gsp`

Retained (why):

- `localization/_crowdin.gsp` — included by layouts/custom.gsp; included by layouts/react.gsp
- `localization/create.gsp` — action core/LocalizationController.groovy::create renders /common/react only; render(view:'create') in core/LocalizationController.groovy
- `localization/edit.gsp` — action core/LocalizationController.groovy::edit renders /common/react only; render(view:'edit') in core/LocalizationController.groovy
- `migration/_status.gsp` — render(template:'status') in data/MigrationController.groovy

### auth — removed 0, retained 2

Retained (why):

- `auth/login.gsp` — controller action user/AuthController.groovy::login (implicit)
- `auth/signup.gsp` — controller action user/AuthController.groovy::signup (implicit)

### batch — removed 0, retained 2

Retained (why):

- `batch/_uploadFileForm.gsp` — included by batch/importData.gsp
- `batch/importData.gsp` — controller action batch/BatchController.groovy::importData (implicit); render(view:'importData') in batch/BatchController.groovy

### category — removed 0, retained 5

Retained (why):

- `category/_selectOptions.gsp` — render(template:'../category/selectOptions') in taglib/CategorySelectTagLib.groovy; included by category/_selectOptions.gsp
- `category/_tree.gsp` — included by category/tree.gsp; included by category/_tree.gsp
- `category/create.gsp` — action product/CategoryController.groovy::create renders /common/react only; render(view:'create') in product/CategoryController.groovy
- `category/edit.gsp` — action product/CategoryController.groovy::edit renders /common/react only; render(view:'edit') in product/CategoryController.groovy
- `category/tree.gsp` — action product/CategoryController.groovy::tree renders /common/react only; render(view:'tree') in product/CategoryController.groovy

### cycleCount — removed 0, retained 2

Retained (why):

- `cycleCount/_printCount.gsp` — view path string '/cycleCount/printCount' in api/CycleCountApiController.groovy
- `cycleCount/_printRecount.gsp` — view path string '/cycleCount/printRecount' in api/CycleCountApiController.groovy

### dashboard-auth — removed 22, retained 12

Removed:

- `common/_breadcrumb.gsp`
- `common/_header.gsp`
- `common/_menu.gsp`
- `common/_navbar.gsp`
- `common/_personAutocomplete.gsp`
- `dashboard/_activitySummary.gsp`
- `dashboard/_alertSummary.gsp`
- `dashboard/_binLocationSummary.gsp`
- `dashboard/_catalogsSummary.gsp`
- `dashboard/_expiringSummary.gsp`
- `dashboard/_genericProductSummary.gsp`
- `dashboard/_indicatorSummary.gsp`
- `dashboard/_newsSummary.gsp`
- `dashboard/_orderSummary.gsp`
- `dashboard/_productSummary.gsp`
- `dashboard/_receiptSummary.gsp`
- `dashboard/_requisitionItemSummary.gsp`
- `dashboard/_requisitionSummary.gsp`
- `dashboard/_shipmentSummary.gsp`
- `dashboard/_tagSummary.gsp`
- `dashboard/_valueSummary.gsp`
- `dashboard/old.gsp`

Retained (why):

- `common/_customCss.gsp` — included by layouts/custom.gsp; included by layouts/print.gsp
- `common/_customVariables.gsp` — included by layouts/custom.gsp
- `common/_dataTable.gsp` — render(template:'/common/dataTable') in data/MigrationController.groovy; view path string '/common/dataTable' in data/MigrationController.groovy; included by st
- `common/_footer.gsp` — render(template:'/common/footer') in user/DashboardController.groovy; view path string '/common/footer' in user/DashboardController.groovy; included by layouts/
- `common/_fullstory.gsp` — included by layouts/custom.gsp
- `common/_hotjar.gsp` — included by layouts/custom.gsp; included by layouts/react.gsp
- `common/_localization.gsp` — included by layouts/custom.gsp
- `common/_menuicons.gsp` — included by dashboard/megamenu.gsp
- `common/react.gsp` — view path string '/common/react' in JsonController.groovy; view path string '/common/react' in MobileController.groovy; view path string '/common/react' in puta
- `dashboard/_loginLocations.gsp` — render(template:'loginLocations') in user/DashboardController.groovy; included by dashboard/chooseLocation.gsp
- `dashboard/chooseLocation.gsp` — controller action user/DashboardController.groovy::chooseLocation (implicit)
- `dashboard/megamenu.gsp` — controller action user/DashboardController.groovy::megamenu (implicit); g:include from layouts/custom.gsp

### email — removed 4, retained 21

Removed:

- `email/_emailTemplate.gsp`
- `email/_footer.gsp`
- `email/_userAccountChanged.gsp`
- `email/_userAccountPending.gsp`

Retained (why):

- `email/_applicationError.gsp` — view path string '/email/applicationError' in services/report/NotificationService.groovy
- `email/_approvalsAlert.gsp` — view path string '/email/approvalsAlert' in services/report/NotificationService.groovy
- `email/_approvalsStatusChanged.gsp` — view path string '/email/approvalsStatusChanged' in services/report/NotificationService.groovy
- `email/_errorReport.gsp` — render(template:'/email/errorReport') in core/ErrorsController.groovy; view path string '/email/errorReport' in core/ErrorsController.groovy
- `email/_expiryAlerts.gsp` — view path string '/email/expiryAlerts' in services/report/NotificationService.groovy
- `email/_fulfillmentAlert.gsp` — view path string '/email/fulfillmentAlert' in services/report/NotificationService.groovy
- `email/_goodsDeliveryNote.gsp` — view path string '/email/goodsDeliveryNote' in services/report/NotificationService.groovy
- `email/_header.gsp` — included by email/_fulfillmentAlert.gsp; included by email/_approvalsStatusChanged.gsp; included by email/_approvalsAlert.gsp
- `email/_inventoryItemTable.gsp` — included by email/_expiryAlerts.gsp
- `email/_productCreated.gsp` — render(template:'/email/productCreated') in api/ProductScreenApiController.groovy; render(template:'/email/productCreated') in product/ProductController.groovy;
- `email/_productTable.gsp` — included by email/_stockAlerts.gsp
- `email/_shipmentItemReceived.gsp` — render(template:'/email/shipmentItemReceived') in services/report/NotificationService.groovy; view path string '/email/shipmentItemReceived' in services/report/
- `email/_shipmentItemShipped.gsp` — render(template:'/email/shipmentItemShipped') in services/report/NotificationService.groovy; view path string '/email/shipmentItemShipped' in services/report/No
- `email/_shipmentReceived.gsp` — render(template:'/email/shipmentReceived') in shipping/ShipmentController.groovy; view path string '/email/shipmentReceived' in shipping/ShipmentController.groo
- `email/_shipmentShipped.gsp` — render(template:'/email/shipmentShipped') in shipping/ShipmentController.groovy; render(template:'/email/shipmentShipped') in api/CreateShipmentApiController.gr
- `email/_stockAlerts.gsp` — view path string '/email/stockAlerts' in services/report/NotificationService.groovy
- `email/_userAccountActivated.gsp` — render(template:'/email/userAccountActivated') in user/UserController.groovy; render(template:'/email/userAccountActivated') in api/UserApiController.groovy; vi
- `email/_userAccountConfirmed.gsp` — render(template:'/email/userAccountConfirmed') in user/AuthController.groovy; view path string '/email/userAccountConfirmed' in user/AuthController.groovy; view
- `email/_userAccountCreated.gsp` — render(template:'/email/userAccountCreated') in user/AuthController.groovy; view path string '/email/userAccountCreated' in user/AuthController.groovy; view pat
- `email/_userCanReceiveEmail.gsp` — render(template:'/email/userCanReceiveEmail') in user/UserController.groovy; render(template:'/email/userCanReceiveEmail') in api/UserApiController.groovy; view
- `email/_userPhotoChanged.gsp` — render(template:'/email/userPhotoChanged') in user/UserController.groovy; render(template:'/email/userPhotoChanged') in api/UserApiController.groovy; view path 

### errors — removed 0, retained 4

Retained (why):

- `errors/accessDenied.gsp` — view path string '/errors/accessDenied' in core/ErrorsController.groovy
- `errors/dataAccess.gsp` — view path string '/errors/dataAccess' in core/ErrorsController.groovy
- `errors/methodNotAllowed.gsp` — view path string '/errors/methodNotAllowed' in core/ErrorsController.groovy
- `errors/notFound.gsp` — view path string '/errors/notFound' in core/ErrorsController.groovy

### finance-config — removed 7, retained 12

Removed:

- `budgetCode/list.gsp`
- `eventType/list.gsp`
- `eventType/show.gsp`
- `glAccount/list.gsp`
- `glAccountType/list.gsp`
- `paymentTerm/list.gsp`
- `preferenceType/list.gsp`

Retained (why):

- `budgetCode/create.gsp` — action core/BudgetCodeController.groovy::create renders /common/react only; render(view:'create') in core/BudgetCodeController.groovy
- `budgetCode/edit.gsp` — action core/BudgetCodeController.groovy::edit renders /common/react only; render(view:'edit') in core/BudgetCodeController.groovy
- `eventType/create.gsp` — action core/EventTypeController.groovy::create renders /common/react only; render(view:'create') in core/EventTypeController.groovy
- `eventType/edit.gsp` — action core/EventTypeController.groovy::edit renders /common/react only; render(view:'edit') in core/EventTypeController.groovy
- `glAccount/create.gsp` — action core/GlAccountController.groovy::create renders /common/react only; render(view:'create') in core/GlAccountController.groovy
- `glAccount/edit.gsp` — action core/GlAccountController.groovy::edit renders /common/react only; render(view:'edit') in core/GlAccountController.groovy
- `glAccountType/create.gsp` — action core/GlAccountTypeController.groovy::create renders /common/react only; render(view:'create') in core/GlAccountTypeController.groovy
- `glAccountType/edit.gsp` — action core/GlAccountTypeController.groovy::edit renders /common/react only; render(view:'edit') in core/GlAccountTypeController.groovy
- `paymentTerm/create.gsp` — action core/PaymentTermController.groovy::create renders /common/react only; render(view:'create') in core/PaymentTermController.groovy
- `paymentTerm/edit.gsp` — action core/PaymentTermController.groovy::edit renders /common/react only; render(view:'edit') in core/PaymentTermController.groovy
- `preferenceType/create.gsp` — action core/PreferenceTypeController.groovy::create renders /common/react only; render(view:'create') in core/PreferenceTypeController.groovy
- `preferenceType/edit.gsp` — action core/PreferenceTypeController.groovy::edit renders /common/react only; render(view:'edit') in core/PreferenceTypeController.groovy

### inventory — removed 24, retained 9

Removed:

- `inventory/_actions.gsp`
- `inventory/_browseProduct.gsp`
- `inventory/_browseProductGroup.gsp`
- `inventory/_categoryActions.gsp`
- `inventory/_filters.gsp`
- `inventory/_inventoryDamaged.gsp`
- `inventory/_inventoryExpired.gsp`
- `inventory/_summary.gsp`
- `inventory/browse.gsp`
- `inventory/editBinLocation.gsp`
- `inventory/editTransaction.gsp`
- `inventory/listDailyTransactions.gsp`
- `inventory/listLowStock.gsp`
- `inventory/listReorderStock.gsp`
- `inventory/manage.gsp`
- `inventory/showProducts.gsp`
- `inventory/showTransaction.gsp`
- `inventory/upload.gsp`
- `inventoryBrowser/_sidebar.gsp`
- `inventoryBrowser/list.gsp`
- `inventorySnapshot/_sidebar.gsp`
- `inventorySnapshot/edit.gsp`
- `inventorySnapshot/list.gsp`
- `inventorySnapshot/show.gsp`

Retained (why):

- `inventory/_incomingTransfer.gsp` — included by inventory/createTransaction.gsp
- `inventory/_inventoryAdjustment.gsp` — included by inventory/createTransaction.gsp
- `inventory/_inventoryConsumed.gsp` — included by inventory/createTransaction.gsp
- `inventory/_outgoingTransfer.gsp` — included by inventory/createTransaction.gsp
- `inventory/createTransaction.gsp` — action inventory/InventoryController.groovy::createTransaction renders /common/react only; render(view:'createTransaction') in inventory/InventoryController.gro
- `inventory/list.gsp` — action inventory/InventoryController.groovy::list renders /common/react only; render(view:'list') in inventory/InventoryController.groovy
- `inventory/listExpiredStock.gsp` — controller action inventory/InventoryController.groovy::listExpiredStock (implicit)
- `inventory/listExpiringStock.gsp` — controller action inventory/InventoryController.groovy::listExpiringStock (implicit)
- `inventory/listTransactions.gsp` — action inventory/InventoryController.groovy::listTransactions renders /common/react only; render(view:'listTransactions') in inventory/InventoryController.groov

### invoicing — removed 2, retained 6

Removed:

- `invoice/_filters.gsp`
- `invoice/list.gsp`

Retained (why):

- `invoice/_actions.gsp` — included by invoice/_summary.gsp
- `invoice/_documents.gsp` — included by invoice/show.gsp
- `invoice/_invoiceItems.gsp` — included by invoice/show.gsp
- `invoice/_summary.gsp` — included by invoice/show.gsp; included by invoice/addDocument.gsp
- `invoice/addDocument.gsp` — controller action invoice/InvoiceController.groovy::addDocument (implicit)
- `invoice/show.gsp` — controller action invoice/InvoiceController.groovy::show (implicit); render(view:'show') in invoice/InvoiceController.groovy

### layouts — removed 5, retained 4

Removed:

- `layouts/analytics.gsp`
- `layouts/bootstrap.gsp`
- `layouts/main.gsp`
- `layouts/mobile.gsp`
- `layouts/stockCard.gsp`

Retained (why):

- `layouts/custom.gsp` — layout used by errors/methodNotAllowed.gsp; layout used by errors/dataAccess.gsp; layout used by errors/accessDenied.gsp
- `layouts/email.gsp` — layout used by email/_productCreated.gsp; layout used by email/_userAccountConfirmed.gsp; layout used by email/_userAccountCreated.gsp
- `layouts/print.gsp` — layout used by picklist/returnPrint.gsp; layout used by picklist/print.gsp; layout used by order/print.gsp
- `layouts/react.gsp` — layout used by common/react.gsp; layout used by partialReceiving/create.gsp

### locations-orgs — removed 28, retained 17

Removed:

- `country/list.gsp`
- `location/_form.gsp`
- `location/list.gsp`
- `location/showBinLocations.gsp`
- `location/showContents.gsp`
- `location/showZoneLocations.gsp`
- `location/uploadLogo.gsp`
- `locationGroup/list.gsp`
- `locationGroup/show.gsp`
- `locationRole/create.gsp`
- `locationRole/edit.gsp`
- `locationRole/list.gsp`
- `locationRole/show.gsp`
- `locationType/list.gsp`
- `locationType/show.gsp`
- `organization/_filters.gsp`
- `organization/list.gsp`
- `organization/show.gsp`
- `party/list.gsp`
- `party/show.gsp`
- `partyRole/list.gsp`
- `partyRole/show.gsp`
- `partyType/list.gsp`
- `partyType/show.gsp`
- `supplier/_documents.gsp`
- `supplier/_priceHistory.gsp`
- `supplier/list.gsp`
- `supplier/show.gsp`

Retained (why):

- `location/_actions.gsp` — included by location/_summary.gsp
- `location/_summary.gsp` — included by location/edit.gsp
- `location/edit.gsp` — action core/LocationController.groovy::edit renders /common/react only; render(view:'edit') in core/LocationController.groovy
- `locationGroup/_summary.gsp` — included by locationGroup/edit.gsp; included by locationGroup/create.gsp
- `locationGroup/create.gsp` — action core/LocationGroupController.groovy::create renders /common/react only; render(view:'create') in core/LocationGroupController.groovy
- `locationGroup/edit.gsp` — action core/LocationGroupController.groovy::edit renders /common/react only; render(view:'edit') in core/LocationGroupController.groovy
- `locationRole/_form.gsp` — render(template:'/locationRole/form') in user/UserController.groovy; view path string '/locationRole/form' in user/UserController.groovy
- `locationType/create.gsp` — action core/LocationTypeController.groovy::create renders /common/react only; render(view:'create') in core/LocationTypeController.groovy
- `locationType/edit.gsp` — action core/LocationTypeController.groovy::edit renders /common/react only; render(view:'edit') in core/LocationTypeController.groovy
- `organization/create.gsp` — action core/OrganizationController.groovy::create renders /common/react only; render(view:'create') in core/OrganizationController.groovy
- `organization/edit.gsp` — action core/OrganizationController.groovy::edit renders /common/react only; render(view:'edit') in core/OrganizationController.groovy
- `party/create.gsp` — action core/PartyController.groovy::create renders /common/react only; render(view:'create') in core/PartyController.groovy
- `party/edit.gsp` — action core/PartyController.groovy::edit renders /common/react only; render(view:'edit') in core/PartyController.groovy
- `partyRole/create.gsp` — action core/PartyRoleController.groovy::create renders /common/react only; render(view:'create') in core/PartyRoleController.groovy
- `partyRole/edit.gsp` — action core/PartyRoleController.groovy::edit renders /common/react only; render(view:'edit') in core/PartyRoleController.groovy
- `partyType/create.gsp` — action core/PartyTypeController.groovy::create renders /common/react only; render(view:'create') in core/PartyTypeController.groovy
- `partyType/edit.gsp` — action core/PartyTypeController.groovy::edit renders /common/react only; render(view:'edit') in core/PartyTypeController.groovy

### misc-root — removed 3, retained 1

Removed:

- `exception.gsp`
- `index.gsp`
- `unsupported.gsp`

Retained (why):

- `error.gsp` — view path string '/error' in core/ErrorsController.groovy

### mobile — removed 7, retained 1

Removed:

- `mobile/chooseLocation.gsp`
- `mobile/error.gsp`
- `mobile/index.gsp`
- `mobile/login.gsp`
- `mobile/outboundList.gsp`
- `mobile/productDetails.gsp`
- `mobile/productList.gsp`

Retained (why):

- `mobile/menu.gsp` — action MobileController.groovy::menu renders /common/react only; render(view:'/mobile/menu') in MobileController.groovy; view path string '/mobile/menu' in Mobi

### orders — removed 8, retained 24

Removed:

- `order/_orderItemSummaryFilters.gsp`
- `order/_orderStatusFilters.gsp`
- `order/listOrderItems.gsp`
- `order/orderItemSummaryList.gsp`
- `order/orderSummaryList.gsp`
- `orderAdjustmentType/list.gsp`
- `purchaseOrder/handleError.gsp`
- `purchaseOrder/placeOrder.gsp`

Retained (why):

- `order/_actions.gsp` — included by order/_summary.gsp; included by order/list.gsp
- `order/_filters.gsp` — included by order/list.gsp
- `order/_itemDetails.gsp` — render(template:'itemDetails') in order/OrderController.groovy
- `order/_itemStatus.gsp` — render(template:'itemStatus') in order/OrderController.groovy
- `order/_orderAdjustments.gsp` — render(template:'orderAdjustments') in order/OrderController.groovy
- `order/_orderComments.gsp` — render(template:'orderComments') in order/OrderController.groovy
- `order/_orderDocuments.gsp` — render(template:'orderDocuments') in order/OrderController.groovy
- `order/_orderInvoices.gsp` — render(template:'orderInvoices') in order/OrderController.groovy
- `order/_orderItemForm.gsp` — included by purchaseOrder/_showOrderItems.gsp
- `order/_orderItemFormDialog.gsp` — render(template:'orderItemFormDialog') in order/OrderController.groovy
- `order/_orderShipments.gsp` — render(template:'orderShipments') in order/OrderController.groovy
- `order/_orderSummary.gsp` — render(template:'orderSummary') in order/OrderController.groovy
- `order/_productSourceFormDialog.gsp` — render(template:'productSourceFormDialog') in order/OrderController.groovy
- `order/_summary.gsp` — included by purchaseOrder/_showOrderItems.gsp; included by purchaseOrder/_enterOrderDetails.gsp; included by order/editAdjustment.gsp
- `order/addComment.gsp` — controller action order/OrderController.groovy::addComment (implicit); render(view:'addComment') in order/OrderController.groovy
- `order/addDocument.gsp` — controller action order/OrderController.groovy::addDocument (implicit)
- `order/editAdjustment.gsp` — controller action order/OrderController.groovy::editAdjustment (implicit); render(view:'editAdjustment') in order/OrderController.groovy
- `order/list.gsp` — controller action order/OrderController.groovy::list (implicit)
- `order/print.gsp` — controller action order/OrderController.groovy::print (implicit)
- `order/show.gsp` — controller action order/OrderController.groovy::show (implicit); render(view:'show') in order/OrderController.groovy
- `orderAdjustmentType/create.gsp` — action order/OrderAdjustmentTypeController.groovy::create renders /common/react only; render(view:'create') in order/OrderAdjustmentTypeController.groovy
- `orderAdjustmentType/edit.gsp` — action order/OrderAdjustmentTypeController.groovy::edit renders /common/react only; render(view:'edit') in order/OrderAdjustmentTypeController.groovy
- `purchaseOrder/_enterOrderDetails.gsp` — render(template:'enterOrderDetails') in order/PurchaseOrderController.groovy
- `purchaseOrder/_showOrderItems.gsp` — render(template:'showOrderItems') in order/PurchaseOrderController.groovy

### partialReceiving — removed 0, retained 1

Retained (why):

- `partialReceiving/create.gsp` — controller action receiving/PartialReceivingController.groovy::create (implicit); render(view:'/partialReceiving/create') in receiving/PartialReceivingControlle

### picking — removed 2, retained 0

Removed:

- `replenishment/_printPage.gsp`
- `replenishment/print.gsp`

### picklist — removed 0, retained 8

Retained (why):

- `picklist/_page.gsp` — included by picklist/_print.gsp
- `picklist/_print.gsp` — render(template:'/picklist/print') in picklist/PicklistController.groovy; view path string '/picklist/print' in picklist/PicklistController.groovy
- `picklist/_printPage.gsp` — included by picklist/print.gsp
- `picklist/_returnPage.gsp` — included by picklist/_returnPrint.gsp
- `picklist/_returnPrint.gsp` — render(template:'/picklist/returnPrint') in picklist/PicklistController.groovy; view path string '/picklist/returnPrint' in picklist/PicklistController.groovy
- `picklist/_returnPrintPage.gsp` — included by picklist/returnPrint.gsp
- `picklist/print.gsp` — action picklist/PicklistController.groovy::print renders /common/react only; view path string '/picklist/print' in picklist/PicklistController.groovy
- `picklist/returnPrint.gsp` — action picklist/PicklistController.groovy::returnPrint renders /common/react only; view path string '/picklist/returnPrint' in picklist/PicklistController.groov

### print-documents — removed 17, retained 4

Removed:

- `deliveryNote/_addressSection.gsp`
- `deliveryNote/_notesSection.gsp`
- `deliveryNote/_printHeader.gsp`
- `deliveryNote/_printOutboundReturnTable.gsp`
- `deliveryNote/_printPage.gsp`
- `deliveryNote/_printToolbar.gsp`
- `deliveryNote/_signaturesSection.gsp`
- `deliveryNote/_styles.gsp`
- `deliveryNote/print.gsp`
- `deliveryNote/printOutboundReturn.gsp`
- `doc4j/download.gsp`
- `document/list.gsp`
- `document/show.gsp`
- `goodsReceiptNote/_body.gsp`
- `goodsReceiptNote/_header.gsp`
- `goodsReceiptNote/_signature.gsp`
- `goodsReceiptNote/print.gsp`

Retained (why):

- `document/_preview.gsp` — render(template:'preview') in core/DocumentController.groovy
- `document/create.gsp` — action core/DocumentController.groovy::create renders /common/react only; render(view:'create') in core/DocumentController.groovy
- `document/edit.gsp` — action core/DocumentController.groovy::edit renders /common/react only; render(view:'edit') in core/DocumentController.groovy
- `document/upload.gsp` — controller action core/DocumentController.groovy::upload (implicit)

### product-catalog — removed 22, retained 55

Removed:

- `attribute/list.gsp`
- `attribute/show.gsp`
- `product/addDocument.gsp`
- `product/batchEditProperties.gsp`
- `product/list.gsp`
- `product/productMergeLogs.gsp`
- `product/search.gsp`
- `product/show.gsp`
- `product/upnDatabase.gsp`
- `productAssociation/show.gsp`
- `productCatalog/list.gsp`
- `productCatalog/show.gsp`
- `productComponent/index.gsp`
- `productGroup/list.gsp`
- `productGroup/show.gsp`
- `productSupplier/list.gsp`
- `productSupplier/show.gsp`
- `productType/list.gsp`
- `productType/show.gsp`
- `tag/list.gsp`
- `tag/show.gsp`
- `unitOfMeasureConversion/list.gsp`

Retained (why):

- `attribute/_renderFormList.gsp` — included by productSupplier/_dialog.gsp; included by productSupplier/create.gsp; included by productSupplier/edit.gsp
- `attribute/edit.gsp` — action product/AttributeController.groovy::edit renders /common/react only; render(view:'edit') in product/AttributeController.groovy
- `product/_actions.gsp` — included by product/_summary.gsp
- `product/_actionsBatch.gsp` — included by product/batchEdit.gsp
- `product/_attributes.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_categories.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_category.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_documents.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_inventoryLevels.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_manufacturers.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_mergeProductConfirmationDialog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_mergeProducts.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productAssociations.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productCatalogs.gsp` — render(template:'productCatalogs') in product/ProductController.groovy
- `product/_productComponents.gsp` — render(template:'productComponents') in product/ProductController.groovy
- `product/_productDetails.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productGroups.gsp` — render(template:'productGroups') in product/ProductController.groovy
- `product/_productMergeLogsFilters.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productPackageDialog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productPackages.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productSuppliers.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_productSynonyms.gsp` — render(template:'productSynonyms') in product/ProductController.groovy
- `product/_productSynonymsEdit.gsp` — render(template:'productSynonymsEdit') in product/ProductController.groovy
- `product/_status.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_summary.gsp` — included by consumption/_product.gsp; included by product/edit.gsp
- `product/_summaryDialog.gsp` — included by inventoryLevel/_form.gsp
- `product/_tags.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_uomClassDialog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_uomDialog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/_uploadFile.gsp` — UNCERTAIN: dynamic render(template: <expr>) in product/ProductController.groovy
- `product/batchEdit.gsp` — action product/ProductController.groovy::batchEdit renders /common/react only; render(view:'batchEdit') in product/ProductController.groovy
- `product/edit.gsp` — action product/ProductController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductController.groovy
- `product/importAsCsv.gsp` — action product/ProductController.groovy::importAsCsv renders /common/react only; render(view:'importAsCsv') in product/ProductController.groovy
- `productAssociation/_dialog.gsp` — render(template:'dialog') in product/ProductAssociationController.groovy
- `productAssociation/_productAssociationDeleteDialog.gsp` — included by productAssociation/edit.gsp
- `productAssociation/create.gsp` — action product/ProductAssociationController.groovy::create renders /common/react only; render(view:'create') in product/ProductAssociationController.groovy
- `productAssociation/edit.gsp` — action product/ProductAssociationController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductAssociationController.groovy
- `productAssociation/list.gsp` — controller action product/ProductAssociationController.groovy::list (implicit)
- `productCatalog/_productCatalogItems.gsp` — render(template:'productCatalogItems') in product/ProductCatalogController.groovy; included by productCatalog/edit.gsp
- `productCatalog/_summary.gsp` — included by productCatalog/edit.gsp
- `productCatalog/create.gsp` — action product/ProductCatalogController.groovy::create renders /common/react only; render(view:'create') in product/ProductCatalogController.groovy
- `productCatalog/edit.gsp` — action product/ProductCatalogController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductCatalogController.groovy
- `productGroup/_products.gsp` — render(template:'products') in product/ProductGroupController.groovy; included by productGroup/edit.gsp
- `productGroup/create.gsp` — action product/ProductGroupController.groovy::create renders /common/react only; render(view:'create') in product/ProductGroupController.groovy
- `productGroup/edit.gsp` — action product/ProductGroupController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductGroupController.groovy
- `productSupplier/_dialog.gsp` — render(template:'dialog') in product/ProductSupplierController.groovy
- `productSupplier/create.gsp` — action product/ProductSupplierController.groovy::create renders /common/react only; render(view:'create') in product/ProductSupplierController.groovy
- `productSupplier/edit.gsp` — action product/ProductSupplierController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductSupplierController.groovy
- `productType/create.gsp` — action product/ProductTypeController.groovy::create renders /common/react only; render(view:'create') in product/ProductTypeController.groovy
- `productType/edit.gsp` — action product/ProductTypeController.groovy::edit renders /common/react only; render(view:'edit') in product/ProductTypeController.groovy
- `tag/_summary.gsp` — included by tag/create.gsp; included by tag/edit.gsp
- `tag/create.gsp` — action core/TagController.groovy::create renders /common/react only; render(view:'create') in core/TagController.groovy
- `tag/edit.gsp` — action core/TagController.groovy::edit renders /common/react only; render(view:'edit') in core/TagController.groovy
- `unitOfMeasureConversion/create.gsp` — action core/UnitOfMeasureConversionController.groovy::create renders /common/react only; render(view:'create') in core/UnitOfMeasureConversionController.groovy
- `unitOfMeasureConversion/edit.gsp` — action core/UnitOfMeasureConversionController.groovy::edit renders /common/react only; render(view:'edit') in core/UnitOfMeasureConversionController.groovy

### putAway — removed 0, retained 1

Retained (why):

- `putAway/_print.gsp` — render(template:'/putAway/print') in putaway/PutAwayController.groovy; view path string '/putAway/print' in putaway/PutAwayController.groovy

### quartz — removed 0, retained 1

Retained (why):

- `quartz/list.gsp` — view path string '/quartz/list' in UrlMappings.groovy

### receiving — removed 5, retained 0

Removed:

- `receiveOrderWorkflow/_progressBar.gsp`
- `receiveOrderWorkflow/receiveOrder/confirmOrderReceipt.gsp`
- `receiveOrderWorkflow/receiveOrder/enterShipmentDetails.gsp`
- `receiveOrderWorkflow/receiveOrder/handleError.gsp`
- `receiveOrderWorkflow/receiveOrder/processOrderItems.gsp`

### reporting — removed 19, retained 10

Removed:

- `consumption/pivot.gsp`
- `json/_searchResults.gsp`
- `report/_showTransactionReportMetadata.gsp`
- `report/printPaginatedPackingListReport.gsp`
- `report/printPickListReport.gsp`
- `report/printShippingReport.gsp`
- `report/showForecastReport.gsp`
- `report/showInventoryReport.gsp`
- `report/showPaginatedPackingListReport.gsp`
- `report/showRequestDetailReport.gsp`
- `report/showTransactionReport.gsp`
- `transaction/_actions.gsp`
- `transaction/_details.gsp`
- `transaction/_entries.gsp`
- `transaction/_summary.gsp`
- `transactionEntry/create.gsp`
- `transactionEntry/edit.gsp`
- `transactionEntry/list.gsp`
- `transactionEntry/show.gsp`

Retained (why):

- `consumption/_filters.gsp` — included by consumption/show.gsp
- `consumption/_product.gsp` — render(template:'product') in reporting/ConsumptionController.groovy
- `consumption/list.gsp` — controller action reporting/ConsumptionController.groovy::list (implicit)
- `consumption/show.gsp` — controller action reporting/ConsumptionController.groovy::show (implicit); render(view:'show') in reporting/ConsumptionController.groovy
- `json/createPerson.gsp` — controller action JsonController.groovy::createPerson (implicit)
- `report/_dataTableDialog.gsp` — render(template:'dataTableDialog') in reporting/ReportController.groovy
- `report/showBinLocationReport.gsp` — controller action reporting/ReportController.groovy::showBinLocationReport (implicit)
- `report/showCycleCountReport.gsp` — controller action reporting/ReportController.groovy::showCycleCountReport (implicit)
- `report/showInventoryByLocationReport.gsp` — controller action reporting/ReportController.groovy::showInventoryByLocationReport (implicit)
- `report/showOnOrderReport.gsp` — controller action reporting/ReportController.groovy::showOnOrderReport (implicit)

### requisitionTemplate — removed 0, retained 13

Retained (why):

- `requisitionTemplate/_actions.gsp` — included by requisitionTemplate/_summary.gsp
- `requisitionTemplate/_header.gsp` — included by requisitionTemplate/editHeader.gsp; included by requisitionTemplate/edit.gsp; included by requisitionTemplate/sendMail.gsp
- `requisitionTemplate/_list.gsp` — UNCERTAIN: dynamic render(view: <expr>) in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/_printPage.gsp` — UNCERTAIN: dynamic render(view: <expr>) in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/_summary.gsp` — included by requisitionTemplate/editHeader.gsp; included by requisitionTemplate/create.gsp; included by requisitionTemplate/edit.gsp
- `requisitionTemplate/batch.gsp` — controller action requisition/RequisitionTemplateController.groovy::batch (implicit); render(view:'batch') in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/create.gsp` — action requisition/RequisitionTemplateController.groovy::create renders /common/react only; render(view:'create') in requisition/RequisitionTemplateController.g
- `requisitionTemplate/edit.gsp` — controller action requisition/RequisitionTemplateController.groovy::edit (implicit); render(view:'edit') in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/editHeader.gsp` — controller action requisition/RequisitionTemplateController.groovy::editHeader (implicit)
- `requisitionTemplate/list.gsp` — UNCERTAIN: dynamic render(view: <expr>) in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/print.gsp` — UNCERTAIN: dynamic render(view: <expr>) in requisition/RequisitionTemplateController.groovy
- `requisitionTemplate/sendMail.gsp` — controller action requisition/RequisitionTemplateController.groovy::sendMail (implicit)
- `requisitionTemplate/show.gsp` — controller action requisition/RequisitionTemplateController.groovy::show (implicit)

### requisitions — removed 29, retained 14

Removed:

- `requisition/_buttons.gsp`
- `requisition/_cancelQuantity.gsp`
- `requisition/_changePackageSize.gsp`
- `requisition/_changeQuantity.gsp`
- `requisition/_chooseSubstitute.gsp`
- `requisition/_flowHeader.gsp`
- `requisition/_list.gsp`
- `requisition/_menu.gsp`
- `requisition/_modifyRequisitionItem.gsp`
- `requisition/_pickRequisitionItem.gsp`
- `requisition/_requisitionItems.gsp`
- `requisition/_reviewRequisitionItem.gsp`
- `requisition/_supplementProduct.gsp`
- `requisition/addComment.gsp`
- `requisition/addDocument.gsp`
- `requisition/chooseTemplate.gsp`
- `requisition/confirm.gsp`
- `requisition/create.gsp`
- `requisition/edit.gsp`
- `requisition/fulfill.gsp`
- `requisition/fulfillItem.gsp`
- `requisition/list.gsp`
- `requisition/pick.gsp`
- `requisition/printDraft.gsp`
- `requisition/process.gsp`
- `requisition/review.gsp`
- `requisition/showPicklist.gsp`
- `requisition/substitute.gsp`
- `requisitionItem/_actions.gsp`

Retained (why):

- `requisition/_actions.gsp` — included by requisition/_summary.gsp
- `requisition/_editRequisitionItem.gsp` — render(template:'editRequisitionItem') in requisition/RequisitionController.groovy
- `requisition/_header.gsp` — included by requisition/show.gsp; included by requisition/editHeader.gsp; included by requisitionItem/change.gsp
- `requisition/_picklistItems.gsp` — render(template:'picklistItems') in requisition/RequisitionController.groovy
- `requisition/_requisitionItems2.gsp` — render(template:'requisitionItems2') in requisition/RequisitionController.groovy
- `requisition/_showRequisitionItem.gsp` — included by stockMovement/_requisition.gsp; included by requisition/show.gsp
- `requisition/_summary.gsp` — included by requisition/show.gsp; included by requisition/createNonStock.gsp; included by requisition/editHeader.gsp
- `requisition/createNonStock.gsp` — render(view:'createNonStock') in requisition/RequisitionController.groovy
- `requisition/createStock.gsp` — render(view:'createStock') in requisition/RequisitionController.groovy
- `requisition/editHeader.gsp` — action requisition/RequisitionController.groovy::editHeader renders /common/react only; render(view:'editHeader') in requisition/RequisitionController.groovy
- `requisition/show.gsp` — controller action requisition/RequisitionController.groovy::show (implicit)
- `requisition/transfer.gsp` — action requisition/RequisitionController.groovy::transfer renders /common/react only; render(view:'transfer') in requisition/RequisitionController.groovy
- `requisitionItem/change.gsp` — controller action requisition/RequisitionItemController.groovy::change (implicit)
- `requisitionItem/list.gsp` — action requisition/RequisitionItemController.groovy::list renders /common/react only; render(view:'list') in requisition/RequisitionItemController.groovy

### shipment-workflow — removed 26, retained 0

Removed:

- `createShipmentWorkflow/_addIncomingItem.gsp`
- `createShipmentWorkflow/_addItem.gsp`
- `createShipmentWorkflow/_addLocation.gsp`
- `createShipmentWorkflow/_addPerson.gsp`
- `createShipmentWorkflow/_addShipper.gsp`
- `createShipmentWorkflow/_containerButtons.gsp`
- `createShipmentWorkflow/_containerFields.gsp`
- `createShipmentWorkflow/_containerMenuItems.gsp`
- `createShipmentWorkflow/_editBox.gsp`
- `createShipmentWorkflow/_editContainer.gsp`
- `createShipmentWorkflow/_editItem.gsp`
- `createShipmentWorkflow/_flowHeader.gsp`
- `createShipmentWorkflow/_itemFields.gsp`
- `createShipmentWorkflow/_itemFoundFields.gsp`
- `createShipmentWorkflow/_itemMenuItems.gsp`
- `createShipmentWorkflow/_itemTableRow.gsp`
- `createShipmentWorkflow/_moveContainer.gsp`
- `createShipmentWorkflow/_moveDraggableItem.gsp`
- `createShipmentWorkflow/_moveItem.gsp`
- `createShipmentWorkflow/_shipmentButtons.gsp`
- `createShipmentWorkflow/_shipmentMenuItems.gsp`
- `createShipmentWorkflow/createShipment/enterContainerDetails.gsp`
- `createShipmentWorkflow/createShipment/enterShipmentDetails.gsp`
- `createShipmentWorkflow/createShipment/enterTrackingDetails.gsp`
- `createShipmentWorkflow/createShipment/pickShipmentItems.gsp`
- `createShipmentWorkflow/createShipment/sendShipment.gsp`

### shipments — removed 15, retained 18

Removed:

- `container/_summary.gsp`
- `shipment/_filters.gsp`
- `shipment/_list.gsp`
- `shipment/_listShippingMenuItems.gsp`
- `shipment/_sidebar.gsp`
- `shipment/addComment.gsp`
- `shipment/addDocument.gsp`
- `shipment/deleteShipment.gsp`
- `shipment/list.gsp`
- `shipment/receiveShipment.gsp`
- `shipmentItem/list.gsp`
- `shipmentItem/show.gsp`
- `shipmentItem/split.gsp`
- `shipmentWorkflow/list.gsp`
- `shipmentWorkflow/show.gsp`

Retained (why):

- `shipment/_actions.gsp` — included by shipment/showDetails.gsp; included by shipment/_summary.gsp
- `shipment/_barcodeLabel.gsp` — render(template:'barcodeLabel') in shipping/ShipmentController.groovy
- `shipment/_buttons.gsp` — included by shipment/showDetails.gsp
- `shipment/_container.gsp` — included by shipment/showDetails.gsp
- `shipment/_showPutawayLocations.gsp` — render(template:'showPutawayLocations') in shipping/ShipmentController.groovy
- `shipment/_showTracking.gsp` — render(template:'showTracking') in shipping/ShipmentController.groovy
- `shipment/_showTransactions.gsp` — render(template:'showTransactions') in shipping/ShipmentController.groovy
- `shipment/_summary.gsp` — included by shipment/showDetails.gsp; included by shipment/showPackingList.gsp; included by shipment/sendShipment.gsp
- `shipment/addToShipment.gsp` — action shipping/ShipmentController.groovy::addToShipment renders /common/react only; render(view:'addToShipment') in shipping/ShipmentController.groovy
- `shipment/editEvent.gsp` — action shipping/ShipmentController.groovy::editEvent renders /common/react only; render(view:'editEvent') in shipping/ShipmentController.groovy
- `shipment/sendShipment.gsp` — controller action shipping/ShipmentController.groovy::sendShipment (implicit)
- `shipment/showDetails.gsp` — controller action shipping/ShipmentController.groovy::showDetails (implicit)
- `shipment/showPackingList.gsp` — controller action shipping/ShipmentController.groovy::showPackingList (implicit)
- `shipmentItem/create.gsp` — action shipping/ShipmentItemController.groovy::create renders /common/react only; render(view:'create') in shipping/ShipmentItemController.groovy
- `shipmentItem/edit.gsp` — action shipping/ShipmentItemController.groovy::edit renders /common/react only; render(view:'edit') in shipping/ShipmentItemController.groovy
- `shipmentItem/pick.gsp` — action shipping/ShipmentItemController.groovy::pick renders /common/react only; render(view:'pick') in shipping/ShipmentItemController.groovy
- `shipmentWorkflow/create.gsp` — action shipping/ShipmentWorkflowController.groovy::create renders /common/react only; render(view:'create') in shipping/ShipmentWorkflowController.groovy
- `shipmentWorkflow/edit.gsp` — action shipping/ShipmentWorkflowController.groovy::edit renders /common/react only; render(view:'edit') in shipping/ShipmentWorkflowController.groovy

### stock-card — removed 8, retained 32

Removed:

- `inventoryItem/editInventoryLevel.gsp`
- `inventoryItem/recordInventory.gsp`
- `inventoryItem/showGraph.gsp`
- `inventoryItem/showLotNumbers.gsp`
- `inventoryItem/showRecordInventory.gsp`
- `inventoryItem/showStockCard.gsp`
- `inventoryItem/showTransactionLog.gsp`
- `inventoryLevel/show.gsp`

Retained (why):

- `inventoryItem/_actions.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_actionsCurrentStock.gsp` — included by inventoryItem/_showCurrentStock.gsp
- `inventoryItem/_addToShipment.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_adjustStock.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_editItemDialog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_printStockHistory.gsp` — render(template:'printStockHistory') in inventory/InventoryItemController.groovy
- `inventoryItem/_productDetails.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_returnStock.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showCurrentStock.gsp` — render(template:'showCurrentStock') in inventory/InventoryItemController.groovy
- `inventoryItem/_showCurrentStockAllLocations.gsp` — render(template:'showCurrentStockAllLocations') in inventory/InventoryItemController.groovy
- `inventoryItem/_showDemand.gsp` — render(template:'showDemand') in inventory/InventoryItemController.groovy
- `inventoryItem/_showDocuments.gsp` — render(template:'showDocuments') in inventory/InventoryItemController.groovy
- `inventoryItem/_showGraph.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showInventorySnapshot.gsp` — render(template:'showInventorySnapshot') in inventory/InventoryItemController.groovy
- `inventoryItem/_showLotNumbers.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showPendingInboundStock.gsp` — render(template:'showPendingInboundStock') in inventory/InventoryItemController.groovy
- `inventoryItem/_showPendingOutboundStock.gsp` — render(template:'showPendingOutboundStock') in inventory/InventoryItemController.groovy
- `inventoryItem/_showProductAssociations.gsp` — render(template:'showProductAssociations') in inventory/InventoryItemController.groovy
- `inventoryItem/_showProductDemand.gsp` — render(template:'showProductDemand') in inventory/InventoryItemController.groovy
- `inventoryItem/_showRecordInventory.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showRecordInventory2.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showStockCard.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showStockCardMenuItems.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_showStockHistory.gsp` — render(template:'showStockHistory') in inventory/InventoryItemController.groovy
- `inventoryItem/_showStockHistoryPrintable.gsp` — included by inventoryItem/_printStockHistory.gsp
- `inventoryItem/_showSuppliers.gsp` — render(template:'showSuppliers') in inventory/InventoryItemController.groovy
- `inventoryItem/_showTransactionLog.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryItem/_transferStock.gsp` — UNCERTAIN: dynamic render(template: <expr>) in inventory/InventoryItemController.groovy
- `inventoryLevel/_form.gsp` — render(template:'form') in inventory/InventoryLevelController.groovy; included by inventoryLevel/edit.gsp; included by inventoryLevel/create.gsp
- `inventoryLevel/create.gsp` — action inventory/InventoryLevelController.groovy::create renders /common/react only; render(view:'create') in inventory/InventoryLevelController.groovy
- `inventoryLevel/edit.gsp` — action inventory/InventoryLevelController.groovy::edit renders /common/react only; render(view:'edit') in inventory/InventoryLevelController.groovy
- `inventoryLevel/list.gsp` — controller action inventory/InventoryLevelController.groovy::list (implicit)

### stock-movements — removed 5, retained 9

Removed:

- `stockMovement/_actions.gsp`
- `stockMovement/_list.gsp`
- `stockMovement/addComment.gsp`
- `stockMovement/addDocument.gsp`
- `stockMovement/list.gsp`

Retained (why):

- `stockMovement/_comments.gsp` — render(template:'comments') in inventory/StockMovementController.groovy
- `stockMovement/_documents.gsp` — render(template:'documents') in inventory/StockMovementController.groovy
- `stockMovement/_events.gsp` — render(template:'events') in inventory/StockMovementController.groovy
- `stockMovement/_packingList.gsp` — render(template:'packingList') in inventory/StockMovementController.groovy
- `stockMovement/_receipts.gsp` — render(template:'receipts') in inventory/StockMovementController.groovy
- `stockMovement/_requisition.gsp` — render(template:'requisition') in inventory/StockMovementController.groovy
- `stockMovement/_summary.gsp` — included by stockMovement/show.gsp
- `stockMovement/_synchronizeDialog.gsp` — render(template:'synchronizeDialog') in inventory/StockMovementController.groovy
- `stockMovement/show.gsp` — controller action inventory/StockMovementController.groovy::show (implicit)

### stock-transfers — removed 5, retained 3

Removed:

- `returns/show.gsp`
- `stockTransfer/_filters.gsp`
- `stockTransfer/_printPage.gsp`
- `stockTransfer/list.gsp`
- `stockTransfer/print.gsp`

Retained (why):

- `stockTransfer/_orderSummary.gsp` — included by stockTransfer/show.gsp
- `stockTransfer/_summary.gsp` — included by stockTransfer/show.gsp
- `stockTransfer/show.gsp` — controller action inventory/StockTransferController.groovy::show (implicit)

### stocklists — removed 1, retained 2

Removed:

- `stocklist/show.gsp`

Retained (why):

- `stocklist/_itemList.gsp` — included by stocklist/_print.gsp
- `stocklist/_print.gsp` — render(template:'/stocklist/print') in stocklist/StocklistController.groovy; render(template:'/stocklist/print') in services/inventory/StocklistService.groovy; 

### taglib-views — removed 4, retained 16

Removed:

- `taglib/_createLocation.gsp`
- `taglib/_selectCategories.gsp`
- `taglib/_selectPerson.gsp`
- `taglib/_selectProducts.gsp`

Retained (why):

- `taglib/_autoSuggest.gsp` — render(template:'/taglib/autoSuggest') in taglib/AutoSuggestTagLib.groovy; view path string '/taglib/autoSuggest' in taglib/AutoSuggestTagLib.groovy
- `taglib/_autoSuggestSearchable.gsp` — render(template:'/taglib/autoSuggestSearchable') in taglib/AutoSuggestSearchableTagLib.groovy; view path string '/taglib/autoSuggestSearchable' in taglib/AutoSu
- `taglib/_autoSuggestString.gsp` — render(template:'/taglib/autoSuggestString') in taglib/AutoSuggestStringTagLib.groovy; view path string '/taglib/autoSuggestString' in taglib/AutoSuggestStringT
- `taglib/_chooseSubstitute.gsp` — render(template:'/taglib/chooseSubstitute') in taglib/AutoSuggestTagLib.groovy; view path string '/taglib/chooseSubstitute' in taglib/AutoSuggestTagLib.groovy
- `taglib/_comboBox.gsp` — render(template:'/taglib/comboBox') in taglib/ComboBoxTagLib.groovy; view path string '/taglib/comboBox' in taglib/ComboBoxTagLib.groovy
- `taglib/_decimalFormatField.gsp` — render(template:'/taglib/decimalFormatField') in taglib/DecimalNumberFieldTagLib.groovy; view path string '/taglib/decimalFormatField' in taglib/DecimalNumberFi
- `taglib/_displayBarcode.gsp` — render(template:'/taglib/displayBarcode') in taglib/ImageTagLib.groovy; view path string '/taglib/displayBarcode' in taglib/ImageTagLib.groovy
- `taglib/_displayLogo.gsp` — render(template:'/taglib/displayLogo') in taglib/ImageTagLib.groovy; view path string '/taglib/displayLogo' in taglib/ImageTagLib.groovy
- `taglib/_expirationDate.gsp` — render(template:'/taglib/expirationDate') in taglib/DateTagLib.groovy; view path string '/taglib/expirationDate' in taglib/DateTagLib.groovy
- `taglib/_globalSearch.gsp` — render(template:'/taglib/globalSearch') in taglib/GlobalSearchTagLib.groovy; view path string '/taglib/globalSearch' in taglib/GlobalSearchTagLib.groovy
- `taglib/_globalSearchStatic.gsp` — render(template:'/taglib/globalSearchStatic') in taglib/GlobalSearchTagLib.groovy; view path string '/taglib/globalSearchStatic' in taglib/GlobalSearchTagLib.gr
- `taglib/_productDisplayName.gsp` — render(template:'/taglib/productDisplayName') in taglib/FormatTagLib.groovy; view path string '/taglib/productDisplayName' in taglib/FormatTagLib.groovy
- `taglib/_productStatus.gsp` — render(template:'/taglib/productStatus') in taglib/InventoryTagLib.groovy; view path string '/taglib/productStatus' in taglib/InventoryTagLib.groovy
- `taglib/_searchProduct.gsp` — render(template:'../taglib/searchProduct') in taglib/SearchProductTagLib.groovy
- `taglib/_selectContainer.gsp` — render(template:'/taglib/selectContainer') in taglib/SelectTagLib.groovy; view path string '/taglib/selectContainer' in taglib/SelectTagLib.groovy
- `taglib/_userPhoto.gsp` — render(template:'/taglib/userPhoto') in taglib/AuthTagLib.groovy; view path string '/taglib/userPhoto' in taglib/AuthTagLib.groovy

### users-security — removed 9, retained 7

Removed:

- `person/list.gsp`
- `person/show.gsp`
- `role/create.gsp`
- `role/edit.gsp`
- `role/index.gsp`
- `role/show.gsp`
- `user/cropPhoto.gsp`
- `user/list.gsp`
- `user/show.gsp`

Retained (why):

- `person/create.gsp` — action core/PersonController.groovy::create renders /common/react only; render(view:'create') in core/PersonController.groovy
- `person/edit.gsp` — action core/PersonController.groovy::edit renders /common/react only; render(view:'edit') in core/PersonController.groovy
- `user/_actions.gsp` — included by user/_summary.gsp
- `user/_summary.gsp` — included by user/edit.gsp; included by user/changePhoto.gsp
- `user/changePhoto.gsp` — action user/UserController.groovy::changePhoto renders /common/react only; render(view:'changePhoto') in user/UserController.groovy
- `user/create.gsp` — action user/UserController.groovy::create renders /common/react only; render(view:'create') in user/UserController.groovy
- `user/edit.gsp` — action user/UserController.groovy::edit renders /common/react only; render(view:'edit') in user/UserController.groovy

