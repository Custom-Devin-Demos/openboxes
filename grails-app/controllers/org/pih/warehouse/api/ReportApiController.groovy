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
import org.apache.commons.lang.StringEscapeUtils
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.product.Product

class ReportApiController {

    def inventoryService

    def cycleCountReport() {
        Location location = Location.load(session.warehouse.id)
        List binLocations = inventoryService.getQuantityByBinLocation(location)
        log.info "Returned ${binLocations.size()} bin locations for location ${location}"

        List rows = binLocations.collect { row ->
            // Required in order to avoid lazy initialization exception that occurs because all
            // of the querying / session work that was done above was executed in worker threads
            Product product = Product.load(row?.product?.id)

            def latestInventoryDate = row?.product?.latestInventoryDate(location.id) ?: row?.product.earliestReceivingDate(location.id)
            [
                    productCode      : StringEscapeUtils.escapeCsv(row?.product?.productCode),
                    productName      : row?.product.name ?: "",
                    productFamily    : product?.productFamily?.toString() ?: "",
                    category         : StringEscapeUtils.escapeCsv(row?.category?.name ?: ""),
                    formularies      : product.productCatalogs.join(", ") ?: "",
                    lotNumber        : StringEscapeUtils.escapeCsv(row?.inventoryItem.lotNumber ?: ""),
                    expirationDate   : row?.inventoryItem.expirationDate ? row?.inventoryItem.expirationDate.format(Constants.EXPIRATION_DATE_FORMAT) : "",
                    abcClassification: StringEscapeUtils.escapeCsv(row?.product.getAbcClassification(location.id) ?: ""),
                    binLocation      : StringEscapeUtils.escapeCsv(row?.binLocation?.name ?: ""),
                    status           : g.message(code: "binLocationSummary.${row?.status}.label"),
                    lastInventoryDate: latestInventoryDate ? latestInventoryDate.format(Constants.EXPIRATION_DATE_FORMAT) : "",
                    quantityOnHand   : row?.quantity ?: 0,
            ]
        }

        render([data: rows] as JSON)
    }
}
