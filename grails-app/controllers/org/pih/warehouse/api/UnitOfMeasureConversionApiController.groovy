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
import grails.gorm.PagedResultList
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.UnitOfMeasure
import org.pih.warehouse.core.UnitOfMeasureConversion
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus

class UnitOfMeasureConversionApiController {

    private static final List<String> SORTABLE_PROPERTIES = [
        "id", "active", "conversionRate", "dateCreated", "lastUpdated",
    ]

    def unitOfMeasureOptions() {
        render([data: UnitOfMeasure.list().collect { [id: it.id, label: it.name] }] as JSON)
    }

    def list() {
        Integer max = Math.min(params.max ? params.int('max') : 10, 100)
        Integer offset = params.int('offset') ?: 0
        String sortProperty = params.sort as String
        String sortOrder = params.order == "desc" ? "desc" : "asc"
        PagedResultList unitOfMeasureConversions = UnitOfMeasureConversion.createCriteria().list(max: max, offset: offset) {
            if (sortProperty == "fromUnitOfMeasure") {
                createAlias("fromUnitOfMeasure", "fromUom")
                order("fromUom.name", sortOrder)
            } else if (sortProperty == "toUnitOfMeasure") {
                createAlias("toUnitOfMeasure", "toUom")
                order("toUom.name", sortOrder)
            } else if (SORTABLE_PROPERTIES.contains(sortProperty)) {
                order(sortProperty, sortOrder)
            }
        } as PagedResultList
        render([data: unitOfMeasureConversions.collect { toJson(it) }, totalCount: unitOfMeasureConversions.totalCount] as JSON)
    }

    def read() {
        UnitOfMeasureConversion unitOfMeasureConversion = UnitOfMeasureConversion.get(params.id)
        if (!unitOfMeasureConversion) {
            throw new ObjectNotFoundException(params.id, UnitOfMeasureConversion.class.toString())
        }
        render([data: toJson(unitOfMeasureConversion)] as JSON)
    }

    @Transactional
    def create() {
        def jsonObject = request.JSON
        UnitOfMeasureConversion unitOfMeasureConversion = new UnitOfMeasureConversion()
        unitOfMeasureConversion.fromUnitOfMeasure = jsonObject.fromUnitOfMeasureId ?
                UnitOfMeasure.get(jsonObject.fromUnitOfMeasureId as String) : null
        unitOfMeasureConversion.toUnitOfMeasure = jsonObject.toUnitOfMeasureId ?
                UnitOfMeasure.get(jsonObject.toUnitOfMeasureId as String) : null
        unitOfMeasureConversion.conversionRate = jsonObject.conversionRate != null && jsonObject.conversionRate != "" ?
                new BigDecimal(jsonObject.conversionRate as String) : null
        unitOfMeasureConversion.active = jsonObject.active != null ? jsonObject.active as Boolean : Boolean.TRUE
        if (unitOfMeasureConversion.hasErrors() || !unitOfMeasureConversion.save(flush: true)) {
            throw new ValidationException("Invalid unit of measure conversion", unitOfMeasureConversion.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(unitOfMeasureConversion)] as JSON)
    }

    @Transactional
    def update() {
        UnitOfMeasureConversion unitOfMeasureConversion = UnitOfMeasureConversion.get(params.id)
        if (!unitOfMeasureConversion) {
            throw new ObjectNotFoundException(params.id, UnitOfMeasureConversion.class.toString())
        }
        def jsonObject = request.JSON
        unitOfMeasureConversion.fromUnitOfMeasure = jsonObject.fromUnitOfMeasureId ?
                UnitOfMeasure.get(jsonObject.fromUnitOfMeasureId as String) : null
        unitOfMeasureConversion.toUnitOfMeasure = jsonObject.toUnitOfMeasureId ?
                UnitOfMeasure.get(jsonObject.toUnitOfMeasureId as String) : null
        unitOfMeasureConversion.conversionRate = jsonObject.conversionRate != null && jsonObject.conversionRate != "" ?
                new BigDecimal(jsonObject.conversionRate as String) : null
        unitOfMeasureConversion.active = jsonObject.active != null ? jsonObject.active as Boolean : Boolean.TRUE
        if (unitOfMeasureConversion.hasErrors() || !unitOfMeasureConversion.save(flush: true)) {
            throw new ValidationException("Invalid unit of measure conversion", unitOfMeasureConversion.errors)
        }
        render([data: toJson(unitOfMeasureConversion)] as JSON)
    }

    @Transactional
    def delete() {
        UnitOfMeasureConversion unitOfMeasureConversion = UnitOfMeasureConversion.get(params.id)
        if (!unitOfMeasureConversion) {
            throw new ObjectNotFoundException(params.id, UnitOfMeasureConversion.class.toString())
        }
        try {
            unitOfMeasureConversion.delete(flush: true)
        } catch (DataIntegrityViolationException ignored) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: "Unit of Measure conversion ${params.id} could not be deleted"] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(UnitOfMeasureConversion unitOfMeasureConversion) {
        return [
            id               : unitOfMeasureConversion.id,
            fromUnitOfMeasure: unitOfMeasureConversion.fromUnitOfMeasure ? [
                id  : unitOfMeasureConversion.fromUnitOfMeasure.id,
                name: unitOfMeasureConversion.fromUnitOfMeasure.name,
            ] : null,
            toUnitOfMeasure  : unitOfMeasureConversion.toUnitOfMeasure ? [
                id  : unitOfMeasureConversion.toUnitOfMeasure.id,
                name: unitOfMeasureConversion.toUnitOfMeasure.name,
            ] : null,
            conversionRate   : unitOfMeasureConversion.conversionRate?.stripTrailingZeros(),
            active           : unitOfMeasureConversion.active,
            dateCreated      : unitOfMeasureConversion.dateCreated,
            lastUpdated      : unitOfMeasureConversion.lastUpdated,
        ]
    }
}
