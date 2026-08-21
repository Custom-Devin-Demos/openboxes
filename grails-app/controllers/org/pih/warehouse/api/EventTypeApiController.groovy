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
import org.pih.warehouse.core.EventCode
import org.pih.warehouse.core.EventType
import org.springframework.http.HttpStatus

class EventTypeApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: EventType.list(params).collect { toJson(it) }, totalCount: EventType.count()] as JSON)
    }

    def read() {
        EventType eventType = EventType.get(params.id)
        if (!eventType) {
            throw new ObjectNotFoundException(params.id, EventType.class.toString())
        }
        render([data: toJson(eventType)] as JSON)
    }

    def eventCodeOptions() {
        render([data: EventCode.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    @Transactional
    def create() {
        EventType eventType = new EventType()
        bindData(eventType, request.JSON)
        if (eventType.hasErrors() || !eventType.save(flush: true)) {
            throw new ValidationException("Invalid event type", eventType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(eventType)] as JSON)
    }

    @Transactional
    def update() {
        EventType eventType = EventType.get(params.id)
        if (!eventType) {
            throw new ObjectNotFoundException(params.id, EventType.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (eventType.version > version) {
                eventType.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["EventType"] as Object[],
                        "Another user has updated this EventType while you were editing")
                throw new ValidationException("Invalid event type", eventType.errors)
            }
        }
        bindData(eventType, jsonObject, [exclude: ['version']])
        if (eventType.hasErrors() || !eventType.save(flush: true)) {
            throw new ValidationException("Invalid event type", eventType.errors)
        }
        render([data: toJson(eventType)] as JSON)
    }

    @Transactional
    def delete() {
        EventType eventType = EventType.get(params.id)
        if (!eventType) {
            throw new ObjectNotFoundException(params.id, EventType.class.toString())
        }
        eventType.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(EventType eventType) {
        return [
            id         : eventType.id,
            name       : eventType.name,
            description: eventType.description,
            sortOrder  : eventType.sortOrder,
            eventCode  : eventType.eventCode?.name(),
            optionValue: eventType.optionValue,
            dateCreated: eventType.dateCreated,
            lastUpdated: eventType.lastUpdated,
            version    : eventType.version,
        ]
    }
}
