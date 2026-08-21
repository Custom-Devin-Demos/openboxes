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
import org.pih.warehouse.core.Address
import org.pih.warehouse.core.LocationGroup
import org.pih.warehouse.core.LocationGroupCommand
import org.pih.warehouse.core.LocationGroupService

class LocationGroupApiController extends BaseDomainApiController {

    LocationGroupService locationGroupService

    def list() {
        List<LocationGroup> locationGroups = locationGroupService.getLocationGroups(params)
        Integer totalCount = locationGroups instanceof PagedResultList ? locationGroups.totalCount : locationGroups.size()
        def data = locationGroups.collect { LocationGroup locationGroup ->
            [
                id            : locationGroup.id,
                name          : locationGroup.name,
                address       : toAddressJson(locationGroup.address),
                locationsCount: locationGroup.locations?.size() ?: 0,
            ]
        }
        render ([data: data, totalCount: totalCount] as JSON)
    }

    def read() {
        LocationGroup locationGroup = locationGroupService.getLocationGroup(params.id)
        render([data: [
            id       : locationGroup.id,
            name     : locationGroup.name,
            address  : toAddressJson(locationGroup.address),
            version  : locationGroup.version,
            locations: locationGroup.locations?.sort { it.name }?.collect { [id: it.id, name: it.name] } ?: [],
        ]] as JSON)
    }

    def create(LocationGroupCommand command) {
        LocationGroup locationGroup = locationGroupService.createLocationGroup(command)
        render([data: [id: locationGroup.id]] as JSON)
    }

    def update(LocationGroupCommand command) {
        LocationGroup locationGroup = locationGroupService.updateLocationGroup(params.id, command)
        render([data: locationGroup] as JSON)
    }

    def delete() {
        locationGroupService.deleteLocationGroup(params.id)
        render status: 204
    }

    private static Map toAddressJson(Address address) {
        if (!address) {
            return null
        }
        return [
            id             : address.id,
            address        : address.address,
            address2       : address.address2,
            city           : address.city,
            stateOrProvince: address.stateOrProvince,
            postalCode     : address.postalCode,
            country        : address.country,
            description    : address.description,
        ]
    }
}
