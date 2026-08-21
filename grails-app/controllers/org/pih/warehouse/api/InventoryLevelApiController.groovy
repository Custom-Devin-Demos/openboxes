package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.PagedResultList
import grails.gorm.transactions.Transactional
import org.pih.warehouse.core.DocumentService
import org.pih.warehouse.core.Location
import org.pih.warehouse.data.DataService
import org.pih.warehouse.importer.InventoryLevelImportDataService
import org.pih.warehouse.inventory.InventoryLevel
import org.pih.warehouse.inventory.InventoryStatus
import org.pih.warehouse.product.Product

class InventoryLevelApiController {

    DataService dataService
    DocumentService documentService
    InventoryLevelImportDataService inventoryLevelImportDataService
    def productService
    def locationService
    def localizationService
    def messageSource

    def list() {
        Location facility = Location.get(params.facilityId)
        if (!facility)
            throw new IllegalArgumentException("Unable to locate facility with id ${params.facilityId}")

        List inventoryLevels = InventoryLevel.createCriteria().list {
            eq("inventory", facility.inventory)
            isNull("internalLocation")
        }

        withFormat {
            "xls" {
                def data = dataService.transformObjects(inventoryLevels, InventoryLevel.PROPERTIES)
                documentService.generateExcel(response.outputStream, data)
                response.setHeader 'Content-disposition', "attachment; filename=\"inventory-levels.xls\""
                response.outputStream.flush()
                return
            }
            "csv" {
                String text = inventoryLevelImportDataService.exportInventoryLevels(inventoryLevels)
                response.contentType = "text/csv"
                response.setHeader("Content-disposition", "attachment; filename=\"inventory-levels.csv\"")
                render(text)
                return
            }

            "*" {
                render([data: inventoryLevels] as JSON)
            }
        }
    }

    /**
     * Data provider for the React inventory level list screen (replaces inventoryLevel/list.gsp model).
     */
    def search() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)

        def terms = params.q ? params?.q?.split(" ") : null
        def products = terms ? productService.searchProducts(terms, null) : []
        def location = Location.get(params?.location?.id)

        PagedResultList inventoryLevels = InventoryLevel.createCriteria().list(params) {
            if (location?.inventory) {
                eq("inventory", location.inventory)
            }
            if (products) {
                'in'("product", products)
            }
        }

        render([
                inventoryLevels: inventoryLevels.collect { InventoryLevel inventoryLevel ->
                    [
                            id             : inventoryLevel.id,
                            status         : inventoryLevel.status?.name(),
                            product        : [
                                    id         : inventoryLevel.product?.id,
                                    productCode: inventoryLevel.product?.productCode,
                                    name       : inventoryLevel.product?.name,
                            ],
                            inventory      : inventoryLevel.inventory?.warehouse?.name,
                            minQuantity    : inventoryLevel.minQuantity,
                            reorderQuantity: inventoryLevel.reorderQuantity,
                            maxQuantity    : inventoryLevel.maxQuantity,
                            dateCreated    : inventoryLevel.dateCreated,
                    ]
                },
                totalCount     : inventoryLevels?.totalCount ?: 0,
                locations      : locationService.getLocations(null, [:]).sort { it?.name?.toLowerCase() }.collect {
                    [id: it.id, name: it.name]
                },
        ] as JSON)
    }

    /**
     * Data provider for the React inventory level show screen (replaces inventoryLevel/show.gsp model).
     */
    def details() {
        InventoryLevel inventoryLevel = InventoryLevel.get(params.id)
        if (!inventoryLevel) {
            response.status = 404
            render([errorMessage: getMessage("default.not.found.message",
                    [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                    "InventoryLevel not found")] as JSON)
            return
        }
        render([inventoryLevel: toDetailedMap(inventoryLevel)] as JSON)
    }

    /**
     * Data provider for the React inventory level create/edit form
     * (replaces inventoryLevel/create.gsp and inventoryLevel/edit.gsp models).
     */
    def formContext() {
        InventoryLevel inventoryLevel = params.id ? InventoryLevel.get(params.id) : null

        // Mirrors legacy InventoryLevelController.edit fallback: the id may be a product id
        if (params.id && !inventoryLevel) {
            Product productInstance = Product.get(params.id)
            inventoryLevel = productInstance ? InventoryLevel.findByProduct(productInstance) : null
        }
        if (params.id && !inventoryLevel) {
            response.status = 404
            render([errorMessage: getMessage("default.not.found.message",
                    [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                    "InventoryLevel not found")] as JSON)
            return
        }

        Product product = inventoryLevel?.product ?: (params['product.id'] ? Product.get(params['product.id']) : null)
        Location location = inventoryLevel?.inventory?.warehouse ?: Location.get(session?.warehouse?.id)
        def binLocations = location?.hasBinLocationSupport() ?
                locationService.getBinLocations(location).sort { it?.name?.toLowerCase() } : []

        render([
                inventoryLevel: inventoryLevel ? toDetailedMap(inventoryLevel) : null,
                product       : product ? [
                        id         : product.id,
                        productCode: product.productCode,
                        name       : product.name,
                        displayName: product.displayNameOrDefaultName,
                        unitOfMeasure: product.unitOfMeasure,
                ] : null,
                location      : location ? [id: location.id, name: location.name] : null,
                statusOptions : InventoryStatus.values().collect { it.name() },
                binLocations  : binLocations.collect { [id: it.id, name: it.name] },
        ] as JSON)
    }

    /**
     * Mirrors legacy InventoryLevelController.save with a JSON response instead of flash/redirect.
     */
    @Transactional
    def save() {
        Product product = Product.get(params.product.id)
        Location location = Location.get(params.location.id)
        Location internalLocation = params.internalLocation ? Location.get(params.internalLocation) : null

        def existingInventoryLevel = InventoryLevel.createCriteria().count {
            eq("product", product)
            eq("inventory", location.inventory)
            if (internalLocation) {
                eq("internalLocation", internalLocation)
            } else {
                isNull("internalLocation")
            }
        }
        if (existingInventoryLevel) {
            response.status = 400
            render([
                    success      : false,
                    errorMessages: ["Inventory level already exists for '${product?.name}' in location '${location?.name}', bin location '${internalLocation?.name}' ".toString()],
            ] as JSON)
            return
        }

        InventoryLevel inventoryLevel = new InventoryLevel(params)
        inventoryLevel.inventory = location.inventory
        if (inventoryLevel.save(flush: true)) {
            render([
                    success  : true,
                    message  : getMessage("default.created.message",
                            [getMessage("inventoryLevel.label", null, "InventoryLevel"), inventoryLevel.id] as Object[],
                            "InventoryLevel created"),
                    id       : inventoryLevel.id,
                    productId: inventoryLevel.product?.id,
            ] as JSON)
            return
        }

        response.status = 400
        render([success: false, errorMessages: resolveErrors(inventoryLevel.errors)] as JSON)
    }

    /**
     * Mirrors legacy InventoryLevelController.update with a JSON response instead of flash/redirect.
     */
    @Transactional
    def update() {
        InventoryLevel inventoryLevel = InventoryLevel.get(params.id)
        if (!inventoryLevel) {
            response.status = 404
            render([success: false, errorMessages: [getMessage("default.not.found.message",
                    [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                    "InventoryLevel not found")]] as JSON)
            return
        }
        if (params.version) {
            def version = params.version.toLong()
            if (inventoryLevel.version > version) {
                inventoryLevel.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [getMessage("inventoryLevel.label", null, "InventoryLevel")] as Object[],
                        "Another user has updated this InventoryLevel while you were editing")
                response.status = 400
                render([success: false, errorMessages: resolveErrors(inventoryLevel.errors)] as JSON)
                return
            }
        }
        inventoryLevel.properties = params
        if (!inventoryLevel.hasErrors() && inventoryLevel.save(flush: true)) {
            render([
                    success  : true,
                    message  : getMessage("default.updated.message",
                            [getMessage("inventoryLevel.label", null, "InventoryLevel"), inventoryLevel.id] as Object[],
                            "InventoryLevel updated"),
                    productId: inventoryLevel.product?.id,
            ] as JSON)
            return
        }
        response.status = 400
        render([success: false, errorMessages: resolveErrors(inventoryLevel.errors)] as JSON)
    }

    /**
     * Mirrors legacy InventoryLevelController.delete with a JSON response instead of flash/redirect.
     */
    @Transactional
    def delete() {
        InventoryLevel inventoryLevel = InventoryLevel.get(params.id)
        if (!inventoryLevel) {
            response.status = 404
            render([success: false, errorMessages: [getMessage("default.not.found.message",
                    [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                    "InventoryLevel not found")]] as JSON)
            return
        }
        String productId = inventoryLevel?.product?.id
        try {
            inventoryLevel.delete(flush: true)
            render([
                    success  : true,
                    message  : getMessage("default.deleted.message",
                            [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                            "InventoryLevel deleted"),
                    productId: productId,
            ] as JSON)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = 400
            render([success: false, errorMessages: [getMessage("default.not.deleted.message",
                    [getMessage("inventoryLevel.label", null, "InventoryLevel"), params.id] as Object[],
                    "InventoryLevel could not be deleted")], productId: productId] as JSON)
        }
    }

    private static Map toDetailedMap(InventoryLevel inventoryLevel) {
        return [
                id                     : inventoryLevel.id,
                version                : inventoryLevel.version,
                status                 : inventoryLevel.status?.name(),
                product                : [
                        id           : inventoryLevel.product?.id,
                        productCode  : inventoryLevel.product?.productCode,
                        name         : inventoryLevel.product?.name,
                        displayName  : inventoryLevel.product?.displayNameOrDefaultName,
                        unitOfMeasure: inventoryLevel.product?.unitOfMeasure,
                ],
                inventory              : [
                        id  : inventoryLevel.inventory?.id,
                        name: inventoryLevel.inventory?.warehouse?.name,
                ],
                internalLocation       : inventoryLevel.internalLocation ?
                        [id: inventoryLevel.internalLocation.id, name: inventoryLevel.internalLocation.name] : null,
                preferredBinLocation   : inventoryLevel.preferredBinLocation ?
                        [id: inventoryLevel.preferredBinLocation.id, name: inventoryLevel.preferredBinLocation.name] : null,
                replenishmentLocation  : inventoryLevel.replenishmentLocation ?
                        [id: inventoryLevel.replenishmentLocation.id, name: inventoryLevel.replenishmentLocation.name] : null,
                abcClass               : inventoryLevel.abcClass,
                comments               : inventoryLevel.comments,
                minQuantity            : inventoryLevel.minQuantity,
                reorderQuantity        : inventoryLevel.reorderQuantity,
                maxQuantity            : inventoryLevel.maxQuantity,
                expectedLeadTimeDays   : inventoryLevel.expectedLeadTimeDays,
                replenishmentPeriodDays: inventoryLevel.replenishmentPeriodDays,
                forecastQuantity       : inventoryLevel.forecastQuantity,
                forecastPeriodDays     : inventoryLevel.forecastPeriodDays,
                dateCreated            : inventoryLevel.dateCreated,
                lastUpdated            : inventoryLevel.lastUpdated,
        ]
    }

    private String getMessage(String code, Object[] args = null, String defaultMessage = null) {
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
}
