/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.ReasonCode
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.picklist.Picklist
import org.pih.warehouse.picklist.PicklistItem
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductPackage
import org.pih.warehouse.requisition.CommodityClass
import org.pih.warehouse.requisition.Requisition
import org.pih.warehouse.requisition.RequisitionItem
import org.pih.warehouse.requisition.RequisitionStatus
import org.pih.warehouse.requisition.RequisitionType

@Transactional
class RequisitionApiController {

    def requisitionService
    def requisitionIdentifierService
    def inventoryService
    def userService

    private static final String DATE_FORMAT = "MM/dd/yyyy"
    private static final String DISPLAY_DATE_FORMAT = "dd/MMM/yyyy hh:mm:ss a z"

    def templates() {
        def requisitionCriteria = new Requisition(isTemplate: true)
        requisitionCriteria.origin = Location.get(session?.warehouse?.id)
        params.max = -1
        params.offset = 0
        def requisitionTemplates = requisitionService.getAllRequisitionTemplates(requisitionCriteria, params)
        requisitionTemplates.sort { it.destination.name }
        render([data: requisitionTemplates.collect { template ->
            [
                    id             : template.id,
                    name           : template.name,
                    originName     : template.origin?.name,
                    destinationName: template.destination?.name,
                    commodityClass : template.commodityClass ?
                            warehouse.message(code: "enum.CommodityClass." + template.commodityClass, default: template.commodityClass.name()) : null,
            ]
        }] as JSON)
    }

    def template() {
        Requisition requisitionTemplate = Requisition.get(params.id)
        if (!requisitionTemplate) {
            response.status = 404
            render([errorMessage: "Could not find requisition template"] as JSON)
            return
        }
        render([data: [
                id              : requisitionTemplate.id,
                name            : requisitionTemplate.name,
                type            : requisitionTemplate.type?.name(),
                originId        : requisitionTemplate.origin?.id,
                originName      : requisitionTemplate.origin?.name,
                destinationId   : requisitionTemplate.destination?.id,
                destinationName : requisitionTemplate.destination?.name,
                commodityClass  : requisitionTemplate.commodityClass?.name(),
                requisitionItems: requisitionTemplate.requisitionItems?.sort()?.collect { RequisitionItem requisitionItem ->
                    [
                            productId         : requisitionItem.product?.id,
                            productCode       : requisitionItem.product?.productCode,
                            productName       : requisitionItem.product?.name,
                            quantity          : requisitionItem.quantity,
                            productPackageId  : requisitionItem.productPackage?.id,
                            productPackageName: requisitionItem.productPackage ?
                                    (requisitionItem.productPackage?.uom?.code + "/" + requisitionItem.productPackage?.quantity) : null,
                            orderIndex        : requisitionItem.orderIndex,
                    ]
                },
        ]] as JSON)
    }

    def create() {
        def jsonRequest = request.JSON
        def requisition = new Requisition()
        requisition.status = jsonRequest.status ? jsonRequest.status as RequisitionStatus : RequisitionStatus.CREATED
        requisition.type = jsonRequest.type ? jsonRequest.type as RequisitionType : null
        requisition.origin = jsonRequest.originId ? Location.get(jsonRequest.originId) : null
        requisition.destination = jsonRequest.destinationId ? Location.get(jsonRequest.destinationId) : null
        requisition.requestedBy = jsonRequest.requestedById ? Person.get(jsonRequest.requestedById) : null
        requisition.createdBy = jsonRequest.createdById ? User.get(jsonRequest.createdById) : User.get(session?.user?.id)
        requisition.description = jsonRequest.description ?: null
        if (jsonRequest.dateRequested) {
            requisition.dateRequested = Date.parse(DATE_FORMAT, jsonRequest.dateRequested.toString())
        }
        if (jsonRequest.commodityClass) {
            requisition.commodityClass = jsonRequest.commodityClass as CommodityClass
        }
        jsonRequest.requisitionItems?.each { itemData ->
            def requisitionItem = new RequisitionItem()
            requisitionItem.product = itemData.productId ? Product.get(itemData.productId) : null
            requisitionItem.quantity = itemData.quantity ? itemData.quantity as Integer : null
            requisitionItem.productPackage = itemData.productPackageId ? ProductPackage.get(itemData.productPackageId) : null
            requisitionItem.orderIndex = itemData.orderIndex ? itemData.orderIndex as Integer : 0
            requisition.addToRequisitionItems(requisitionItem)
        }
        requisition.name = generateName(requisition)
        requisition.requestNumber = requisitionIdentifierService.generate(requisition)
        requisition = requisitionService.saveRequisition(requisition)
        if (!requisition.hasErrors()) {
            render([success: true, data: requisition.toJson()] as JSON)
        } else {
            render([success: false, errors: requisition.errors.allErrors.collect { g.message(error: it) }] as JSON)
        }
    }

    def edit() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        if (requisition.status < RequisitionStatus.EDITING) {
            requisition.status = RequisitionStatus.EDITING
            requisition.save(flush: true)
        }
        render([data: requisition.toJson() + getHeaderData(requisition)
                + [requisitionItems: getRequisitionItemsData(requisition)]] as JSON)
    }

    def confirm() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        if (requisition.status < RequisitionStatus.CHECKING) {
            requisition.status = RequisitionStatus.CHECKING
            requisition.save(flush: true)
        }
        def rows = []
        requisition.requisitionItems?.sort()?.each { RequisitionItem requisitionItem ->
            def picklistItems = requisitionItem.retrievePicklistItems()
            if (picklistItems) {
                picklistItems.each { picklistItem ->
                    Boolean isSubstitution = picklistItem?.inventoryItem?.product != picklistItem?.requisitionItem?.product
                    rows << [
                            status                    : isSubstitution ? "Substitution" : "Fulfilled",
                            isSubstitution            : isSubstitution,
                            requestedProductCode      : picklistItem?.requisitionItem?.product?.productCode,
                            requestedProductName      : picklistItem?.requisitionItem?.product?.name,
                            productCode               : picklistItem?.inventoryItem?.product?.productCode,
                            productName               : picklistItem?.inventoryItem?.product?.name,
                            binLocationName           : picklistItem?.binLocation?.name,
                            lotNumber                 : picklistItem?.inventoryItem?.lotNumber,
                            quantityRequested         : requisitionItem.quantity ?: 0,
                            quantityPicked            : picklistItem.quantity ?: 0,
                            quantityCanceled          : requisitionItem.quantityCanceled ?: 0,
                            quantityRemaining         : requisitionItem.calculateQuantityRemaining() ?: 0,
                            unitOfMeasure             : picklistItem?.inventoryItem?.product?.unitOfMeasure ?: "EA",
                            cancelReasonCode          : requisitionItem.cancelReasonCode,
                            cancelComments            : requisitionItem.cancelComments,
                    ]
                }
            } else {
                rows << [
                        status           : "Canceled",
                        isSubstitution   : false,
                        productCode      : requisitionItem.product?.productCode,
                        productName      : requisitionItem.product?.name,
                        binLocationName  : null,
                        lotNumber        : null,
                        quantityRequested: requisitionItem.quantity ?: 0,
                        quantityPicked   : 0,
                        quantityCanceled : requisitionItem.quantityCanceled ?: 0,
                        quantityRemaining: requisitionItem.calculateQuantityRemaining() ?: 0,
                        unitOfMeasure    : requisitionItem.product?.unitOfMeasure ?: "EA",
                        cancelReasonCode : requisitionItem.cancelReasonCode ?: "N/A",
                        cancelComments   : requisitionItem.cancelComments,
                ]
            }
        }
        render([data: requisition.toJson() + getHeaderData(requisition)
                + [requisitionItems: getRequisitionItemsData(requisition), rows: rows]] as JSON)
    }

    def updateDetails() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        def jsonRequest = request.JSON
        if (jsonRequest.containsKey("checkedById")) {
            requisition.checkedBy = jsonRequest.checkedById ? Person.get(jsonRequest.checkedById) : null
        }
        if (jsonRequest.containsKey("dateChecked")) {
            requisition.dateChecked = jsonRequest.dateChecked ?
                    Date.parse(DATE_FORMAT, jsonRequest.dateChecked.toString()) : null
        }
        if (jsonRequest.containsKey("verifiedById")) {
            requisition.verifiedBy = jsonRequest.verifiedById ? Person.get(jsonRequest.verifiedById) : null
        }
        if (jsonRequest.containsKey("dateVerified")) {
            requisition.dateVerified = jsonRequest.dateVerified ?
                    Date.parse(DATE_FORMAT, jsonRequest.dateVerified.toString()) : null
        }
        if (jsonRequest.containsKey("pickerId") && requisition.picklist) {
            requisition.picklist.picker = jsonRequest.pickerId ? Person.get(jsonRequest.pickerId) : null
        }
        if (jsonRequest.containsKey("datePicked") && requisition.picklist) {
            requisition.picklist.datePicked = jsonRequest.datePicked ?
                    Date.parse(DATE_FORMAT, jsonRequest.datePicked.toString()) : null
        }
        requisition.save(flush: true)
        render([success: true] as JSON)
    }

    def list() {
        User user = User.get(session?.user?.id)
        Location currentLocation = Location.get(session?.warehouse?.id)

        params.origin = currentLocation
        def requisitionCriteria = new Requisition(params)

        def requisitions = requisitionService.getRequisitions(requisitionCriteria, params)
        def requisitionStatistics = requisitionService.getRequisitionStatistics(null, requisitionCriteria.origin, user)

        render([data: [
                totalCount   : requisitions.totalCount,
                requisitions : requisitions.collect { Requisition requisition ->
                    [
                            id             : requisition.id,
                            requestNumber  : requisition.requestNumber,
                            name           : requisition.name,
                            status         : requisition.status?.name(),
                            statusLabel    : requisition.status ? warehouse.message(code: "enum.RequisitionStatus." + requisition.status, default: requisition.status.name()) : null,
                            type           : requisition.type ? warehouse.message(code: "enum.RequisitionType." + requisition.type, default: requisition.type.name()) : null,
                            numItems       : requisition.requisitionItems?.size() ?: 0,
                            requestedByName: requisition.requestedBy?.name,
                            verifiedByName : requisition.verifiedBy?.name,
                            pickedByName   : requisition.picklist?.picker?.name,
                            checkedByName  : requisition.checkedBy?.name,
                            issuedByName   : requisition.issuedBy?.name,
                            dateRequested  : requisition.dateRequested?.time,
                            dateCreated    : requisition.dateCreated?.time,
                            dateIssued     : requisition.dateIssued?.time,
                            dateChecked    : requisition.dateChecked?.time,
                            datePicked     : requisition.picklist?.datePicked?.time,
                            dateVerified   : requisition.dateVerified?.time,
                            lastUpdated    : requisition.lastUpdated?.time,
                            isPending      : requisition.isPending(),
                    ]
                },
                statistics   : requisitionStatistics.collectEntries { key, value ->
                    [(key instanceof RequisitionStatus ? key.name() : key.toString()): value]
                },
                statusOptions: RequisitionStatus.list().collect { RequisitionStatus status ->
                    [id: status.name(), label: warehouse.message(code: "enum.RequisitionStatus." + status, default: status.name())]
                },
                typeOptions  : RequisitionType.list().collect { RequisitionType type ->
                    [id: type.name(), label: warehouse.message(code: "enum.RequisitionType." + type, default: type.name())]
                },
        ]] as JSON)
    }

    def editHeader() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        User user = User.get(session?.user?.id)
        render([data: requisition.toJson() + getHeaderData(requisition) + [
                requestNumber        : requisition.requestNumber,
                statusName           : requisition.status?.name(),
                commodityClass       : requisition.commodityClass?.name(),
                requestedDeliveryDate: requisition.requestedDeliveryDate?.format(DATE_FORMAT),
                verifiedById         : requisition.verifiedBy?.id,
                pickerId             : requisition.picklist?.picker?.id,
                pickerName           : requisition.picklist?.picker?.name,
                checkedByName        : requisition.checkedBy?.name,
                deliveredById        : requisition.deliveredBy?.id,
                deliveredByName      : requisition.deliveredBy?.name,
                receivedById         : requisition.receivedBy?.id,
                receivedByName       : requisition.receivedBy?.name,
                hasPicklist          : requisition.picklist != null,
                isUserAdmin          : userService.isUserAdmin(user),
                statusOptions        : RequisitionStatus.list().collect { RequisitionStatus status ->
                    [id: status.name(), label: warehouse.message(code: "enum.RequisitionStatus." + status, default: status.name())]
                },
                typeOptions          : RequisitionType.list().collect { RequisitionType type ->
                    [id: type.name(), label: warehouse.message(code: "enum.RequisitionType." + type, default: type.name())]
                },
        ]] as JSON)
    }

    def saveHeader() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        def jsonRequest = request.JSON
        if (jsonRequest.containsKey("requestNumber")) {
            requisition.requestNumber = jsonRequest.requestNumber ?: null
        }
        if (jsonRequest.containsKey("status") && jsonRequest.status) {
            requisition.status = jsonRequest.status as RequisitionStatus
        }
        if (jsonRequest.containsKey("type")) {
            requisition.type = jsonRequest.type ? jsonRequest.type as RequisitionType : null
        }
        if (jsonRequest.containsKey("originId")) {
            requisition.origin = jsonRequest.originId ? Location.get(jsonRequest.originId) : null
        }
        if (jsonRequest.containsKey("destinationId")) {
            requisition.destination = jsonRequest.destinationId ? Location.get(jsonRequest.destinationId) : null
        }
        if (jsonRequest.containsKey("commodityClass")) {
            requisition.commodityClass = jsonRequest.commodityClass ? jsonRequest.commodityClass as CommodityClass : null
        }
        if (jsonRequest.containsKey("requestedById")) {
            requisition.requestedBy = jsonRequest.requestedById ? Person.get(jsonRequest.requestedById) : null
        }
        if (jsonRequest.containsKey("verifiedById")) {
            requisition.verifiedBy = jsonRequest.verifiedById ? Person.get(jsonRequest.verifiedById) : null
        }
        if (jsonRequest.containsKey("checkedById")) {
            requisition.checkedBy = jsonRequest.checkedById ? Person.get(jsonRequest.checkedById) : null
        }
        if (jsonRequest.containsKey("deliveredById")) {
            requisition.deliveredBy = jsonRequest.deliveredById ? Person.get(jsonRequest.deliveredById) : null
        }
        if (jsonRequest.containsKey("receivedById")) {
            requisition.receivedBy = jsonRequest.receivedById ? Person.get(jsonRequest.receivedById) : null
        }
        if (jsonRequest.containsKey("pickerId") && requisition.picklist) {
            requisition.picklist.picker = jsonRequest.pickerId ? Person.get(jsonRequest.pickerId) : null
        }
        if (jsonRequest.containsKey("dateRequested")) {
            requisition.dateRequested = jsonRequest.dateRequested ?
                    Date.parse(DATE_FORMAT, jsonRequest.dateRequested.toString()) : null
        }
        if (jsonRequest.containsKey("requestedDeliveryDate")) {
            requisition.requestedDeliveryDate = jsonRequest.requestedDeliveryDate ?
                    Date.parse(DATE_FORMAT, jsonRequest.requestedDeliveryDate.toString()) : null
        }
        if (jsonRequest.containsKey("name")) {
            requisition.name = jsonRequest.name ?: null
        }
        if (jsonRequest.containsKey("description")) {
            requisition.description = jsonRequest.description ?: null
        }
        requisition.name = generateName(requisition)
        requisition = requisitionService.saveRequisition(requisition)
        if (requisition.hasErrors()) {
            render([success: false, errors: requisition.errors.allErrors.collect { g.message(error: it) }] as JSON)
            return
        }
        render([success: true, data: requisition.toJson()] as JSON)
    }

    def review() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        if (requisition.status < RequisitionStatus.VERIFYING) {
            requisition.status = RequisitionStatus.VERIFYING
            requisition.save(flush: true)
        }
        Location location = Location.get(session.warehouse.id)
        def quantityOnHandMap = getQuantityOnHandMap(location, requisition)
        render([data: requisition.toJson() + getHeaderData(requisition) + [
                verifiedById     : requisition.verifiedBy?.id,
                dateVerifiedInput: requisition.dateVerified?.format(DATE_FORMAT),
                quantityOnHandMap: quantityOnHandMap,
                requisitionItems : getReviewItemsData(requisition),
                reasonCodes      : ReasonCode.list().collect { ReasonCode reasonCode ->
                    [id: reasonCode.name(), label: warehouse.message(code: "enum.ReasonCode." + reasonCode, default: reasonCode.name())]
                },
        ]] as JSON)
    }

    def requisitionItemDetails() {
        RequisitionItem requisitionItem = RequisitionItem.get(params.itemId)
        if (!requisitionItem) {
            response.status = 404
            render([errorMessage: "Requisition item not found"] as JSON)
            return
        }
        Location location = Location.get(session.warehouse.id)
        def products = getRelatedProducts(requisitionItem)
        def relatedProducts = products.collect { Product product ->
            [
                    id           : product.id,
                    productCode  : product.productCode,
                    name         : product.name,
                    unitOfMeasure: product.unitOfMeasure ?: "EA",
                    quantityOnHand: inventoryService.getQuantityOnHand(location, product) ?: 0,
            ]
        }.sort { -it.quantityOnHand }
        render([data: [relatedProducts: relatedProducts]] as JSON)
    }

    def updateRequisitionItem() {
        Requisition requisition = Requisition.get(params.id)
        RequisitionItem requisitionItem = RequisitionItem.get(params.itemId)
        if (!requisition || !requisitionItem) {
            response.status = 404
            render([errorMessage: "Requisition item not found"] as JSON)
            return
        }
        def jsonRequest = request.JSON
        String action = jsonRequest.action
        String reasonCode = jsonRequest.reasonCode ?: null
        String comments = jsonRequest.comments ?: null
        String message = null
        try {
            switch (action) {
                case "undoChanges":
                    requisitionItem.undoChanges()
                    requisitionItem.save(flush: true)
                    break
                case "approveQuantity":
                    requisitionItem.approveQuantity()
                    message = "Requisition item was approved at ${requisitionItem.quantity}"
                    break
                case "cancelQuantity":
                    requisitionItem.cancelQuantity(reasonCode, comments)
                    break
                case "save":
                    Product product = jsonRequest.productId ? Product.get(jsonRequest.productId) : null
                    Integer quantity = jsonRequest.quantity != null ? jsonRequest.quantity as Integer : null
                    if (!product) {
                        render([success: false, errors: ["Must choose a substitution"]] as JSON)
                        return
                    }
                    if (product && requisitionItem.product != product) {
                        requisitionItem.chooseSubstitute(product, null, quantity, reasonCode, comments)
                        message = "Substitution was made due to ${reasonCode}"
                    } else if (requisitionItem.quantity != quantity) {
                        requisitionItem.changeQuantity(quantity, reasonCode, comments)
                        message = "Quantity was changed to ${quantity} due to ${reasonCode}"
                    } else {
                        requisitionItem.approveQuantity()
                        message = "Requisition item was approved at ${quantity}"
                    }
                    break
                default:
                    render([success: false, errors: ["Unknown action ${action}"]] as JSON)
                    return
            }
        } catch (ValidationException e) {
            render([success: false, errors: e.errors.allErrors.collect { g.message(error: it) }] as JSON)
            return
        }
        if (requisitionItem.hasErrors()) {
            render([success: false, errors: requisitionItem.errors.allErrors.collect { g.message(error: it) }] as JSON)
            return
        }
        render([success: true, message: message] as JSON)
    }

    def pick() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        if (!requisition.verifiedBy) {
            render([data: [verifiedByMissing: true,
                           message          : warehouse.message(code: 'requisition.verifiedBy.invalid.message')]] as JSON)
            return
        }
        if (requisition.status < RequisitionStatus.PICKING) {
            requisition.status = RequisitionStatus.PICKING
            requisition.requisitionItems.each { RequisitionItem requisitionItem ->
                if (requisitionItem.isPending()) {
                    requisitionItem.approveQuantity()
                }
            }
            requisition.save(flush: true)
        }
        Picklist picklist = Picklist.findByRequisition(requisition)
        if (!picklist) {
            picklist = new Picklist()
            picklist.requisition = requisition
            if (!picklist.save(flush: true)) {
                throw new ValidationException("Unable to create new picklist", picklist.errors)
            }
        }
        render([data: requisition.toJson() + getHeaderData(requisition) + [
                pickerId        : picklist.picker?.id,
                pickerName      : picklist.picker?.name,
                datePicked      : picklist.datePicked?.format(DATE_FORMAT),
                requisitionItems: requisition.requisitionItems?.sort()?.collect { RequisitionItem requisitionItem ->
                    requisitionItem.toJson() + [
                            statusLabel      : requisitionItem.status ? warehouse.message(code: "enum.RequisitionItemStatus." + requisitionItem.status, default: requisitionItem.status.toString()) : null,
                            cancelReasonCode : requisitionItem.cancelReasonCode,
                            productCode      : requisitionItem.product?.productCode,
                            isParent         : requisitionItem.parentRequisitionItem == null,
                            quantityPicked   : requisitionItem.calculateQuantityPicked() ?: 0,
                            quantityRemaining: requisitionItem.calculateQuantityRemaining() ?: 0,
                    ]
                } ?: [],
        ]] as JSON)
    }

    def picklistItems() {
        RequisitionItem requisitionItem = RequisitionItem.get(params.itemId)
        if (!requisitionItem) {
            response.status = 404
            render([errorMessage: "Requisition item not found"] as JSON)
            return
        }
        Location location = Location.get(session.warehouse.id)
        List<AvailableItem> availableItems = inventoryService.getAvailableBinLocations(location, requisitionItem.product)
        def picklistItems = requisitionItem.retrievePicklistItems()
        render([data: [
                cannotPick       : requisitionItem.isCanceled() || requisitionItem.isSubstituted() || requisitionItem.isChanged(),
                statusLabel      : requisitionItem.status ? warehouse.message(code: "enum.RequisitionItemStatus." + requisitionItem.status, default: requisitionItem.status.toString()) : null,
                productCode      : requisitionItem.product?.productCode,
                productName      : requisitionItem.product?.name,
                quantity         : requisitionItem.quantity ?: 0,
                unitOfMeasure    : requisitionItem.productPackage ?
                        "${requisitionItem.productPackage?.uom?.code}/${requisitionItem.productPackage?.quantity}" : "EA",
                quantityRemaining: requisitionItem.calculateQuantityRemaining() ?: 0,
                availableItems   : availableItems.collect { AvailableItem availableItem ->
                    def picklistItem = picklistItems?.find {
                        it.binLocation == availableItem.binLocation && it.inventoryItem == availableItem.inventoryItem
                    }
                    [
                            binLocationId    : availableItem.binLocation?.id,
                            binLocationName  : availableItem.binLocation?.name,
                            inventoryItemId  : availableItem.inventoryItem?.id,
                            lotNumber        : availableItem.inventoryItem?.lotNumber,
                            expirationDate   : availableItem.inventoryItem?.expirationDate?.format("d MMM yyyy"),
                            quantityAvailable: availableItem.quantityAvailable ?: 0,
                            unitOfMeasure    : availableItem.inventoryItem?.product?.unitOfMeasure ?: "EA",
                            picklistItemId   : picklistItem?.id,
                            quantityPicked   : picklistItem?.quantity ?: 0,
                    ]
                },
        ]] as JSON)
    }

    def updatePicklistItems() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        def jsonRequest = request.JSON
        RequisitionItem requisitionItem = RequisitionItem.get(jsonRequest.requisitionItemId)
        if (!requisitionItem) {
            response.status = 404
            render([errorMessage: "Requisition item not found"] as JSON)
            return
        }
        Picklist picklist = Picklist.findByRequisition(requisition)
        if (!picklist) {
            picklist = new Picklist()
            picklist.requisition = requisition
            if (!picklist.save(flush: true)) {
                throw new ValidationException("Unable to create new picklist", picklist.errors)
            }
        }
        jsonRequest.picklistItems?.each { itemData ->
            PicklistItem existingPicklistItem = itemData.id ? PicklistItem.get(itemData.id) : null
            Integer quantity = itemData.quantity != null ? itemData.quantity as Integer : 0
            if (quantity > 0) {
                if (existingPicklistItem) {
                    existingPicklistItem.quantity = quantity
                    existingPicklistItem.save(flush: true)
                } else {
                    PicklistItem picklistItem = new PicklistItem()
                    picklistItem.requisitionItem = requisitionItem
                    picklistItem.inventoryItem = itemData.inventoryItemId ?
                            InventoryItem.get(itemData.inventoryItemId) : null
                    picklistItem.binLocation = itemData.binLocationId ? Location.get(itemData.binLocationId) : null
                    picklistItem.quantity = quantity
                    picklist.addToPicklistItems(picklistItem)
                    picklist.save(flush: true)
                }
            } else {
                if (existingPicklistItem) {
                    picklist.removeFromPicklistItems(existingPicklistItem)
                    existingPicklistItem.delete()
                }
            }
        }
        render([success: true] as JSON)
    }

    def printDraft() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        Picklist picklist = Picklist.findByRequisition(requisition)
        Location location = Location.get(session.warehouse.id)
        def rows = []
        requisition.requisitionItems?.sort()?.eachWithIndex { RequisitionItem requisitionItem, int i ->
            def picklistItems = picklist ? requisitionItem.retrievePicklistItems() : null
            int numInventoryItem = picklist ? (picklistItems?.size() ?: 1) : (requisitionItem.calculateNumInventoryItem(location.inventory) ?: 1)
            (0..<numInventoryItem).each { int j ->
                def picklistItem = picklistItems ? (j < picklistItems.size() ? picklistItems[j] : null) : null
                rows << [
                        rowNumber        : i + 1,
                        productCode      : requisitionItem.product?.productCode,
                        productName      : requisitionItem.product?.name,
                        lotNumber        : picklistItem?.inventoryItem?.lotNumber,
                        expirationDate   : picklistItem?.inventoryItem?.expirationDate?.format("d MMM yyyy"),
                        quantityRequested: requisitionItem.quantity ?: 0,
                        unitOfMeasure    : requisitionItem.product?.unitOfMeasure ?: "EA",
                        binLocation      : requisitionItem.product?.getInventoryLevel(session.warehouse.id)?.binLocation ?: "N/A",
                        quantityPicked   : picklistItem?.quantity ?: 0,
                ]
            }
        }
        render([data: [
                name           : requisition.name,
                requestNumber  : requisition.requestNumber,
                originName     : requisition.origin?.name,
                dateRequested  : requisition.dateRequested?.format("MMMMM dd, yyyy"),
                requestedByName: requisition.requestedBy?.name,
                rows           : rows,
        ]] as JSON)
    }

    def process() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            response.status = 404
            render([errorMessage: "Requisition not found"] as JSON)
            return
        }
        def currentInventory = Location.get(session.warehouse.id).inventory
        Picklist picklist = Picklist.findByRequisition(requisition) ?: new Picklist()
        def productInventoryItemsMap = [:]
        def productInventoryItems = inventoryService.getInventoryItemsWithQuantity(
                requisition.requisitionItems?.collect { it.product }, currentInventory)
        productInventoryItems.keySet().each { product ->
            productInventoryItemsMap[product.id] = productInventoryItems[product].collect { it.toJson() }
        }
        render([data: [
                requisition             : requisition.toJson(),
                productInventoryItemsMap: productInventoryItemsMap,
                picklist                : picklist.toJson(),
        ]] as JSON)
    }

    private Map getQuantityOnHandMap(Location location, Requisition requisition) {
        def quantityOnHandMap = [:]
        def products = requisition.requisitionItems?.collect { it.product } ?: []
        if (products) {
            def quantityProductMap = inventoryService.getQuantityByProductMap(location.inventory, products)
            requisition.requisitionItems?.each { RequisitionItem requisitionItem ->
                quantityOnHandMap[requisitionItem.product?.id] = quantityProductMap[requisitionItem.product] ?: 0
            }
        }
        return quantityOnHandMap
    }

    private List getReviewItemsData(Requisition requisition) {
        requisition.originalRequisitionItems?.sort()?.collect { RequisitionItem requisitionItem ->
            [
                    id                     : requisitionItem.id,
                    status                 : requisitionItem.status?.toString(),
                    statusLabel            : requisitionItem.status ? warehouse.message(code: "enum.RequisitionItemStatus." + requisitionItem.status, default: requisitionItem.status.toString()) : null,
                    productId              : requisitionItem.product?.id,
                    productCode            : requisitionItem.product?.productCode,
                    productName            : requisitionItem.product?.name,
                    unitOfMeasure          : requisitionItem.product?.unitOfMeasure ?: "EA",
                    quantity               : requisitionItem.quantity ?: 0,
                    quantityApproved       : requisitionItem.quantityApproved ?: 0,
                    cancelReasonCode       : requisitionItem.cancelReasonCode ? warehouse.message(code: "enum.ReasonCode." + requisitionItem.cancelReasonCode, default: requisitionItem.cancelReasonCode) : null,
                    cancelComments         : requisitionItem.cancelComments,
                    isCanceled             : requisitionItem.isCanceled(),
                    isChanged              : requisitionItem.isChanged(),
                    isSubstituted          : requisitionItem.isSubstituted(),
                    isSubstitution         : requisitionItem.isSubstitution(),
                    isPending              : requisitionItem.isPending(),
                    isApproved             : requisitionItem.isApproved(),
                    isCompleted            : requisitionItem.isCompleted(),
                    canEdit                : requisitionItem.canChangeQuantity() || requisitionItem.canChooseSubstitute() || requisitionItem.canApproveQuantity(),
                    canUndoChanges         : requisitionItem.canUndoChanges(),
                    substitutionProductId  : requisitionItem.substitutionItem?.product?.id,
                    substitutionProductCode: requisitionItem.substitutionItem?.product?.productCode,
                    substitutionProductName: requisitionItem.substitutionItem?.product?.name,
                    substitutionUnitOfMeasure: requisitionItem.substitutionItem?.product?.unitOfMeasure ?: "EA",
                    substitutionQuantity   : requisitionItem.substitutionItem?.quantity ?: 0,
                    substitutionQuantityApproved: requisitionItem.substitutionItem?.quantityApproved ?: 0,
                    modificationProductId  : requisitionItem.modificationItem?.product?.id,
                    modificationQuantity   : requisitionItem.modificationItem?.quantity ?: 0,
                    modificationQuantityApproved: requisitionItem.modificationItem?.quantityApproved ?: 0,
            ]
        } ?: []
    }

    // FIXME Move to requisition item class (mirrors RequisitionController.getRelatedProducts)
    private List getRelatedProducts(RequisitionItem requisitionItem) {
        def products = []
        products << requisitionItem.product
        requisitionItem.product.productGroups.each { productGroup ->
            productGroup.products.each { product ->
                products.add(product)
            }
        }
        return products.unique()
    }

    private List getRequisitionItemsData(Requisition requisition) {
        requisition.requisitionItems?.sort()?.collect { RequisitionItem requisitionItem ->
            requisitionItem.toJson() + [
                    requisitionItemType: requisitionItem.requisitionItemType?.name(),
                    status             : requisitionItem.status?.toString(),
                    recipient          : requisitionItem.recipient?.name,
            ]
        } ?: []
    }

    private Map getHeaderData(Requisition requisition) {
        def itemsByStatus = requisition.requisitionItems ? requisition.requisitionItems.groupBy { it.status } : [:]
        [
                requestNumber    : requisition.requestNumber,
                commodityClass   : requisition.commodityClass?.name(),
                itemStatusCounts : itemsByStatus.collect { status, items ->
                    [status: status?.toString(), count: items.size()]
                },
                dateCreated      : requisition.dateCreated?.format(DISPLAY_DATE_FORMAT),
                createdByName    : requisition.createdBy?.name,
                updatedByName    : requisition.updatedBy?.name,
                dateVerified     : requisition.dateVerified?.format(DISPLAY_DATE_FORMAT),
                verifiedByName   : requisition.verifiedBy?.name,
                datePicked       : requisition.picklist?.datePicked?.format(DISPLAY_DATE_FORMAT),
                pickedByName     : requisition.picklist?.picker?.name,
                dateChecked      : requisition.dateChecked?.format(DATE_FORMAT),
                checkedById      : requisition.checkedBy?.id,
                checkedByName    : requisition.checkedBy?.name,
                dateIssued       : requisition.dateIssued?.format(DISPLAY_DATE_FORMAT),
                issuedByName     : requisition.issuedBy?.name,
                dateDelivered    : requisition.dateDelivered?.format(DISPLAY_DATE_FORMAT),
                deliveredByName  : requisition.deliveredBy?.name,
                transactions     : requisition.transactions?.collect {
                    [id: it.id, transactionNumber: it.transactionNumber]
                } ?: [],
        ]
    }

    /**
     * Composes the requisition name the same way the legacy RequisitionController.getName() did.
     */
    private String generateName(Requisition requisition) {
        def commodityClass = (requisition.commodityClass) ? "${warehouse.message(code: 'enum.CommodityClass.' + requisition.commodityClass)}" : null
        def requisitionType = (requisition.type) ? "${warehouse.message(code: 'enum.RequisitionType.' + requisition.type)}" : null
        def requisitionName =
                [
                        requisitionType,
                        requisition.destination,
                        requisition.recipientProgram,
                        commodityClass,
                        requisition?.dateRequested?.format("MMM dd yyyy")
                ]

        return requisitionName.findAll { it }.join(" - ")
    }
}
