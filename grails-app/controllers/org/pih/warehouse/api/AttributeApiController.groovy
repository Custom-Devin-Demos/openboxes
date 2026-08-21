package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.EntityTypeCode
import org.pih.warehouse.core.UnitOfMeasureClass
import org.pih.warehouse.product.Attribute
import org.pih.warehouse.product.AttributeService
import org.springframework.dao.DataIntegrityViolationException

class AttributeApiController {

    AttributeService attributeService

    def list() {
        EntityTypeCode entityTypeCode = params.get("entityType") as EntityTypeCode
        List<Attribute> attributes = attributeService.list(entityTypeCode)
        render([data: attributes] as JSON)
    }

    def search() {
        params.max = Math.min(params.int('max', 10), 100)
        params.offset = params.int('offset', 0)
        List<Attribute> attributes = attributeService.searchAttributes(params.q,
                [max: params.max, offset: params.offset, sort: params.sort, order: params.order])
        render([data: attributes.collect { toDetailedJson(it) }, totalCount: attributes.totalCount] as JSON)
    }

    def read() {
        Attribute attribute = Attribute.get(params.id)
        if (!attribute) {
            throw new ObjectNotFoundException(params.id, "Attribute")
        }
        render(toDetailedJson(attribute) as JSON)
    }

    @Transactional
    def create() {
        saveAttribute()
    }

    @Transactional
    def update() {
        saveAttribute()
    }

    @Transactional
    def delete() {
        Attribute attribute = Attribute.get(params.id)
        if (!attribute) {
            throw new ObjectNotFoundException(params.id, "Attribute")
        }
        try {
            attribute.delete(flush: true)
            render(status: 204)
        } catch (DataIntegrityViolationException e) {
            response.status = 400
            render([errorCode: 400, errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'attribute.label', default: 'Attribute'), params.id])}"] as JSON)
        }
    }

    private void saveAttribute() {
        def data = request.JSON ?: params
        EntityTypeCode entityTypeCode = data.entityTypeCode ?
                data.entityTypeCode as EntityTypeCode : null

        Attribute attributeInstance = params.id ? Attribute.get(params.id) : new Attribute()
        if (params.id && !attributeInstance) {
            throw new ObjectNotFoundException(params.id, "Attribute")
        }

        if (data.version != null && attributeInstance.id) {
            def version = data.version.toString().toLong()
            if (attributeInstance.version > version) {
                attributeInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'attribute.label', default: 'Attribute')] as Object[],
                        "Another user has updated this Attribute while you were editing")
                throw new ValidationException("Unable to save attribute due to errors", attributeInstance.errors)
            }
        }

        attributeInstance.code = data.code
        attributeInstance.name = data.name
        attributeInstance.description = data.description ?: null
        attributeInstance.active = data.active as boolean
        attributeInstance.required = data.required as boolean
        attributeInstance.allowOther = data.allowOther as boolean
        attributeInstance.unitOfMeasureClass = data.unitOfMeasureClass?.id ?
                UnitOfMeasureClass.get(data.unitOfMeasureClass.id) : null
        if (entityTypeCode && !attributeInstance?.entityTypeCodes?.contains(entityTypeCode)) {
            attributeInstance?.entityTypeCodes?.clear()
            attributeInstance.addToEntityTypeCodes(entityTypeCode)
        }

        attributeInstance.options = new ArrayList()
        data.option?.each { o ->
            if (o) {
                attributeInstance.options.add(o)
            }
        }

        if (!attributeInstance.hasErrors() && attributeInstance.save(flush: true)) {
            render(toDetailedJson(attributeInstance) as JSON)
        } else {
            throw new ValidationException("Unable to save attribute due to errors", attributeInstance.errors)
        }
    }

    private Map toDetailedJson(Attribute attribute) {
        return [
                id                : attribute.id,
                code              : attribute.code,
                name              : attribute.name,
                description       : attribute.description,
                entityTypeCode    : attribute.entityTypeCode?.name(),
                unitOfMeasureClass: attribute.unitOfMeasureClass ? [
                        id  : attribute.unitOfMeasureClass.id,
                        name: attribute.unitOfMeasureClass.name,
                ] : null,
                options           : attribute.options ?: [],
                active            : attribute.active,
                required          : attribute.required,
                allowOther        : attribute.allowOther,
                dateCreated       : attribute.dateCreated?.format("dd/MMM/yyyy hh:mm a"),
                lastUpdated       : attribute.lastUpdated?.format("dd/MMM/yyyy hh:mm a"),
                version           : attribute.version,
        ]
    }
}
