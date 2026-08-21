package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException

import java.text.SimpleDateFormat
import org.pih.warehouse.DateUtil
import org.pih.warehouse.PaginatedList
import org.pih.warehouse.auth.AuthService
import org.pih.warehouse.core.ActivityCode
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.DashboardService
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.ReasonCode
import org.pih.warehouse.core.User
import org.pih.warehouse.importer.CSVUtils
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.importer.InventoryImportDataService
import org.pih.warehouse.inventory.AdjustInventoryService
import org.pih.warehouse.inventory.AdjustStockCommand
import org.pih.warehouse.inventory.ExpirationHistoryReportFilterCommand
import org.pih.warehouse.inventory.ExpirationHistoryReportRow
import org.pih.warehouse.inventory.InventoryCommand
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.InventoryService
import org.pih.warehouse.inventory.ReorderReportFilterCommand
import org.pih.warehouse.inventory.ReorderReportItemDto
import org.pih.warehouse.inventory.Transaction
import org.pih.warehouse.inventory.TransactionCode
import org.pih.warehouse.inventory.TransactionCommand
import org.pih.warehouse.inventory.TransactionEntry
import org.pih.warehouse.inventory.TransactionIdentifierService
import org.pih.warehouse.inventory.TransactionSource
import org.pih.warehouse.inventory.TransactionType
import org.pih.warehouse.inventory.product.ExpirationHistoryReport
import org.pih.warehouse.product.Category
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductCatalog
import org.pih.warehouse.product.ProductType
import org.pih.warehouse.report.InventoryReportCommand
import org.pih.warehouse.core.Tag
import org.pih.warehouse.importer.InventoryExcelImporter
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.multipart.MultipartHttpServletRequest

class InventoryApiController {

    InventoryImportDataService inventoryImportDataService
    DashboardService dashboardService
    InventoryService inventoryService
    TransactionIdentifierService transactionIdentifierService
    AdjustInventoryService adjustInventoryService
    def productService
    def productAvailabilityService
    def userService
    def locationService
    def categoryService
    def uploadService
    def messageSource

    def importCsv() {
        String fileData = request.inputStream.text

        if (fileData.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty")
        }

        if (request.contentType != "text/csv") {
            throw new IllegalArgumentException("File must be in CSV format")
        }

        /*
         * Named importDataCommand rather than command: the Grails controller
         * action transformer resolves a local variable named `command` in one
         * action against same-named command-object parameters in other
         * actions, generating casts to the wrong command class.
         */
        ImportDataCommand importDataCommand = new ImportDataCommand(
                data: CSVUtils.csvToObjects(fileData),
                date: new Date(System.currentTimeMillis() - 1000),
                location: Location.get(params.facilityId)
        )

        inventoryImportDataService.calculateAndApplyInventoryDifferences(importDataCommand)
        inventoryImportDataService.validateData(importDataCommand)
        inventoryImportDataService.importData(importDataCommand)

        render(status: 200)
    }

    def getReorderReport(ReorderReportFilterCommand command) {
        if (command.hasErrors()) {
            throw new ValidationException("Invalid filters", command.errors)
        }
        List<ReorderReportItemDto> reorderReport = dashboardService.getReorderReport(command)

        withFormat {
            "csv" {
                String csv = dashboardService.getReorderReportCsv(reorderReport)
                String filename = "Reorder report - ${AuthService.currentLocation?.name}.csv"
                response.setHeader("Content-disposition", "attachment; filename=\"${filename}\"")
                render(contentType: "text/csv", text: csv, encoding: "UTF-8")
                return
            }
            "*" {
                render([data: reorderReport] as JSON)
            }
        }
    }

    def getExpirationHistoryReport(ExpirationHistoryReportFilterCommand command) {
        if (command.hasErrors()) {
            throw new ValidationException("Invalid filters", command.errors)
        }
        withFormat {
            "csv" {
                String csv = inventoryService.getExpirationHistoryReportCsv(command)
                response.contentType = "text/csv"
                String filename = "Expiration history report - ${AuthService.currentLocation?.name}.csv"
                response.setHeader("Content-disposition", "attachment; filename=\"${filename}\"")
                render(text: csv, encoding: "UTF-8")
                return
            }
            "*" {
                ExpirationHistoryReport report = inventoryService.getExpirationHistoryReport(command)
                render([
                        data                     : report.rows,
                        totalCount               : report.rows.totalCount,
                        totalQuantityLostToExpiry: report.totalQuantityLostToExpiry,
                        totalValueLostToExpiry   : report.totalValueLostToExpiry
                ] as JSON)
            }
        }
    }

    /**
     * Data provider for the React inventory browser (replaces server-rendered inventory/browse.gsp model).
     */
    def browse(InventoryCommand command) {
        if (!params.max) params.max = 10
        if (!params.offset) params.offset = 0

        command.location = command?.location ?: Location.get(session.warehouse.id)
        def category = params.categoryId ? Category.get(params.categoryId) : productService.getRootCategory()
        command.category = category?.id ? category : null
        command.catalogs = params.catalogs ? command.catalogs : null
        command.tags = params.tags ? command.tags : null
        command.maxResults = params?.max as Integer
        command.offset = params?.offset as Integer
        command.searchResults = productAvailabilityService.searchProducts(command)

        render([
                searchTerms          : command.searchTerms,
                categoryId           : command.category?.id,
                tags                 : command.tags*.id,
                catalogs             : command.catalogs*.id,
                productTypes         : command.productTypes*.id,
                showOutOfStockProducts: command.showOutOfStockProducts,
                maxResults           : command.maxResults,
                offset               : command.offset,
                totalCount           : command.searchResults?.totalCount ?: 0,
                searchResults        : command.searchResults.collect { item ->
                    Product product = item.product
                    [
                            id            : product.id,
                            productCode   : product.productCode,
                            name          : product.name,
                            color         : product.color,
                            hasImage      : !product.images?.empty,
                            imageId       : product.images ? product.thumbnail?.id : null,
                            productType   : product.productType ? [id: product.productType.id, name: product.productType.name] : null,
                            category      : product.category ? [id: product.category.id, name: product.category.name] : null,
                            tags          : product.tags?.collect { [id: it.id, tag: it.tag] } ?: [],
                            catalogs      : product.productCatalogs?.collect { [id: it.id, name: it.name] } ?: [],
                            quantityOnHand: item.quantityOnHand ?: 0
                    ]
                },
                filterOptions        : [
                        categories  : categoryService.getCategoriesOptions(true),
                        tags        : Tag.list(sort: "tag").collect { [id: it.id, name: it.tag, productCount: it?.products?.size()] },
                        catalogs    : ProductCatalog.list(sort: "name").collect { [id: it.id, name: it.name, productCount: it?.productCatalogItems?.size()] },
                        productTypes: ProductType.list(sort: "name").collect { [id: it.id, name: it.name] },
                ]
        ] as JSON)
    }

    /**
     * Data provider for the React inventory report (replaces server-rendered inventory/list.gsp model).
     */
    def listInventory() {
        renderStockList("getInventoryItems")
    }

    /**
     * Data provider for the React low stock report (replaces server-rendered inventory/listLowStock model).
     */
    def listLowStock() {
        renderStockList("getLowStock")
    }

    /**
     * Data provider for the React reorder stock report (replaces server-rendered inventory/listReorderStock model).
     */
    def listReorderStock() {
        renderStockList("getReorderStock")
    }

    private void renderStockList(String methodName) {
        Location location = Location.get(session.warehouse.id)
        List<Category> categories = params.list('categories') ?
                Category.findAllByIdInList(params.list('categories')) : []
        params.includeSubcategories = params.containsKey("_includeSubcategories") ? params.includeSubcategories : true
        if (params.includeSubcategories) {
            categories = inventoryService.getExplodedCategories(categories)
        }
        def inventoryItems = dashboardService."$methodName"(location, categories)
        boolean hasRoleFinance = userService.hasRoleFinance(User.get(session?.user?.id))

        render([
                hasRoleFinance: hasRoleFinance,
                categories    : categoryService.getCategoriesOptions(true),
                data          : inventoryItems.collect { item ->
                    Product product = item.product
                    [
                            status                    : item.status,
                            product                   : [
                                    id           : product.id,
                                    productCode  : product.productCode,
                                    name         : product.name,
                                    color        : product.color,
                                    productGroups: product.productGroups?.collect { it.name } ?: [],
                                    category     : product.category?.name,
                                    abcClass     : product.abcClass,
                                    unitOfMeasure: product.unitOfMeasure,
                                    pricePerUnit : hasRoleFinance ? product.pricePerUnit : null,
                            ],
                            minQuantity               : item.inventoryLevel?.minQuantity,
                            reorderQuantity           : item.inventoryLevel?.reorderQuantity,
                            maxQuantity               : item.inventoryLevel?.maxQuantity,
                            quantity                  : item.quantity,
                            quantityAvailableToPromise: item.quantityAvailableToPromise,
                            totalValue                : hasRoleFinance && product.pricePerUnit && item.quantity ?
                                    (product.pricePerUnit * item.quantity) : null,
                    ]
                }
        ] as JSON)
    }

    /**
     * Data provider for the React daily transactions screen (replaces inventory/listDailyTransactions.gsp model).
     */
    def listDailyTransactions() {
        def dateFormat = new SimpleDateFormat("dd/MM/yyyy")
        def dateSelected = (params.date) ? dateFormat.parse(params.date) : new Date()

        def transactionsByDate = Transaction.list().groupBy {
            DateUtil.clearTime(it?.transactionDate)
        }?.entrySet()?.sort { it.key }?.reverse()

        def transactions = Transaction.findAllByTransactionDate(dateSelected)

        render([
                dateSelected      : dateFormat.format(dateSelected),
                transactionsByDate: transactionsByDate.collect { entry ->
                    [date: dateFormat.format(entry.key), count: entry.value?.size() ?: 0]
                },
                transactions      : transactions.collect { transaction ->
                    [
                            id               : transaction.id,
                            transactionNumber: transaction.transactionNumber,
                            dateCreated      : transaction.dateCreated?.toString(),
                            transactionType  : transaction.transactionType ?
                                    getLocalizedMetadata(transaction.transactionType.name) : null,
                            source           : transaction.source?.name,
                            destination      : transaction.destination?.name,
                            entries          : transaction.transactionEntries.collect { entry ->
                                [
                                        product  : serializeProduct(entry.inventoryItem?.product),
                                        lotNumber: entry.inventoryItem?.lotNumber,
                                        quantity : entry.quantity,
                                ]
                            },
                    ]
                },
        ] as JSON)
    }

    /**
     * Data provider for the React expired stock report (replaces inventory/listExpiredStock.gsp model).
     */
    def listExpiredStock(InventoryReportCommand command) {
        command.location = Location.get(session.warehouse.id)

        List<InventoryItem> inventoryItems = dashboardService.getExpiredStock(command)
        List<Category> categories = inventoryItems?.collect { it.product.category }?.unique()

        renderExpirationStockList(command, inventoryItems, categories)
    }

    /**
     * Data provider for the React expiring stock report (replaces inventory/listExpiringStock.gsp model).
     */
    def listExpiringStock(InventoryReportCommand command) {
        command.location = Location.get(session.warehouse.id)

        List<InventoryItem> inventoryItems = dashboardService.getExpiringStock(command)
        List<Category> categories = inventoryItems?.collect { it?.product?.category }?.unique().sort {
            it.name
        }

        renderExpirationStockList(command, inventoryItems, categories)
    }

    private void renderExpirationStockList(InventoryReportCommand command, List<InventoryItem> inventoryItems, List<Category> categories) {
        List<Map> data = []
        if (!inventoryItems?.isEmpty()) {
            data = productAvailabilityService.getQuantityOnHandByInventoryItem(command.location, inventoryItems)
                    .collect { key, val -> [inventoryItem: key, quantity: val] }
        }

        render([
                categories: categories.collect { [id: it.id, name: it.name] },
                data      : data.collect { entry ->
                    InventoryItem inventoryItem = entry.inventoryItem
                    [
                            inventoryItem: [
                                    id            : inventoryItem.id,
                                    lotNumber     : inventoryItem.lotNumber,
                                    expirationDate: inventoryItem.expirationDate?.format("d MMM yyyy"),
                                    product       : [
                                            id           : inventoryItem.product?.id,
                                            productCode  : inventoryItem.product?.productCode,
                                            name         : inventoryItem.product?.name,
                                            unitOfMeasure: inventoryItem.product?.unitOfMeasure,
                                            category     : inventoryItem.product?.category?.name,
                                    ],
                            ],
                            quantity     : entry.quantity,
                    ]
                },
        ] as JSON)
    }

    /**
     * Data provider for the React edit bin location screen (replaces inventory/editBinLocation.gsp model).
     */
    def editBinLocation() {
        Product product = Product.findByProductCode(params.productCode)
        Location location = Location.get(session.warehouse.id)
        Location binLocation = Location.findByParentLocationAndName(location, params.binLocation)
        InventoryItem inventoryItem = inventoryService.findInventoryItemByProductAndLotNumber(product, params.lotNumber)
        Integer quantity = inventoryService.getQuantityFromBinLocation(location, binLocation, inventoryItem)

        render([
                location     : [id: location?.id, name: location?.name],
                binLocation  : binLocation ? [id: binLocation.id, name: binLocation.name] : null,
                inventoryItem: inventoryItem ? [
                        id            : inventoryItem.id,
                        lotNumber     : inventoryItem.lotNumber,
                        expirationDate: inventoryItem.expirationDate?.format("MMM dd, yyyy"),
                        product       : [
                                id           : inventoryItem.product?.id,
                                productCode  : inventoryItem.product?.productCode,
                                name         : inventoryItem.product?.name,
                                unitOfMeasure: inventoryItem.product?.unitOfMeasure,
                        ],
                ] : null,
                quantity     : quantity,
                reasonCodes  : ReasonCode.listInventoryAdjustmentReasonCodes().collect { reasonCode ->
                    [id: reasonCode.name(), name: getMessage("enum.ReasonCode.${reasonCode.name()}", reasonCode.name())]
                },
        ] as JSON)
    }

    /**
     * Saves a stock adjustment submitted from the React edit bin location screen.
     * Mirrors InventoryItemController.adjustStock behavior with a JSON response.
     */
    @Transactional
    def adjustStock(AdjustStockCommand command) {
        InventoryItem inventoryItem = command.inventoryItem
        try {
            inventoryService.adjustStock(command)
            if (!command.hasErrors()) {
                String message = getMessage("default.updated.message", "Updated",
                        [getMessage("inventoryItem.label", "Inventory item"), inventoryItem.id] as Object[])
                render([success: true, message: message] as JSON)
                return
            }
        } catch (ValidationException e) {
            command.errors = e.errors
        }
        response.status = 400
        render([success: false, errors: resolveErrors(command.errors)] as JSON)
    }

    /**
     * Data provider for the React create transaction screen (replaces inventory/createTransaction.gsp model).
     */
    def getCreateTransaction() {
        def warehouseInstance = Location.get(session?.warehouse?.id)
        def products = []
        List binLocationItems = []
        Map productInventoryItems = [:]

        if (params?.product?.id) {
            def productIds = params.list('product.id').collect { String.valueOf(it) }
            if (productIds) {
                products = Product.getAll(productIds)
                productInventoryItems = inventoryService.getInventoryItemsByProducts(warehouseInstance, productIds)
                binLocationItems = inventoryService.getProductQuantityByBinLocation(warehouseInstance, products)
            }
        } else if (params?.inventoryItem?.id) {
            def inventoryItemIds = params.list('inventoryItem.id')
            def inventoryItems = inventoryItemIds.collect { InventoryItem.get(String.valueOf(it)) }
            def productIds = inventoryItems.collect { it?.product?.id }
            if (productIds) {
                products = Product.getAll(productIds)
            }
            binLocationItems = inventoryService.getBinLocationsByInventoryItems(warehouseInstance, inventoryItems)
        } else {
            throw new RuntimeException("You must select at least one product or inventory item")
        }

        def quantityMap = inventoryService.getQuantityForInventory(warehouseInstance?.inventory, products)

        // Transaction types available for consumption (debit) with same activity-based filtering as SelectTagLib
        List<TransactionType> debitTransactionTypes = TransactionType.findAllByTransactionCode(TransactionCode.DEBIT)
        def disabledTransactionTypes = []
        if (!warehouseInstance.supports(ActivityCode.CONSUME_STOCK)) {
            disabledTransactionTypes.add(org.pih.warehouse.core.Constants.CONSUMPTION_TRANSACTION_TYPE_ID)
        }
        if (!warehouseInstance.supports(ActivityCode.ADJUST_INVENTORY)) {
            disabledTransactionTypes.add(org.pih.warehouse.core.Constants.ADJUSTMENT_DEBIT_TRANSACTION_TYPE_ID)
            disabledTransactionTypes.add(org.pih.warehouse.core.Constants.ADJUSTMENT_CREDIT_TRANSACTION_TYPE_ID)
        }
        if (!warehouseInstance.supports(ActivityCode.SEND_STOCK)) {
            disabledTransactionTypes.add(org.pih.warehouse.core.Constants.TRANSFER_OUT_TRANSACTION_TYPE_ID)
        }
        debitTransactionTypes = debitTransactionTypes.findAll { !(it.id in disabledTransactionTypes) }

        render([
                location             : [
                        id                   : warehouseInstance?.id,
                        name                 : warehouseInstance?.name,
                        inventoryId          : warehouseInstance?.inventory?.id,
                        hasBinLocationSupport: warehouseInstance?.hasBinLocationSupport(),
                ],
                products             : products.collect { serializeProduct(it) },
                binLocations         : binLocationItems.collect { item ->
                    [
                            product      : serializeProduct(item.product),
                            inventoryItem: serializeInventoryItem(item.inventoryItem),
                            binLocation  : item.binLocation ? [id: item.binLocation.id, name: item.binLocation.name] : null,
                            quantity     : item.quantity,
                    ]
                },
                productInventoryItems: productInventoryItems.collectEntries { product, items ->
                    [(product.id): items.collect { serializeInventoryItem(it) }]
                },
                quantityMap          : quantityMap.collectEntries { inventoryItem, quantity ->
                    [(inventoryItem.id): quantity]
                },
                reasonCodes          : ReasonCode.listInventoryAdjustmentReasonCodes().collect { reasonCode ->
                    [id: reasonCode.name(), name: getMessage("enum.ReasonCode.${reasonCode.name()}", reasonCode.name())]
                },
                transactionTypesDebit: debitTransactionTypes.collect { transactionType ->
                    [id: transactionType.id, name: getLocalizedMetadata(transactionType.name)]
                },
                destinations         : locationService.getTransactionDestinations(warehouseInstance)
                        .sort { it?.name?.toLowerCase() }
                        .collect { [id: it.id, name: it.name, locationType: it.locationType?.name] },
                sources              : locationService.getTransactionSources(warehouseInstance)
                        .sort { it?.name?.toLowerCase() }
                        .collect { [id: it.id, name: it.name, locationType: it.locationType?.name] },
                warehouseBinLocations: warehouseInstance.hasBinLocationSupport() ?
                        Location.findAllByParentLocationAndActive(warehouseInstance, true)
                                .sort { it?.name?.toLowerCase() }
                                .collect { [id: it.id, name: it.name] } : [],
                users                : User.list(sort: "username").collect { [id: it.id, name: it.name, username: it.username] },
                currentUserId        : session?.user?.id,
        ] as JSON)
    }

    /**
     * Saves an inventory adjustment transaction submitted from the React create transaction screen.
     * Mirrors InventoryController.saveAdjustmentTransaction with a JSON response.
     */
    @Transactional
    def saveAdjustmentTransaction(TransactionCommand command) {
        def transaction = command?.transactionInstance
        def warehouseInstance = Location.get(session?.warehouse?.id)

        command.transactionEntries.each {
            if (it.quantity < 0) {
                transaction.errors.rejectValue("transactionEntries", "transactionEntry.quantity.invalid", [it?.inventoryItem?.lotNumber] as Object[], "")
            }
        }

        if (!transaction.hasErrors()) {
            try {
                command.transactionEntries.each {
                    if (it.quantity != 0) {
                        def transactionEntry = new TransactionEntry()
                        transactionEntry.product = it.inventoryItem.product
                        transactionEntry.inventoryItem = it.inventoryItem
                        transactionEntry.binLocation = it.binLocation
                        transactionEntry.quantity = it.quantity
                        transactionEntry.comments = it.comment
                        transactionEntry.reasonCode = it.reasonCode
                        transaction.addToTransactionEntries(transactionEntry)
                    }
                }
                TransactionSource transactionSource =
                        adjustInventoryService.createAdjustInventoryTransactionSource(warehouseInstance)
                transaction.transactionSource = transactionSource

                if (!transaction.hasErrors() && transaction.validate()) {
                    transaction.save(failOnError: true)
                    def productId = command.transactionEntries.first()?.inventoryItem?.product?.id
                    render([success: true, message: "Successfully saved transaction", productId: productId] as JSON)
                    return
                }
            } catch (ValidationException e) {
                log.debug("caught validation exception " + e)
            }
        }
        response.status = 400
        render([success: false, errors: resolveErrors(transaction.errors)] as JSON)
    }

    /**
     * Saves a debit transaction (transfer out / consumption) submitted from the React create transaction screen.
     * Mirrors InventoryController.saveDebitTransaction with a JSON response.
     */
    @Transactional
    def saveDebitTransaction(TransactionCommand command) {
        command.transactionInstance = new Transaction(params.transactionInstance)

        def productIds = params.list('product.id').collect { String.valueOf(it) }
        List products = Product.getAll(productIds)

        def transaction = command?.transactionInstance
        transaction.transactionNumber = transactionIdentifierService.generate(transaction)
        def warehouseInstance = Location.get(session?.warehouse?.id)
        def quantityMap = inventoryService.getQuantityForInventory(warehouseInstance?.inventory, products)

        command.transactionEntries.each {
            def onHandQuantity = quantityMap[it.inventoryItem]
            if (it.quantity > onHandQuantity) {
                transaction.errors.rejectValue("transactionEntries", "transactionEntry.quantity.invalid", [it?.inventoryItem?.lotNumber] as Object[], "")
            }
        }

        if (!transaction?.hasErrors()) {
            try {
                command.transactionEntries.each {
                    if (it.quantity) {
                        def transactionEntry = new TransactionEntry()
                        transactionEntry.inventoryItem = it.inventoryItem
                        transactionEntry.product = it.product
                        transactionEntry.quantity = it.quantity
                        transactionEntry.binLocation = it.binLocation
                        transaction.addToTransactionEntries(transactionEntry)
                    }
                }

                if (!transaction?.hasErrors() && transaction?.validate()) {
                    transaction.save(failOnError: true)
                    render([success: true, message: "Successfully saved transaction", productId: productIds[0]] as JSON)
                    return
                }
            } catch (ValidationException e) {
                log.debug("caught validation exception " + e)
            }
        }
        response.status = 400
        render([success: false, errors: resolveErrors(transaction.errors)] as JSON)
    }

    /**
     * Saves a credit transaction (transfer in) submitted from the React create transaction screen.
     * Mirrors InventoryController.saveCreditTransaction with a JSON response.
     */
    @Transactional
    def saveCreditTransaction(TransactionCommand command) {
        def transactionInstance = command?.transactionInstance

        command.transactionEntries.each {
            if (it.quantity < 0) {
                transactionInstance.errors.rejectValue("transactionEntries", "transactionEntry.quantity.invalid", [it?.inventoryItem?.lotNumber] as Object[], "")
            }
        }

        command.transactionEntries.each {
            if (!it.inventoryItem) {
                def inventoryItem = inventoryService.findInventoryItemByProductAndLotNumber(it.product, it.lotNumber)
                if (!inventoryItem) {
                    inventoryItem = new InventoryItem()
                    inventoryItem.lotNumber = it.lotNumber
                    inventoryItem.expirationDate = (it.lotNumber) ? it.expirationDate : null
                    inventoryItem.product = it.product
                    if (inventoryItem.hasErrors() || !inventoryItem.save()) {
                        inventoryItem.errors.allErrors.each { error ->
                            command.errors.reject("inventoryItem.invalid",
                                    [inventoryItem, error.getField(), error.getRejectedValue()] as Object[],
                                    "[${error.getField()} ${error.getRejectedValue()}] - ${error.defaultMessage} ")
                        }
                    }
                }
                it.inventoryItem = inventoryItem
            }
        }

        command.transactionEntries.each {
            def transactionEntry = new TransactionEntry(inventoryItem: it.inventoryItem,
                    product: it.inventoryItem.product, binLocation: it.binLocation, quantity: it.quantity)
            transactionInstance.addToTransactionEntries(transactionEntry)
        }

        if (!transactionInstance.hasErrors()) {
            try {
                if (!transactionInstance.hasErrors() && transactionInstance.validate()) {
                    transactionInstance.save(failOnError: true)
                    String productId = transactionInstance.getAssociatedProducts().first()
                    render([success: true, message: "Successfully saved transaction", productId: productId] as JSON)
                    return
                }
            } catch (ValidationException e) {
                log.debug("caught validation exception " + e)
            }
        }
        response.status = 400
        List errors = resolveErrors(transactionInstance.errors) + resolveErrors(command.errors)
        render([success: false, errors: errors] as JSON)
    }

    /**
     * Data provider for the React edit transaction screen (replaces inventory/editTransaction.gsp model).
     */
    def getTransaction() {
        def transactionInstance = Transaction.get(params?.id)
        if (!transactionInstance) {
            response.status = 404
            render([error: getMessage("inventory.noTransactionWithId.message", "Transaction not found", [params.id] as Object[])] as JSON)
            return
        }

        def warehouseInstance = Location.get(session?.warehouse?.id)
        def products = transactionInstance?.transactionEntries.collect { it.inventoryItem.product }
        def inventoryItems = products ? InventoryItem.findAllByProductInList(products) : []
        def inventoryItemsMap = inventoryItems.groupBy { it.product?.id }

        render([
                transaction         : [
                        id               : transactionInstance.id,
                        transactionNumber: transactionInstance.transactionNumber,
                        transactionDate  : transactionInstance.transactionDate?.format("yyyy-MM-dd'T'HH:mm"),
                        transactionType  : transactionInstance.transactionType ? [
                                id  : transactionInstance.transactionType.id,
                                name: getLocalizedMetadata(transactionInstance.transactionType.name),
                        ] : null,
                        source           : transactionInstance.source ? [id: transactionInstance.source.id, name: transactionInstance.source.name] : null,
                        destination      : transactionInstance.destination ? [id: transactionInstance.destination.id, name: transactionInstance.destination.name] : null,
                        inventory        : [
                                id  : transactionInstance.inventory?.id,
                                name: transactionInstance.inventory?.warehouse?.name,
                        ],
                        comment          : transactionInstance.comment,
                        entries          : transactionInstance.transactionEntries.collect { entry ->
                            [
                                    id            : entry.id,
                                    product       : serializeProduct(entry.inventoryItem?.product),
                                    binLocation   : entry.binLocation?.name,
                                    inventoryItem : serializeInventoryItem(entry.inventoryItem),
                                    quantity      : entry.quantity,
                            ]
                        },
                ],
                inventoryItemsMap   : inventoryItemsMap.collectEntries { productId, items ->
                    [(productId): items.collect { serializeInventoryItem(it) }]
                },
                transactionTypeList : TransactionType.list().collect { transactionType ->
                    [id: transactionType.id, name: getLocalizedMetadata(transactionType.name)]
                },
                locationInstanceList: Location.findAllByParentLocationIsNull().collect { [id: it.id, name: it.name] },
                warehouseInstance   : [id: warehouseInstance?.id, name: warehouseInstance?.name],
        ] as JSON)
    }

    /**
     * Saves transaction header/details submitted from the React edit transaction screen.
     * Mirrors InventoryController.saveTransaction with a JSON response.
     */
    @Transactional
    def saveTransaction() {
        def transactionInstance = Transaction.get(params.id)
        if (!transactionInstance) {
            transactionInstance = new Transaction()
        }

        transactionInstance.properties = params

        Boolean saved = null
        if (transactionInstance.validate() && !transactionInstance.hasErrors()) {
            try {
                transactionInstance.lastUpdated = new Date()
                saved = transactionInstance.save(flush: true)
            }
            catch (Exception e) {
                log.error("Unable to save transaction ", e)
            }
        }

        if (saved) {
            render([
                    success: true,
                    message: getMessage("inventory.transactionSaved.message", "Transaction saved"),
                    id     : transactionInstance?.id,
            ] as JSON)
        } else {
            response.status = 400
            render([
                    success: false,
                    message: getMessage("inventory.unableToSaveTransaction.message", "Unable to save transaction"),
                    errors : resolveErrors(transactionInstance.errors),
                    id     : transactionInstance?.id,
            ] as JSON)
        }
    }

    /**
     * Deletes a transaction entry from the React edit transaction screen.
     * Mirrors TransactionEntryController.delete with a JSON response.
     */
    @Transactional
    def deleteTransactionEntry() {
        def transactionEntryInstance = TransactionEntry.get(params.id)
        if (!transactionEntryInstance) {
            response.status = 404
            render([
                    success: false,
                    message: getMessage("default.not.found.message", "Not found",
                            [getMessage("transactionEntry.label", "Transaction entry"), params.id] as Object[]),
            ] as JSON)
        } else {
            transactionEntryInstance.transaction.removeFromTransactionEntries(transactionEntryInstance)
            transactionEntryInstance.delete()
            render([
                    success: true,
                    message: getMessage("default.deleted.message", "Deleted",
                            [getMessage("transactionEntry.label", "Transaction entry"), params.id] as Object[]),
            ] as JSON)
        }
    }

    /**
     * Data provider for the React transaction list screen (replaces inventory/listTransactions.gsp model).
     */
    def listTransactions() {
        Location location = Location.get(session.warehouse.id)
        def currentInventory = location.inventory

        Date transactionDateFrom = params.transactionDateFrom ? Date.parse("MM/dd/yyyy", params.transactionDateFrom) : null
        Date transactionDateTo = params.transactionDateTo ? Date.parse("MM/dd/yyyy", params.transactionDateTo) : null

        // we are only showing transactions for the inventory associated with the current warehouse
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        params.sort = params?.sort ?: "dateCreated"
        params.order = params?.order ?: "desc"

        def transactionType = TransactionType.get(params?.transactionType?.id)
        def transactions = Transaction.createCriteria().list(params) {
            and {
                eq("inventory", currentInventory)
                if (transactionType) {
                    eq("transactionType", transactionType)
                }
                if (params.transactionNumber) {
                    ilike("transactionNumber", "%" + params.transactionNumber + "%")
                }
                if (params.transactionDateFrom) {
                    ge("transactionDate", transactionDateFrom)
                }
                if (params.transactionDateTo) {
                    le("transactionDate", transactionDateTo)
                }
            }
        }

        render([
                warehouseName          : location?.name,
                transactionCount       : transactions.totalCount,
                transactionTypeSelected: transactionType?.id,
                transactionTypes       : TransactionType.list().collect { type ->
                    [id: type.id, name: getLocalizedMetadata(type.name)]
                },
                isSuperuser            : userService.isSuperuser(User.get(session?.user?.id)),
                max                    : params.max,
                offset                 : params.int('offset') ?: 0,
                transactions           : transactions.collect { transaction ->
                    [
                            id               : transaction.id,
                            entryCount       : transaction.transactionEntries?.size() ?: 0,
                            transactionNumber: transaction.transactionNumber ?: transaction.id,
                            transactionDate  : transaction.transactionDate?.format("dd-MMM-yyyy hh:mm:ssa"),
                            transactionType  : transaction.transactionType ?
                                    getLocalizedMetadata(transaction.transactionType.name) : null,
                            inventory        : transaction.inventory?.warehouse?.name,
                            source           : transaction.source?.name,
                            destination      : transaction.destination?.name,
                            createdBy        : transaction.createdBy?.name,
                            dateCreated      : transaction.dateCreated?.toString(),
                    ]
                },
        ] as JSON)
    }

    /**
     * Deletes a transaction from the React transaction list screen.
     * Mirrors InventoryController.deleteTransaction with a JSON response.
     */
    @Transactional
    def deleteTransaction() {
        def transactionInstance = Transaction.get(params.id)
        if (!transactionInstance) {
            response.status = 404
            render([
                    success: false,
                    message: getMessage("default.not.found.message", "Not found",
                            [getMessage("transaction.label", "Transaction"), params.id] as Object[]),
            ] as JSON)
            return
        }
        try {
            inventoryService.deleteTransaction(transactionInstance)
            render([
                    success: true,
                    message: getMessage("default.deleted.message", "Deleted",
                            [getMessage("transaction.label", "Transaction"), params.id] as Object[]),
            ] as JSON)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = 400
            render([
                    success: false,
                    message: getMessage("default.not.deleted.message", "Could not delete",
                            [getMessage("transaction.label", "Transaction"), params.id] as Object[]),
            ] as JSON)
        }
    }

    /**
     * Data provider for the React show transaction screen (replaces inventory/showTransaction.gsp model).
     */
    def showTransaction() {
        def transactionInstance = Transaction.get(params?.id)
        if (!transactionInstance) {
            response.status = 404
            render([error: getMessage("inventory.noTransactionWithId.message", "Transaction not found", [params.id] as Object[])] as JSON)
            return
        }

        render([
                isSuperuser: userService.isSuperuser(User.get(session?.user?.id)),
                transaction: [
                        id               : transactionInstance.id,
                        transactionNumber: transactionInstance.transactionNumber,
                        transactionDate  : transactionInstance.transactionDate?.format(Constants.DEFAULT_DATE_TIME_FORMAT),
                        transactionType  : transactionInstance.transactionType ? [
                                id             : transactionInstance.transactionType.id,
                                name           : getLocalizedMetadata(transactionInstance.transactionType.name),
                                transactionCode: transactionInstance.transactionType.transactionCode?.name(),
                        ] : null,
                        source           : transactionInstance.source?.name,
                        destination      : transactionInstance.destination?.name,
                        inventory        : transactionInstance.inventory?.warehouse?.name,
                        outgoingShipment : transactionInstance.outgoingShipment ? [
                                id            : transactionInstance.outgoingShipment.id,
                                shipmentNumber: transactionInstance.outgoingShipment.shipmentNumber,
                        ] : null,
                        incomingShipment : transactionInstance.incomingShipment ? [
                                id            : transactionInstance.incomingShipment.id,
                                shipmentNumber: transactionInstance.incomingShipment.shipmentNumber,
                        ] : null,
                        receipt          : transactionInstance.receipt ? [
                                id           : transactionInstance.receipt.id,
                                receiptNumber: transactionInstance.receipt.receiptNumber,
                        ] : null,
                        order            : transactionInstance.order ? [
                                id  : transactionInstance.order.id,
                                name: transactionInstance.order.name,
                        ] : null,
                        createdBy        : transactionInstance.createdBy?.name,
                        updatedBy        : transactionInstance.updatedBy?.name,
                        dateCreated      : transactionInstance.dateCreated?.format(Constants.DEFAULT_DATE_TIME_FORMAT),
                        lastUpdated      : transactionInstance.lastUpdated?.format(Constants.DEFAULT_DATE_TIME_FORMAT),
                        comment          : transactionInstance.comment,
                        localTransfer    : transactionInstance.localTransfer ? [
                                sourceTransaction     : serializeLocalTransferTransaction(transactionInstance.localTransfer.sourceTransaction),
                                destinationTransaction: serializeLocalTransferTransaction(transactionInstance.localTransfer.destinationTransaction),
                        ] : null,
                        entries          : transactionInstance.transactionEntries.collect { entry ->
                            [
                                    id           : entry.id,
                                    product      : serializeProduct(entry.inventoryItem?.product),
                                    binLocation  : entry.binLocation?.name,
                                    inventoryItem: serializeInventoryItem(entry.inventoryItem),
                                    quantity     : entry.quantity,
                            ]
                        },
                ],
        ] as JSON)
    }

    /**
     * Data provider for the React manage inventory screen (replaces inventory/binLocations JSON datatable source).
     */
    def listBinLocations() {
        Location location = Location.load(session.warehouse.id)
        List binLocations = productAvailabilityService.getQuantityOnHandByBinLocation(location)

        render([
                data: binLocations.collect {
                    [
                            productCode   : it?.inventoryItem?.product?.productCode,
                            productName   : it?.inventoryItem?.product?.name,
                            binLocation   : it?.binLocation?.name,
                            lotNumber     : it?.inventoryItem?.lotNumber,
                            expirationDate: it?.inventoryItem?.expirationDate ?
                                    Constants.EXPIRATION_DATE_FORMATTER.format(it?.inventoryItem?.expirationDate) : null,
                            quantity      : it?.quantity,
                    ]
                },
        ] as JSON)
    }

    /**
     * Data provider for the React show products screen (replaces inventory/showProducts.gsp model).
     */
    def showProducts() {
        def products = inventoryService.findProductsWithoutEmptyLotNumber()
        def productsByCategory = products.groupBy { it.category }

        render([
                categories: productsByCategory.collect { category, categoryProducts ->
                    [
                            name    : category?.name,
                            products: categoryProducts.collect { product ->
                                [
                                        id         : product.id,
                                        productCode: product.productCode,
                                        name       : product.name,
                                ]
                            },
                    ]
                },
        ] as JSON)
    }

    /**
     * Parses an uploaded inventory file for the React upload inventory screen (replaces inventory/upload.gsp model).
     */
    def uploadInventory() {
        def inventoryList = [:]
        File localFile = null
        MultipartHttpServletRequest mpr = (MultipartHttpServletRequest) request
        MultipartFile uploadFile = mpr.getFile("file")
        if (!uploadFile?.empty) {
            try {
                localFile = uploadService.createLocalFile(uploadFile.originalFilename)
                uploadFile.transferTo(localFile)
            } catch (Exception e) {
                throw new RuntimeException(e)
            }
        }

        if (!localFile) {
            response.status = 400
            render([error: getMessage("inventory.upload.noFile.message", "Please select a file to upload")] as JSON)
            return
        }

        def excelImporter = new InventoryExcelImporter(localFile.absolutePath)
        inventoryList = excelImporter.data

        render([
                inventoryList: inventoryList.collect { row ->
                    row.collect { key, value -> [key: key?.toString(), value: value?.toString()] }
                },
        ] as JSON)
    }

    private Map serializeLocalTransferTransaction(Transaction transaction) {
        if (!transaction) return null
        [
                id               : transaction.id,
                transactionNumber: transaction.transactionNumber ?: transaction.transactionType?.name,
        ]
    }

    private Map serializeProduct(Product product) {
        if (!product) return null
        [
                id           : product.id,
                productCode  : product.productCode,
                name         : product.name,
                unitOfMeasure: product.unitOfMeasure,
        ]
    }

    private Map serializeInventoryItem(InventoryItem inventoryItem) {
        if (!inventoryItem) return null
        [
                id            : inventoryItem.id,
                lotNumber     : inventoryItem.lotNumber,
                expirationDate: inventoryItem.expirationDate?.format("MMM dd, yyyy"),
                productId     : inventoryItem.product?.id,
        ]
    }

    private String getMessage(String code, String defaultMessage, Object[] args = null) {
        messageSource.getMessage(code, args, defaultMessage, request?.locale ?: Locale.default)
    }

    private String getLocalizedMetadata(String name) {
        // TransactionType names use pipe-delimited localized values (see LocalizationUtil)
        org.pih.warehouse.LocalizationUtil.getLocalizedString(name, request?.locale ?: Locale.default)
    }

    private List resolveErrors(errors) {
        errors?.allErrors?.collect { error ->
            messageSource.getMessage(error, request?.locale ?: Locale.default)
        } ?: []
    }
}
