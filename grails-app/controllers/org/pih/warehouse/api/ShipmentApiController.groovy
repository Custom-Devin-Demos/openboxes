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
import grails.util.Holders
import java.text.SimpleDateFormat
import org.ocpsoft.prettytime.PrettyTime
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Event
import org.pih.warehouse.core.EventType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.core.DocumentService
import org.pih.warehouse.shipping.ItemListCommand
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentService
import org.pih.warehouse.LocalizationUtil

class ShipmentApiController {

    ShipmentService shipmentService
    DocumentService documentService

    private Locale getCurrentLocale() {
        Locale defaultLocale = new Locale(Holders.grailsApplication.config.openboxes.locale.defaultLocale)
        return (session?.locale ?: session?.user?.locale) ?: defaultLocale
    }

    private String localize(String name) {
        return name ? LocalizationUtil.getLocalizedString(name, currentLocale) : null
    }

    private String formatDate(Date date) {
        return date ? new SimpleDateFormat(Constants.DEFAULT_DATE_FORMAT).format(date) : null
    }

    private Map getShipmentSummary(Shipment shipment) {
        return [
                id                  : shipment.id,
                version             : shipment.version,
                name                : shipment.name,
                shipmentNumber      : shipment.shipmentNumber,
                shipmentType        : shipment.shipmentType ? [
                        id  : shipment.shipmentType.id,
                        name: localize(shipment.shipmentType.name),
                        defaultName: LocalizationUtil.getLocalizedString(shipment.shipmentType.name, null),
                ] : null,
                origin              : shipment.origin ? [id: shipment.origin.id, name: localize(shipment.origin.name)] : null,
                destination         : shipment.destination ? [id: shipment.destination.id, name: localize(shipment.destination.name)] : null,
                hasShipped          : shipment.hasShipped(),
                wasReceived         : shipment.wasReceived(),
                expectedShippingDate: formatDate(shipment.expectedShippingDate),
                actualShippingDate  : formatDate(shipment.actualShippingDate),
                expectedDeliveryDate: formatDate(shipment.expectedDeliveryDate),
                actualDeliveryDate  : formatDate(shipment.actualDeliveryDate),
                numItems            : shipment.shipmentItems ? shipment.shipmentItems.size() : 0,
                totalValue          : shipment.totalValue,
                currencyCode        : Holders.grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                totalWeightInPounds : shipment.totalWeightInPounds(),
                status              : shipment.status?.name,
                direction           : shipment.origin?.id == session?.warehouse?.id ? "OUTBOUND" :
                        shipment.destination?.id == session?.warehouse?.id ? "INBOUND" : null,
        ]
    }

    def summary() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }
        render([data: getShipmentSummary(shipment)] as JSON)
    }

    def commentForm() {
        List<User> users = User.list()
        render([data: [
                users: users.collect { [id: it.id, username: it.username] },
        ]] as JSON)
    }

    def documentForm() {
        Document document = Document.get(params.documentId)
        List<DocumentType> documentTypes = documentService.getNonTemplateDocumentTypes()
        render([data: [
                document     : document ? [
                        id            : document.id,
                        name          : document.name,
                        documentNumber: document.documentNumber,
                        documentType  : document.documentType ? [id: document.documentType.id, name: localize(document.documentType.name)] : null,
                        filename      : document.filename,
                        size          : document.size,
                        contentType   : document.contentType,
                        lastUpdated   : document.lastUpdated?.toString(),
                ] : null,
                documentTypes: documentTypes.collect { [id: it.id, name: localize(it.name)] },
        ]] as JSON)
    }

    def eventForm() {
        Event event = Event.get(params.eventId)
        List<EventType> eventTypes = EventType.list()
        List<Location> locations = Location.list()
        render([data: [
                event     : event ? [
                        id           : event.id,
                        eventDate    : event.eventDate ? new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").format(event.eventDate) : null,
                        eventType    : event.eventType ? [id: event.eventType.id, name: localize(event.eventType.name)] : null,
                        eventLocation: event.eventLocation ? [id: event.eventLocation.id, name: event.eventLocation.name] : null,
                ] : null,
                eventTypes: eventTypes.collect { [id: it.id, name: it.name] },
                locations : locations.collect { [id: it.id, name: it.name] },
        ]] as JSON)
    }

    def addToShipmentForm() {
        def productIds = params.list('product.id').collect { String.valueOf(it) }
        Location location = Location.get(session.warehouse.id)
        ItemListCommand command = shipmentService.getAddToShipmentCommand(productIds, location)
        List<Shipment> pendingShipments = shipmentService.getPendingShipments(location)
        PrettyTime prettyTime = new PrettyTime()

        render([data: [
                items           : command.items.collect { item ->
                    [
                            product          : item.product ? [
                                    id  : item.product.id,
                                    name: localize(item.product.name),
                            ] : null,
                            inventoryItem    : item.inventoryItem ? [id: item.inventoryItem.id] : null,
                            lotNumber        : item.lotNumber,
                            expirationDate   : item.inventoryItem?.expirationDate ?
                                    new SimpleDateFormat("d MMM yyyy").format(item.inventoryItem.expirationDate) : null,
                            quantityOnHand   : item.quantityOnHand,
                            quantityShipping : item.quantityShipping,
                            quantityReceiving: item.quantityReceiving,
                    ]
                },
                pendingShipments: pendingShipments.collect { shipment ->
                    [
                            id                  : shipment.id,
                            name                : shipment.name,
                            shipmentNumber      : shipment.shipmentNumber,
                            destination         : shipment.destination?.name,
                            expectedShippingDate: shipment.expectedShippingDate ? prettyTime.format(shipment.expectedShippingDate) : "",
                            looseItemCount      : shipment.shipmentItems ? shipment.shipmentItems.findAll { it.container == null }.size() : 0,
                            containers          : shipment.containers ? shipment.containers.collect { container ->
                                [
                                        id       : container.id,
                                        name     : container.name,
                                        itemCount: shipment.shipmentItems ?
                                                shipment.shipmentItems.findAll { it?.container?.id == container.id }.size() : 0,
                                ]
                            } : [],
                    ]
                },
        ]] as JSON)
    }
}
