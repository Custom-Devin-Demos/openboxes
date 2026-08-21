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

import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.data.TransactionSourceMigrationService
import org.pih.warehouse.inventory.Transaction
import org.pih.warehouse.inventory.TransactionType
import org.pih.warehouse.product.Product
import org.pih.warehouse.reporting.DateDimension
import org.pih.warehouse.reporting.LocationDimension
import org.pih.warehouse.reporting.LotDimension
import org.pih.warehouse.reporting.ProductDimension

@Transactional(readOnly = true)
class MigrationApiController {

    def migrationService
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
