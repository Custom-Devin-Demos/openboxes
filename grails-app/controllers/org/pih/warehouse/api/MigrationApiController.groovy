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
import org.hibernate.criterion.CriteriaSpecification

import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.data.TransactionSourceMigrationService
import org.pih.warehouse.inventory.Transaction
import org.pih.warehouse.inventory.TransactionType
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductAvailability
import org.pih.warehouse.reporting.ConsumptionFact
import org.pih.warehouse.reporting.DateDimension
import org.pih.warehouse.reporting.LocationDimension
import org.pih.warehouse.reporting.LotDimension
import org.pih.warehouse.reporting.ProductDimension
import org.pih.warehouse.reporting.TransactionFact

@Transactional(readOnly = true)
class MigrationApiController {

    def migrationService
    def dataService
    def locationService
    def productAvailabilityService
    TransactionSourceMigrationService transactionSourceMigrationService

    def dataMigration() {
        def organizations = migrationService.getSuppliersForMigration()
        def productSuppliers = migrationService.getProductsForMigration()
        TransactionType inventoryTransactionType = TransactionType.load(Constants.INVENTORY_TRANSACTION_TYPE_ID)
        TransactionType productInventoryTransactionType = TransactionType.load(Constants.PRODUCT_INVENTORY_TRANSACTION_TYPE_ID)
        Integer inventoryTransactionCount = Transaction.countByTransactionType(inventoryTransactionType)
        Integer productInventoryTransactionCount = Transaction.countByTransactionType(productInventoryTransactionType)
        Location currentLocation = Location.get(session.warehouse.id)
        Integer productInventoryTransactionInCurrentLocationCount = Transaction.countByTransactionTypeAndInventory(productInventoryTransactionType, currentLocation.inventory)
        List<Product> productsWithProductInventoryTransactionInCurrentLocation = migrationService.getProductsWithTransactions(currentLocation, productInventoryTransactionType)
        Map<String, List<String>> overlappingTransactions = migrationService.getOtherOverlappingTransactions(currentLocation, productInventoryTransactionType)
        Integer amountOfMissingInventoryImportTransactionSources = transactionSourceMigrationService.getAmountOfMissingInventoryImportTransactionSources()
        Integer amountOfMissingCycleCountTransactionSources = transactionSourceMigrationService.getAmountOfMissingCycleCountTransactionSources()
        Integer amountOfMissingRecordStockTransactionSources =
                ((amountOfMissingInventoryImportTransactionSources + amountOfMissingCycleCountTransactionSources) == 0)
                        ? transactionSourceMigrationService.getAmountOfMissingRecordStockTransactionSources()
                        : null

        render([data: [
                organizationCount                                        : organizations.size(),
                inventoryTransactionCount                                : inventoryTransactionCount,
                productInventoryTransactionCount                         : productInventoryTransactionCount,
                productInventoryTransactionInCurrentLocationCount        : productInventoryTransactionInCurrentLocationCount,
                productsWithProductInventoryTransactionInCurrentLocation : productsWithProductInventoryTransactionInCurrentLocation?.productCode,
                productSupplierCount                                     : productSuppliers.size(),
                overlappingTransactions                                  : overlappingTransactions.collect { "${it.key}=${it.value}".toString() },
                amountOfMissingInventoryImportTransactionSources         : amountOfMissingInventoryImportTransactionSources,
                amountOfMissingCycleCountTransactionSources              : amountOfMissingCycleCountTransactionSources,
                amountOfMissingRecordStockTransactionSources             : amountOfMissingRecordStockTransactionSources,
        ]] as JSON)
    }

    def dimensionTables() {
        render([data: [
                dateDimensionCount    : DateDimension.count(),
                locationDimensionCount: LocationDimension.count(),
                lotDimensionCount     : LotDimension.count(),
                productDimensionCount : ProductDimension.count(),
        ]] as JSON)
    }

    def factTables() {
        def stockoutFactCount = dataService.executeQuery("select count(*) as count from stockout_fact")[0]?.count ?: 0
        render([data: [
                transactionFactCount: TransactionFact.count(),
                consumptionFactCount: ConsumptionFact.count(),
                stockoutFactCount   : stockoutFactCount,
        ]] as JSON)
    }

    def materializedViews() {
        def productDemandCount = dataService.executeQuery("select count(*) as count from product_demand_details")[0]?.count ?: 0
        def productAvailabilityCount = dataService.executeQuery("select count(*) as count from product_availability")[0]?.count ?: 0
        render([data: [
                productDemandCount      : productDemandCount,
                productAvailabilityCount: productAvailabilityCount,
        ]] as JSON)
    }

    def productAvailability() {
        def countByLocation = ProductAvailability.createCriteria().list {
            resultTransformer(CriteriaSpecification.ALIAS_TO_ENTITY_MAP)
            projections {
                count("id", "count")
                groupProperty("location", "location")
            }
        }

        def rows = locationService.depots.collect { Location location ->
            def count = countByLocation.find { it.location == location }?.count ?: null
            [
                    locationId              : location.id,
                    locationName            : location.name,
                    productAvailabilityCount: count,
            ]
        }.sort { it.productAvailabilityCount }
        render([data: rows, totalCount: rows.size()] as JSON)
    }

    def productAvailabilityCount() {
        Location location = Location.get(params.locationId)
        def results = ProductAvailability.createCriteria().list {
            resultTransformer(CriteriaSpecification.ALIAS_TO_ENTITY_MAP)
            projections {
                count("id", "count")
            }
            eq("location", location)
        }
        def count = results ? results[0].count : null
        render([data: [count: count]] as JSON)
    }

    def productAvailabilityCalculated() {
        Location location = Location.get(params.locationId)
        def binLocations = productAvailabilityService.calculateBinLocations(location)
        render([data: [count: binLocations.size()]] as JSON)
    }

    def productAvailabilityCompare() {
        Location location = Location.get(params.locationId)
        boolean showAll = params.boolean("showAll") ?: false
        def binLocations = productAvailabilityService.calculateBinLocations(location)

        def data = ProductAvailability.findAllByLocation(location)
        data = data.collect { ProductAvailability pa ->
            def binLocation = binLocations.find {
                it.product?.id == pa.product?.id &&
                        it.inventoryItem?.id == pa.inventoryItem?.id &&
                        it.binLocation?.id == pa.binLocation?.id
            }
            binLocations.remove(binLocation)
            return [
                    productCode                    : pa?.productCode,
                    lotNumber                      : pa?.lotNumber,
                    binLocation                    : pa?.binLocationName,
                    quantityFromProductAvailability: pa.quantityOnHand ?: 0,
                    quantityFromTransactions       : binLocation?.quantity,
                    includedInProductAvailability  : true,
            ]
        }.findAll { it.quantityFromProductAvailability != it.quantityFromTransactions || showAll }

        def binLocationsRemaining = binLocations.collect {
            [
                    productCode                    : it?.product?.productCode,
                    lotNumber                      : it?.inventoryItem?.lotNumber,
                    binLocation                    : it?.binLocation?.name,
                    quantityFromProductAvailability: null,
                    quantityFromTransactions       : it.quantity,
                    includedInProductAvailability  : false,
            ]
        }
        data.addAll(binLocationsRemaining)
        render([data: data, totalCount: data.size()] as JSON)
    }

    @Transactional
    def productAvailabilityRefresh() {
        Location location = Location.get(params.locationId)
        productAvailabilityService.refreshProductAvailability(location, true)
        render([data: [message: "Refreshed product availability for location ${location.name}".toString()]] as JSON)
    }

    def receiptsWithoutTransaction() {
        def data = migrationService.getReceiptsWithoutTransaction()
        if ("count" == params.format) {
            render([count: data.size()] as JSON)
            return
        }
        def rows = data.collect {
            [
                    shipmentId    : it.shipment?.id,
                    shipmentNumber: it.shipment?.shipmentNumber,
                    shipmentStatus: it.shipment?.currentStatus?.toString(),
                    shipmentName  : it?.shipment?.name,
                    receiptNumber : it.receiptNumber,
                    receiptStatus : it.receiptStatusCode.name(),
            ]
        }.sort { it?.shipmentNumber }
        render([data: rows, totalCount: rows.size()] as JSON)
    }

    def shipmentsWithoutTransactions() {
        def data = migrationService.shipmentsWithoutTransactions
        if ("count" == params.format) {
            render([count: data.size()] as JSON)
            return
        }
        def rows = data.collect {
            [
                    shipmentId    : it?.id,
                    shipmentNumber: it?.shipmentNumber,
                    shipmentStatus: it.currentStatus.name(),
                    origin        : it.origin.name,
                    destination   : it.destination.name,
            ]
        }
        render([data: rows, totalCount: rows.size()] as JSON)
    }

    def stockMovementsWithoutShipmentItems() {
        def data = migrationService.stockMovementsWithoutShipmentItems
        if ("count" == params.format) {
            render([count: data.size()] as JSON)
            return
        }
        def rows = data.collect {
            [
                    id         : it?.id,
                    identifier : it?.request_number,
                    status     : it.status,
                    dateCreated: it.date_created,
                    origin     : it.origin,
                    requested  : it.requested,
                    picked     : it.picked,
                    shipped    : it.shipped,
                    issued     : it.issued,
            ]
        }.sort { it?.dateCreated }
        render([data: rows, totalCount: rows.size()] as JSON)
    }
}
