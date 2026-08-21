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
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentCode
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.shipping.ContainerType
import org.pih.warehouse.shipping.ReferenceNumberType
import org.pih.warehouse.shipping.ShipmentType
import org.pih.warehouse.shipping.ShipmentWorkflow
import org.springframework.http.HttpStatus

class ShipmentWorkflowApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: ShipmentWorkflow.list(params).collect { toJson(it) }, totalCount: ShipmentWorkflow.count()] as JSON)
    }

    def read() {
        ShipmentWorkflow shipmentWorkflow = ShipmentWorkflow.get(params.id)
        if (!shipmentWorkflow) {
            throw new ObjectNotFoundException(params.id, ShipmentWorkflow.class.toString())
        }
        render([data: toJson(shipmentWorkflow)] as JSON)
    }

    def options() {
        render([data: [
            shipmentTypes       : ShipmentType.list().collect { [id: it.id, label: it.toString()] },
            referenceNumberTypes: ReferenceNumberType.list().collect { [id: it.id, label: it.toString()] },
            containerTypes      : ContainerType.list().collect { [id: it.id, label: it.toString()] },
            documentTemplates   : getDocumentTemplates().collect { [id: it.id, label: it.toString()] },
        ]] as JSON)
    }

    @Transactional
    def create() {
        ShipmentWorkflow shipmentWorkflow = new ShipmentWorkflow()
        bindShipmentWorkflowData(shipmentWorkflow, request.JSON)
        if (shipmentWorkflow.hasErrors() || !shipmentWorkflow.save(flush: true)) {
            throw new ValidationException("Invalid shipment workflow", shipmentWorkflow.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(shipmentWorkflow)] as JSON)
    }

    @Transactional
    def update() {
        ShipmentWorkflow shipmentWorkflow = ShipmentWorkflow.get(params.id)
        if (!shipmentWorkflow) {
            throw new ObjectNotFoundException(params.id, ShipmentWorkflow.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (shipmentWorkflow.version > version) {
                shipmentWorkflow.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["ShipmentWorkflow"] as Object[],
                        "Another user has updated this ShipmentWorkflow while you were editing")
                throw new ValidationException("Invalid shipment workflow", shipmentWorkflow.errors)
            }
        }
        bindShipmentWorkflowData(shipmentWorkflow, jsonObject)
        if (shipmentWorkflow.hasErrors() || !shipmentWorkflow.save(flush: true)) {
            throw new ValidationException("Invalid shipment workflow", shipmentWorkflow.errors)
        }
        render([data: toJson(shipmentWorkflow)] as JSON)
    }

    @Transactional
    def delete() {
        ShipmentWorkflow shipmentWorkflow = ShipmentWorkflow.get(params.id)
        if (!shipmentWorkflow) {
            throw new ObjectNotFoundException(params.id, ShipmentWorkflow.class.toString())
        }
        try {
            shipmentWorkflow.delete(flush: true)
            render status: HttpStatus.NO_CONTENT.value()
        }
        catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = HttpStatus.CONFLICT.value()
            render([errorCode: HttpStatus.CONFLICT.value(),
                    errorMessage: warehouse.message(code: 'default.not.deleted.message',
                            args: [warehouse.message(code: 'shipmentWorkflow.label', default: 'ShipmentWorkflow'), params.id])] as JSON)
        }
    }

    private void bindShipmentWorkflowData(ShipmentWorkflow shipmentWorkflow, def jsonObject) {
        shipmentWorkflow.name = jsonObject.name ?: null
        shipmentWorkflow.shipmentType = jsonObject.shipmentType ? ShipmentType.get(jsonObject.shipmentType) : null
        shipmentWorkflow.excludedFields = jsonObject.excludedFields ?: null
        shipmentWorkflow.documentTemplate = jsonObject.documentTemplate ?: null
        if (jsonObject.containsKey("referenceNumberTypes")) {
            shipmentWorkflow.referenceNumberTypes?.clear()
            jsonObject.referenceNumberTypes.each { id ->
                ReferenceNumberType referenceNumberType = ReferenceNumberType.get(id)
                if (referenceNumberType) {
                    shipmentWorkflow.addToReferenceNumberTypes(referenceNumberType)
                }
            }
        }
        if (jsonObject.containsKey("containerTypes")) {
            shipmentWorkflow.containerTypes?.clear()
            jsonObject.containerTypes.each { id ->
                ContainerType containerType = ContainerType.get(id)
                if (containerType) {
                    shipmentWorkflow.addToContainerTypes(containerType)
                }
            }
        }
        if (jsonObject.containsKey("documentTemplates")) {
            shipmentWorkflow.documentTemplates?.clear()
            jsonObject.documentTemplates.each { id ->
                Document document = Document.get(id)
                if (document) {
                    shipmentWorkflow.addToDocumentTemplates(document)
                }
            }
        }
    }

    private static List getDocumentTemplates() {
        def documentTypes = DocumentType.findAllByDocumentCodeInList(DocumentCode.shipmentWorkflowTemplateList())
        return documentTypes ? Document.findAllByDocumentTypeInList(documentTypes) : []
    }

    private static Map toJson(ShipmentWorkflow shipmentWorkflow) {
        return [
            id                  : shipmentWorkflow.id,
            name                : shipmentWorkflow.name,
            shipmentType        : shipmentWorkflow.shipmentType ? [id: shipmentWorkflow.shipmentType.id, name: shipmentWorkflow.shipmentType.toString()] : null,
            excludedFields      : shipmentWorkflow.excludedFields,
            documentTemplate    : shipmentWorkflow.documentTemplate,
            dateCreated         : shipmentWorkflow.dateCreated,
            lastUpdated         : shipmentWorkflow.lastUpdated,
            referenceNumberTypes: shipmentWorkflow.referenceNumberTypes?.collect { [id: it.id, name: it.toString()] } ?: [],
            containerTypes      : shipmentWorkflow.containerTypes?.collect { [id: it.id, name: it.toString()] } ?: [],
            documentTemplates   : shipmentWorkflow.documentTemplates?.collect { [id: it.id, name: it.toString()] } ?: [],
            version             : shipmentWorkflow.version,
        ]
    }
}
