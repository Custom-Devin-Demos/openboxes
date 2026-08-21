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
import org.pih.warehouse.core.UnitOfMeasure
import org.pih.warehouse.core.UnitOfMeasureConversion
import org.springframework.http.HttpStatus

class UnitOfMeasureConversionApiController {

    def unitOfMeasureOptions() {
        render([data: UnitOfMeasure.list().collect { [id: it.id, label: it.name] }] as JSON)
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
            conversionRate   : unitOfMeasureConversion.conversionRate,
            active           : unitOfMeasureConversion.active,
            dateCreated      : unitOfMeasureConversion.dateCreated,
            lastUpdated      : unitOfMeasureConversion.lastUpdated,
        ]
    }
}
