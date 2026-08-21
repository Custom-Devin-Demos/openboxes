/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 * */
package org.pih.warehouse.api

import grails.converters.JSON
import grails.validation.ValidationException
import groovy.time.TimeCategory
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.UserService
import org.pih.warehouse.report.ConsumptionService
import org.pih.warehouse.reporting.ConsumptionCommand
import org.pih.warehouse.reporting.ConsumptionFact
import org.pih.warehouse.reporting.ShowConsumptionCommand

class ConsumptionApiController {

    ConsumptionService consumptionService
    UserService userService

    def aggregate(ConsumptionCommand command) {
        String locationId = command?.location?.id ?: session?.warehouse?.id
        Location location = Location.get(locationId)

        use(TimeCategory) {
            command.endDate = command?.endDate ?: new Date()
            command.startDate = command?.startDate ?: new Date() - 6.months
        }

        List<ConsumptionFact> results = consumptionService.listConsumption(location, command?.category, command.startDate, command.endDate)

        def data = results.collect {
            [
                    id          : it.id,
                    productCode : it?.productKey?.productCode,
                    productName : it.productKey?.productName,
                    categoryName: it?.productKey?.categoryName,
                    year        : it?.transactionDateKey?.year,
                    month       : it?.transactionDateKey?.month,
                    day         : it?.transactionDateKey?.dayOfMonth,
                    quantity    : it?.quantity,
                    unitCost    : it?.unitCost,
                    unitPrice   : it?.unitPrice
            ]
        }
        render([data: data] as JSON)
    }

    def show(ShowConsumptionCommand command) {
        if (command.hasErrors()) {
            throw new ValidationException("Invalid consumption report parameters", command.errors)
        }

        consumptionService.applyShowConsumption(command, userService.hasRoleFinance(session?.user))

        def rows = command.rows.collect { product, row ->
            def monthlyQuantity = command.numberOfDays ? row.monthlyQuantity : 0
            def numberOfMonthsRemaining = command.numberOfDays ? row.numberOfMonthsRemaining : 0
            [
                    productId               : product?.id,
                    productCode             : product?.productCode,
                    productName             : product?.displayNameOrDefaultName,
                    pricePerUnit            : row.pricePerUnit,
                    issuedQuantity          : row.issuedQuantity,
                    consumedQuantity        : row.consumedQuantity,
                    returnedQuantity        : row.returnedQuantity,
                    totalConsumptionQuantity: row.totalConsumptionQuantity,
                    totalConsumptionValue   : (row.pricePerUnit ?: 0) * row.totalConsumptionQuantity,
                    monthlyQuantity         : monthlyQuantity,
                    onHandQuantity          : row.onHandQuantity,
                    numberOfMonthsRemaining : numberOfMonthsRemaining,
            ]
        }
        render([data: rows] as JSON)
    }

    def depots() {
        def depots = Location.findAllByActive(true).findAll { it.isDepot() }.sort { it.name }
        render([data: depots.collect { [id: it.id, name: it.name] }] as JSON)
    }
}
