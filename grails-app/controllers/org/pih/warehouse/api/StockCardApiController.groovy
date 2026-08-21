package org.pih.warehouse.api

import grails.converters.JSON
import grails.core.GrailsApplication
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import groovy.time.TimeCategory
import org.pih.warehouse.DateUtil
import org.pih.warehouse.core.ActivityCode
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.User
import org.pih.warehouse.core.ValidationCode
import org.pih.warehouse.inventory.Inventory
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.InventoryLevel
import org.pih.warehouse.inventory.InventorySnapshot
import org.pih.warehouse.inventory.InventoryStatus
import org.pih.warehouse.inventory.LotStatusCode
import org.pih.warehouse.inventory.RecordInventoryCommand
import org.pih.warehouse.inventory.StockCardCommand
import org.pih.warehouse.inventory.StockHistoryAssembler
import org.pih.warehouse.inventory.StockHistoryPageModel
import org.pih.warehouse.inventory.StockHistoryResult
import org.pih.warehouse.inventory.StockHistoryRowDto
import org.pih.warehouse.inventory.Transaction
import org.pih.warehouse.inventory.TransferStockCommand
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.order.OrderItemStatusCode
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductException
import org.pih.warehouse.requisition.RequisitionItem
import org.pih.warehouse.shipping.Container
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentItem
import org.pih.warehouse.shipping.ShipmentItemException

import java.text.DateFormat
import java.text.SimpleDateFormat

class StockCardApiController {

    def inventoryService
    def locationService
    def shipmentService
    def requisitionService
    def orderService
    def forecastingService
    def userService
    def inventoryItemDataService
    def productAvailabilityService
    def localizationService
    def messageSource
    GrailsApplication grailsApplication
    StockHistoryAssembler stockHistoryAssembler

    def details() {
        Location location = Location.get(session?.warehouse?.id)
        User user = User.get(session?.user?.id)
        StockCardCommand cmd = new StockCardCommand()
        cmd.warehouse = location
        try {
            inventoryService.getStockCardCommand(cmd, params)
        } catch (ProductException e) {
            response.status = 404
            render([errorMessage: e.message] as JSON)
            return
        }

        Product product = cmd.product
        InventoryLevel inventoryLevel = InventoryLevel.findByProductAndInventory(product, cmd.inventory)
        Date latestInventoryDate = product.latestInventoryDate(location.id)

        render([
                product                        : [
                        id            : product.id,
                        productCode   : product.productCode,
                        name          : product.name,
                        displayName   : product.displayNameOrDefaultName,
                        active        : product.active,
                        lotAndExpiryControl: product.lotAndExpiryControl,
                        unitOfMeasure : product.unitOfMeasure,
                        description   : product.description,
                        pricePerUnit  : userService.hasRoleFinance(user) ? product.pricePerUnit : null,
                        category      : product.category ? [id: product.category.id, name: product.category.name] : null,
                        categories    : product.categories?.collect { [id: it.id, name: it.name] } ?: [],
                        productFamily : product.productFamily ? [id: product.productFamily.id, name: product.productFamily.name] : null,
                        glAccountCode : product.glAccount?.code,
                        abcClass      : inventoryLevel?.abcClass ?: product.abcClass,
                        createdBy     : product.createdBy?.name,
                        updatedBy     : product.updatedBy?.name,
                        dateCreated   : product.dateCreated,
                        lastUpdated   : product.lastUpdated,
                        productCatalogs: product.productCatalogs?.collect { [id: it.id, name: it.name] } ?: [],
                        tags          : product.tags?.collect { [id: it.id, tag: it.tag] } ?: [],
                        attributes    : product.attributes?.findAll { !it.productSupplier }?.collect {
                            [name: it.attribute?.name, value: it.value, unitOfMeasure: it.attribute?.unitOfMeasureClass?.baseUom?.name]
                        } ?: [],
                        uoms          : product.uoms?.collect { [uom: it.uom?.code, quantity: it.quantity] } ?: [],
                        hasDocuments  : !product.documents?.isEmpty(),
                ],
                inventoryLevel                 : toInventoryLevelMap(inventoryLevel),
                inventoryStatus                : cmd.inventoryLevel?.status?.name(),
                totalQuantity                  : cmd.totalQuantity ?: 0,
                totalQuantityAvailableToPromise: cmd.totalQuantityAvailableToPromise ?: 0,
                latestInventoryDate            : latestInventoryDate,
                forecastingEnabled             : grailsApplication.config.openboxes.forecasting.enabled ?: false,
                mergeProductsEnabled           : grailsApplication.config.openboxes.products.merge.enabled ?: false,
                currencyCode                   : grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                warehouse                      : [
                        id  : location.id,
                        name: location.name,
                ],
                permissions                    : [
                        isSuperuser          : userService.isSuperuser(user),
                        isUserAdmin          : userService.isUserAdmin(user),
                        isUserManager        : userService.isUserManager(user),
                        hasRoleFinance       : userService.hasRoleFinance(user),
                        hasRoleProductManager: userService.hasRoleProductManager(user),
                        canAdjustInventory   : location.supports(ActivityCode.ADJUST_INVENTORY),
                ],
        ] as JSON)
    }

    def currentStock() {
        StockCardCommand cmd = new StockCardCommand()
        cmd.warehouse = Location.get(session?.warehouse?.id)
        StockCardCommand commandInstance = inventoryService.getStockCardCommand(cmd, params)

        render([
                availableItems                 : commandInstance.availableItems?.collect { entry ->
                    [
                            inventoryItem    : toInventoryItemMap(entry.inventoryItem),
                            binLocation      : toBinLocationMap(entry.binLocation),
                            quantityOnHand   : entry.quantityOnHand,
                            quantityAvailable: entry.quantityAvailable,
                            status           : entry.status?.name(),
                            recalled         : entry.recalled,
                            onHold           : entry.onHold,
                    ]
                } ?: [],
                totalQuantity                  : commandInstance.totalQuantity ?: 0,
                totalQuantityAvailableToPromise: commandInstance.totalQuantityAvailableToPromise ?: 0,
        ] as JSON)
    }

    def stockHistory() {
        StockCardCommand cmd = new StockCardCommand()
        cmd.warehouse = Location.get(session?.warehouse?.id)

        StockHistoryPageModel pageModel = stockHistoryAssembler.assembleStockHistoryPage(cmd, params)
        StockHistoryResult stockHistory = pageModel.stockHistory

        Map groupedList = [:]
        pageModel.groupedStockHistoryList.each { year, months ->
            Map monthsMap = [:]
            months.each { month, entries ->
                monthsMap[month] = entries.collect { StockHistoryRowDto entry ->
                    def shipment = entry.transaction?.incomingShipment ?: entry.transaction?.outgoingShipment
                    def shipmentDto = shipment ? pageModel.displayContext.shipmentDtoById?.get(shipment.id) : null
                    def requisitionDto = pageModel.displayContext.requisitionDtoById?.get(entry.requisitionId)
                    def orderDto = pageModel.displayContext.orderDtoById?.get(entry.orderId)
                    [
                            transaction           : entry.transaction ? [
                                    id               : entry.transaction.id,
                                    transactionDate  : entry.transaction.transactionDate,
                                    transactionNumber: entry.transaction.transactionNumber,
                                    comment          : entry.transaction.comment,
                                    dateCreated      : entry.transaction.dateCreated,
                                    createdBy        : entry.transaction.createdBy?.name,
                                    transactionType  : [
                                            name           : entry.transaction.transactionType?.name,
                                            transactionCode: entry.transaction.transactionType?.transactionCode?.name(),
                                            isAdjustment   : entry.transaction.transactionType?.isAdjustment(),
                                    ],
                                    source           : entry.transaction.source?.name,
                                    destination      : entry.transaction.destination?.name,
                            ] : null,
                            localTransferInfo     : entry.localTransferInfo ? [
                                    sourceTransactionId       : entry.localTransferInfo.sourceTransactionId,
                                    sourceTransactionType     : entry.localTransferInfo.sourceTransactionType?.name,
                                    destinationTransactionId  : entry.localTransferInfo.destinationTransactionId,
                                    destinationTransactionType: entry.localTransferInfo.destinationTransactionType?.name,
                            ] : null,
                            reference             : buildStockHistoryReference(shipment, shipmentDto, requisitionDto, orderDto),
                            comments              : entry.comments,
                            binLocation           : toBinLocationMap(entry.binLocation),
                            destinationBinLocation: toBinLocationMap(entry.destinationBinLocation),
                            inventoryItem         : toInventoryItemMap(entry.inventoryItem),
                            transactionCode       : entry.transactionCode?.name(),
                            quantity              : entry.quantity,
                            balance               : entry.balance,
                            isDebit               : entry.isDebit,
                            isCredit              : entry.isCredit,
                            isInternal            : entry.isInternal,
                            isBaseline            : entry.isBaseline,
                            isSameTransaction     : entry.isSameTransaction,
                            showDetails           : entry.showDetails,
                    ]
                }
            }
            groupedList[year] = monthsMap
        }

        render([
                productId       : pageModel.commandInstance.product.id,
                stockHistoryList: groupedList,
                totalBalance    : stockHistory.totalBalance,
                totalCount      : stockHistory.totalCount,
                totalCredit     : stockHistory.totalCredit,
                totalDebit      : stockHistory.totalDebit,
        ] as JSON)
    }

    private static Map buildStockHistoryReference(shipment, shipmentDto, requisitionDto, orderDto) {
        if (shipmentDto?.isFromPurchaseOrder) {
            return [
                    type          : 'PURCHASE_ORDER',
                    id            : shipment?.id,
                    label         : shipmentDto.purchaseOrderTypeCode?.name(),
                    number        : shipment?.shipmentNumber,
                    name          : shipment?.name,
            ]
        }
        if (shipmentDto?.isFromReturnOrder) {
            return [
                    type          : 'RETURN_ORDER',
                    id            : shipment?.id,
                    label         : shipmentDto.returnOrderTypeName,
                    orderTypeCode : shipmentDto.returnOrderTypeCode,
                    number        : shipment?.shipmentNumber,
                    name          : shipment?.name,
            ]
        }
        if (requisitionDto) {
            return [
                    type  : 'REQUISITION',
                    id    : requisitionDto.id,
                    number: requisitionDto.requestNumber,
                    name  : requisitionDto.name,
            ]
        }
        if (shipment) {
            return [
                    type  : 'SHIPMENT',
                    id    : shipment.id,
                    number: shipment.shipmentNumber,
                    name  : shipment.name,
            ]
        }
        if (orderDto) {
            return [
                    type           : orderDto.isTransferOrder && !orderDto.isPutawayOrder ? 'STOCK_TRANSFER' : 'ORDER',
                    id             : orderDto.id,
                    label          : orderDto.orderTypeName,
                    orderTypeCode  : orderDto.orderTypeCode,
                    number         : orderDto.orderNumber,
                    name           : orderDto.name,
            ]
        }
        return null
    }

    def allLocations() {
        User currentUser = User.get(session?.user?.id)
        Product product = Product.get(params?.product?.id ?: params.id)
        if (!product) {
            response.status = 404
            render([errorMessage: "Product with identifier '${params?.product?.id ?: params.id}' could not be found"] as JSON)
            return
        }
        boolean hasRoleFinance = userService.hasRoleFinance(currentUser)
        List<Map> quantityMap = inventoryService.getCurrentStockAllLocations(product, currentUser)
        def locationGroups = []
        quantityMap.each { entry ->
            entry.each { key, values ->
                locationGroups << [
                        locationGroup: key,
                        totalQuantity: values.totalQuantity,
                        totalValue   : hasRoleFinance ? values.totalValue : null,
                        locations    : values.locations.collect { locationEntry ->
                            [
                                    location    : [
                                            id          : locationEntry?.location?.id,
                                            name        : locationEntry?.location?.name,
                                            locationType: locationEntry?.location?.locationType?.name,
                                    ],
                                    quantity: locationEntry?.quantity,
                                    value   : hasRoleFinance ? locationEntry?.value : null,
                            ]
                        },
                ]
            }
        }
        render([
                locationGroups: locationGroups,
                hasRoleFinance: hasRoleFinance,
                unitOfMeasure : product.unitOfMeasure,
        ] as JSON)
    }

    def suppliers() {
        Product product = Product.get(params.id)
        Location currentLocation = Location.get(session?.warehouse?.id)
        User user = User.get(session?.user?.id)
        boolean hasRoleFinance = userService.hasRoleFinance(user)

        def productSuppliers = product?.productSuppliers?.findAll { it.active }?.sort() ?: []
        render([
                hasRoleFinance  : hasRoleFinance,
                currencyCode    : grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                productSuppliers: productSuppliers.collect { productSupplier ->
                    def defaultProductPackage = productSupplier.defaultProductPackageDerived
                    def defaultPreference = productSupplier.productSupplierPreferences.find { it.destinationParty == currentLocation.organization }
                    def globalPreference = productSupplier.productSupplierPreferences.find { !it.destinationParty }
                    boolean hidden = defaultPreference?.preferenceType?.validationCode == ValidationCode.HIDE ||
                            (defaultPreference?.preferenceType?.validationCode != ValidationCode.HIDE &&
                                    globalPreference?.preferenceType?.validationCode == ValidationCode.HIDE)
                    [
                            code            : productSupplier.code,
                            name            : productSupplier.name,
                            supplier        : productSupplier.supplier?.name,
                            supplierCode    : productSupplier.supplierCode,
                            manufacturer    : productSupplier.manufacturer?.name,
                            manufacturerCode: productSupplier.manufacturerCode,
                            preferenceType  : defaultPreference?.preferenceType?.name ?: globalPreference?.preferenceType?.name,
                            minOrderQuantity: productSupplier.minOrderQuantity,
                            packageSize     : defaultProductPackage ? productSupplier.packageSize : null,
                            packagePrice    : defaultProductPackage?.productPrice != null && hasRoleFinance ? productSupplier.packagePrice : null,
                            hasPackagePrice : defaultProductPackage?.productPrice != null,
                            eachPrice       : productSupplier.eachPrice,
                            hidden          : hidden,
                    ]
                },
        ] as JSON)
    }

    def associations() {
        Product product = Product.get(params.id)
        Location location = Location.get(session?.warehouse?.id)

        def associations = product?.associations?.sort { it.code }
        def products = product?.associatedProducts() as List
        def quantityAvailableMap = [:]
        if (products && !products.isEmpty()) {
            quantityAvailableMap = productAvailabilityService.getQuantityAvailableToPromiseByProduct(location, products)
        }
        def totalQuantity = quantityAvailableMap.values().sum() ?: 0

        render([
                associations : associations?.collect { association ->
                    def associatedProduct = association.associatedProduct
                    [
                            code             : association.code?.name(),
                            comments         : association.comments,
                            associatedProduct: [
                                    id           : associatedProduct?.id,
                                    productCode  : associatedProduct?.productCode,
                                    name         : associatedProduct?.name,
                                    displayName  : associatedProduct?.displayNameOrDefaultName,
                                    unitOfMeasure: associatedProduct?.unitOfMeasure,
                            ],
                            quantityAvailable: quantityAvailableMap[associatedProduct?.id] ?: 0,
                    ]
                } ?: [],
                totalQuantity: totalQuantity,
                unitOfMeasure: product?.unitOfMeasure,
        ] as JSON)
    }

    def pendingInbound() {
        Product product = Product.get(params.id)
        Location location = Location.get(session?.warehouse?.id)
        def itemsMap = [:]

        def shipmentItems = shipmentService.getPendingInboundShipmentItems(location, product)
        shipmentItems.sort { it.shipment.currentStatus }.groupBy { it.shipment }.collect { k, v ->
            itemsMap.put(k, [
                    quantityRemaining: v.quantityRemaining.sum(),
                    quantityPurchased: 0,
                    shipDate         : k.expectedShippingDate,
                    type             : 'Stock Movement',
            ])
        }
        def orderItems = orderService.getPendingInboundOrderItems(location, product)
        orderItems.findAll { orderItem -> orderItem.orderItemStatusCode != OrderItemStatusCode.CANCELED }.collect {
            def existingItem = itemsMap.find { k, v -> k instanceof OrderItem && k.actualReadyDate == it.actualReadyDate && k.order == it.order }
            if (!existingItem) {
                itemsMap.put(it, [
                        quantityRemaining: 0,
                        quantityPurchased: (it.quantityRemaining * it.quantityPerUom).toInteger(),
                        shipDate         : it.actualReadyDate,
                        type             : 'Purchase Order',
                ])
            } else {
                itemsMap[existingItem.getKey()].quantityPurchased += (it.quantityRemaining * it.quantityPerUom).toInteger()
            }
        }

        def items = itemsMap.collect { item, value ->
            boolean isStockMovement = value.type == 'Stock Movement'
            [
                    type             : value.type,
                    shipmentType     : isStockMovement ? item?.shipmentType?.name : null,
                    id               : isStockMovement ? item?.id : item?.order?.id,
                    number           : isStockMovement ? item?.shipmentNumber : item?.order?.orderNumber,
                    name             : isStockMovement ? item?.name : item?.order?.name,
                    origin           : isStockMovement ? item?.origin?.name : item?.order?.origin?.name,
                    status           : isStockMovement ? item?.currentStatus?.name() : item?.order?.status?.name(),
                    dateOrdered      : isStockMovement ? null : item?.order?.dateOrdered,
                    shipDate         : value.shipDate,
                    quantityPurchased: value.quantityPurchased,
                    quantityRemaining: value.quantityRemaining,
            ]
        }

        render([
                items                 : items,
                totalQuantityPurchased: itemsMap ? itemsMap.values()["quantityPurchased"].sum() : 0,
                totalQuantityRemaining: itemsMap ? itemsMap.values()["quantityRemaining"].sum() : 0,
                unitOfMeasure         : product?.unitOfMeasure,
        ] as JSON)
    }

    def pendingOutbound() {
        Product product = Product.get(params.id)
        Location location = Location.get(session?.warehouse?.id)
        def itemsMap = [:]

        def requisitionItems = requisitionService.getPendingRequisitionItems(location, product)
        requisitionItems.groupBy { it.requisition }.collect { k, v ->
            itemsMap.put(k, [
                    picklistItemsByLot: k?.picklist?.getPicklistItemsByLot(product),
                    quantityRequested : v.quantity.sum(),
                    quantityRequired  : v.sum() { RequisitionItem requisitionItem -> requisitionItem.calculateQuantityRequired() },
                    quantityPicked    : v.sum() { RequisitionItem requisitionItem -> requisitionItem.calculateQuantityPicked() },
            ])
        }

        def items = itemsMap.collect { requisition, value ->
            [
                    id               : requisition?.id,
                    shipmentType     : requisition?.shipment?.shipmentType?.name,
                    dateRequested    : requisition?.dateRequested,
                    status           : requisition?.status?.name(),
                    requestNumber    : requisition?.requestNumber,
                    name             : requisition?.name,
                    destination      : requisition?.destination?.name,
                    quantityRequested: value.quantityRequested,
                    quantityRequired : value.quantityRequired,
                    picklistItemsByLot: value.picklistItemsByLot?.collect { lot, picklistItems ->
                        [lotNumber: lot, quantity: picklistItems.quantity.sum()]
                    } ?: [],
            ]
        }

        render([
                items                 : items,
                totalQuantityRequested: itemsMap ? itemsMap.values()["quantityRequested"].sum() : 0,
                totalQuantityRequired : itemsMap ? itemsMap.values()["quantityRequired"].sum() : 0,
                totalQuantityPicked   : itemsMap ? (itemsMap.values()["picklistItemsByLot"]*.values()["quantity"]?.flatten()?.sum() ?: 0) : 0,
                unitOfMeasure         : product?.unitOfMeasure,
        ] as JSON)
    }

    def demand() {
        use(TimeCategory) {
            DateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy")
            Integer demandPeriod = grailsApplication.config.openboxes.forecasting.demandPeriod ?: 365
            Map defaultStartDateRange = DateUtil.getDateRange(new Date(), 0)
            params.startDate = params.startDate ? dateFormat.parse(params.startDate) : defaultStartDateRange.startDate - demandPeriod.days
            Map defaultEndDateRange = DateUtil.getDateRange(new Date(), -1)
            params.endDate = params.endDate ? dateFormat.parse(params.endDate) : defaultEndDateRange.endDate
        }

        StockCardCommand cmd = new StockCardCommand()
        cmd.warehouse = Location.get(session?.warehouse?.id)
        Location destination = params.destination ? Location.get(params.destination.id) : null
        StockCardCommand commandInstance = inventoryService.getStockCardCommand(cmd, params)

        DateFormat monthFormat = new SimpleDateFormat("MMM yyyy")
        monthFormat.timeZone = TimeZone.default

        def requisitionItemsDemandDetails = forecastingService.getDemandDetails(
                cmd.warehouse,
                destination,
                commandInstance?.product,
                params.startDate,
                params.endDate
        )

        def destinations = forecastingService.getAvailableDestinationsForDemandDetails(
                cmd.warehouse,
                commandInstance?.product,
                params.startDate,
                params.endDate
        )

        requisitionItemsDemandDetails = requisitionItemsDemandDetails.collect {
            [
                    status           : it?.request_status,
                    productCode      : it?.product_code,
                    productName      : it?.product_name,
                    origin           : it?.origin_name,
                    requisitionId    : it?.request_id,
                    requestNumber    : it?.request_number,
                    destination      : it?.destination_name,
                    dateIssued       : it?.date_issued,
                    monthIssued      : it?.date_issued ? monthFormat.format(it?.date_issued) : null,
                    dateRequested    : it?.date_requested,
                    monthRequested   : monthFormat.format(it?.date_requested),
                    quantityRequested: it?.quantity_requested ?: 0,
                    quantityIssued   : it?.quantity_picked ?: 0,
                    quantityDemand   : it?.quantity_demand ?: 0,
                    reasonCode       : it?.reason_code_classification,
            ]
        }

        def monthKeys = (params.startDate..params.endDate).collect {
            monthFormat.format(it)
        }.unique()

        render([
                requisitionItems: requisitionItemsDemandDetails,
                numberOfMonths  : monthKeys?.size() ?: 1,
                monthKeys       : monthKeys,
                startDate       : params.startDate,
                endDate         : params.endDate,
                destinations    : destinations?.collect { [id: it.id, name: it.name] } ?: [],
        ] as JSON)
    }

    def snapshot() {
        Location location = Location.get(session?.warehouse?.id)
        Product product = Product.get(params.id)
        InventoryLevel inventoryLevel = product?.getInventoryLevel(location?.id)
        def inventorySnapshots = InventorySnapshot.findAllByProductAndLocation(product, location)
        render([
                inventoryLevel    : toInventoryLevelMap(inventoryLevel),
                inventorySnapshots: inventorySnapshots.collect {
                    [
                            date          : it.date,
                            quantityOnHand: it.quantityOnHand,
                    ]
                },
        ] as JSON)
    }

    def documents() {
        Product product = Product.get(params.id)
        def documents = product?.documents ?: []
        render([
                documents: documents.findAll { !it.fileUri }.collect {
                    [
                            id          : it.id,
                            filename    : it.filename,
                            documentType: it.documentType?.name,
                            contentType : it.contentType,
                    ]
                },
                links    : documents.findAll { it.fileUri }.collect {
                    [
                            id     : it.id,
                            name   : it.name,
                            fileUri: it.fileUri,
                    ]
                },
        ] as JSON)
    }

    def lotNumbers() {
        Product product = Product.get(params?.product?.id ?: params.id)
        if (!product) {
            response.status = 404
            render([errorMessage: "Product with identifier '${params?.product?.id ?: params.id}' could not be found"] as JSON)
            return
        }
        def inventoryItems = product.inventoryItems ? product.inventoryItems.sort { it.dateCreated } : []
        render([
                product       : [
                        id         : product.id,
                        productCode: product.productCode,
                        name       : product.name,
                        displayName: product.displayNameOrDefaultName,
                ],
                inventoryItems: inventoryItems.collect { InventoryItem inventoryItem ->
                    [
                            id            : inventoryItem.id,
                            lotNumber     : inventoryItem.lotNumber,
                            expirationDate: inventoryItem.expirationDate,
                            lotStatus     : inventoryItem.lotStatus?.name(),
                            recalled      : inventoryItem.lotStatus == LotStatusCode.RECALLED,
                    ]
                },
        ] as JSON)
    }

    def recordInventory(RecordInventoryCommand commandInstance) {
        Location locationInstance = Location.get(session?.warehouse?.id)
        if (!commandInstance.inventory) {
            commandInstance.inventory = locationInstance?.inventory
        }
        inventoryService.populateRecordInventoryCommand(commandInstance, params)

        Product productInstance = commandInstance.product
        def transactionEntryList = inventoryService.getTransactionEntriesByInventoryAndProduct(commandInstance?.inventory, [productInstance])
        commandInstance.totalQuantity = inventoryService.getQuantityByProductMap(transactionEntryList)[productInstance] ?: 0

        render([
                product            : [
                        id                 : productInstance.id,
                        productCode        : productInstance.productCode,
                        name               : productInstance.name,
                        displayName        : productInstance.displayNameOrDefaultName,
                        unitOfMeasure      : productInstance.unitOfMeasure,
                        lotAndExpiryControl: productInstance.lotAndExpiryControl,
                ],
                inventory          : [id: commandInstance.inventory?.id],
                totalQuantity      : commandInstance.totalQuantity,
                transactionDate    : commandInstance.transactionDate,
                recordInventoryRows: commandInstance.recordInventoryRows?.collect { row ->
                    [
                            id            : row?.id,
                            lotNumber     : row?.lotNumber,
                            binLocation   : toBinLocationMap(row?.binLocation ? Location.get(row.binLocation.id) : null),
                            expirationDate: row?.expirationDate,
                            oldQuantity   : row?.oldQuantity,
                            newQuantity   : row?.newQuantity,
                            comment       : row?.comment,
                    ]
                } ?: [],
        ] as JSON)
    }

    def actionContext() {
        Location location = Location.get(session?.warehouse?.id)
        render([
                transactionDestinations: locationService.getTransactionDestinations(location).sort { it?.name?.toLowerCase() }.collect {
                    [id: it.id, name: it.name, locationType: it.locationType?.name]
                },
                transactionSources     : locationService.getTransactionSources(location).sort { it?.name?.toLowerCase() }.collect {
                    [id: it.id, name: it.name, locationType: it.locationType?.name]
                },
                pendingShipments       : shipmentService.getPendingShipments(location).collect { shipment ->
                    [
                            id                  : shipment.id,
                            shipmentNumber      : shipment.shipmentNumber,
                            name                : shipment.name,
                            origin              : shipment.origin?.name,
                            destination         : shipment.destination?.name,
                            expectedShippingDate: shipment.expectedShippingDate,
                            looseItemCount      : shipment.shipmentItems?.findAll { !it.container }?.size() ?: 0,
                            containers          : shipment.containers?.collect { container ->
                                [
                                        id       : container.id,
                                        name     : container.name,
                                        itemCount: shipment.shipmentItems?.findAll { it?.container?.id == container.id }?.size() ?: 0,
                                ]
                            } ?: [],
                    ]
                },
        ] as JSON)
    }

    def binLocations() {
        Location location = Location.get(params?.location?.id ?: session?.warehouse?.id)
        def binLocations = location?.hasBinLocationSupport() ?
                locationService.getBinLocations(location).sort { it?.name?.toLowerCase() } : []
        render([
                hasBinLocationSupport: location?.hasBinLocationSupport() ?: false,
                binLocations         : binLocations.collect { toBinLocationMap(it) },
        ] as JSON)
    }

    def inventoryLevelDetails() {
        Product productInstance = Product.get(params?.product?.id)
        if (!productInstance) {
            response.status = 404
            render([errorMessage: "Product with identifier '${params?.product?.id}' could not be found"] as JSON)
            return
        }
        Inventory inventoryInstance = Inventory.get(params?.inventory?.id)
        if (!inventoryInstance) {
            Location warehouse = Location.get(session?.warehouse?.id)
            inventoryInstance = warehouse.inventory
        }
        InventoryLevel inventoryLevelInstance = InventoryLevel.findByProductAndInventory(productInstance, inventoryInstance)

        render([
                product        : [
                        id         : productInstance.id,
                        productCode: productInstance.productCode,
                        name       : productInstance.name,
                        displayName: productInstance.displayNameOrDefaultName,
                ],
                inventory      : [
                        id  : inventoryInstance?.id,
                        name: inventoryInstance?.warehouse?.name,
                ],
                inventoryLevel : toInventoryLevelMap(inventoryLevelInstance),
                statusOptions  : InventoryStatus.values().collect { it.name() },
        ] as JSON)
    }

    @Transactional
    def updateInventoryLevel() {
        Product productInstance = Product.get(params?.product?.id)
        Inventory inventoryInstance = Inventory.get(params?.inventory?.id)
        InventoryLevel inventoryLevelInstance = InventoryLevel.get(params.id)

        if (inventoryLevelInstance) {
            inventoryLevelInstance.properties = params
        } else {
            inventoryLevelInstance = new InventoryLevel(params)
        }

        Locale locale = localizationService.getCurrentLocale()
        if (!inventoryLevelInstance.hasErrors() && inventoryLevelInstance.save()) {
            String label = messageSource.getMessage('inventoryLevel.label', null, 'Inventory level', locale)
            render([
                    success: true,
                    message: messageSource.getMessage('default.updated.message', [label] as Object[], "${label} updated", locale),
            ] as JSON)
            return
        }

        response.status = 400
        render([
                success      : false,
                errorMessages: inventoryLevelInstance.errors.allErrors.collect { messageSource.getMessage(it, locale) },
        ] as JSON)
    }

    /**
     * Mirrors InventoryItemController.transferStock (used for both transfer out and return in)
     * with a JSON response instead of flash/redirect.
     */
    @Transactional
    def transferStock(TransferStockCommand command) {
        InventoryItem inventoryItem = command.inventoryItem
        if (!inventoryItem) {
            response.status = 400
            render([success: false, errors: [getMessage("default.not.found.message", "Not found",
                    [getMessage("inventoryItem.label", "Inventory item"), params['inventoryItem.id']] as Object[])]] as JSON)
            return
        }
        try {
            Transaction transaction = inventoryService.transferStock(command)
            if (transaction.hasErrors()) {
                response.status = 400
                render([success: false, errors: resolveErrors(transaction.errors)] as JSON)
                return
            }
            flushSession()
        } catch (Exception e) {
            log.error("Error transferring stock " + e.message, e)
            response.status = 400
            render([success: false, errors: [e.message]] as JSON)
            return
        }
        String message = getMessage("default.updated.message", "Updated",
                [getMessage("inventoryItem.label", "Inventory item"), inventoryItem.id] as Object[])
        render([success: true, message: message] as JSON)
    }

    /**
     * Mirrors InventoryItemController.update (edit inventory item dialog)
     * with a JSON response instead of flash/redirect.
     */
    @Transactional
    def updateInventoryItem() {
        InventoryItem itemInstance = InventoryItem.get(params.id)
        Date minExpirationDate = grailsApplication.config.getProperty("openboxes.expirationDate.minValue", Date.class, null)
        if (!itemInstance) {
            response.status = 400
            render([success: false, errors: [getMessage("default.not.found.message", "Not found",
                    [getMessage("inventoryItem.label", "Inventory item"), params.id] as Object[])]] as JSON)
            return
        }
        if (itemInstance.product && itemInstance.product.lotAndExpiryControl && (!params.expirationDate || !params.lotNumber)) {
            response.status = 400
            render([success: false, errors: [getMessage("inventoryItem.lotAndExpiryControl.message",
                    "Both lot number and expiry date are required for this product")]] as JSON)
            return
        }
        itemInstance.properties = params
        itemInstance.lotNumber = params?.lotNumber
        if (!itemInstance.product.lotAndExpiryControl && !itemInstance.lotNumber) {
            response.status = 400
            render([success: false, errors: [getMessage("inventoryItem.blankLot.message",
                    "Lot number cannot be blank")]] as JSON)
            return
        }
        if (itemInstance.expirationDate && minExpirationDate && itemInstance.expirationDate < minExpirationDate) {
            response.status = 400
            render([success: false,
                    errors : ["This date is invalid. Please enter a date after ${minExpirationDate.getYear() + 1900}.".toString()]] as JSON)
            return
        }
        if (!itemInstance.hasErrors() && inventoryItemDataService.save(itemInstance)) {
            try {
                flushSession()
            } catch (Exception e) {
                log.error("Error updating inventory item " + e.message, e)
                response.status = 400
                render([success: false, errors: [e.message]] as JSON)
                return
            }
            render([success: true, message: getMessage("default.updated.message", "Updated",
                    [getMessage("inventoryItem.label", "Inventory item"), itemInstance.id] as Object[])] as JSON)
            return
        }
        response.status = 400
        List errors = resolveErrors(itemInstance.errors)
        render([success: false, errors: errors ?: [getMessage("default.not.updated.message", "Not updated",
                [getMessage("inventoryItem.label", "Inventory item"), itemInstance.id] as Object[])]] as JSON)
    }

    /**
     * Mirrors InventoryItemController.addToShipment with a JSON response instead of flash/redirect.
     */
    @Transactional
    def addToShipment() {
        Product productInstance = Product.get(params?.product?.id)
        Person personInstance = Person.get(params?.recipient?.id)
        Location binLocation = Location.get(params?.binLocation?.id)
        InventoryItem inventoryItem = InventoryItem.get(params?.inventoryItem?.id)

        def shipmentContainer = params.shipmentContainer?.split(":")
        Shipment shipmentInstance = shipmentContainer ? Shipment.get(shipmentContainer[0]) : null
        Container containerInstance = shipmentContainer && shipmentContainer.size() > 1 ?
                Container.get(shipmentContainer[1]) : null

        if (!shipmentInstance || !inventoryItem) {
            response.status = 400
            render([success: false, errors: [getMessage("inventoryItem.errorValidatingItem.message",
                    "Error adding item to shipment")]] as JSON)
            return
        }

        ShipmentItem shipmentItem = new ShipmentItem(
                product: productInstance,
                binLocation: binLocation,
                lotNumber: inventoryItem.lotNumber ?: '',
                expirationDate: inventoryItem?.expirationDate,
                inventoryItem: inventoryItem,
                quantity: params.quantity,
                recipient: personInstance,
                shipment: shipmentInstance,
                container: containerInstance)

        try {
            shipmentService.validateShipmentItem(shipmentItem)

            if (shipmentItem.hasErrors() || !shipmentItem.validate()) {
                response.status = 400
                render([success: false, errors: resolveErrors(shipmentItem.errors)] as JSON)
                return
            }

            if (!shipmentInstance.addToShipmentItems(shipmentItem).save()) {
                response.status = 400
                render([success: false, errors: [getMessage("inventoryItem.unableToAddItemToShipment.message",
                        "Unable to add new item to shipment. Please try again.")]] as JSON)
                return
            }
            flushSession()
        } catch (ShipmentItemException e) {
            response.status = 400
            render([success: false, errors: resolveErrors(e.shipmentItem.errors)] as JSON)
            return
        } catch (ValidationException e) {
            response.status = 400
            render([success: false, errors: resolveErrors(e.errors)] as JSON)
            return
        }

        String productDescription = "${productInstance?.productCode} ${productInstance?.name}" +
                (inventoryItem?.lotNumber ? " #${inventoryItem.lotNumber}" : "")
        render([success: true, message: getMessage("inventoryItem.addedItemToShipment.message", "Added item to shipment",
                [productDescription, shipmentInstance?.name] as Object[])] as JSON)
    }

    /**
     * Forces a session flush so commit-time DB failures surface before a success response is rendered.
     */
    private static void flushSession() {
        InventoryItem.withSession { session -> session.flush() }
    }

    private String getMessage(String code, String defaultMessage, Object[] args = null) {
        messageSource.getMessage(code, args, defaultMessage, localizationService.getCurrentLocale())
    }

    private List resolveErrors(errors) {
        Locale locale = localizationService.getCurrentLocale()
        errors?.allErrors?.collect { error ->
            try {
                messageSource.getMessage(error, locale)
            } catch (Exception ignored) {
                error.defaultMessage ?: error.code
            }
        } ?: []
    }

    private static Map toInventoryLevelMap(InventoryLevel inventoryLevel) {
        if (!inventoryLevel) {
            return null
        }
        return [
                id                     : inventoryLevel.id,
                status                 : inventoryLevel.status?.name(),
                minQuantity            : inventoryLevel.minQuantity,
                reorderQuantity        : inventoryLevel.reorderQuantity,
                maxQuantity            : inventoryLevel.maxQuantity,
                forecastQuantity       : inventoryLevel.forecastQuantity,
                monthlyForecastQuantity: inventoryLevel.forecastQuantity != null ?
                        inventoryLevel.monthlyForecastQuantity : null,
                preferredBinLocation   : inventoryLevel.preferredBinLocation?.name,
                abcClass               : inventoryLevel.abcClass,
        ]
    }

    private static Map toInventoryItemMap(InventoryItem inventoryItem) {
        if (!inventoryItem) {
            return null
        }
        return [
                id            : inventoryItem.id,
                lotNumber     : inventoryItem.lotNumber,
                expirationDate: inventoryItem.expirationDate,
                lotStatus     : inventoryItem.lotStatus?.name(),
                recalled      : inventoryItem.lotStatus == LotStatusCode.RECALLED,
        ]
    }

    private static Map toBinLocationMap(Location binLocation) {
        if (!binLocation) {
            return null
        }
        return [
                id  : binLocation.id,
                name: binLocation.name,
                zone: binLocation.zone ? [id: binLocation.zone.id, name: binLocation.zone.name] : null,
        ]
    }
}
