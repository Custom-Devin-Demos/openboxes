package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import org.pih.warehouse.auth.AuthService
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.User
import org.pih.warehouse.core.UserService
import org.pih.warehouse.product.Product
import org.pih.warehouse.requisition.ReplenishmentTypeCode
import org.pih.warehouse.requisition.Requisition
import org.pih.warehouse.requisition.RequisitionItem
import org.pih.warehouse.requisition.RequisitionItemSortByCode
import org.pih.warehouse.requisition.RequisitionStatus
import org.pih.warehouse.requisition.RequisitionTemplateService
import org.pih.warehouse.requisition.RequisitionType

@Transactional
class RequisitionTemplateApiController {

    UserService userService
    RequisitionTemplateService requisitionTemplateService

    private static final String DATE_FORMAT = "MM/dd/yyyy hh:mm a"

    private Map optionsData() {
        [
                replenishmentTypeCodeOptions: ReplenishmentTypeCode.list().collect { ReplenishmentTypeCode code ->
                    [id: code.name(), label: code.name()]
                },
                sortByCodeOptions           : RequisitionItemSortByCode.list().collect { RequisitionItemSortByCode code ->
                    [id: code.name(), label: code.friendlyName]
                },
        ]
    }

    private Map permissionsData() {
        User user = User.get(session?.user?.id)
        [
                isUserAdmin   : userService.isUserAdmin(user),
                hasRoleFinance: userService.hasRoleFinance(user),
        ]
    }

    def createContext() {
        Location origin = Location.get(session?.warehouse?.id)
        render([data: [
                originId  : origin?.id,
                originName: origin?.name,
                createdById: session?.user?.id,
        ] + optionsData() + permissionsData()] as JSON)
    }

    def details() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Could not find requisition with ID ${params.id}"] as JSON)
            return
        }
        def lastUpdated = [requisition.lastUpdated, requisition.requisitionItems*.lastUpdated?.max()].findAll { it }.max()
        render([data: [
                id                   : requisition.id,
                version              : requisition.version,
                name                 : requisition.name,
                type                 : requisition.type?.name(),
                isPublished          : requisition.isPublished,
                originId             : requisition.origin?.id,
                originName           : requisition.origin?.name,
                destinationId        : requisition.destination?.id,
                destinationName      : requisition.destination?.name,
                sessionWarehouseName : session?.warehouse?.name,
                requisitionItemCount : requisition.requisitionItems?.size() ?: 0,
                commodityClass       : requisition.commodityClass?.name(),
                commodityClassLabel  : requisition.commodityClass ?
                        warehouse.message(code: "enum.CommodityClass." + requisition.commodityClass, default: requisition.commodityClass.name()) : null,
                requestedById        : requisition.requestedBy?.id,
                requestedByName      : requisition.requestedBy?.name,
                replenishmentPeriod  : requisition.replenishmentPeriod,
                replenishmentTypeCode: requisition.replenishmentTypeCode?.name(),
                sortByCode           : requisition.sortByCode?.name(),
                sortByCodeLabel      : requisition.sortByCode?.friendlyName,
                description          : requisition.description,
                totalCost            : requisition.totalCost ?: 0,
                currencyCode         : grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                createdByName        : requisition.createdBy?.name,
                dateCreated          : requisition.dateCreated?.format(DATE_FORMAT),
                updatedByName        : requisition.updatedBy?.name,
                lastUpdated          : lastUpdated?.format(DATE_FORMAT),
        ] + optionsData() + permissionsData()] as JSON)
    }

    def save() {
        def jsonRequest = request.JSON
        Requisition requisition = new Requisition(status: RequisitionStatus.CREATED)
        requisition.isTemplate = true
        requisition.type = jsonRequest.type ? jsonRequest.type as RequisitionType : null
        requisition.createdBy = jsonRequest.createdById ? User.get(jsonRequest.createdById) : User.get(session?.user?.id)
        bindHeaderFields(requisition, jsonRequest)

        if (!requisition.hasErrors() && requisition.save()) {
            render([success: true, data: [id: requisition.id]] as JSON)
        } else {
            response.status = 400
            render([success: false, errors: requisition.errors.allErrors.collect { g.message(error: it) }] as JSON)
        }
    }

    def updateHeader() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: warehouse.message(code: 'default.not.found.message',
                    args: [warehouse.message(code: 'requisition.label', default: 'Requisition'), params.id])] as JSON)
            return
        }
        def jsonRequest = request.JSON
        if (jsonRequest.version != null) {
            Long version = jsonRequest.version as Long
            if (requisition.version > version) {
                response.status = 400
                render([success: false, errors: [warehouse.message(code: 'default.optimistic.locking.failure',
                        args: [warehouse.message(code: 'requisition.label', default: 'Requisition')],
                        default: "Another user has updated this requisition while you were editing")]] as JSON)
                return
            }
        }
        bindHeaderFields(requisition, jsonRequest)
        requisition.lastUpdated = new Date()
        requisition.updatedBy = AuthService.currentUser

        if (!requisition.hasErrors() && requisition.save(flush: true)) {
            render([success: true, data: [id: requisition.id]] as JSON)
        } else {
            response.status = 400
            render([success: false, errors: requisition.errors.allErrors.collect { g.message(error: it) }] as JSON)
        }
    }

    private void bindHeaderFields(Requisition requisition, def jsonRequest) {
        if (jsonRequest.containsKey("name")) {
            requisition.name = jsonRequest.name ?: null
        }
        if (jsonRequest.containsKey("originId")) {
            requisition.origin = jsonRequest.originId ? Location.get(jsonRequest.originId) : null
        }
        if (jsonRequest.containsKey("destinationId")) {
            requisition.destination = jsonRequest.destinationId ? Location.get(jsonRequest.destinationId) : null
        }
        if (jsonRequest.containsKey("requestedById")) {
            requisition.requestedBy = jsonRequest.requestedById ? Person.get(jsonRequest.requestedById) : null
        }
        if (jsonRequest.containsKey("replenishmentPeriod")) {
            requisition.replenishmentPeriod = jsonRequest.replenishmentPeriod ?
                    jsonRequest.replenishmentPeriod as Integer : null
        }
        if (jsonRequest.containsKey("replenishmentTypeCode")) {
            requisition.replenishmentTypeCode = jsonRequest.replenishmentTypeCode ?
                    jsonRequest.replenishmentTypeCode as ReplenishmentTypeCode : null
        }
        if (jsonRequest.containsKey("sortByCode")) {
            requisition.sortByCode = jsonRequest.sortByCode ?
                    jsonRequest.sortByCode as RequisitionItemSortByCode : null
        }
        if (jsonRequest.containsKey("description")) {
            requisition.description = jsonRequest.description ?: null
        }
    }

    def importData() {
        Integer skipLines = params.int('skipLines') ?: 0
        String delimiter = params.delimiter ?: ","
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Could not find requisition with ID ${params.id}"] as JSON)
            return
        }
        InputStream inputStream = params.csv
                ? new ByteArrayInputStream(params.csv.getBytes("UTF-8"))
                : request.getFile('file')?.inputStream

        List<Object> data = requisitionTemplateService.parseImportFile(inputStream, requisition, delimiter, skipLines)
        List<String> errors = requisitionTemplateService.validateImportData(data)

        session.data = data
        render([data: data, errors: errors] as JSON)
    }

    def doImport() {
        def updateCount = 0
        def insertCount = 0
        def ignoreCount = 0
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Could not find requisition with ID ${params.id}"] as JSON)
            return
        }
        List<String> errors = []
        String message = null
        if (session.data) {
            def data = session.data
            data.eachWithIndex { row, index ->
                // Ignore the first row if the user included header info
                if (row[0] != "Product Code" && row[2] != "Quantity") {
                    try {
                        def productCode = row[0]
                        def quantity = Integer.parseInt(row[2])
                        // Ignore if quantity is null or 0
                        if (quantity) {
                            def product = Product.findByProductCode(productCode)
                            if (product) {
                                def requisitionItem = requisition.requisitionItems.find {
                                    it.product == product
                                }
                                if (requisitionItem) {
                                    if (requisitionItem.quantity != quantity) {
                                        requisitionItem.quantity = quantity
                                        updateCount++
                                    } else {
                                        ignoreCount++
                                    }
                                } else {
                                    requisitionItem = new RequisitionItem()
                                    requisitionItem.product = product
                                    requisitionItem.orderIndex = index
                                    requisitionItem.quantity = quantity
                                    requisitionItem.substitutable = false
                                    requisition.addToRequisitionItems(requisitionItem)
                                    insertCount++
                                }
                            } else {
                                errors << "${index + 1}: Product with product code '${row[0]}' does not exist".toString()
                                ignoreCount++
                            }
                        }
                    } catch (NumberFormatException e) {
                        errors << "${index + 1}: Invalid quantity '${row[2]}' for product code '${row[0]}'".toString()
                        ignoreCount++
                    }
                }
            }
            requisition.save(flush: true)
            session.data = null
            message = "Imported ${insertCount} stock list items; updated ${updateCount} stock list items; ignored ${ignoreCount} stock list items"
        }
        render([success: true, message: message, errors: errors] as JSON)
    }

    def addItems() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Could not find requisition with ID ${params.id}"] as JSON)
            return
        }
        def jsonRequest = request.JSON
        String multipleProductCodes = jsonRequest.multipleProductCodes ?: ""
        def productCodes = multipleProductCodes.split(",")
        def processedProductCodes = []
        def ignoredProductCodes = []
        def count = requisition.requisitionItems.size() ?: 0
        productCodes.eachWithIndex { productCode, index ->
            def product = Product.findByProductCode(productCode.trim())
            if (product) {
                def requisitionItem = requisition.requisitionItems.find {
                    it.product == product
                }
                if (!requisitionItem) {
                    requisitionItem = new RequisitionItem()
                    requisitionItem.product = product
                    requisitionItem.quantity = 1
                    requisitionItem.substitutable = false
                    requisitionItem.orderIndex = count + index
                    requisition.updatedBy = session.user
                    requisition.addToRequisitionItems(requisitionItem)
                    requisition.save()
                    processedProductCodes << productCode
                } else {
                    ignoredProductCodes << productCode
                }
            } else {
                ignoredProductCodes << productCode
            }
        }
        String message = "Added requisition item with product codes " + processedProductCodes ?: "none" + " (ignored: " + ignoredProductCodes + ")"
        render([success: true, message: message] as JSON)
    }
}
