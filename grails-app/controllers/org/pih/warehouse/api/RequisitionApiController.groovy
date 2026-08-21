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
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.User
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
        requisition.save(flush: true)
        render([success: true] as JSON)
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
