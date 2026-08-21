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
import org.pih.warehouse.core.ActivityCode
import org.pih.warehouse.core.LocationType
import org.pih.warehouse.core.LocationTypeCode
import org.springframework.http.HttpStatus

class LocationTypeApiController {

    def read() {
        LocationType locationType = LocationType.get(params.id)
        if (!locationType) {
            throw new ObjectNotFoundException(params.id, LocationType.class.toString())
        }
        render([data: toJson(locationType)] as JSON)
    }

    def locationTypeCodeOptions() {
        render([data: LocationTypeCode.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    def supportedActivityOptions() {
        render([data: ActivityCode.list().collect {
            [id: it.name(), label: warehouse.message(code: "enum.ActivityCode.${it.name()}", default: it.name())]
        }] as JSON)
    }

    @Transactional
    def create() {
        LocationType locationType = new LocationType()
        bindLocationTypeData(locationType, request.JSON)
        if (locationType.hasErrors() || !locationType.save(flush: true)) {
            throw new ValidationException("Invalid location type", locationType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(locationType)] as JSON)
    }

    @Transactional
    def update() {
        LocationType locationType = LocationType.get(params.id)
        if (!locationType) {
            throw new ObjectNotFoundException(params.id, LocationType.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (locationType.version > version) {
                locationType.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["LocationType"] as Object[],
                        "Another user has updated this LocationType while you were editing")
                throw new ValidationException("Invalid location type", locationType.errors)
            }
        }
        bindLocationTypeData(locationType, jsonObject)
        if (locationType.hasErrors() || !locationType.save(flush: true)) {
            throw new ValidationException("Invalid location type", locationType.errors)
        }
        render([data: toJson(locationType)] as JSON)
    }

    @Transactional
    def delete() {
        LocationType locationType = LocationType.get(params.id)
        if (!locationType) {
            throw new ObjectNotFoundException(params.id, LocationType.class.toString())
        }
        locationType.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private void bindLocationTypeData(LocationType locationType, def jsonObject) {
        bindData(locationType, jsonObject, [exclude: ['version', 'supportedActivities']])
        if (jsonObject.containsKey("supportedActivities")) {
            locationType.supportedActivities?.clear()
            jsonObject.supportedActivities?.each { String activity ->
                locationType.addToSupportedActivities(activity)
            }
        }
    }

    private static Map toJson(LocationType locationType) {
        return [
            id                 : locationType.id,
            name               : locationType.name,
            description        : locationType.description,
            locationTypeCode   : locationType.locationTypeCode?.name(),
            supportedActivities: locationType.supportedActivities?.collect { it } ?: [],
            sortOrder          : locationType.sortOrder,
            version            : locationType.version,
        ]
    }
}
