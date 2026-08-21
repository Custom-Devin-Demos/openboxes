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
import groovy.transform.CompileStatic
import org.grails.datastore.gorm.GormEntity
import grails.gorm.transactions.Transactional
import org.apache.commons.lang.StringEscapeUtils
import org.hibernate.proxy.HibernateProxy
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.product.Category
import org.pih.warehouse.product.Product
import org.pih.warehouse.report.MultiLocationInventoryReportCommand

class ReportApiController {

    def inventoryService
    def productAvailabilityService

    @CompileStatic
    private static Serializable identifierOf(Object entity) {
        if (entity == null) {
            return null
        }
        if (entity instanceof HibernateProxy) {
            return ((HibernateProxy) entity).getHibernateLazyInitializer().getIdentifier()
        }
        return ((GormEntity) entity).ident()
    }

    @Transactional(readOnly = true)
    def cycleCountReport() {
        Location location = Location.load(session.warehouse.id)
        List binLocations = inventoryService.getQuantityByBinLocation(location)
        log.info "Returned ${binLocations.size()} bin locations for location ${location}"

        List rows = binLocations.collect { row ->
            // Required in order to avoid lazy initialization exception that occurs because all
            // of the querying / session work that was done above was executed in worker threads
            Product product = Product.get(identifierOf(row?.product))
            Category category = identifierOf(row?.category) ? Category.get(identifierOf(row?.category)) : null
            InventoryItem inventoryItem = identifierOf(row?.inventoryItem) ? InventoryItem.get(identifierOf(row?.inventoryItem)) : null
            Location binLocation = identifierOf(row?.binLocation) ? Location.get(identifierOf(row?.binLocation)) : null

            def latestInventoryDate = product?.latestInventoryDate(location.id) ?: product?.earliestReceivingDate(location.id)
            [
                    productCode      : StringEscapeUtils.escapeCsv(product?.productCode),
                    productName      : product?.name ?: "",
                    productFamily    : product?.productFamily?.toString() ?: "",
                    category         : StringEscapeUtils.escapeCsv(category?.name ?: ""),
                    formularies      : product?.productCatalogs?.join(", ") ?: "",
                    lotNumber        : StringEscapeUtils.escapeCsv(inventoryItem?.lotNumber ?: ""),
                    expirationDate   : inventoryItem?.expirationDate ? inventoryItem.expirationDate.format(Constants.EXPIRATION_DATE_FORMAT) : "",
                    abcClassification: StringEscapeUtils.escapeCsv(product?.getAbcClassification(location.id) ?: ""),
                    binLocation      : StringEscapeUtils.escapeCsv(binLocation?.name ?: ""),
                    status           : g.message(code: "binLocationSummary.${row?.status}.label"),
                    lastInventoryDate: latestInventoryDate ? latestInventoryDate.format(Constants.EXPIRATION_DATE_FORMAT) : "",
                    quantityOnHand   : row?.quantity ?: 0,
            ]
        }

        render([data: rows] as JSON)
    }

    def inventoryByLocationReport(MultiLocationInventoryReportCommand command) {
        if (!command.validate()) {
            response.status = 400
            render([errorCode: 400, errorMessages: command.errors.allErrors.collect { message(error: it) }] as JSON)
            return
        }

        if (command.includeSubcategories) {
            command.categories = inventoryService.getExplodedCategories(command.categories)
        }

        command.entries = productAvailabilityService.getQuantityOnHandByProduct(command.locations, command.categories)

        def locations = command.locations?.findAll { it?.id }
        render([data: [
                locations: locations?.collect { [id: it.id, name: it.name] },
                entries  : command.entries.collect { product, row ->
                    [
                            productCode                    : product?.productCode,
                            productName                    : product?.name,
                            productFamily                  : product?.productFamily?.name,
                            category                       : product?.category?.name,
                            formularies                    : product?.getProductCatalogs()?.collect { it.name }?.join(","),
                            tags                           : product?.tagsToString(),
                            quantityOnHandByLocation       : locations?.collectEntries { location ->
                                [(location.id): row[location.id]?.quantityOnHand]
                            },
                            totalQuantityOnHand            : row?.values()?.quantityOnHand?.sum(),
                            totalQuantityAvailableToPromise: row?.values()?.quantityAvailableToPromise?.sum(),
                    ]
                },
        ]] as JSON)
    }
}
