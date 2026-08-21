/**
 * Definitions of ENDPOINT URLs used for API calls
 * */

const API = '/api';
export const GENERIC_API = `${API}/generic`;
const { CONTEXT_PATH } = window;

// ORDER
export const ORDER_API = `${API}/orders`;
export const ORDER_PENDING_ORDER_ITEMS = `${ORDER_API}/pendingOrderItems`;
export const ORDER_ITEM_SUMMARIES = `${ORDER_API}/orderItemSummaries`;
export const ORDER_STATUS_OPTIONS = `${ORDER_API}/statusOptions`;
export const ORDER_TYPE_OPTIONS = `${ORDER_API}/orderTypeOptions`;
export const ORDER_SUMMARY = (id) => `${ORDER_API}/${id}/summary`;
export const ORDER_COMMENT_FORM_DATA = (id) => `${ORDER_API}/${id}/commentFormData`;
export const ORDER_DOCUMENT_FORM_DATA = (id) => `${ORDER_API}/${id}/documentFormData`;
export const ORDER_ADJUSTMENT_FORM_DATA = (id) => `${ORDER_API}/${id}/adjustmentFormData`;
export const ORDER_SUMMARIES = `${ORDER_API}/orderSummaries`;
export const ORDER_SUMMARY_STATUS_OPTIONS = `${ORDER_API}/orderSummaryStatusOptions`;
export const ORDER_DETAILS = (id) => `${ORDER_API}/${id}/details`;
export const ORDER_ITEMS_SUMMARY_DATA = (id) => `${ORDER_API}/${id}/orderItemsSummaryData`;
export const ORDER_ITEM_STATUS_DATA = (id) => `${ORDER_API}/${id}/itemStatusData`;
export const ORDER_ITEM_DETAILS_DATA = (id) => `${ORDER_API}/${id}/itemDetailsData`;
export const ORDER_ADJUSTMENTS_DATA = (id) => `${ORDER_API}/${id}/adjustmentsData`;
export const ORDER_SHIPMENTS_DATA = (id) => `${ORDER_API}/${id}/shipmentsData`;
export const ORDER_INVOICES_DATA = (id) => `${ORDER_API}/${id}/invoicesData`;
export const ORDER_DOCUMENTS_DATA = (id) => `${ORDER_API}/${id}/documentsData`;
export const ORDER_COMMENTS_DATA = (id) => `${ORDER_API}/${id}/commentsData`;
export const ORDER_PRINT_DATA = (id) => `${ORDER_API}/${id}/printData`;

// ORDER ADJUSTMENT TYPE
export const ORDER_ADJUSTMENT_TYPE_API = `${API}/orderAdjustmentTypes`;
export const ORDER_ADJUSTMENT_TYPE_BY_ID = (id) => `${ORDER_ADJUSTMENT_TYPE_API}/${id}`;
export const ORDER_ADJUSTMENT_TYPE_FORM_DATA = `${ORDER_ADJUSTMENT_TYPE_API}/formData`;

// PURCHASE ORDER
export const PURCHASE_ORDER_API = `${API}/purchaseOrders`;
export const PURCHASE_ORDER_DELETE = (id) => `${PURCHASE_ORDER_API}/${id}`;
export const PURCHASE_ORDER_ROLLBACK_ORDER = (id) => `${PURCHASE_ORDER_API}/${id}/rollback`;

// STOCK MOVEMENT
export const STOCK_MOVEMENT_API = `${API}/stockMovements`;
export const STOCK_MOVEMENT_BY_ID = (id) => `${STOCK_MOVEMENT_API}/${id}`;
export const STOCK_MOVEMENT_PENDING_SHIPMENT_ITEMS = `${STOCK_MOVEMENT_API}/pendingRequisitionItems`;
export const STOCK_MOVEMENT_INCOMING_ITEMS = `${STOCK_MOVEMENT_API}/shippedItems`;
export const STOCK_MOVEMENT_UPDATE_STATUS = (id) => `${STOCK_MOVEMENT_API}/${id}/status`;
export const STOCK_MOVEMENT_UPDATE_INVENTORY_ITEMS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/updateInventoryItems`;
export const STOCK_MOVEMENT_UPDATE_REQUISITION = (id) => `${STOCK_MOVEMENT_API}/${id}/updateRequisition`;
export const STOCK_MOVEMENT_ROLLBACK_APPROVAL = (id) => `${STOCK_MOVEMENT_API}/${id}/rollbackApproval`;
export const STOCK_MOVEMENT_ITEMS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/stockMovementItems`;
export const STOCK_MOVEMENT_UPDATE_ITEMS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/updateItems`;
export const STOCK_MOVEMENT_REMOVE_ALL_ITEMS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/removeAllItems`;
export const STOCK_MOVEMENT_STATUS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/status`;
export const PICKLIST_ITEMS_EXPORT = (id) => `${STOCK_MOVEMENT_API}/exportPickListItems/${id}`;
export const PICKLIST_TEMPLATE_EXPORT = (id) => `${STOCK_MOVEMENT_API}/picklistTemplate/${id}`;
export const PACKLIST_TEMPLATE_EXPORT = (id) => `${STOCK_MOVEMENT_API}/packlistTemplate/${id}`;
export const PICKLIST_IMPORT = (id) => `${STOCK_MOVEMENT_API}/importPickListItems/${id}`;
export const PACKLIST_IMPORT = (id) => `${STOCK_MOVEMENT_API}/importPackListItems/${id}`;
export const PACKING_LIST_TEMPLATE = `${STOCK_MOVEMENT_API}/packingList/template`;
export const STOCK_MOVEMENT_UPDATE_SHIPMENT = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/updateShipment`;
export const STOCK_MOVEMENT_UPLOAD_DOCUMENTS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/uploadDocuments`;
export const STOCK_MOVEMENT_DOCUMENTS = (id) => `${STOCK_MOVEMENT_BY_ID(id)}/documents`;

// STOCK MOVEMENT ITEMS
export const STOCK_MOVEMENT_ITEM_API = `${API}/stockMovementItems`;
export const STOCK_MOVEMENT_ITEM_BY_ID = (id) => `${STOCK_MOVEMENT_ITEM_API}/${id}`;
export const STOCK_MOVEMENT_ITEM_DETAILS = (id) => `${STOCK_MOVEMENT_ITEM_BY_ID(id)}/details`;
export const STOCK_MOVEMENT_ITEM_REMOVE = (id) => `${STOCK_MOVEMENT_ITEM_BY_ID(id)}/removeItem`;
export const STOCK_MOVEMENT_UPDATE_PICKLIST = (id) => `${STOCK_MOVEMENT_ITEM_BY_ID(id)}/updatePicklist`;
export const STOCK_MOVEMENT_CREATE_PICKLIST = (id) => `${STOCK_MOVEMENT_ITEM_BY_ID(id)}/createPicklist`;
export const STOCK_MOVEMENT_ITEM_REVERT_PICK = (id) => `${STOCK_MOVEMENT_ITEM_BY_ID(id)}/picklistItems`;

// STOCK TRANSFER
export const STOCK_TRANSFER_API = `${API}/stockTransfers`;
export const STOCK_TRANSFER_BY_ID = (id) => `${STOCK_TRANSFER_API}/${id}`;
export const STOCK_TRANSFER_REMOVE_ALL_ITEMS = (id) => `${STOCK_TRANSFER_BY_ID(id)}/removeAllItems`;
export const STOCK_TRANSFER_CANDIDATES = `${STOCK_TRANSFER_API}/candidates`;

// STOCK TRANSFER ITEMS
export const STOCK_TRANSFER_ITEM_API = `${API}/stockTransferItems`;
export const STOCK_TRANSFER_ITEM_BY_ID = (id) => `${STOCK_TRANSFER_ITEM_API}/${id}`;

// INVOICE
export const INVOICE_API = `${API}/invoices`;
export const INVOICE_BY_ID = (id) => `${INVOICE_API}/${id}`;
export const INVOICE_ITEMS = (id) => `${INVOICE_BY_ID(id)}/items`;
export const INVOICE_ITEM_CANDIDATES = (id) => `${INVOICE_BY_ID(id)}/invoiceItemCandidates`;
export const INVOICE_POST = (id) => `${INVOICE_BY_ID(id)}/post`;
export const INVOICE_SUBMIT = (id) => `${INVOICE_BY_ID(id)}/submit`;
export const INVOICE_ORDERS = (id) => `${INVOICE_BY_ID(id)}/orders`;
export const INVOICE_SHIPMENTS = (id) => `${INVOICE_BY_ID(id)}/shipments`;
export const REMOVE_INVOICE_ITEM = (id) => `${INVOICE_API}/${id}/removeItem`;
export const INVOICE_DETAILS = (id) => `${INVOICE_BY_ID(id)}/details`;
export const INVOICE_DOCUMENT_FORM_DATA = (id) => `${INVOICE_BY_ID(id)}/documentFormData`;

// INVOICE ITEM
export const INVOICE_ITEM_API = `${API}/invoiceItems`;
export const VALIDATE_INVOICE_ITEM = (id) => `${INVOICE_ITEM_API}/${id}/validation`;

// PREPAYMENT INVOICE
export const PREPAYMENT_INVOICE_API = `${API}/prepaymentInvoices`;
export const PREPAYMENT_INVOICE_BY_ID = (id) => `${PREPAYMENT_INVOICE_API}/${id}`;
export const PREPAYMENT_INVOICE_INVOICE_ITEMS = (id) => `${PREPAYMENT_INVOICE_BY_ID(id)}/invoiceItems`;

// PREPAYMENT INVOICE ITEM
export const PREPAYMENT_INVOICE_ITEM_API = `${API}/prepaymentInvoiceItems`;
export const PREPAYMENT_INVOICE_ITEM_BY_ID = (id) => `${PREPAYMENT_INVOICE_ITEM_API}/${id}`;

// PRODUCT
export const PRODUCT_API = `${API}/products`;
export const INVENTORY_ITEM = (productCode, lotNumber) => `${CONTEXT_PATH}/${PRODUCT_API}/${productCode}/inventoryItems/${lotNumber}`;
export const LOT_NUMBERS_WITH_EXPIRATION_DATE = `${PRODUCT_API}/inventoryItems/lotNumbersWithExpirationDate`;
export const AVAILABLE_ITEMS = `${PRODUCT_API}/availableItems`;

// STOCK LIST
export const STOCKLIST_API = `${API}/stocklists`;
export const STOCKLIST_EXPORT = (id) => `${STOCKLIST_API}/${id}/export`;
export const STOCKLIST_DELETE = (id) => `${STOCKLIST_API}/${id}`;
export const STOCKLIST_CLEAR = (id) => `${STOCKLIST_API}/${id}/clear`;
export const STOCKLIST_CLONE = (id) => `${STOCKLIST_API}/${id}/clone`;
export const STOCKLIST_PUBLISH = (id) => `${STOCKLIST_API}/${id}/publish`;
export const STOCKLIST_UNPUBLISH = (id) => `${STOCKLIST_API}/${id}/unpublish`;

// GL ACCOUNTS
export const GL_ACCOUNTS_OPTION = `${API}/glAccountOptions`;

// PRODUCT GROUP
export const PRODUCT_GROUP_OPTION = `${API}/productGroupOptions`;
export const PRODUCT_GROUP_API = `${API}/productGroups`;
export const PRODUCT_GROUP_BY_ID = (id) => `${PRODUCT_GROUP_API}/${id}`;
export const PRODUCT_GROUP_PRODUCTS = (id) => `${PRODUCT_GROUP_API}/${id}/products`;
export const PRODUCT_GROUP_PRODUCT = (id, productId) => `${PRODUCT_GROUP_API}/${id}/products/${productId}`;
export const PRODUCT_COMPONENT_API = `${API}/productComponents`;

// SHIPMENT TYPES
export const SHIPMENT_TYPES = `${GENERIC_API}/shipmentType`;

// SHIPMENTS
export const SHIPMENT_API = `${API}/shipments`;
export const SHIPMENT_SUMMARY = (id) => `${SHIPMENT_API}/${id}/summary`;
export const SHIPMENT_COMMENT_FORM = `${SHIPMENT_API}/commentForm`;
export const SHIPMENT_DOCUMENT_FORM = (id) => `${SHIPMENT_API}/${id}/documentForm`;
export const SHIPMENT_EVENT_FORM = (id) => `${SHIPMENT_API}/${id}/eventForm`;
export const SHIPMENT_ADD_TO_SHIPMENT_FORM = `${SHIPMENT_API}/addToShipmentForm`;
export const SHIPMENT_LIST = `${SHIPMENT_API}/shipmentList`;
export const SHIPMENT_SHOW_DETAILS = (id) => `${SHIPMENT_API}/${id}/showDetails`;
export const SHIPMENT_PACKING_LIST = (id) => `${SHIPMENT_API}/${id}/packingList`;
export const SHIPMENT_PAGINATED_PACKING_LIST = (id) => `${SHIPMENT_API}/${id}/paginatedPackingList`;

// CONSUMPTION
export const CONSUMPTION_AGGREGATE = `${API}/consumption/aggregate`;
export const CONSUMPTION_SHOW = `${API}/consumption/show`;
export const CONSUMPTION_DEPOTS = `${API}/consumption/depots`;
export const SHIPMENT_SEND_FORM = (id) => `${SHIPMENT_API}/${id}/sendShipmentForm`;
export const SHIPMENT_SEND = (id) => `${SHIPMENT_API}/${id}/sendShipment`;
export const SHIPMENT_RECEIVE_FORM = (id) => `${SHIPMENT_API}/${id}/receiveShipmentForm`;
export const SHIPMENT_RECEIVE = (id) => `${SHIPMENT_API}/${id}/receiveShipment`;
export const SHIPMENT_RECEIPT_ITEM_SPLIT = (id) => `${SHIPMENT_API}/receiptItems/${id}/split`;
export const SHIPMENT_RECEIPT_ITEM_DELETE = (id) => `${SHIPMENT_API}/receiptItems/${id}/delete`;
export const SHIPMENT_RECEIPT_DELETE = (id) => `${SHIPMENT_API}/receipts/${id}/delete`;
export const SHIPMENT_RECEIPT_ITEM_PUTAWAY_LOCATIONS = (id) => `${SHIPMENT_API}/receiptItems/${id}/putawayLocations`;

// PAYMENT TERMS
export const PAYMENT_TERMS_OPTION = `${API}/paymentTermOptions`;

// USERS
export const USERS_OPTIONS = `${API}/users`;

// PREFERENCE TYPES
export const PREFERENCE_TYPE_OPTIONS = `${API}/preferenceTypeOptions`;

// RATING TYPES
export const RATING_TYPE_OPTIONS = `${API}/ratingTypeCodeOptions`;

// ATTRIBUTES
export const ATTRIBUTES = `${API}/attributes`;
export const ATTRIBUTES_SEARCH = `${ATTRIBUTES}/search`;
export const ATTRIBUTE_BY_ID = (id) => `${ATTRIBUTES}/${id}`;

// CATEGORIES
export const CATEGORIES = `${API}/categories`;
export const CATEGORIES_TREE = `${CATEGORIES}/tree`;
export const CATEGORIES_MOVE = `${CATEGORIES}/move`;
export const CATEGORIES_SAVE = `${CATEGORIES}/saveCategory`;
export const CATEGORIES_UPDATE_ASSIGNING_PARENT_TO_PRODUCT = `${CATEGORIES}/updateAssigningParentToProduct`;
export const CATEGORY_DETAILS = (id) => `${CATEGORIES}/${id}/details`;
export const CATEGORY_DELETE = (id) => `${CATEGORIES}/${id}/deleteCategory`;
export const CATEGORY_OPTIONS = `${API}/categoryOptions`;
export const TAG_OPTIONS = `${API}/tagOptions`;
export const UNIT_OF_MEASURE_CLASS_OPTIONS = `${API}/unitOfMeasureClassOptions`;

// PERSONS
export const PERSONS = `${API}/persons`;
export const PERSONS_SEARCH = `${PERSONS}/search`;
export const PERSON_BY_ID = (id) => `${PERSONS}/${id}`;

// ROLES
export const ROLES = `${API}/roles`;
export const ROLE_BY_ID = (id) => `${ROLES}/${id}`;
export const ROLE_TYPE_OPTIONS = `${API}/roleTypeOptions`;

// USERS
export const USERS_API = `${API}/users`;
export const USER_BY_ID = (id) => `${USERS_API}/${id}`;
export const USER_CREATE = `${USERS_API}/create`;
export const USER_PHOTO = (id) => `${USERS_API}/${id}/photo`;
export const USER_LOCALE_OPTIONS = `${USERS_API}/localeOptions`;

// PRODUCT ASSOCIATIONS
export const PRODUCT_ASSOCIATIONS = `${API}/productAssociations`;
export const PRODUCT_ASSOCIATIONS_SEARCH = `${PRODUCT_ASSOCIATIONS}/search`;
export const PRODUCT_ASSOCIATION_DETAILS = (id) => `${PRODUCT_ASSOCIATIONS}/${id}/details`;
export const PRODUCT_ASSOCIATION_DELETE = (id) => `${PRODUCT_ASSOCIATIONS}/${id}/deleteAssociation`;
export const PRODUCT_ASSOCIATION_TYPE_CODE_OPTIONS = `${API}/productAssociationTypeCodeOptions`;
export const PRODUCT_ASSOCIATION_SAVE = `${PRODUCT_ASSOCIATIONS}/saveAssociation`;
export const PRODUCT_ASSOCIATION_UPDATE = (id) => `${PRODUCT_ASSOCIATIONS}/${id}/updateAssociation`;

// PRODUCT CATALOGS
export const PRODUCT_CATALOGS = `${API}/productCatalogs`;
export const PRODUCT_CATALOGS_SEARCH = `${PRODUCT_CATALOGS}/search`;
export const PRODUCT_CATALOGS_SAVE = `${PRODUCT_CATALOGS}/saveCatalog`;
export const PRODUCT_CATALOGS_ADD_ITEM = `${PRODUCT_CATALOGS}/addItem`;
export const PRODUCT_CATALOG_ITEM_DELETE = (id) => `${PRODUCT_CATALOGS}/items/${id}`;
export const PRODUCT_CATALOG_DETAILS = (id) => `${PRODUCT_CATALOGS}/${id}/details`;
export const PRODUCT_CATALOG_DELETE = (id) => `${PRODUCT_CATALOGS}/${id}/deleteCatalog`;
export const PRODUCT_CATALOG_IMPORT_ITEMS = (id) => `${PRODUCT_CATALOGS}/${id}/importItems`;

// LOCATIONS
export const LOCATION_API = `${API}/locations`;
export const LOCATION_TYPES = `${LOCATION_API}/locationTypes`;
export const LOCATION_TEMPLATE = `${CONTEXT_PATH}${LOCATION_API}/template`;
export const LOCATION_IMPORT = `${CONTEXT_PATH}${LOCATION_API}/importCsv`;
export const LOCATION = (id) => `${LOCATION_API}/${id}`;
export const LOCATION_SEARCH = `${LOCATION_API}/search`;
export const LOCATION_DETAILS = (id) => `${LOCATION_API}/${id}/details`;
export const LOCATION_CONTENTS = (id) => `${LOCATION_API}/${id}/contents`;
export const LOCATION_LOGO = (id) => `${LOCATION_API}/${id}/logo`;
export const LOCATION_SUPPORTED_ACTIVITIES = `${LOCATION_API}/supportedActivities`;

// SUPPLIER
export const SUPPLIER_API = `${API}/suppliers`;
export const SUPPLIER_SEARCH = `${SUPPLIER_API}/search`;
export const SUPPLIER_DETAILS = (id) => `${SUPPLIER_API}/${id}/details`;
export const SUPPLIER_PRICE_HISTORY = '/supplier/getPriceHistory';
export const SUPPLIER_PRICE_HISTORY_DOWNLOAD = `${CONTEXT_PATH}/supplier/getPriceHistory`;

// PUTAWAY
export const PUTAWAY_GENERATE_PDF = (id) => `/putAway/generatePdf/${id}`;

// SUPPORT LINKS
export const SUPPORT_LINKS = `${CONTEXT_PATH}${API}/supportLinks`;

// COMBINED SHIPMENT ITEMS
export const COMBINED_SHIPMENT_ITEMS_API = `${API}/combinedShipmentItems`;
export const COMBINED_SHIPMENT_ITEMS_IMPORT_TEMPLATE = (id) => `${COMBINED_SHIPMENT_ITEMS_API}/importTemplate/${id}`;
export const COMBINED_SHIPMENT_ITEMS_EXPORT_TEMPLATE = `${COMBINED_SHIPMENT_ITEMS_API}/exportTemplate`;

export const HELPSCOUT_CONFIGURATION = `${CONTEXT_PATH}${API}/helpscout/configuration/`;

export const ENABLE_LOCALIZATION = `${CONTEXT_PATH}/user/enableLocalizationMode`;
export const DISABLE_LOCALIZATION = (languageCode) => {
  if (languageCode) {
    return `${CONTEXT_PATH}/user/disableLocalizationMode?locale=${languageCode}`;
  }
  return `${CONTEXT_PATH}/user/disableLocalizationMode`;
};

export const GLOBAL_SEARCH = (term) => `${CONTEXT_PATH}/dashboard/globalSearch?searchTerms=${term}`;

// ORGANIZATIONS
export const ORGANIZATION_API = `${API}/organizations`;
export const ORGANIZATION_BY_ID = (id) => `${ORGANIZATION_API}/${id}`;
export const ORGANIZATION_DETAILS = (id) => `${ORGANIZATION_API}/${id}/details`;

// PRODUCT SUPPLIER
export const PRODUCT_SUPPLIER_API = `${API}/productSuppliers`;
export const PRODUCT_SUPPLIER_BY_ID = (id) => `${PRODUCT_SUPPLIER_API}/${id}`;
export const PRODUCT_SUPPLIER_PREFERENCES_API = `${API}/productSupplierPreferences`;
export const PRODUCT_SUPPLIER_PREFERENCES_BY_ID = (id) => `${PRODUCT_SUPPLIER_PREFERENCES_API}/${id}`;
export const PRODUCT_SUPPLIER_EXPORT = `${PRODUCT_SUPPLIER_API}/export`;

// UNIT OF MEASURE
export const UNIT_OF_MEASURE_API = `${API}/unitOfMeasures`;
export const UNIT_OF_MEASURE_OPTIONS = `${UNIT_OF_MEASURE_API}/options`;
// Currencies don't use url in plural form, do not change it to UNIT_OF_MEASURE_API!
export const CURRENCIES_OPTIONS = `${API}/unitOfMeasure/currencies`;

// PRODUCT PACKAGE
export const PRODUCT_PACKAGE_API = `${API}/productPackages`;

// PRODUCT SUPPLIER PREFERENCE
export const PRODUCT_SUPPLIER_PREFERENCE_API = `${API}/productSupplierPreferences`;
export const PRODUCT_SUPPLIER_PREFERENCE_BATCH = `${PRODUCT_SUPPLIER_PREFERENCE_API}/batch`;

// PRODUCT SUPPLIER ATTRIBUTE
export const PRODUCT_SUPPLIER_ATTRIBUTE_API = `${API}/productSupplierAttributes`;
export const PRODUCT_SUPPLIER_ATTRIBUTE_BATCH = `${PRODUCT_SUPPLIER_ATTRIBUTE_API}/batch`;

// PRODUCT CLASSIFICATION
export const PRODUCT_CLASSIFICATIONS_API = (facilityId) => `${API}/facilities/${facilityId}/products/classifications`;

export const PICKLIST_API = `${API}/picklists`;
export const PICKLIST_CLEAR = (id) => `${PICKLIST_API}/${id}/items`;

// FULL OUTBOUND IMPORT FEATURE
export const FULFILLMENT_API = `${API}/fulfillments`;
export const PACKING_LIST = `${CONTEXT_PATH}/packingList`;
export const IMPORT_PACKING_LIST = `${PACKING_LIST}/upload`;
export const FULFILLMENT_VALIDATION = `${FULFILLMENT_API}/validate`;

// SELECT OPTIONS
export const HANDLING_REQUIREMENTS_OPTIONS = `${API}/handlingRequirementsOptions`;

// INTERNAL LOCATIONS
export const INTERNAL_LOCATIONS = `${API}/internalLocations`;

// BUDGET CODE
export const BUDGET_CODE_API = `${API}/budgetCodes`;
export const BUDGET_CODE_BY_ID = (id) => `${BUDGET_CODE_API}/${id}`;

// LOCATION GROUP
export const LOCATION_GROUP_API = `${API}/locationGroups`;
export const LOCATION_GROUP_BY_ID = (id) => `${LOCATION_GROUP_API}/${id}`;

// LOCATION TYPE
export const LOCATION_TYPE_API = `${API}/locationTypes`;
export const LOCATION_TYPE_BY_ID = (id) => `${LOCATION_TYPE_API}/${id}`;
export const LOCATION_TYPE_CODE_OPTIONS = `${LOCATION_TYPE_API}/locationTypeCodeOptions`;
export const LOCATION_TYPE_SUPPORTED_ACTIVITY_OPTIONS = `${LOCATION_TYPE_API}/supportedActivityOptions`;

// GL ACCOUNT TYPE
export const GL_ACCOUNT_TYPE_API = `${API}/glAccountTypes`;
export const GL_ACCOUNT_TYPE_BY_ID = (id) => `${GL_ACCOUNT_TYPE_API}/${id}`;
export const GL_ACCOUNT_TYPE_CODE_OPTIONS = `${GL_ACCOUNT_TYPE_API}/glAccountTypeCodeOptions`;

// PAYMENT TERM
export const PAYMENT_TERM_API = `${API}/paymentTerms`;
export const PAYMENT_TERM_BY_ID = (id) => `${PAYMENT_TERM_API}/${id}`;

// EVENT TYPE
export const EVENT_TYPE_API = `${API}/eventTypes`;
export const EVENT_TYPE_BY_ID = (id) => `${EVENT_TYPE_API}/${id}`;
export const EVENT_TYPE_EVENT_CODE_OPTIONS = `${EVENT_TYPE_API}/eventCodeOptions`;

// PARTY
export const PARTY_API = `${API}/parties`;
export const PARTY_BY_ID = (id) => `${PARTY_API}/${id}`;
export const PARTY_TYPE_OPTIONS = `${PARTY_API}/partyTypeOptions`;
export const PARTY_OPTIONS = `${PARTY_API}/partyOptions`;

// PARTY ROLE
export const PARTY_ROLE_API = `${API}/partyRoles`;
export const PARTY_ROLE_BY_ID = (id) => `${PARTY_ROLE_API}/${id}`;
export const PARTY_ROLE_ROLE_TYPE_OPTIONS = `${PARTY_ROLE_API}/roleTypeOptions`;

// GL ACCOUNT
export const GL_ACCOUNT_API = `${API}/glAccounts`;
export const GL_ACCOUNT_BY_ID = (id) => `${GL_ACCOUNT_API}/${id}`;
export const GL_ACCOUNT_TYPE_OPTIONS = `${GL_ACCOUNT_API}/glAccountTypeOptions`;

// PREFERENCE TYPE
export const PREFERENCE_TYPE_API = `${API}/preferenceTypes`;
export const PREFERENCE_TYPE_BY_ID = (id) => `${PREFERENCE_TYPE_API}/${id}`;
export const PREFERENCE_TYPE_VALIDATION_CODE_OPTIONS = `${PREFERENCE_TYPE_API}/validationCodeOptions`;

// CYCLE COUNT
export const CYCLE_COUNT = (locationId) => `${API}/facilities/${locationId}/cycle-counts`;
export const CYCLE_COUNT_CANDIDATES = (locationId) => `${CYCLE_COUNT(locationId)}/candidates`;
export const CYCLE_COUNT_PENDING_REQUESTS = (locationId) => `${CYCLE_COUNT(locationId)}/requests/pending`;
export const CYCLE_COUNT_REQUESTS = (locationId) => `${CYCLE_COUNT(locationId)}/requests/batch`;
export const CYCLE_COUNT_START = (locationId, format) => `${CYCLE_COUNT(locationId)}/start/batch${format ? `?format=${format}` : ''}`;
export const CYCLE_COUNT_RECOUNT_START = (locationId, format) => `${CYCLE_COUNT(locationId)}/recount/start/batch${format ? `?format=${format}` : ''}`;
export const CYCLE_COUNT_ITEM = (locationId, itemId) => `${CYCLE_COUNT(locationId)}/items/${itemId}`;
export const CYCLE_COUNT_ITEMS = (locationId, cycleCountId) => `${CYCLE_COUNT(locationId)}/${cycleCountId}/items`;
export const CYCLE_COUNT_ITEMS_BATCH = (locationId, cycleCountId) => `${CYCLE_COUNT(locationId)}/${cycleCountId}/items/batch`;
// Root endpoint doesn't require the cycleCountId - we can send items from multiple cycle counts
export const CYCLE_COUNT_ITEMS_BATCH_ROOT = (locationId) => `${CYCLE_COUNT(locationId)}/items/batch`;
export const CYCLE_COUNT_SUBMIT_COUNT = (locationId, cycleCountId) => `${CYCLE_COUNT(locationId)}/${cycleCountId}/count`;
export const CYCLE_COUNT_SUBMIT_RECOUNT = (locationId, cycleCountId) => `${CYCLE_COUNT(locationId)}/${cycleCountId}/recount`;
export const CYCLE_COUNT_REFRESH_ITEMS = (locationId, cycleCountId, removeOutOfStockItemsImplicitly) => `${CYCLE_COUNT(locationId)}/${cycleCountId}/refresh${removeOutOfStockItemsImplicitly ? '?removeOutOfStockItemsImplicitly=true' : ''}`;
export const CYCLE_COUNT_ITEMS_IMPORT = (locationId) => `${CYCLE_COUNT(locationId)}/items/upload/count`;
export const CYCLE_COUNT_ITEMS_IMPORT_RECOUNT = (locationId) => `${CYCLE_COUNT(locationId)}/items/upload/recount`;
export const CYCLE_COUNT_REQUESTS_BATCH = (locationId) => `${CYCLE_COUNT(locationId)}/requests/batch`;

// REPORTING
export const REPORTS = `${API}/reports`;
export const CYCLE_COUNT_SUMMARY_REPORT = `${REPORTS}/cycle-count-summary`;
export const INVENTORY_AUDIT_SUMMARY_REPORT = `${REPORTS}/inventory-audit-summary`;
export const INVENTORY_AUDIT_SUMMARY_REPORT_CSV = `${INVENTORY_AUDIT_SUMMARY_REPORT}.csv`;
export const INVENTORY_TRANSACTIONS_SUMMARY = `${REPORTS}/inventory-transactions-summary`;
export const INVENTORY_TRANSACTIONS_SUMMARY_CSV = `${INVENTORY_TRANSACTIONS_SUMMARY}.csv`;

// INDICATORS
export const INDICATORS_REPORT = `${API}/reports/indicators`;

export const INDICATORS_PRODUCTS_INVENTORIED = `${INDICATORS_REPORT}/productsInventoried`;
export const INDICATORS_INVENTORY_SHRINKAGE = `${INDICATORS_REPORT}/inventoryShrinkage`;
export const INDICATORS_INVENTORY_ACCURACY = `${INDICATORS_REPORT}/inventoryAccuracy`;

// STOCK CARD
export const STOCK_CARD_API = `${API}/stockCard`;
export const STOCK_CARD_DETAILS = (id) => `${STOCK_CARD_API}/${id}/details`;
export const STOCK_CARD_CURRENT_STOCK = (id) => `${STOCK_CARD_API}/${id}/currentStock`;
export const STOCK_CARD_STOCK_HISTORY = (id) => `${STOCK_CARD_API}/${id}/stockHistory`;
export const STOCK_CARD_ALL_LOCATIONS = (id) => `${STOCK_CARD_API}/${id}/allLocations`;
export const STOCK_CARD_SUPPLIERS = (id) => `${STOCK_CARD_API}/${id}/suppliers`;
export const STOCK_CARD_ASSOCIATIONS = (id) => `${STOCK_CARD_API}/${id}/associations`;
export const STOCK_CARD_PENDING_INBOUND = (id) => `${STOCK_CARD_API}/${id}/pendingInbound`;
export const STOCK_CARD_PENDING_OUTBOUND = (id) => `${STOCK_CARD_API}/${id}/pendingOutbound`;
export const STOCK_CARD_DEMAND = (id) => `${STOCK_CARD_API}/${id}/demand`;
export const STOCK_CARD_SNAPSHOT = (id) => `${STOCK_CARD_API}/${id}/snapshot`;
export const STOCK_CARD_DOCUMENTS = (id) => `${STOCK_CARD_API}/${id}/documents`;
export const STOCK_CARD_LOT_NUMBERS = (id) => `${STOCK_CARD_API}/${id}/lotNumbers`;
export const STOCK_CARD_ACTION_CONTEXT = `${STOCK_CARD_API}/actionContext`;
export const STOCK_CARD_BIN_LOCATIONS = `${STOCK_CARD_API}/binLocations`;
export const STOCK_CARD_RECORD_INVENTORY = `${STOCK_CARD_API}/recordInventory`;
export const STOCK_CARD_INVENTORY_LEVEL = `${STOCK_CARD_API}/inventoryLevel`;
export const STOCK_CARD_TRANSACTION_LOG = (id) => `${STOCK_CARD_API}/${id}/transactionLog`;
export const STOCK_CARD_TRANSFER_STOCK = `${STOCK_CARD_API}/transferStock`;

// INVENTORY LEVELS
export const INVENTORY_LEVELS_API = `${API}/inventoryLevels`;
export const INVENTORY_LEVELS_SEARCH = `${INVENTORY_LEVELS_API}/search`;
export const INVENTORY_LEVELS_FORM_CONTEXT = `${INVENTORY_LEVELS_API}/formContext`;
export const INVENTORY_LEVELS_FORM_CONTEXT_BY_ID = (id) => `${INVENTORY_LEVELS_API}/${id}/formContext`;
export const INVENTORY_LEVELS_DETAILS = (id) => `${INVENTORY_LEVELS_API}/${id}/details`;
export const INVENTORY_LEVELS_SAVE = INVENTORY_LEVELS_API;
export const INVENTORY_LEVELS_BY_ID = (id) => `${INVENTORY_LEVELS_API}/${id}`;
export const STOCK_CARD_UPDATE_INVENTORY_ITEM = `${STOCK_CARD_API}/updateInventoryItem`;
export const STOCK_CARD_ADD_TO_SHIPMENT = `${STOCK_CARD_API}/addToShipment`;

// PRODUCT SCREENS (edit/create, batch edit, CSV import, add document)
export const PRODUCT_SCREENS_API = `${API}/productScreens`;
export const PRODUCT_SCREENS_CREATE_DATA = `${PRODUCT_SCREENS_API}/editData`;
export const PRODUCT_SCREENS_EDIT_DATA = (id) => `${PRODUCT_SCREENS_API}/${id}/editData`;
export const PRODUCT_SCREENS_SAVE_DETAILS = `${PRODUCT_SCREENS_API}/saveDetails`;
export const PRODUCT_SCREENS_BATCH_EDIT = `${PRODUCT_SCREENS_API}/batchEdit`;
export const PRODUCT_SCREENS_IMPORT_UPLOAD = `${PRODUCT_SCREENS_API}/importUpload`;
export const PRODUCT_SCREENS_IMPORT_CONFIRM = `${PRODUCT_SCREENS_API}/importConfirm`;
export const PRODUCT_SCREENS_ADD_DOCUMENT_CONTEXT = (id) => `${PRODUCT_SCREENS_API}/${id}/addDocumentContext`;
export const PRODUCT_SCREENS_UPLOAD_DOCUMENT = (id) => `${PRODUCT_SCREENS_API}/${id}/documents`;
export const PRODUCT_SCREENS_ADD_SYNONYM = (id) => `${PRODUCT_SCREENS_API}/${id}/synonyms`;
export const PRODUCT_SCREENS_MERGE_LOGS = `${PRODUCT_SCREENS_API}/productMergeLogs`;
export const PRODUCT_SCREENS_SEARCH_RESULTS = `${PRODUCT_SCREENS_API}/searchResults`;
export const PRODUCT_SCREENS_UPN_DATABASE = `${PRODUCT_SCREENS_API}/upnDatabase`;

// INVENTORY
export const INVENTORY_API = (id) => `${API}/facilities/${id}/inventories`;
export const REORDER_REPORT = (id) => `${INVENTORY_API(id)}/reorderReport`;
export const EXPIRATION_HISTORY_REPORT = `${API}/inventories/expirationHistoryReport`;

// INVENTORY (legacy screen migration)
export const INVENTORY_SCREEN_API = `${API}/inventory`;
export const INVENTORY_BROWSE = `${INVENTORY_SCREEN_API}/browse`;
export const INVENTORY_LIST = `${INVENTORY_SCREEN_API}/listInventory`;
export const INVENTORY_LIST_LOW_STOCK = `${INVENTORY_SCREEN_API}/listLowStock`;
export const INVENTORY_LIST_REORDER_STOCK = `${INVENTORY_SCREEN_API}/listReorderStock`;
export const INVENTORY_LIST_DAILY_TRANSACTIONS = `${INVENTORY_SCREEN_API}/listDailyTransactions`;
export const INVENTORY_LIST_EXPIRED_STOCK = `${INVENTORY_SCREEN_API}/listExpiredStock`;
export const INVENTORY_LIST_EXPIRING_STOCK = `${INVENTORY_SCREEN_API}/listExpiringStock`;
export const INVENTORY_EDIT_BIN_LOCATION = `${INVENTORY_SCREEN_API}/editBinLocation`;
export const INVENTORY_ADJUST_STOCK = `${INVENTORY_SCREEN_API}/adjustStock`;
export const INVENTORY_CREATE_TRANSACTION = `${INVENTORY_SCREEN_API}/createTransaction`;
export const INVENTORY_SAVE_ADJUSTMENT_TRANSACTION = `${INVENTORY_SCREEN_API}/saveAdjustmentTransaction`;
export const INVENTORY_SAVE_DEBIT_TRANSACTION = `${INVENTORY_SCREEN_API}/saveDebitTransaction`;
export const INVENTORY_SAVE_CREDIT_TRANSACTION = `${INVENTORY_SCREEN_API}/saveCreditTransaction`;
export const INVENTORY_TRANSACTION_BY_ID = (id) => `${INVENTORY_SCREEN_API}/transactions/${id}`;
export const INVENTORY_SAVE_TRANSACTION = `${INVENTORY_SCREEN_API}/saveTransaction`;
export const INVENTORY_TRANSACTION_ENTRY_DELETE = (id) => `${INVENTORY_SCREEN_API}/transactionEntries/${id}`;
export const INVENTORY_LIST_TRANSACTIONS = `${INVENTORY_SCREEN_API}/listTransactions`;
export const INVENTORY_SHOW_TRANSACTION = (id) => `${INVENTORY_SCREEN_API}/showTransaction/${id}`;
export const INVENTORY_DELETE_TRANSACTION = (id) => `${INVENTORY_SCREEN_API}/deleteTransaction/${id}`;
export const INVENTORY_LIST_BIN_LOCATIONS = `${INVENTORY_SCREEN_API}/listBinLocations`;
export const INVENTORY_SHOW_PRODUCTS = `${INVENTORY_SCREEN_API}/showProducts`;
export const INVENTORY_UPLOAD = `${INVENTORY_SCREEN_API}/uploadInventory`;

// ADMIN
export const ADMIN_API = `${API}/admin`;
export const ADMIN_CONTROLLERS = `${ADMIN_API}/controllers`;
export const ADMIN_CONTROLLER_ACTIONS = `${ADMIN_API}/controllerActions`;
export const ADMIN_PLUGINS = `${ADMIN_API}/plugins`;
export const ADMIN_CACHE = `${ADMIN_API}/cache`;
export const ADMIN_EVICT_DOMAIN_CACHE = `${ADMIN_CACHE}/evictDomainCache`;
export const ADMIN_EVICT_QUERY_CACHE = `${ADMIN_CACHE}/evictQueryCache`;
export const ADMIN_SETTINGS = `${ADMIN_API}/settings`;
export const ADMIN_TRIGGER_STOCK_ALERTS = `${ADMIN_API}/triggerStockAlerts`;
export const ADMIN_SEND_MAIL = `${ADMIN_API}/sendMail`;
export const ADMIN_MAIL_FORM = `${ADMIN_API}/mailForm`;
export const ADMIN_STATUS = `${ADMIN_API}/status`;
export const ADMIN_UPGRADE = `${ADMIN_API}/upgrade`;
export const ADMIN_UPGRADE_DOWNLOAD = `${ADMIN_UPGRADE}/download`;
export const ADMIN_UPGRADE_DEPLOY = `${ADMIN_UPGRADE}/deploy`;

// BATCH IMPORT
export const BATCH_IMPORT_DATA = `${API}/batch/importData`;

// DATA EXPORT
export const DATA_EXPORTS = `${API}/dataExports`;

// JOBS
export const JOB_BY_ID = (id) => `${API}/jobs/${id}`;
export const JOB_SCHEDULE = (id) => `${API}/jobs/${id}/schedule`;
export const JOB_TRIGGER_BY_ID = (id) => `${API}/jobs/triggers/${id}`;

// LOCALIZATIONS
export const LOCALIZATIONS = `${API}/localizations`;
export const LOCALIZATION_LOCALE_OPTIONS = `${LOCALIZATIONS}/localeOptions`;
export const LOCALIZATION_SEARCH = `${LOCALIZATIONS}/search`;
export const LOCALIZATION_UPLOAD = `${LOCALIZATIONS}/upload`;
export const LOCALIZATION_BY_ID = (id) => `${LOCALIZATIONS}/${id}`;
export const LOCALIZATION_DETAILS = (id) => `${LOCALIZATIONS}/${id}/details`;

// MIGRATION (legacy migration screens)
export const MIGRATION_API = `${API}/migration`;
export const MIGRATION_DATA_MIGRATION = `${MIGRATION_API}/dataMigration`;
export const MIGRATION_DIMENSION_TABLES = `${MIGRATION_API}/dimensionTables`;
export const MIGRATION_RECEIPTS_WITHOUT_TRANSACTION = `${MIGRATION_API}/receiptsWithoutTransaction`;
export const MIGRATION_SHIPMENTS_WITHOUT_TRANSACTIONS = `${MIGRATION_API}/shipmentsWithoutTransactions`;
export const MIGRATION_STOCK_MOVEMENTS_WITHOUT_SHIPMENT_ITEMS = `${MIGRATION_API}/stockMovementsWithoutShipmentItems`;

// REQUISITIONS (legacy requisition screens migration)
export const REQUISITION_API = `${API}/requisitions`;
export const REQUISITION_TEMPLATES = `${REQUISITION_API}/templates`;
export const REQUISITION_TEMPLATE_BY_ID = (id) => `${REQUISITION_TEMPLATES}/${id}`;
export const REQUISITION_EDIT = (id) => `${REQUISITION_API}/${id}/edit`;
export const REQUISITION_CONFIRM = (id) => `${REQUISITION_API}/${id}/confirm`;
export const REQUISITION_DETAILS = (id) => `${REQUISITION_API}/${id}/details`;
export const REQUISITION_LIST = `${REQUISITION_API}/list`;
export const REQUISITION_EDIT_HEADER = (id) => `${REQUISITION_API}/${id}/editHeader`;
export const REQUISITION_REVIEW = (id) => `${REQUISITION_API}/${id}/review`;
export const REQUISITION_ITEM_UPDATE = (id, itemId) => `${REQUISITION_API}/${id}/items/${itemId}`;
export const REQUISITION_ITEM_DETAILS = (id, itemId) => `${REQUISITION_API}/${id}/items/${itemId}/details`;
export const REQUISITION_PICK = (id) => `${REQUISITION_API}/${id}/pick`;
export const REQUISITION_ITEM_PICKLIST_ITEMS = (id, itemId) => `${REQUISITION_API}/${id}/items/${itemId}/picklistItems`;
export const REQUISITION_UPDATE_PICKLIST_ITEMS = (id) => `${REQUISITION_API}/${id}/picklistItems`;
export const REQUISITION_PRINT_DRAFT = (id) => `${REQUISITION_API}/${id}/printDraft`;
export const REQUISITION_PROCESS = (id) => `${REQUISITION_API}/${id}/process`;
export const PICKLIST_SAVE = '/picklist/save';
