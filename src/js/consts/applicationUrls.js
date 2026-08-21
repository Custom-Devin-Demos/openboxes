/**
 * Definitions of APPLICATION URLs used for redirecting to pages
 * */
import { stringifyUrl } from 'query-string';

export const CONTEXT_PATH = window.CONTEXT_PATH ?? '/openboxes';

const DASHBOARD_URL = {
  base: `${CONTEXT_PATH}/dashboard`,
};

const LOCATION_CONFIGURATION_URL = {
  base: `${CONTEXT_PATH}/locationsConfiguration`,
  create: () => `${LOCATION_CONFIGURATION_URL.base}/create`,
  edit: (id) => `${LOCATION_CONFIGURATION_URL.create()}/${id}`,
  upload: () => `${LOCATION_CONFIGURATION_URL.base}/upload`,
};

const PRODUCT_CONFIGURATION_URL = {
  base: `${CONTEXT_PATH}/productsConfiguration`,
  index: () => `${PRODUCT_CONFIGURATION_URL.base}/index`,
};

const PRODUCT_URL = {
  base: `${CONTEXT_PATH}/product`,
  list: () => `${PRODUCT_URL.base}/list`,
  create: () => `${PRODUCT_URL.base}/create`,
  edit: (id) => `${PRODUCT_URL.base}/edit/${id}`,
  importCSV: () => `${PRODUCT_URL.base}/importAsCsv`,
  addDocument: (id) => `${PRODUCT_URL.base}/addDocument/${id}`,
  batchEdit: () => `${PRODUCT_URL.base}/batchEdit`,
  batchEditProperties: () => `${PRODUCT_URL.base}/batchEditProperties`,
  search: () => `${PRODUCT_URL.base}/search`,
  show: (id) => `${PRODUCT_URL.base}/show${id ? `/${id}` : ''}`,
  mergeLogs: () => `${PRODUCT_URL.base}/productMergeLogs`,
  upnDatabase: () => `${PRODUCT_URL.base}/upnDatabase`,
  barcode: (data) => `${PRODUCT_URL.base}/barcode?data=${encodeURIComponent(data)}&width=100&height=10&format=CODE_128`,
};

const LOCATION_URL = {
  base: `${CONTEXT_PATH}/location`,
  list: () => `${LOCATION_URL.base}/list`,
  create: () => `${LOCATION_URL.base}/edit`,
  edit: (id) => `${LOCATION_URL.base}/edit/${id}`,
  showBinLocations: (id) => `${LOCATION_URL.base}/showBinLocations/${id}`,
  showZoneLocations: (id) => `${LOCATION_URL.base}/showZoneLocations/${id}`,
  showContents: (id) => `${LOCATION_URL.base}/showContents/${id}`,
  uploadLogo: (id) => `${LOCATION_URL.base}/uploadLogo/${id}`,
  viewLogo: (id) => `${LOCATION_URL.base}/viewLogo/${id}`,
  exportBinLocations: (id) => `${LOCATION_URL.base}/exportBinLocations/${id}`,
  exportLocations: () => `${CONTEXT_PATH}/batch/downloadExcel?type=Location`,
  show: (id) => `${LOCATION_URL.base}/show/${id}`,
};

const SUPPLIER_URL = {
  base: `${CONTEXT_PATH}/supplier`,
  list: () => `${SUPPLIER_URL.base}/list`,
  show: (id) => `${SUPPLIER_URL.base}/show/${id}`,
};

const STOCK_MOVEMENT_URL = {
  base: `${CONTEXT_PATH}/stockMovement`,
  list: () => `${STOCK_MOVEMENT_URL.base}/list`,
  listInbound: () => `${STOCK_MOVEMENT_URL.list()}?direction=INBOUND`,
  listOutbound: () => `${STOCK_MOVEMENT_URL.list()}?direction=OUTBOUND`,
  listRequest: () => `${STOCK_MOVEMENT_URL.list()}?direction=OUTBOUND&sourceType=ELECTRONIC`,
  createInbound: () => `${STOCK_MOVEMENT_URL.base}/createInbound`,
  createOutbound: () => `${STOCK_MOVEMENT_URL.base}/createOutbound`,
  createRequest: () => `${STOCK_MOVEMENT_URL.base}/createRequest`,
  createCombinedShipments: () => `${STOCK_MOVEMENT_URL.base}/createCombinedShipments`,
  genericEdit: (id) => `${STOCK_MOVEMENT_URL.base}/edit/${id}`,
  editInbound: (id) => `${STOCK_MOVEMENT_URL.createInbound()}/${id}`,
  editOutbound: (id) => `${STOCK_MOVEMENT_URL.createOutbound()}/${id}`,
  editRequest: (id) => `${STOCK_MOVEMENT_URL.createRequest()}/${id}`,
  editCombinedShipments: (id) => `${STOCK_MOVEMENT_URL.createCombinedShipments()}/${id}`,
  show: (id) => `${STOCK_MOVEMENT_URL.base}/show/${id}`,
  importOutbound: () => `${STOCK_MOVEMENT_URL.base}/importOutboundStockMovement`,
  importCsv: (id) => `${STOCK_MOVEMENT_URL.base}/importCsv/${id}`,
  exportCsv: (id) => `${STOCK_MOVEMENT_URL.base}/exportCsv/${id}`,
  uploadDocuments: (id) => `${STOCK_MOVEMENT_URL.base}/uploadDocuments/${id}`,
};

const INVOICE_URL = {
  base: `${CONTEXT_PATH}/invoice`,
  list: () => `${INVOICE_URL.base}/list`,
  create: () => `${INVOICE_URL.base}/create`,
  edit: (id) => `${INVOICE_URL.create()}/${id}`,
  show: (id) => `${INVOICE_URL.base}/show/${id}`,
  addDocument: (id) => `${INVOICE_URL.base}/addDocument/${id}`,
  editDocument: (documentId, invoiceId) => `${INVOICE_URL.base}/editDocument/${documentId}?invoice.id=${invoiceId}`,
  deleteDocument: (documentId, invoiceId) => `${INVOICE_URL.base}/deleteDocument/${documentId}?invoice.id=${invoiceId}`,
  rollback: (id) => `${INVOICE_URL.base}/rollback/${id}`,
  eraseInvoice: (id) => `${INVOICE_URL.base}/eraseInvoice/${id}`,
};

const PUTAWAY_URL = {
  base: `${CONTEXT_PATH}/putAway`,
  create: () => `${PUTAWAY_URL.base}/create`,
  edit: (id) => `${PUTAWAY_URL.create()}/${id}`,
  generatePdf: (id) => `${PUTAWAY_URL.base}/generatePdf/${id}`,
};

const STOCK_TRANSFER_URL = {
  base: `${CONTEXT_PATH}/stockTransfer`,
  create: () => `${STOCK_TRANSFER_URL.base}/create`,
  createOutbound: () => `${STOCK_TRANSFER_URL.base}/createOutboundReturn`,
  createInbound: () => `${STOCK_TRANSFER_URL.base}/createInboundReturn`,
  genericEdit: (id) => `${STOCK_TRANSFER_URL.base}/edit/${id}`,
  createById: (id) => `${STOCK_TRANSFER_URL.create()}/${id}`,
  edit: (id) => `${STOCK_TRANSFER_URL.base}/edit/${id}`,
  editOutbound: (id) => `${STOCK_TRANSFER_URL.createOutbound()}/${id}`,
  editInbound: (id) => `${STOCK_TRANSFER_URL.createInbound()}/${id}`,
  show: (id) => `${STOCK_TRANSFER_URL.base}/show/${id}`,
  print: (id) => `${STOCK_TRANSFER_URL.base}/print/${id}`,
};

const ORDER_URL = {
  base: `${CONTEXT_PATH}/order`,
  list: () => `${ORDER_URL.base}/list`,
  listPutaway: () => `${ORDER_URL.base}/list?orderType=PUTAWAY_ORDER`,
  create: () => `${ORDER_URL.base}/create`,
  show: (id) => `${ORDER_URL.base}/show/${id}`,
  print: (id) => `${ORDER_URL.base}/print/${id}`,
  addComment: (id) => `${ORDER_URL.base}/addComment/${id}`,
  addDocument: (id) => `${ORDER_URL.base}/addDocument/${id}`,
  placeOrder: (id) => `${ORDER_URL.base}/placeOrder/${id}`,
  remove: (id) => `${ORDER_URL.base}/remove/${id}`,
  rollbackOrderStatus: (id) => `${ORDER_URL.base}/rollbackOrderStatus/${id}`,
  saveComment: () => `${ORDER_URL.base}/saveComment`,
  saveAdjustment: () => `${ORDER_URL.base}/saveAdjustment`,
  orderSummaryList: () => `${ORDER_URL.base}/orderSummaryList`,
  withdraw: (id) => `${ORDER_URL.base}/withdraw/${id}`,
  download: (id) => `${ORDER_URL.base}/download/${id}`,
  downloadOrderItems: (id) => `${ORDER_URL.base}/downloadOrderItems/${id}`,
  render: (id, documentTemplateId) => `${ORDER_URL.base}/render/${id}?documentTemplate.id=${documentTemplateId}`,
  editComment: (commentId, orderId) => `${ORDER_URL.base}/editComment/${commentId}?order.id=${orderId}`,
  deleteComment: (commentId, orderId) => `${ORDER_URL.base}/deleteComment/${commentId}?order.id=${orderId}`,
  editDocument: (documentId, orderId) => `${ORDER_URL.base}/editDocument/${documentId}?order.id=${orderId}`,
  deleteDocument: (documentId, orderId) => `${ORDER_URL.base}/deleteDocument/${documentId}?order.id=${orderId}`,
  createCombinedShipment: (orderId) => `${ORDER_URL.base}/createCombinedShipment?direction=INBOUND&orderId=${orderId}`,
};

const ORDER_ADJUSTMENT_TYPE_URL = {
  base: `${CONTEXT_PATH}/orderAdjustmentType`,
  list: () => `${ORDER_ADJUSTMENT_TYPE_URL.base}/list`,
  create: () => `${ORDER_ADJUSTMENT_TYPE_URL.base}/create`,
  edit: (id) => `${ORDER_ADJUSTMENT_TYPE_URL.base}/edit/${id}`,
};

const DOCUMENT_URL = {
  base: `${CONTEXT_PATH}/document`,
  uploadDocument: () => `${DOCUMENT_URL.base}/uploadDocument`,
  download: (id) => `${DOCUMENT_URL.base}/download/${id}`,
  saveDocument: () => `${DOCUMENT_URL.base}/saveDocument`,
  list: () => `${DOCUMENT_URL.base}/list`,
  create: () => `${DOCUMENT_URL.base}/create`,
  edit: (id) => `${DOCUMENT_URL.base}/edit/${id}`,
  preview: (id) => `${DOCUMENT_URL.base}/preview/${id}`,
};

const PURCHASE_ORDER_URL = {
  base: `${CONTEXT_PATH}/purchaseOrder`,
  create: () => `${PURCHASE_ORDER_URL.base}/create`,
  edit: (id) => `${PURCHASE_ORDER_URL.base}/edit/${id}`,
  addItems: (id) => `${PURCHASE_ORDER_URL.base}/addItems/${id}`,
  list: (params = {}) => stringifyUrl({
    url: `${PURCHASE_ORDER_URL.base}/list`,
    query: { ...params },
  }),
};

const INVENTORY_ITEM_URL = {
  base: `${CONTEXT_PATH}/inventoryItem`,
  showStockCard: (id, params = {}) => stringifyUrl({
    url: `${INVENTORY_ITEM_URL.base}/showStockCard/${id}`,
    query: { ...params },
  }),
  showTransactionLog: (id, params = {}) => stringifyUrl({
    url: `${INVENTORY_ITEM_URL.base}/showTransactionLog/${id}`,
    query: { ...params },
  }),
};

const INVENTORY_LEVEL_URL = {
  base: `${CONTEXT_PATH}/inventoryLevel`,
  list: (params = {}) => stringifyUrl({
    url: `${INVENTORY_LEVEL_URL.base}/list`,
    query: { ...params },
  }),
  create: (params = {}) => stringifyUrl({
    url: `${INVENTORY_LEVEL_URL.base}/create`,
    query: { ...params },
  }),
  show: (id) => `${INVENTORY_LEVEL_URL.base}/show/${id}`,
  edit: (id) => `${INVENTORY_LEVEL_URL.base}/edit/${id}`,
};

const INVENTORY_BROWSER_URL = {
  base: `${CONTEXT_PATH}/inventoryBrowser`,
  list: () => `${INVENTORY_BROWSER_URL.base}/list`,
};

const INVENTORY_SNAPSHOT_URL = {
  base: `${CONTEXT_PATH}/inventorySnapshot`,
  list: () => `${INVENTORY_SNAPSHOT_URL.base}/list`,
  show: (id) => `${INVENTORY_SNAPSHOT_URL.base}/show/${id}`,
  edit: (id) => `${INVENTORY_SNAPSHOT_URL.base}/edit/${id}`,
  download: () => `${INVENTORY_SNAPSHOT_URL.base}/download`,
};

const INVENTORY_URL = {
  base: `${CONTEXT_PATH}/inventory`,
  showTransaction: (id) => `${INVENTORY_URL.base}/showTransaction/${id}`,
  browse: () => `${INVENTORY_URL.base}/browse`,
  list: () => `${INVENTORY_URL.base}/list`,
  listTransactions: () => `${INVENTORY_URL.base}/listTransactions`,
  editTransaction: (id) => `${INVENTORY_URL.base}/editTransaction/${id}`,
  listLowStock: () => `${INVENTORY_URL.base}/listLowStock`,
  listReorderStock: () => `${INVENTORY_URL.base}/listReorderStock`,
  listDailyTransactions: () => `${INVENTORY_URL.base}/listDailyTransactions`,
  listExpiredStock: () => `${INVENTORY_URL.base}/listExpiredStock`,
  listExpiringStock: () => `${INVENTORY_URL.base}/listExpiringStock`,
  deleteTransaction: (id) => `${INVENTORY_URL.base}/deleteTransaction/${id}`,
  manage: () => `${INVENTORY_URL.base}/manage`,
  editBinLocation: () => `${INVENTORY_URL.base}/editBinLocation`,
  showProducts: () => `${INVENTORY_URL.base}/showProducts`,
  createDefaultInventoryItems: () => `${INVENTORY_URL.base}/createDefaultInventoryItems`,
  upload: () => `${INVENTORY_URL.base}/upload`,
};

const SHIPMENT_URL = {
  base: `${CONTEXT_PATH}/shipment`,
  showDetails: (id) => `${SHIPMENT_URL.base}/showDetails/${id}`,
  addComment: (id) => `${SHIPMENT_URL.base}/addComment/${id}`,
  saveComment: () => `${SHIPMENT_URL.base}/saveComment`,
  addDocument: (id) => `${SHIPMENT_URL.base}/addDocument/${id}`,
  deleteShipment: (id) => `${SHIPMENT_URL.base}/deleteShipment/${id}`,
  editEvent: (id, params = {}) => stringifyUrl({
    url: `${SHIPMENT_URL.base}/editEvent/${id}`,
    query: { ...params },
  }),
  saveEvent: () => `${SHIPMENT_URL.base}/saveEvent`,
  deleteEvent: (id, params = {}) => stringifyUrl({
    url: `${SHIPMENT_URL.base}/deleteEvent/${id}`,
    query: { ...params },
  }),
  addToShipmentPost: () => `${SHIPMENT_URL.base}/addToShipmentPost`,
  list: (params = {}) => stringifyUrl({
    url: `${SHIPMENT_URL.base}/list`,
    query: { ...params },
  }),
  showDetailsOverride: (id) => `${SHIPMENT_URL.base}/showDetails/${id}?override=true`,
  sendShipment: (id) => `${SHIPMENT_URL.base}/sendShipment/${id}`,
  receiveShipment: (id) => `${SHIPMENT_URL.base}/receiveShipment/${id}`,
  showPackingList: (id) => `${SHIPMENT_URL.base}/showPackingList/${id}`,
  editDetails: (id) => `${SHIPMENT_URL.base}/editDetails/${id}`,
  editContents: (id) => `${SHIPMENT_URL.base}/editContents/${id}`,
  deleteDocument: (shipmentId, documentId) => `${SHIPMENT_URL.base}/deleteDocument/${documentId}?shipmentId=${shipmentId}`,
  downloadDocument: (shipmentId, documentId) => `${SHIPMENT_URL.base}/downloadDocument/${documentId}?shipmentId=${shipmentId}`,
  deleteComment: (shipmentId, commentId) => `${SHIPMENT_URL.base}/deleteComment/${commentId}?shipmentId=${shipmentId}`,
  rollbackLastEvent: (id) => `${SHIPMENT_URL.base}/rollbackLastEvent/${id}`,
  refreshCurrentStatus: (id) => `${SHIPMENT_URL.base}/refreshCurrentStatus/${id}`,
  showTransactions: (id) => `${SHIPMENT_URL.base}/showTransactions/${id}`,
  showTracking: (id) => `${SHIPMENT_URL.base}/showTracking/${id}`,
  syncTransactions: (id) => `${SHIPMENT_URL.base}/syncTransactions/${id}`,
  validateReceipt: (receiptId) => `${SHIPMENT_URL.base}/validateReceipt/${receiptId}`,
  exportPackingList: (id) => `${SHIPMENT_URL.base}/exportPackingList/${id}`,
  downloadPackingList: (id) => `${SHIPMENT_URL.base}/downloadPackingList/${id}`,
  downloadLabels: (id) => `${SHIPMENT_URL.base}/downloadLabels/${id}`,
  bulkAction: (action) => `${SHIPMENT_URL.base}/${action}`,
};

const SHIPMENT_ITEM_URL = {
  base: `${CONTEXT_PATH}/shipmentItem`,
  list: () => `${SHIPMENT_ITEM_URL.base}/list`,
  create: () => `${SHIPMENT_ITEM_URL.base}/create`,
  edit: (id) => `${SHIPMENT_ITEM_URL.base}/edit/${id}`,
  show: (id) => `${SHIPMENT_ITEM_URL.base}/show/${id}`,
  pick: (id) => `${SHIPMENT_ITEM_URL.base}/pick/${id}`,
};

const REQUISITION_TEMPLATE_URL = {
  base: `${CONTEXT_PATH}/requisitionTemplate`,
  create: () => `${REQUISITION_TEMPLATE_URL.base}/create`,
  show: (id) => `${REQUISITION_TEMPLATE_URL.base}/show/${id}`,
  edit: (id) => `${REQUISITION_TEMPLATE_URL.base}/edit/${id}`,
  batch: (id) => `${REQUISITION_TEMPLATE_URL.base}/batch/${id}`,
  editHeader: (id) => `${REQUISITION_TEMPLATE_URL.base}/editHeader/${id}`,
  list: () => `${REQUISITION_TEMPLATE_URL.base}/list`,
  export: (id) => `${REQUISITION_TEMPLATE_URL.base}/export/${id}`,
  publish: (id) => `${REQUISITION_TEMPLATE_URL.base}/publish/${id}`,
  unpublish: (id) => `${REQUISITION_TEMPLATE_URL.base}/unpublish/${id}`,
  sendMail: (id) => `${REQUISITION_TEMPLATE_URL.base}/sendMail/${id}`,
};

const REQUISITION_URL = {
  base: `${CONTEXT_PATH}/requisition`,
  list: () => `${REQUISITION_URL.base}/list`,
  chooseTemplate: () => `${REQUISITION_URL.base}/chooseTemplate`,
  create: (type) => `${REQUISITION_URL.base}/create${type ? `?type=${type}` : ''}`,
  createStockFromTemplate: (id) => `${REQUISITION_URL.base}/createStockFromTemplate/${id}`,
  edit: (id) => `${REQUISITION_URL.base}/edit/${id}`,
  review: (id) => `${REQUISITION_URL.base}/review/${id}`,
  pick: (id) => `${REQUISITION_URL.base}/pick/${id}`,
  confirm: (id) => `${REQUISITION_URL.base}/confirm/${id}`,
  transfer: (id) => `${REQUISITION_URL.base}/transfer/${id}`,
  show: (id) => `${REQUISITION_URL.base}/show/${id}`,
  saveRequisitionItems: () => `${REQUISITION_URL.base}/saveRequisitionItems`,
  editHeader: (id) => `${REQUISITION_URL.base}/editHeader/${id}`,
  printDraft: (id) => `${REQUISITION_URL.base}/printDraft/${id}`,
  process: (id) => `${REQUISITION_URL.base}/process/${id}`,
  picked: (id) => `${REQUISITION_URL.base}/picked/${id}`,
  exportRequisitions: () => `${REQUISITION_URL.base}/exportRequisitions`,
  exportRequisitionItems: () => `${REQUISITION_URL.base}/exportRequisitionItems`,
};

const REQUISITION_ITEM_URL = {
  base: `${CONTEXT_PATH}/requisitionItem`,
  list: () => `${REQUISITION_ITEM_URL.base}/list`,
  edit: (id) => `${REQUISITION_ITEM_URL.base}/edit/${id}`,
  change: (id) => `${REQUISITION_ITEM_URL.base}/change/${id}`,
  export: (queryString) => `${REQUISITION_ITEM_URL.base}/export${queryString ? `?${queryString}` : ''}`,
};

const STOCKLIST_URL = {
  base: `${CONTEXT_PATH}/stocklist`,
  pdf: (id) => `${STOCKLIST_URL.base}/renderPdf/${id}`,
  csv: (id) => `${STOCKLIST_URL.base}/generateCsv/${id}`,
  html: (id) => `${STOCKLIST_URL.base}/renderHtml/${id}`,
};

const REPLENISHMENT_URL = {
  base: `${CONTEXT_PATH}/replenishment`,
  create: () => `${REPLENISHMENT_URL.base}/create`,
  edit: (id) => `${REPLENISHMENT_URL.create()}/${id}`,
  print: (id) => `${REPLENISHMENT_URL.base}/print/${id}`,
};

const CATEGORY_URL = {
  base: `${CONTEXT_PATH}/category`,
  tree: (id) => (id ? `${CATEGORY_URL.base}/tree?id=${id}` : `${CATEGORY_URL.base}/tree`),
  create: () => `${CATEGORY_URL.base}/create`,
  edit: (id) => `${CATEGORY_URL.base}/edit/${id}`,
};

const ATTRIBUTE_URL = {
  base: `${CONTEXT_PATH}/attribute`,
  list: () => `${ATTRIBUTE_URL.base}/list`,
  create: () => `${ATTRIBUTE_URL.base}/create`,
  edit: (id) => `${ATTRIBUTE_URL.base}/edit/${id}`,
  show: (id) => `${ATTRIBUTE_URL.base}/show/${id}`,
};

const PRODUCT_GROUP_URL = {
  base: `${CONTEXT_PATH}/productGroup`,
  list: () => `${PRODUCT_GROUP_URL.base}/list`,
  create: () => `${PRODUCT_GROUP_URL.base}/create`,
  edit: (id) => `${PRODUCT_GROUP_URL.base}/edit/${id}`,
  show: (id) => `${PRODUCT_GROUP_URL.base}/show/${id}`,
};

const PRODUCT_COMPONENT_URL = {
  base: `${CONTEXT_PATH}/productComponent`,
  index: () => `${PRODUCT_COMPONENT_URL.base}/index`,
  create: () => `${PRODUCT_COMPONENT_URL.base}/create`,
};

const PRODUCT_ASSOCIATION_URL = {
  base: `${CONTEXT_PATH}/productAssociation`,
  list: () => `${PRODUCT_ASSOCIATION_URL.base}/list`,
  create: () => `${PRODUCT_ASSOCIATION_URL.base}/create`,
  edit: (id) => `${PRODUCT_ASSOCIATION_URL.base}/edit/${id}`,
  show: (id) => `${PRODUCT_ASSOCIATION_URL.base}/show/${id}`,
  export: () => `${CONTEXT_PATH}/batch/downloadExcel?type=ProductAssociation`,
  import: () => `${CONTEXT_PATH}/batch/importData?type=productAssociation`,
};

const PRODUCT_CATALOG_URL = {
  base: `${CONTEXT_PATH}/productCatalog`,
  list: () => `${PRODUCT_CATALOG_URL.base}/list`,
  create: () => `${PRODUCT_CATALOG_URL.base}/create`,
  edit: (id) => `${PRODUCT_CATALOG_URL.base}/edit/${id}`,
  show: (id) => `${PRODUCT_CATALOG_URL.base}/show/${id}`,
  export: (id) => `${PRODUCT_CATALOG_URL.base}/exportProductCatalog/${id}`,
};

const PRODUCT_SUPPLIER_URL = {
  base: `${CONTEXT_PATH}/productSupplier`,
  list: () => `${PRODUCT_SUPPLIER_URL.base}/list`,
  create: () => `${PRODUCT_SUPPLIER_URL.base}/create`,
  edit: (id) => `${PRODUCT_SUPPLIER_URL.base}/create/${id}`,
  export: () => `${PRODUCT_SUPPLIER_URL.base}/export?format=xls`,
};

const BUDGET_CODE_URL = {
  base: `${CONTEXT_PATH}/budgetCode`,
  list: () => `${BUDGET_CODE_URL.base}/list`,
  create: () => `${BUDGET_CODE_URL.base}/create`,
  edit: (id) => `${BUDGET_CODE_URL.base}/edit/${id}`,
};

const EVENT_TYPE_URL = {
  base: `${CONTEXT_PATH}/eventType`,
  list: () => `${EVENT_TYPE_URL.base}/list`,
  create: () => `${EVENT_TYPE_URL.base}/create`,
  edit: (id) => `${EVENT_TYPE_URL.base}/edit/${id}`,
  show: (id) => `${EVENT_TYPE_URL.base}/show/${id}`,
};

const GL_ACCOUNT_URL = {
  base: `${CONTEXT_PATH}/glAccount`,
  list: () => `${GL_ACCOUNT_URL.base}/list`,
  create: () => `${GL_ACCOUNT_URL.base}/create`,
  edit: (id) => `${GL_ACCOUNT_URL.base}/edit/${id}`,
};

const PAYMENT_TERM_URL = {
  base: `${CONTEXT_PATH}/paymentTerm`,
  list: () => `${PAYMENT_TERM_URL.base}/list`,
  create: () => `${PAYMENT_TERM_URL.base}/create`,
  edit: (id) => `${PAYMENT_TERM_URL.base}/edit/${id}`,
};

const PREFERENCE_TYPE_URL = {
  base: `${CONTEXT_PATH}/preferenceType`,
  list: () => `${PREFERENCE_TYPE_URL.base}/list`,
  create: () => `${PREFERENCE_TYPE_URL.base}/create`,
  edit: (id) => `${PREFERENCE_TYPE_URL.base}/edit/${id}`,
};

const PARTY_URL = {
  base: `${CONTEXT_PATH}/party`,
  list: () => `${PARTY_URL.base}/list`,
  create: () => `${PARTY_URL.base}/create`,
  edit: (id) => `${PARTY_URL.base}/edit/${id}`,
  show: (id) => `${PARTY_URL.base}/show/${id}`,
};

const PARTY_ROLE_URL = {
  base: `${CONTEXT_PATH}/partyRole`,
  list: () => `${PARTY_ROLE_URL.base}/list`,
  create: (partyId) => (partyId
    ? `${PARTY_ROLE_URL.base}/create?party.id=${partyId}`
    : `${PARTY_ROLE_URL.base}/create`),
  edit: (id) => `${PARTY_ROLE_URL.base}/edit/${id}`,
  show: (id) => `${PARTY_ROLE_URL.base}/show/${id}`,
};

const LOCATION_GROUP_URL = {
  base: `${CONTEXT_PATH}/locationGroup`,
  list: () => `${LOCATION_GROUP_URL.base}/list`,
  create: () => `${LOCATION_GROUP_URL.base}/create`,
  edit: (id) => `${LOCATION_GROUP_URL.base}/edit/${id}`,
  show: (id) => `${LOCATION_GROUP_URL.base}/show/${id}`,
};

const LOCATION_TYPE_URL = {
  base: `${CONTEXT_PATH}/locationType`,
  list: () => `${LOCATION_TYPE_URL.base}/list`,
  create: () => `${LOCATION_TYPE_URL.base}/create`,
  edit: (id) => `${LOCATION_TYPE_URL.base}/edit/${id}`,
  show: (id) => `${LOCATION_TYPE_URL.base}/show/${id}`,
};

const ORGANIZATION_URL = {
  base: `${CONTEXT_PATH}/organization`,
  list: () => `${ORGANIZATION_URL.base}/list`,
  create: () => `${ORGANIZATION_URL.base}/create`,
  edit: (id) => `${ORGANIZATION_URL.base}/edit/${id}`,
  show: (id) => `${ORGANIZATION_URL.base}/show/${id}`,
  download: () => `${ORGANIZATION_URL.base}/download`,
};

const PARTY_TYPE_URL = {
  base: `${CONTEXT_PATH}/partyType`,
  list: () => `${PARTY_TYPE_URL.base}/list`,
  create: () => `${PARTY_TYPE_URL.base}/create`,
  edit: (id) => `${PARTY_TYPE_URL.base}/edit/${id}`,
  show: (id) => `${PARTY_TYPE_URL.base}/show/${id}`,
};

const PERSON_URL = {
  base: `${CONTEXT_PATH}/person`,
  list: () => `${PERSON_URL.base}/list`,
  create: () => `${PERSON_URL.base}/create`,
  edit: (id) => `${PERSON_URL.base}/edit/${id}`,
  show: (id) => `${PERSON_URL.base}/show/${id}`,
  convertPersonToUser: (id) => `${PERSON_URL.base}/convertPersonToUser/${id}`,
  convertUserToPerson: (id) => `${PERSON_URL.base}/convertUserToPerson/${id}`,
};

const ROLE_URL = {
  base: `${CONTEXT_PATH}/role`,
  index: () => `${ROLE_URL.base}/index`,
  create: () => `${ROLE_URL.base}/create`,
  show: (id) => `${ROLE_URL.base}/show/${id}`,
  edit: (id) => `${ROLE_URL.base}/edit/${id}`,
};

const USER_URL = {
  base: `${CONTEXT_PATH}/user`,
  list: () => `${USER_URL.base}/list`,
  create: () => `${USER_URL.base}/create`,
  show: (id) => `${USER_URL.base}/show/${id}`,
  edit: (id) => `${USER_URL.base}/edit/${id}`,
  changePhoto: (id) => `${USER_URL.base}/changePhoto/${id}`,
  cropPhoto: (id) => `${USER_URL.base}/cropPhoto/${id}`,
  viewThumb: (id) => `${USER_URL.base}/viewThumb/${id}`,
  viewPhoto: (id) => `${USER_URL.base}/viewPhoto/${id}`,
  impersonate: (id) => `${USER_URL.base}/impersonate/${id}`,
};

const GL_ACCOUNT_TYPE_URL = {
  base: `${CONTEXT_PATH}/glAccountType`,
  list: () => `${GL_ACCOUNT_TYPE_URL.base}/list`,
  create: () => `${GL_ACCOUNT_TYPE_URL.base}/create`,
  edit: (id) => `${GL_ACCOUNT_TYPE_URL.base}/edit/${id}`,
};

const CYCLE_COUNT = {
  base: `${CONTEXT_PATH}/inventory/cycleCount`,
  list: (tab) => `${CYCLE_COUNT.base}?tab=${tab}`,
  countStep: () => `${CYCLE_COUNT.base}/count`,
  resolveStep: () => `${CYCLE_COUNT.base}/resolve`,
};

const RECEIPT_URL = {
  base: `${CONTEXT_PATH}/receipt`,
  show: (id) => `${RECEIPT_URL.base}/show/${id}`,
};

const TRANSACTION_ENTRY_URL = {
  base: `${CONTEXT_PATH}/transactionEntry`,
  edit: (id) => `${TRANSACTION_ENTRY_URL.base}/edit/${id}`,
};

const ADMIN_URL = {
  base: `${CONTEXT_PATH}/admin`,
  showSettings: () => `${ADMIN_URL.base}/showSettings`,
  showUpgrade: () => `${ADMIN_URL.base}/showUpgrade`,
  showDatabaseStatus: () => `${ADMIN_URL.base}/showDatabaseStatus`,
  showDatabaseProcessList: () => `${ADMIN_URL.base}/showDatabaseProcessList`,
  status: () => `${ADMIN_URL.base}/status`,
};

const BATCH_URL = {
  base: `${CONTEXT_PATH}/batch`,
  importData: () => `${BATCH_URL.base}/importData`,
  downloadTemplate: (template) => `${BATCH_URL.base}/downloadTemplate?template=${template}`,
  downloadExcel: (type) => `${BATCH_URL.base}/downloadExcel?type=${type}`,
};

const DATA_EXPORT_URL = {
  base: `${CONTEXT_PATH}/dataExport`,
  index: () => `${DATA_EXPORT_URL.base}/index`,
  render: (id, format) => `${DATA_EXPORT_URL.base}/render/${id}?format=${format}`,
};

const JOBS_URL = {
  base: `${CONTEXT_PATH}/jobs`,
  show: (id) => `${JOBS_URL.base}/show/${id}`,
};

const LOCALIZATION_URL = {
  base: `${CONTEXT_PATH}/localization`,
  list: () => `${LOCALIZATION_URL.base}/list`,
  create: () => `${LOCALIZATION_URL.base}/create`,
  show: (id) => `${LOCALIZATION_URL.base}/show/${id}`,
  edit: (id) => `${LOCALIZATION_URL.base}/edit/${id}`,
  export: (locale) => `${LOCALIZATION_URL.base}/export${locale ? `?locale=${locale}` : ''}`,
};

const MIGRATION_URL = {
  base: `${CONTEXT_PATH}/migration`,
  dataMigration: () => `${MIGRATION_URL.base}/dataMigration`,
  dataQuality: () => `${MIGRATION_URL.base}/dataQuality`,
  dimensionTables: () => `${MIGRATION_URL.base}/dimensionTables`,
  migrateOrganizations: (preview) => `${MIGRATION_URL.base}/migrateOrganizations${preview ? '?preview=true' : ''}`,
  deleteOrganizations: () => `${MIGRATION_URL.base}/deleteOrganizations`,
  migrateProductSuppliers: (preview) => `${MIGRATION_URL.base}/migrateProductSuppliers${preview ? '?preview=true' : ''}`,
  deleteProductSuppliers: () => `${MIGRATION_URL.base}/deleteProductSuppliers`,
  nextInventoryTransaction: () => `${MIGRATION_URL.base}/nextInventoryTransaction`,
  locationsWithInventoryTransactions: () => `${MIGRATION_URL.base}/locationsWithInventoryTransactions`,
  locationsWithProductInventoryTransactions: () => `${MIGRATION_URL.base}/locationsWithProductInventoryTransactions`,
  downloadCurrentInventory: () => `${MIGRATION_URL.base}/downloadCurrentInventory?format=csv`,
  migrateInventoryTransactions: () => `${MIGRATION_URL.base}/migrateInventoryTransactions`,
  migrateAllInventoryTransactions: () => `${MIGRATION_URL.base}/migrateAllInventoryTransactions`,
  migrateProductInventoryTransactions: () => `${MIGRATION_URL.base}/migrateProductInventoryTransactions`,
  createMissingInventoryImportTransactionSources: () => `${MIGRATION_URL.base}/createMissingInventoryImportTransactionSourcesForCurrentLocation`,
  createMissingCycleCountTransactionSources: () => `${MIGRATION_URL.base}/createMissingCycleCountTransactionSourcesForCurrentLocation`,
  createMissingRecordStockTransactionSources: () => `${MIGRATION_URL.base}/createMissingRecordStockTransactionSourcesForCurrentLocation`,
};

const REPORT_URL = {
  base: `${CONTEXT_PATH}/report`,
  truncateDimensions: () => `${REPORT_URL.base}/truncateDimensions`,
  buildDimensions: () => `${REPORT_URL.base}/buildDimensions`,
};

const QUARTZ_URL = {
  base: `${CONTEXT_PATH}/quartz`,
  list: () => `${QUARTZ_URL.base}/list`,
};

export {
  ADMIN_URL,
  ATTRIBUTE_URL,
  BATCH_URL,
  BUDGET_CODE_URL,
  CATEGORY_URL,
  CYCLE_COUNT,
  DASHBOARD_URL,
  DATA_EXPORT_URL,
  DOCUMENT_URL,
  EVENT_TYPE_URL,
  GL_ACCOUNT_TYPE_URL,
  GL_ACCOUNT_URL,
  INVENTORY_BROWSER_URL,
  INVENTORY_ITEM_URL,
  INVENTORY_LEVEL_URL,
  INVENTORY_SNAPSHOT_URL,
  INVENTORY_URL,
  INVOICE_URL,
  JOBS_URL,
  LOCALIZATION_URL,
  LOCATION_CONFIGURATION_URL,
  LOCATION_GROUP_URL,
  LOCATION_TYPE_URL,
  LOCATION_URL,
  MIGRATION_URL,
  ORDER_ADJUSTMENT_TYPE_URL,
  ORDER_URL,
  ORGANIZATION_URL,
  PARTY_ROLE_URL,
  PARTY_TYPE_URL,
  PARTY_URL,
  PAYMENT_TERM_URL,
  PERSON_URL,
  PREFERENCE_TYPE_URL,
  PRODUCT_ASSOCIATION_URL,
  PRODUCT_CATALOG_URL,
  PRODUCT_COMPONENT_URL,
  PRODUCT_CONFIGURATION_URL,
  PRODUCT_GROUP_URL,
  PRODUCT_SUPPLIER_URL,
  PRODUCT_URL,
  PURCHASE_ORDER_URL,
  PUTAWAY_URL,
  QUARTZ_URL,
  RECEIPT_URL,
  REPLENISHMENT_URL,
  REPORT_URL,
  REQUISITION_ITEM_URL,
  REQUISITION_TEMPLATE_URL,
  REQUISITION_URL,
  ROLE_URL,
  SHIPMENT_ITEM_URL,
  SHIPMENT_URL,
  STOCK_MOVEMENT_URL,
  STOCK_TRANSFER_URL,
  STOCKLIST_URL,
  SUPPLIER_URL,
  TRANSACTION_ENTRY_URL,
  USER_URL,
};
