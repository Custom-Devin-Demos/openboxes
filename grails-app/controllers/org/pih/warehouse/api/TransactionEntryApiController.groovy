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
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.Location
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.Transaction
import org.pih.warehouse.inventory.TransactionEntry
import org.springframework.http.HttpStatus

class TransactionEntryApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        PagedResultList transactionEntries = TransactionEntry.createCriteria().list(params) {
        } as PagedResultList
        render([data: transactionEntries.collect { toJson(it) }, totalCount: transactionEntries.totalCount] as JSON)
    }

    def read() {
        TransactionEntry transactionEntry = TransactionEntry.get(params.id)
        if (!transactionEntry) {
            throw new ObjectNotFoundException(params.id, TransactionEntry.class.toString())
        }
        render([data: toDetailedJson(transactionEntry)] as JSON)
    }

    @Transactional
    def create() {
        def jsonObject = request.JSON
        TransactionEntry transactionEntry = new TransactionEntry()
        transactionEntry.inventoryItem = jsonObject.inventoryItemId ? InventoryItem.get(jsonObject.inventoryItemId as String) : null
        transactionEntry.transaction = jsonObject.transactionId ? Transaction.get(jsonObject.transactionId as String) : null
        transactionEntry.quantity = jsonObject.quantity != null && jsonObject.quantity != "" ? jsonObject.quantity as Integer : null
        transactionEntry.comments = jsonObject.comments ?: null
        if (transactionEntry.hasErrors() || !transactionEntry.save(flush: true)) {
            throw new ValidationException("Invalid transaction entry", transactionEntry.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toDetailedJson(transactionEntry)] as JSON)
    }

    @Transactional
    def update() {
        TransactionEntry transactionEntry = TransactionEntry.get(params.id)
        if (!transactionEntry) {
            throw new ObjectNotFoundException(params.id, TransactionEntry.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (transactionEntry.version > version) {
                transactionEntry.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["TransactionEntry"] as Object[],
                        "Another user has updated this Transaction entry while you were editing")
                throw new ValidationException("Invalid transaction entry", transactionEntry.errors)
            }
        }
        if (jsonObject.containsKey("inventoryItemId")) {
            transactionEntry.inventoryItem = jsonObject.inventoryItemId ? InventoryItem.get(jsonObject.inventoryItemId as String) : null
        }
        if (jsonObject.containsKey("binLocationId")) {
            transactionEntry.binLocation = jsonObject.binLocationId ? Location.get(jsonObject.binLocationId as String) : null
        }
        if (jsonObject.containsKey("quantity")) {
            transactionEntry.quantity = jsonObject.quantity != null && jsonObject.quantity != "" ? jsonObject.quantity as Integer : null
        }
        if (jsonObject.containsKey("comments")) {
            transactionEntry.comments = jsonObject.comments ?: null
        }
        if (transactionEntry.hasErrors() || !transactionEntry.save(flush: true)) {
            throw new ValidationException("Invalid transaction entry", transactionEntry.errors)
        }
        render([data: toDetailedJson(transactionEntry)] as JSON)
    }

    @Transactional
    def delete() {
        TransactionEntry transactionEntry = TransactionEntry.get(params.id)
        if (!transactionEntry) {
            throw new ObjectNotFoundException(params.id, TransactionEntry.class.toString())
        }
        transactionEntry.transaction.removeFromTransactionEntries(transactionEntry)
        transactionEntry.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    // Options for the create form selects (same source as the legacy scaffold create.gsp)
    def inventoryItemOptions() {
        List<InventoryItem> inventoryItems = InventoryItem.list()
        render([data: inventoryItems.collect { [id: it.id, label: it.toString()] }] as JSON)
    }

    // Same source as the legacy g:selectBinLocation tag (edit.gsp)
    def binLocationOptions() {
        Location currentLocation = Location.get(session?.warehouse?.id)
        if (!currentLocation?.hasBinLocationSupport()) {
            render([data: [], hasBinLocationSupport: false] as JSON)
            return
        }
        List<Location> binLocations = Location.findAllByParentLocationAndActive(currentLocation, true).sort {
            it?.name?.toLowerCase()
        }
        render([data: binLocations.collect { [id: it.id, label: it.name] }, hasBinLocationSupport: true] as JSON)
    }

    def transactionOptions() {
        List<Transaction> transactions = Transaction.list()
        render([data: transactions.collect { [id: it.id, label: transactionLabel(it)] }] as JSON)
    }

    private static String transactionLabel(Transaction transaction) {
        return transaction.transactionNumber ?: transaction.id
    }

    private static Map toJson(TransactionEntry transactionEntry) {
        return [
                id                : transactionEntry.id,
                inventoryItem     : transactionEntry.inventoryItem?.toString(),
                inventoryItemId   : transactionEntry.inventoryItem?.id,
                quantity          : transactionEntry.quantity,
                comments          : transactionEntry.comments,
                transaction       : transactionLabel(transactionEntry.transaction),
                transactionId     : transactionEntry.transaction?.id,
        ]
    }

    private static Map toDetailedJson(TransactionEntry transactionEntry) {
        Transaction transaction = transactionEntry.transaction
        def product = transactionEntry.inventoryItem?.product
        return toJson(transactionEntry) + [
                version         : transactionEntry.version,
                binLocationId   : transactionEntry.binLocation?.id,
                binLocationName : transactionEntry.binLocation?.name,
                product         : product ? [
                        id           : product.id,
                        productCode  : product.productCode,
                        name         : product.name,
                        unitOfMeasure: product.unitOfMeasure,
                ] : null,
                productInventoryItems: product ? InventoryItem.findAllByProduct(product).collect {
                    [id: it.id, lotNumber: it.lotNumber]
                } : [],
                transactionDetails: transaction ? [
                        id               : transaction.id,
                        transactionNumber: transaction.transactionNumber,
                        transactionType  : transaction.transactionType?.name,
                        source           : transaction.source?.name,
                        destination      : transaction.destination?.name,
                        inventory        : transaction.inventory?.warehouse?.name,
                        transactionDate  : transaction.transactionDate?.format("MMM d, yyyy h:mm a"),
                        dateCreated      : transaction.dateCreated?.format("MMM d, yyyy h:mm a"),
                        lastUpdated      : transaction.lastUpdated?.format("MMM d, yyyy h:mm a"),
                        comment          : transaction.comment,
                ] : null,
        ]
    }
}
