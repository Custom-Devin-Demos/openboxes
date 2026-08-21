import React, { useMemo } from 'react';

import queryString from 'query-string';
import Loadable from 'react-loadable';
import { useSelector } from 'react-redux';
import {
  BrowserRouter, Redirect, Route, Switch,
} from 'react-router-dom';
import Alert from 'react-s-alert';
import { ClimbingBoxLoader } from 'react-spinners';
import {
  getCurrentLocationSupportedActivities,
  getNotificationAutohideDelay,
  getSpinner,
} from 'selectors';

import CustomAlert from 'components/dashboard/CustomAlert';
import MainLayoutRoute from 'components/Layout/v2/MainLayoutRoute';
import Loading from 'components/Loading';
import ActivityCode from 'consts/activityCode';
import { DASHBOARD_URL } from 'consts/applicationUrls';
import useConnectionListener from 'hooks/useConnectionListener';
import FlashScopeListenerWrapper from 'wrappers/FlashScopeListenerWrapper';

import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/bouncyflip.css';

// TODO: Fix entering Inbound SM from list

const AsyncStockMovement = Loadable({
  loader: () => import('components/stock-movement-wizard/StockMovement'),
  loading: Loading,
});

const AsyncStockMovementInbound = Loadable({
  loader: () => import('components/stock-movement-wizard/inboundV2/Inbound'),
  loading: Loading,
});

const AsyncStockMovementCombinedShipments = Loadable({
  loader: () => import('components/stock-movement-wizard/StockMovementCombinedShipments'),
  loading: Loading,
});

const AsyncStockMovementRequest = Loadable({
  loader: () => import('components/stock-movement-wizard/StockMovementRequest'),
  loading: Loading,
});

const AsyncStockMovementVerifyRequest = Loadable({
  loader: () => import('components/stock-movement-wizard/StockMovementVerifyRequest'),
  loading: Loading,
});

const AsyncReceivingPage = Loadable({
  loader: () => import('components/receiving/ReceivingPage'),
  loading: Loading,
});

const AsyncPutAwayMainPage = Loadable({
  loader: () => import('components/put-away/PutAwayMainPage'),
  loading: Loading,
});

const AsyncManagement = Loadable({
  loader: () => import('components/stock-list-management/StocklistManagement'),
  loading: Loading,
});

const AsyncDashboard = Loadable({
  loader: () => import('components/dashboard/Dashboard'),
  loading: Loading,
});

const AsyncStockRequestDashboard = Loadable({
  loader: () => import('components/dashboard/StockRequestDashboard'),
  loading: Loading,
});

// TODO add megamenu and menu config
const AsyncInvoice = Loadable({
  loader: () => import('components/invoice/create/InvoiceWizard'),
  loading: Loading,
});

const AsyncInvoiceList = Loadable({
  loader: () => import('components/invoice/list/InvoiceList'),
  loading: Loading,
});

const AsyncInvoiceShow = Loadable({
  loader: () => import('components/invoice/show/InvoiceShowPage'),
  loading: Loading,
});

const AsyncInvoiceAddDocument = Loadable({
  loader: () => import('components/invoice/show/InvoiceAddDocumentPage'),
  loading: Loading,
});

const AsyncStockTransfer = Loadable({
  loader: () => import('components/stock-transfer/StockTransferWizard'),
  loading: Loading,
});

const AsyncOutboundReturns = Loadable({
  loader: () => import('components/returns/outbound/OutboundReturnsWizard'),
  loading: Loading,
});

const AsyncInboundReturns = Loadable({
  loader: () => import('components/returns/inbound/InboundReturnsWizard'),
  loading: Loading,
});

const AsyncReplenishment = Loadable({
  loader: () => import('components/replenishment/ReplenishmentWizard'),
  loading: Loading,
});

const AsyncProductsConfiguration = Loadable({
  loader: () => import('components/products-configuration/ProductsConfigurationWizard'),
  loading: Loading,
});

const AsyncLocationsConfiguration = Loadable({
  loader: () => import('components/locations-configuration/LocationsConfigurationWizard'),
  loading: Loading,
});

const AsyncImportLocations = Loadable({
  loader: () => import('components/locations-configuration/ImportLocations'),
  loading: Loading,
});

const AsyncLocationsList = Loadable({
  loader: () => import('components/locations/LocationsList'),
  loading: Loading,
});

const AsyncLocationEdit = Loadable({
  loader: () => import('components/locations/LocationEdit'),
  loading: Loading,
});

const AsyncLocationBinLocations = Loadable({
  loader: () => import('components/locations/LocationBinLocations'),
  loading: Loading,
});

const AsyncLocationZoneLocations = Loadable({
  loader: () => import('components/locations/LocationZoneLocations'),
  loading: Loading,
});

const AsyncLocationContents = Loadable({
  loader: () => import('components/locations/LocationContents'),
  loading: Loading,
});

const AsyncLocationUploadLogo = Loadable({
  loader: () => import('components/locations/LocationUploadLogo'),
  loading: Loading,
});

const AsyncSupplierList = Loadable({
  loader: () => import('components/supplier/SupplierList'),
  loading: Loading,
});

const AsyncSupplierShow = Loadable({
  loader: () => import('components/supplier/SupplierShow'),
  loading: Loading,
});

const AsyncWelcomePage = Loadable({
  loader: () => import('components/locations-configuration/WelcomePage'),
  loading: Loading,
});

const AsyncLoadDataPage = Loadable({
  loader: () => import('components/load-demo-data/LoadDemoDataPage'),
  loading: Loading,
});

const AsyncResetInstancePage = Loadable({
  loader: () => import('components/reset-instance/ResettingInstanceInfoPage'),
  loading: Loading,
});

const AsyncPurchaseOrderList = Loadable({
  loader: () => import('components/purchaseOrder/PurchaseOrderList'),
  loading: Loading,
});

const AsyncOrderList = Loadable({
  loader: () => import('components/order/OrderList'),
  loading: Loading,
});

const AsyncPendingOrderItemsList = Loadable({
  loader: () => import('components/order/PendingOrderItemsList'),
  loading: Loading,
});

const AsyncOrderItemSummaryList = Loadable({
  loader: () => import('components/order/OrderItemSummaryList'),
  loading: Loading,
});

const AsyncOrderAddCommentPage = Loadable({
  loader: () => import('components/order/OrderAddCommentPage'),
  loading: Loading,
});

const AsyncOrderAddDocumentPage = Loadable({
  loader: () => import('components/order/OrderAddDocumentPage'),
  loading: Loading,
});

const AsyncOrderEditAdjustmentPage = Loadable({
  loader: () => import('components/order/OrderEditAdjustmentPage'),
  loading: Loading,
});

const AsyncOrderSummaryList = Loadable({
  loader: () => import('components/order/OrderSummaryList'),
  loading: Loading,
});

const AsyncOrderShow = Loadable({
  loader: () => import('components/order/show/OrderShow'),
  loading: Loading,
});

const AsyncOrderPrint = Loadable({
  loader: () => import('components/order/OrderPrint'),
  loading: Loading,
});

const AsyncOrderAdjustmentTypeList = Loadable({
  loader: () => import('components/orderAdjustmentType/OrderAdjustmentTypeList'),
  loading: Loading,
});

const AsyncOrderAdjustmentTypeForm = Loadable({
  loader: () => import('components/orderAdjustmentType/OrderAdjustmentTypeForm'),
  loading: Loading,
});

const AsyncStockList = Loadable({
  loader: () => import('components/stock-list/StockList'),
  loading: Loading,
});

const AsyncProductsList = Loadable({
  loader: () => import('components/products/ProductsList'),
  loading: Loading,
});

const AsyncStockMovementInboundList = Loadable({
  loader: () => import('components/stock-movement/inbound/StockMovementInboundList'),
  loading: Loading,
});

const AsyncStockMovementOutboundList = Loadable({
  loader: () => import('components/stock-movement/outbound/StockMovementOutboundList'),
  loading: Loading,
});

const AsyncBudgetCodeList = Loadable({
  loader: () => import('components/budgetCode/BudgetCodeList'),
  loading: Loading,
});

const AsyncBudgetCodeForm = Loadable({
  loader: () => import('components/budgetCode/BudgetCodeForm'),
  loading: Loading,
});

const AsyncEventTypeForm = Loadable({
  loader: () => import('components/eventType/EventTypeForm'),
  loading: Loading,
});

const AsyncLocationGroupList = Loadable({
  loader: () => import('components/locationGroup/LocationGroupList'),
  loading: Loading,
});

const AsyncLocationGroupForm = Loadable({
  loader: () => import('components/locationGroup/LocationGroupForm'),
  loading: Loading,
});

const AsyncLocationGroupShow = Loadable({
  loader: () => import('components/locationGroup/LocationGroupShow'),
  loading: Loading,
});

const AsyncLocationTypeForm = Loadable({
  loader: () => import('components/locationType/LocationTypeForm'),
  loading: Loading,
});

const AsyncEventTypeList = Loadable({
  loader: () => import('components/eventType/EventTypeList'),
  loading: Loading,
});

const AsyncEventTypeShow = Loadable({
  loader: () => import('components/eventType/EventTypeShow'),
  loading: Loading,
});

const AsyncGlAccountList = Loadable({
  loader: () => import('components/glAccount/GlAccountList'),
  loading: Loading,
});

const AsyncGlAccountForm = Loadable({
  loader: () => import('components/glAccount/GlAccountForm'),
  loading: Loading,
});

const AsyncGlAccountTypeList = Loadable({
  loader: () => import('components/glAccountType/GlAccountTypeList'),
  loading: Loading,
});

const AsyncGlAccountTypeForm = Loadable({
  loader: () => import('components/glAccountType/GlAccountTypeForm'),
  loading: Loading,
});

const AsyncPaymentTermForm = Loadable({
  loader: () => import('components/paymentTerm/PaymentTermForm'),
  loading: Loading,
});

const AsyncPaymentTermList = Loadable({
  loader: () => import('components/paymentTerm/PaymentTermList'),
  loading: Loading,
});

const AsyncPreferenceTypeList = Loadable({
  loader: () => import('components/preferenceType/PreferenceTypeList'),
  loading: Loading,
});

const AsyncPreferenceTypeForm = Loadable({
  loader: () => import('components/preferenceType/PreferenceTypeForm'),
  loading: Loading,
});

const AsyncProductSupplierList = Loadable({
  loader: () => import('components/productSupplier/ProductSupplierList'),
  loading: Loading,
});

const AsyncProductSupplierCreatePage = Loadable({
  loader: () => import('components/productSupplier/create/ProductSupplierForm'),
  loading: Loading,
});

const AsyncOutboundImport = Loadable({
  loader: () => import('components/stock-movement-wizard/outboundImport/OutboundImport'),
  loading: Loading,
});

const AsyncCycleCount = Loadable({
  loader: () => import('components/cycleCount/CycleCount'),
  loading: Loading,
});

const AsyncCycleCountCountStep = Loadable({
  loader: () => import('components/cycleCount/toCountTab/CountStep'),
  loading: Loading,
});

const AsyncCycleCountResolveStep = Loadable({
  loader: () => import('components/cycleCount/toResolveTab/ResolveStep'),
  loading: Loading,
});

const AsyncCycleCountReporting = Loadable({
  loader: () => import('components/cycleCountReporting/CycleCountReporting'),
  loading: Loading,
});

const AsyncReorderReport = Loadable({
  loader: () => import('components/reporting/reorderReport/ReorderReport'),
  loading: Loading,
});

const AsyncExpirationHistoryReport = Loadable({
  loader: () => import('components/reporting/expirationHistoryReport/ExpirationHistoryReport'),
  loading: Loading,
});

const AsyncInventoryBrowser = Loadable({
  loader: () => import('components/inventory/InventoryBrowser'),
  loading: Loading,
});

const AsyncInventoryList = Loadable({
  loader: () => import('components/inventory/InventoryList'),
  loading: Loading,
});

const AsyncLowStockList = Loadable({
  loader: () => import('components/inventory/LowStockList'),
  loading: Loading,
});

const AsyncReorderStockList = Loadable({
  loader: () => import('components/inventory/ReorderStockList'),
  loading: Loading,
});

const AsyncDailyTransactions = Loadable({
  loader: () => import('components/inventory/DailyTransactions'),
  loading: Loading,
});

const AsyncExpiredStockList = Loadable({
  loader: () => import('components/inventory/ExpiredStockList'),
  loading: Loading,
});

const AsyncExpiringStockList = Loadable({
  loader: () => import('components/inventory/ExpiringStockList'),
  loading: Loading,
});

const AsyncEditBinLocation = Loadable({
  loader: () => import('components/inventory/EditBinLocation'),
  loading: Loading,
});

const AsyncTransactionList = Loadable({
  loader: () => import('components/inventory/TransactionList'),
  loading: Loading,
});

const AsyncManageInventory = Loadable({
  loader: () => import('components/inventory/ManageInventory'),
  loading: Loading,
});

const AsyncShowProducts = Loadable({
  loader: () => import('components/inventory/ShowProducts'),
  loading: Loading,
});

const AsyncShowTransaction = Loadable({
  loader: () => import('components/inventory/ShowTransaction'),
  loading: Loading,
});

const AsyncUploadInventory = Loadable({
  loader: () => import('components/inventory/UploadInventory'),
  loading: Loading,
});

const AsyncCreateTransaction = Loadable({
  loader: () => import('components/inventory/CreateTransaction'),
  loading: Loading,
});

const AsyncEditTransaction = Loadable({
  loader: () => import('components/inventory/EditTransaction'),
  loading: Loading,
});

const AsyncShipmentAddComment = Loadable({
  loader: () => import('components/shipment/AddComment'),
  loading: Loading,
});

const AsyncShipmentAddDocument = Loadable({
  loader: () => import('components/shipment/AddDocument'),
  loading: Loading,
});

const AsyncShipmentAddToShipment = Loadable({
  loader: () => import('components/shipment/AddToShipment'),
  loading: Loading,
});

const AsyncShipmentDeleteShipment = Loadable({
  loader: () => import('components/shipment/DeleteShipment'),
  loading: Loading,
});

const AsyncShipmentEditEvent = Loadable({
  loader: () => import('components/shipment/EditEvent'),
  loading: Loading,
});

const StockMovementList = (props) => {
  const parsedSearchQuery = queryString.parse(props?.location?.search);
  const direction = parsedSearchQuery?.direction?.toUpperCase();
  switch (direction) {
    case 'INBOUND':
      return <AsyncStockMovementInboundList {...props} />;
    case 'OUTBOUND': {
      return (
        <AsyncStockMovementOutboundList
          {...props}
          sourceType={parsedSearchQuery?.sourceType?.toUpperCase()}
        />
      );
    }
    default:
      return <Redirect to={DASHBOARD_URL.base} />;
  }
};

const AsyncStockTransferList = Loadable({
  loader: () => import('components/stock-transfer/list/StockTransferList'),
  loading: Loading,
});

const AsyncAdminIndex = Loadable({
  loader: () => import('components/admin/AdminIndexPage'),
  loading: Loading,
});

const AsyncControllerActions = Loadable({
  loader: () => import('components/admin/ControllerActionsPage'),
  loading: Loading,
});

const AsyncAdminPlugins = Loadable({
  loader: () => import('components/admin/PluginsPage'),
  loading: Loading,
});

const AsyncAdminCache = Loadable({
  loader: () => import('components/admin/CachePage'),
  loading: Loading,
});

const AsyncAdminSendMail = Loadable({
  loader: () => import('components/admin/SendMailPage'),
  loading: Loading,
});

const AsyncAdminShowSettings = Loadable({
  loader: () => import('components/admin/ShowSettingsPage'),
  loading: Loading,
});

const AsyncAdminStatus = Loadable({
  loader: () => import('components/admin/StatusPage'),
  loading: Loading,
});

const AsyncAdminUpgrade = Loadable({
  loader: () => import('components/admin/UpgradePage'),
  loading: Loading,
});

const AsyncBatchImportData = Loadable({
  loader: () => import('components/batch/ImportDataPage'),
  loading: Loading,
});

const AsyncDataExport = Loadable({
  loader: () => import('components/dataExport/DataExportPage'),
  loading: Loading,
});

const AsyncJobDetails = Loadable({
  loader: () => import('components/jobs/JobDetailsPage'),
  loading: Loading,
});

const AsyncLocalizationCreate = Loadable({
  loader: () => import('components/localization/LocalizationCreatePage'),
  loading: Loading,
});

const AsyncStockCardPage = Loadable({
  loader: () => import('components/stock-card/StockCardPage'),
  loading: Loading,
});

const AsyncLotNumbersPage = Loadable({
  loader: () => import('components/stock-card/LotNumbersPage'),
  loading: Loading,
});

const AsyncGraphPage = Loadable({
  loader: () => import('components/stock-card/GraphPage'),
  loading: Loading,
});

const AsyncRecordInventoryPage = Loadable({
  loader: () => import('components/stock-card/RecordInventoryPage'),
  loading: Loading,
});

const AsyncInventoryLevelPage = Loadable({
  loader: () => import('components/stock-card/InventoryLevelPage'),
  loading: Loading,
});

const AsyncTransactionLogPage = Loadable({
  loader: () => import('components/stock-card/TransactionLogPage'),
  loading: Loading,
});

const AsyncInventoryLevelList = Loadable({
  loader: () => import('components/inventory-level/InventoryLevelList'),
  loading: Loading,
});

const AsyncInventoryLevelShow = Loadable({
  loader: () => import('components/inventory-level/InventoryLevelShow'),
  loading: Loading,
});

const AsyncInventoryLevelForm = Loadable({
  loader: () => import('components/inventory-level/InventoryLevelForm'),
  loading: Loading,
});

const AsyncProductEditPage = Loadable({
  loader: () => import('components/product-screens/ProductEditPage'),
  loading: Loading,
});

const AsyncProductAddDocumentPage = Loadable({
  loader: () => import('components/product-screens/AddDocumentPage'),
  loading: Loading,
});

const AsyncProductImportPage = Loadable({
  loader: () => import('components/product-screens/ImportProductsPage'),
  loading: Loading,
});

const AsyncProductBatchEditPage = Loadable({
  loader: () => import('components/product-screens/BatchEditPage'),
  loading: Loading,
});

const AsyncProductBatchEditPropertiesPage = Loadable({
  loader: () => import('components/product-screens/BatchEditPropertiesPage'),
  loading: Loading,
});

const AsyncRequisitionChooseTemplate = Loadable({
  loader: () => import('components/requisition/ChooseTemplatePage'),
  loading: Loading,
});

const AsyncRequisitionCreate = Loadable({
  loader: () => import('components/requisition/CreateRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionCreateStock = Loadable({
  loader: () => import('components/requisition/CreateStockRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionEdit = Loadable({
  loader: () => import('components/requisition/EditRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionConfirm = Loadable({
  loader: () => import('components/requisition/ConfirmRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionList = Loadable({
  loader: () => import('components/requisition/RequisitionListPage'),
  loading: Loading,
});

const AsyncRequisitionEditHeader = Loadable({
  loader: () => import('components/requisition/EditRequisitionHeaderPage'),
  loading: Loading,
});

const AsyncRequisitionReview = Loadable({
  loader: () => import('components/requisition/ReviewRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionPick = Loadable({
  loader: () => import('components/requisition/PickRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionPrintDraft = Loadable({
  loader: () => import('components/requisition/PrintDraftRequisitionPage'),
  loading: Loading,
});

const AsyncRequisitionProcess = Loadable({
  loader: () => import('components/requisition/ProcessRequisitionPage'),
  loading: Loading,
});

const AsyncAttributeList = Loadable({
  loader: () => import('components/attribute/AttributeList'),
  loading: Loading,
});

const AsyncAttributeForm = Loadable({
  loader: () => import('components/attribute/AttributeForm'),
  loading: Loading,
});

const AsyncAttributeShow = Loadable({
  loader: () => import('components/attribute/AttributeShow'),
  loading: Loading,
});

const AsyncProductAssociationList = Loadable({
  loader: () => import('components/productAssociation/ProductAssociationList'),
  loading: Loading,
});

const AsyncProductAssociationShow = Loadable({
  loader: () => import('components/productAssociation/ProductAssociationShow'),
  loading: Loading,
});

const AsyncProductAssociationForm = Loadable({
  loader: () => import('components/productAssociation/ProductAssociationForm'),
  loading: Loading,
});

const AsyncProductMergeLogsList = Loadable({
  loader: () => import('components/products/ProductMergeLogsList'),
  loading: Loading,
});

const AsyncProductSearch = Loadable({
  loader: () => import('components/products/ProductSearch'),
  loading: Loading,
});

const AsyncProductShow = Loadable({
  loader: () => import('components/products/ProductShow'),
  loading: Loading,
});

const AsyncUpnDatabase = Loadable({
  loader: () => import('components/products/UpnDatabase'),
  loading: Loading,
});

const AsyncProductCatalogList = Loadable({
  loader: () => import('components/productCatalog/ProductCatalogList'),
  loading: Loading,
});

const AsyncProductCatalogForm = Loadable({
  loader: () => import('components/productCatalog/ProductCatalogForm'),
  loading: Loading,
});

const AsyncProductCatalogShow = Loadable({
  loader: () => import('components/productCatalog/ProductCatalogShow'),
  loading: Loading,
});

const AsyncCategoryForm = Loadable({
  loader: () => import('components/category/CategoryForm'),
  loading: Loading,
});

const AsyncCategoryTree = Loadable({
  loader: () => import('components/category/CategoryTree'),
  loading: Loading,
});

const AsyncPartyList = Loadable({
  loader: () => import('components/party/PartyList'),
  loading: Loading,
});

const AsyncPartyForm = Loadable({
  loader: () => import('components/party/PartyForm'),
  loading: Loading,
});

const AsyncPartyShow = Loadable({
  loader: () => import('components/party/PartyShow'),
  loading: Loading,
});

const AsyncPartyRoleForm = Loadable({
  loader: () => import('components/partyRole/PartyRoleForm'),
  loading: Loading,
});

const AsyncPersonList = Loadable({
  loader: () => import('components/person/PersonList'),
  loading: Loading,
});

const AsyncPersonForm = Loadable({
  loader: () => import('components/person/PersonForm'),
  loading: Loading,
});

const AsyncPersonShow = Loadable({
  loader: () => import('components/person/PersonShow'),
  loading: Loading,
});

const AsyncRoleList = Loadable({
  loader: () => import('components/role/RoleList'),
  loading: Loading,
});

const AsyncRoleShow = Loadable({
  loader: () => import('components/role/RoleShow'),
  loading: Loading,
});

const AsyncUserCreateForm = Loadable({
  loader: () => import('components/user/UserCreateForm'),
  loading: Loading,
});

const AsyncUserChangePhoto = Loadable({
  loader: () => import('components/user/UserChangePhoto'),
  loading: Loading,
});

const AsyncRoleForm = Loadable({
  loader: () => import('components/role/RoleForm'),
  loading: Loading,
});

const Router = () => {
  useConnectionListener();

  const spinner = useSelector(getSpinner);
  const supportedActivities = useSelector(getCurrentLocationSupportedActivities);
  const notificationAutohideDelay = useSelector(getNotificationAutohideDelay);

  const Dashboard = useMemo(
    () => (!supportedActivities?.includes(ActivityCode.MANAGE_INVENTORY)
    && supportedActivities?.includes(ActivityCode.SUBMIT_REQUEST)
      ? AsyncStockRequestDashboard
      : AsyncDashboard), [supportedActivities],
  );

  return (
    <div>
      <BrowserRouter>
        <FlashScopeListenerWrapper>
          <Switch>
            <MainLayoutRoute path="**/putAway/create/:putAwayId?" component={AsyncPutAwayMainPage} />
            <MainLayoutRoute path="**/inventoryItem/showStockCard/:id?" component={AsyncStockCardPage} />
            <MainLayoutRoute path="**/inventoryItem/showLotNumbers/:id?" component={AsyncLotNumbersPage} />
            <MainLayoutRoute path="**/inventoryItem/showGraph/:id?" component={AsyncGraphPage} />
            <MainLayoutRoute path="**/inventoryItem/showRecordInventory/:id?" component={AsyncRecordInventoryPage} />
            <MainLayoutRoute path="**/inventoryItem/editInventoryLevel" component={AsyncInventoryLevelPage} />
            <MainLayoutRoute path="**/inventoryItem/showTransactionLog/:id?" component={AsyncTransactionLogPage} />
            <MainLayoutRoute path="**/inventoryLevel/list" component={AsyncInventoryLevelList} />
            <MainLayoutRoute path="**/inventoryLevel/index" component={AsyncInventoryLevelList} />
            <MainLayoutRoute path="**/inventoryLevel/show/:id" component={AsyncInventoryLevelShow} />
            <MainLayoutRoute path="**/inventoryLevel/create" component={AsyncInventoryLevelForm} />
            <MainLayoutRoute path="**/inventoryLevel/edit/:id?" component={AsyncInventoryLevelForm} />
            <MainLayoutRoute path="**/stockMovement/list" component={StockMovementList} />
            <MainLayoutRoute path="**/stockMovement/createOutbound/:stockMovementId?" component={AsyncStockMovement} />
            <MainLayoutRoute path="**/stockMovement/importOutboundStockMovement" component={AsyncOutboundImport} />
            <MainLayoutRoute path="**/report/expirationHistoryReport" component={AsyncExpirationHistoryReport} />
            <MainLayoutRoute path="**/inventory/reorderReport" component={AsyncReorderReport} />
            <MainLayoutRoute path="**/inventory/browse" component={AsyncInventoryBrowser} />
            <MainLayoutRoute path="**/inventory/list" component={AsyncInventoryList} />
            <MainLayoutRoute path="**/inventory/listLowStock" component={AsyncLowStockList} />
            <MainLayoutRoute path="**/inventory/listReorderStock" component={AsyncReorderStockList} />
            <MainLayoutRoute path="**/inventory/listDailyTransactions" component={AsyncDailyTransactions} />
            <MainLayoutRoute path="**/inventory/listTransactions" component={AsyncTransactionList} />
            <MainLayoutRoute path="**/inventory/manage" component={AsyncManageInventory} />
            <MainLayoutRoute path="**/inventory/showProducts" component={AsyncShowProducts} />
            <MainLayoutRoute path="**/inventory/showTransaction/:id" component={AsyncShowTransaction} />
            <MainLayoutRoute path="**/inventory/upload" component={AsyncUploadInventory} />
            <MainLayoutRoute path="**/inventory/listExpiredStock" component={AsyncExpiredStockList} />
            <MainLayoutRoute path="**/inventory/listExpiringStock" component={AsyncExpiringStockList} />
            <MainLayoutRoute path="**/inventory/editBinLocation" component={AsyncEditBinLocation} />
            <MainLayoutRoute path="**/inventory/editTransaction/:id" component={AsyncEditTransaction} />
            <MainLayoutRoute path="**/inventory/createTransaction" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createInboundTransfer" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createOutboundTransfer" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createAdjustment" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createConsumed" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createExpired" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/createDamaged" component={AsyncCreateTransaction} />
            <MainLayoutRoute path="**/inventory/cycleCount/count" component={AsyncCycleCountCountStep} />
            <MainLayoutRoute path="**/inventory/cycleCount/resolve" component={AsyncCycleCountResolveStep} />
            <MainLayoutRoute path="**/inventory/cycleCount/reporting" component={AsyncCycleCountReporting} />
            <MainLayoutRoute path="**/inventory/cycleCount" component={AsyncCycleCount} />
            <MainLayoutRoute path="**/stockMovement/createInbound/:stockMovementId?" component={AsyncStockMovementInbound} />
            <MainLayoutRoute path="**/stockMovement/createCombinedShipments/:stockMovementId?" component={AsyncStockMovementCombinedShipments} />
            <MainLayoutRoute path="**/stockMovement/createRequest/:stockMovementId?" component={AsyncStockMovementRequest} />
            <MainLayoutRoute path="**/stockMovement/verifyRequest/:stockMovementId?" component={AsyncStockMovementVerifyRequest} />
            <MainLayoutRoute path="**/stockMovement/create/:stockMovementId?" component={AsyncStockMovement} />
            <MainLayoutRoute path="**/partialReceiving/create/:shipmentId" component={AsyncReceivingPage} />
            <MainLayoutRoute path="**/stocklistManagement/index/:productId?" component={AsyncManagement} />
            <MainLayoutRoute path="**/invoice/create/:invoiceId?" component={AsyncInvoice} />
            <MainLayoutRoute path="**/invoice/list" component={AsyncInvoiceList} />
            <MainLayoutRoute path="**/invoice/show/:id" component={AsyncInvoiceShow} />
            <MainLayoutRoute path="**/invoice/addDocument/:id" component={AsyncInvoiceAddDocument} />
            <MainLayoutRoute path="**/invoice/editDocument/:id" component={AsyncInvoiceAddDocument} />
            <MainLayoutRoute path="**/stockTransfer/create/:stockTransferId?" component={AsyncStockTransfer} />
            <MainLayoutRoute path="**/stockTransfer/createOutboundReturn/:outboundReturnId?" component={AsyncOutboundReturns} />
            <MainLayoutRoute path="**/stockTransfer/createInboundReturn/:inboundReturnId?" component={AsyncInboundReturns} />
            <MainLayoutRoute path="**/replenishment/create/:replenishmentId?" component={AsyncReplenishment} />
            <MainLayoutRoute path="**/productsConfiguration/index" component={AsyncProductsConfiguration} />
            <MainLayoutRoute path="**/locationsConfiguration/create/:locationId?" component={AsyncLocationsConfiguration} />
            <MainLayoutRoute path="**/location/list" component={AsyncLocationsList} />
            <MainLayoutRoute path="**/location/edit/:locationId?" component={AsyncLocationEdit} />
            <MainLayoutRoute path="**/location/showBinLocations/:locationId" component={AsyncLocationBinLocations} />
            <MainLayoutRoute path="**/location/showZoneLocations/:locationId" component={AsyncLocationZoneLocations} />
            <MainLayoutRoute path="**/location/showContents/:locationId" component={AsyncLocationContents} />
            <MainLayoutRoute path="**/location/uploadLogo/:locationId" component={AsyncLocationUploadLogo} />
            <MainLayoutRoute path="**/supplier/list" component={AsyncSupplierList} />
            <MainLayoutRoute path="**/supplier/show/:id" component={AsyncSupplierShow} />
            <MainLayoutRoute path="**/locationsConfiguration/upload" component={AsyncImportLocations} />
            <Route path="**/locationsConfiguration/index">
              <AsyncWelcomePage />
            </Route>
            <Route path="**/loadData/index"><AsyncLoadDataPage /></Route>
            <Route path="**/resettingInstanceInfo/index">
              <AsyncResetInstancePage />
            </Route>
            <MainLayoutRoute path="**/shipment/addComment/:shipmentId" component={AsyncShipmentAddComment} />
            <MainLayoutRoute path="**/shipment/addDocument/:shipmentId" component={AsyncShipmentAddDocument} />
            <MainLayoutRoute path="**/shipment/editDocument" component={AsyncShipmentAddDocument} />
            <MainLayoutRoute path="**/shipment/addToShipment" component={AsyncShipmentAddToShipment} />
            <MainLayoutRoute path="**/shipment/deleteShipment/:shipmentId" component={AsyncShipmentDeleteShipment} />
            <MainLayoutRoute path="**/shipment/editEvent/:eventId" component={AsyncShipmentEditEvent} />
            <MainLayoutRoute path="**/shipment/addEvent/:shipmentId" component={AsyncShipmentEditEvent} />
            <MainLayoutRoute path="**/purchaseOrder/list" component={AsyncPurchaseOrderList} />
            <MainLayoutRoute path="**/order/list" component={AsyncOrderList} />
            <MainLayoutRoute path="**/order/listOrderItems" component={AsyncPendingOrderItemsList} />
            <MainLayoutRoute path="**/order/orderItemSummary" component={AsyncOrderItemSummaryList} />
            <MainLayoutRoute path="**/order/orderItemDetails" component={AsyncOrderItemSummaryList} />
            <MainLayoutRoute path="**/order/addComment/:id" component={AsyncOrderAddCommentPage} />
            <MainLayoutRoute path="**/order/editComment/:id" component={AsyncOrderAddCommentPage} />
            <MainLayoutRoute path="**/order/addDocument/:id" component={AsyncOrderAddDocumentPage} />
            <MainLayoutRoute path="**/order/editDocument/:id" component={AsyncOrderAddDocumentPage} />
            <MainLayoutRoute path="**/order/addAdjustment/:id" component={AsyncOrderEditAdjustmentPage} />
            <MainLayoutRoute path="**/order/editAdjustment/:id?" component={AsyncOrderEditAdjustmentPage} />
            <MainLayoutRoute path="**/order/orderSummaryList" component={AsyncOrderSummaryList} />
            <MainLayoutRoute path="**/order/show/:id" component={AsyncOrderShow} />
            <Route path="**/order/print/:id" component={AsyncOrderPrint} />
            <MainLayoutRoute path="**/orderAdjustmentType/list" component={AsyncOrderAdjustmentTypeList} />
            <MainLayoutRoute path="**/orderAdjustmentType/create" component={AsyncOrderAdjustmentTypeForm} />
            <MainLayoutRoute path="**/orderAdjustmentType/edit/:orderAdjustmentTypeId" component={AsyncOrderAdjustmentTypeForm} />
            <MainLayoutRoute path="**/requisitionTemplate/list" component={AsyncStockList} />
            <MainLayoutRoute path="**/requisition/chooseTemplate" component={AsyncRequisitionChooseTemplate} />
            <MainLayoutRoute path="**/requisition/createStockFromTemplate/:templateId" component={AsyncRequisitionCreateStock} />
            <MainLayoutRoute path="**/requisition/create" component={AsyncRequisitionCreate} />
            <MainLayoutRoute path="**/requisition/edit/:requisitionId" component={AsyncRequisitionEdit} />
            <MainLayoutRoute path="**/requisition/confirm/:requisitionId" component={AsyncRequisitionConfirm} />
            <MainLayoutRoute path="**/requisition/list" component={AsyncRequisitionList} />
            <MainLayoutRoute path="**/requisition/editHeader/:requisitionId" component={AsyncRequisitionEditHeader} />
            <MainLayoutRoute path="**/requisition/review/:requisitionId" component={AsyncRequisitionReview} />
            <MainLayoutRoute path="**/requisition/pick/:requisitionId" component={AsyncRequisitionPick} />
            <MainLayoutRoute path="**/requisition/printDraft/:requisitionId" component={AsyncRequisitionPrintDraft} />
            <MainLayoutRoute path="**/requisition/process/:requisitionId" component={AsyncRequisitionProcess} />
            <MainLayoutRoute path="**/product/list" component={AsyncProductsList} />
            <MainLayoutRoute path="**/product/create" component={AsyncProductEditPage} />
            <MainLayoutRoute path="**/product/edit/:id" component={AsyncProductEditPage} />
            <MainLayoutRoute path="**/product/addDocument/:id" component={AsyncProductAddDocumentPage} />
            <MainLayoutRoute path="**/product/importAsCsv" component={AsyncProductImportPage} />
            <MainLayoutRoute path="**/product/batchEdit" component={AsyncProductBatchEditPage} />
            <MainLayoutRoute path="**/product/batchEditProperties" component={AsyncProductBatchEditPropertiesPage} />
            <MainLayoutRoute path="**/stockTransfer/list" component={AsyncStockTransferList} />
            <MainLayoutRoute path="**/budgetCode/list" component={AsyncBudgetCodeList} />
            <MainLayoutRoute path="**/budgetCode/create" component={AsyncBudgetCodeForm} />
            <MainLayoutRoute path="**/budgetCode/edit/:budgetCodeId" component={AsyncBudgetCodeForm} />
            <MainLayoutRoute path="**/eventType/list" component={AsyncEventTypeList} />
            <MainLayoutRoute path="**/eventType/show/:id" component={AsyncEventTypeShow} />
            <MainLayoutRoute path="**/eventType/create" component={AsyncEventTypeForm} />
            <MainLayoutRoute path="**/eventType/edit/:eventTypeId" component={AsyncEventTypeForm} />
            <MainLayoutRoute path="**/locationGroup/list" component={AsyncLocationGroupList} />
            <MainLayoutRoute path="**/locationGroup/create" component={AsyncLocationGroupForm} />
            <MainLayoutRoute path="**/locationGroup/edit/:locationGroupId" component={AsyncLocationGroupForm} />
            <MainLayoutRoute path="**/locationGroup/show/:locationGroupId" component={AsyncLocationGroupShow} />
            <MainLayoutRoute path="**/locationType/create" component={AsyncLocationTypeForm} />
            <MainLayoutRoute path="**/locationType/edit/:locationTypeId" component={AsyncLocationTypeForm} />
            <MainLayoutRoute path="**/glAccount/list" component={AsyncGlAccountList} />
            <MainLayoutRoute path="**/glAccount/create" component={AsyncGlAccountForm} />
            <MainLayoutRoute path="**/glAccount/edit/:glAccountId" component={AsyncGlAccountForm} />
            <MainLayoutRoute path="**/glAccountType/list" component={AsyncGlAccountTypeList} />
            <MainLayoutRoute path="**/glAccountType/create" component={AsyncGlAccountTypeForm} />
            <MainLayoutRoute path="**/glAccountType/edit/:glAccountTypeId" component={AsyncGlAccountTypeForm} />
            <MainLayoutRoute path="**/paymentTerm/create" component={AsyncPaymentTermForm} />
            <MainLayoutRoute path="**/paymentTerm/edit/:paymentTermId" component={AsyncPaymentTermForm} />
            <MainLayoutRoute path="**/paymentTerm/list" component={AsyncPaymentTermList} />
            <MainLayoutRoute path="**/preferenceType/list" component={AsyncPreferenceTypeList} />
            <MainLayoutRoute path="**/preferenceType/create" component={AsyncPreferenceTypeForm} />
            <MainLayoutRoute path="**/preferenceType/edit/:preferenceTypeId" component={AsyncPreferenceTypeForm} />
            <MainLayoutRoute path="**/admin/controllerActions" component={AsyncControllerActions} />
            <MainLayoutRoute path="**/admin/plugins" component={AsyncAdminPlugins} />
            <MainLayoutRoute path="**/admin/cache" component={AsyncAdminCache} />
            <MainLayoutRoute path="**/admin/sendMail" component={AsyncAdminSendMail} />
            <MainLayoutRoute path="**/admin/showSettings" component={AsyncAdminShowSettings} />
            <MainLayoutRoute path="**/admin/status" component={AsyncAdminStatus} />
            <MainLayoutRoute path="**/admin/showUpgrade" component={AsyncAdminUpgrade} />
            <MainLayoutRoute path="**/batch/importData" component={AsyncBatchImportData} />
            <MainLayoutRoute path="**/dataExport/index" component={AsyncDataExport} />
            <MainLayoutRoute path="**/dataExport" exact component={AsyncDataExport} />
            <MainLayoutRoute path="**/jobs/show/:jobId" component={AsyncJobDetails} />
            <MainLayoutRoute path="**/localization/create" component={AsyncLocalizationCreate} />
            <MainLayoutRoute path="**/admin/index" component={AsyncAdminIndex} />
            <MainLayoutRoute path="**/admin" exact component={AsyncAdminIndex} />
            <MainLayoutRoute path="**/productSupplier/list" component={AsyncProductSupplierList} />
            <MainLayoutRoute path="**/productSupplier/create/:productSupplierId?" component={AsyncProductSupplierCreatePage} />
            <MainLayoutRoute path="**/attribute/list" component={AsyncAttributeList} />
            <MainLayoutRoute path="**/attribute/create" component={AsyncAttributeForm} />
            <MainLayoutRoute path="**/attribute/edit/:id?" component={AsyncAttributeForm} />
            <MainLayoutRoute path="**/attribute/show/:id" component={AsyncAttributeShow} />
            <MainLayoutRoute path="**/productAssociation/list" component={AsyncProductAssociationList} />
            <MainLayoutRoute path="**/productAssociation/show/:id" component={AsyncProductAssociationShow} />
            <MainLayoutRoute path="**/productAssociation/create" component={AsyncProductAssociationForm} />
            <MainLayoutRoute path="**/productAssociation/edit/:id" component={AsyncProductAssociationForm} />
            <MainLayoutRoute path="**/product/productMergeLogs" component={AsyncProductMergeLogsList} />
            <MainLayoutRoute path="**/product/search" component={AsyncProductSearch} />
            <MainLayoutRoute path="**/product/show/:id?" component={AsyncProductShow} />
            <MainLayoutRoute path="**/product/upnDatabase" component={AsyncUpnDatabase} />
            <MainLayoutRoute path="**/productCatalog/list" component={AsyncProductCatalogList} />
            <MainLayoutRoute path="**/productCatalog/create" component={AsyncProductCatalogForm} />
            <MainLayoutRoute path="**/productCatalog/edit/:id?" component={AsyncProductCatalogForm} />
            <MainLayoutRoute path="**/productCatalog/show/:id" component={AsyncProductCatalogShow} />
            <MainLayoutRoute path="**/category/create" component={AsyncCategoryForm} />
            <MainLayoutRoute path="**/category/edit/:id?" component={AsyncCategoryForm} />
            <MainLayoutRoute path="**/category/tree" component={AsyncCategoryTree} />
            <MainLayoutRoute path="**/party/list" component={AsyncPartyList} />
            <MainLayoutRoute path="**/party/create" component={AsyncPartyForm} />
            <MainLayoutRoute path="**/party/edit/:id?" component={AsyncPartyForm} />
            <MainLayoutRoute path="**/party/show/:id" component={AsyncPartyShow} />
            <MainLayoutRoute path="**/partyRole/create" component={AsyncPartyRoleForm} />
            <MainLayoutRoute path="**/partyRole/edit/:id?" component={AsyncPartyRoleForm} />
            <MainLayoutRoute path="**/person/list" component={AsyncPersonList} />
            <MainLayoutRoute path="**/person/create" component={AsyncPersonForm} />
            <MainLayoutRoute path="**/person/edit/:id?" component={AsyncPersonForm} />
            <MainLayoutRoute path="**/person/show/:id" component={AsyncPersonShow} />
            <MainLayoutRoute path="**/role/index" component={AsyncRoleList} />
            <MainLayoutRoute path="**/role/show/:id" component={AsyncRoleShow} />
            <MainLayoutRoute path="**/role/create" component={AsyncRoleForm} />
            <MainLayoutRoute path="**/role/edit/:roleId" component={AsyncRoleForm} />
            <MainLayoutRoute path="**/user/create" component={AsyncUserCreateForm} />
            <MainLayoutRoute path="**/user/changePhoto/:id" component={AsyncUserChangePhoto} />
            <MainLayoutRoute path="**/dashboard/:configId?" component={Dashboard} />
            <MainLayoutRoute path="**/" component={Dashboard} />
          </Switch>
        </FlashScopeListenerWrapper>
      </BrowserRouter>
      <div className="spinner-container">
        <ClimbingBoxLoader
          color="#0c769e"
          loading={spinner}
          style={{ top: '40%', left: '50%' }}
        />
      </div>
      <Alert
        timeout={notificationAutohideDelay}
        stack={{ limit: 3 }}
        contentTemplate={CustomAlert}
        position="top-right"
        effect="bouncyflip"
        offset={20}
      />
    </div>
  );
};

export default Router;
