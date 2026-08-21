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
import org.apache.commons.lang.StringEscapeUtils
import org.hibernate.proxy.HibernateProxy
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.product.Category
import org.pih.warehouse.product.Product

class ReportApiController {

    def inventoryService

    private static Serializable identifierOf(Object entity) {
        if (entity == null) {
            return null
        }
        return entity instanceof HibernateProxy
                ? ((HibernateProxy) entity).hibernateLazyInitializer.identifier
                : entity.id
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
}
