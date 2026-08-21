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
import grails.validation.ValidationException
import groovy.time.TimeDuration
import java.text.SimpleDateFormat
import org.ocpsoft.prettytime.PrettyTime
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentCode
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Event
import org.pih.warehouse.core.EventType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.core.DocumentService
import org.pih.warehouse.inventory.TransactionException
import org.pih.warehouse.receiving.Receipt
import org.pih.warehouse.receiving.ReceiptItem
import org.pih.warehouse.shipping.ItemListCommand
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentService
import org.pih.warehouse.shipping.ShipmentStatusCode
import org.pih.warehouse.shipping.ShipmentType
import org.pih.warehouse.LocalizationUtil

class ShipmentApiController {

    ShipmentService shipmentService
    DocumentService documentService
    def inventoryService
    def userService
    def messageSource

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

    private String localizeMetadata(Object obj) {
        if (obj == null) {
            return null
        }
        if (obj instanceof Enum) {
            String className = obj.getClass().getSimpleName()
            return g.message(code: "enum." + className + "." + obj.toString())
        }
        return localize(obj.toString())
    }

    private String formatTimeDuration(TimeDuration timeDuration) {
        if (!timeDuration) {
            return null
        }
        if (timeDuration.years > 0) {
            return "${timeDuration.years} years, ${timeDuration.days} days"
        } else if (timeDuration.days > 0) {
            return "${timeDuration.days} days"
        } else if (timeDuration.hours > 0) {
            return "${timeDuration.hours} hours"
        } else if (timeDuration.minutes > 0) {
            return "${timeDuration.minutes} minutes"
        } else if (timeDuration.seconds > 0) {
            return "${timeDuration.seconds} seconds"
        }
        return null
    }

    private List resolveErrors(errors) {
        errors?.allErrors?.collect { error ->
            messageSource.getMessage(error, currentLocale)
        } ?: []
    }

    private Map getContainerSummary(container) {
        if (!container) {
            return null
        }
        return [
                id                 : container.id,
                name               : container.name,
                parentContainerName: container.parentContainer?.name,
                containerTypeName  : localizeMetadata(container.containerType?.name),
                weight             : container.weight,
                weightUnits        : container.weightUnits,
                height             : container.height,
                width              : container.width,
                length             : container.length,
                volumeUnits        : container.volumeUnits,
        ]
    }

    def shipmentList() {
        params.max = Math.min(params.max ? params.int('max') : 100, 10000)

        boolean incoming = params?.type?.toUpperCase() == "INCOMING"
        Location origin = incoming ? (params.origin && params.origin != "null" ? Location.get(params.origin) : null) : Location.get(session.warehouse.id)
        Location destination = incoming ? Location.get(session.warehouse.id) : (params.destination && params.destination != "null" ? Location.get(params.destination) : null)
        ShipmentType shipmentType = params.shipmentType ? ShipmentType.get(params.shipmentType) : null
        ShipmentStatusCode statusCode = params.status ? Enum.valueOf(ShipmentStatusCode.class, params.status) : null
        Date statusStartDate = params.statusStartDate ? Date.parse("MM/dd/yyyy", params.statusStartDate) : null
        Date statusEndDate = params.statusEndDate ? Date.parse("MM/dd/yyyy", params.statusEndDate) : null
        Date lastUpdatedFrom = params.lastUpdatedFrom ? Date.parse("MM/dd/yyyy", params.lastUpdatedFrom) : null
        Date lastUpdatedTo = params.lastUpdatedTo ? Date.parse("MM/dd/yyyy", params.lastUpdatedTo) : null

        def shipments = shipmentService.getShipments(params.terms, shipmentType, origin, destination,
                statusCode, statusStartDate, statusEndDate, lastUpdatedFrom, lastUpdatedTo, params.max)

        PrettyTime prettyTime = new PrettyTime(currentLocale)
        SimpleDateFormat dateFormat = new SimpleDateFormat(Constants.DEFAULT_DATE_FORMAT)

        render([data: [
                incoming     : incoming,
                maxReached   : shipments?.size() == params.max,
                max          : params.max,
                warehouseName: session?.warehouse?.name,
                shipments    : shipments.collect { Shipment shipment ->
                    [
                            id                  : shipment.id,
                            shipmentNumber      : shipment.shipmentNumber,
                            name                : shipment.name,
                            statusCode          : shipment.status?.code?.name(),
                            statusName          : localizeMetadata(shipment.status?.code),
                            shipmentType        : shipment.shipmentType ? [
                                    id         : shipment.shipmentType.id,
                                    name       : localizeMetadata(shipment.shipmentType.name),
                                    defaultName: LocalizationUtil.getLocalizedString(shipment.shipmentType.name, new Locale("en")),
                            ] : null,
                            shipmentItemCount   : shipment.shipmentItemCount,
                            origin              : shipment.origin?.name,
                            destination         : shipment.destination?.name,
                            actualShippingDate  : shipment.actualShippingDate ? [pretty: prettyTime.format(shipment.actualShippingDate), title: dateFormat.format(shipment.actualShippingDate)] : null,
                            expectedShippingDate: shipment.expectedShippingDate ? [pretty: prettyTime.format(shipment.expectedShippingDate), title: dateFormat.format(shipment.expectedShippingDate)] : null,
                            actualDeliveryDate  : shipment.actualDeliveryDate ? [pretty: prettyTime.format(shipment.actualDeliveryDate), title: dateFormat.format(shipment.actualDeliveryDate)] : null,
                            expectedDeliveryDate: shipment.expectedDeliveryDate ? [pretty: prettyTime.format(shipment.expectedDeliveryDate), title: dateFormat.format(shipment.expectedDeliveryDate)] : null,
                            lastUpdated         : shipment.lastUpdated ? [pretty: prettyTime.format(shipment.lastUpdated), title: dateFormat.format(shipment.lastUpdated)] : null,
                    ]
                },
                filters      : [
                        terms       : params.terms,
                        status      : statusCode?.name(),
                        type        : incoming ? "incoming" : "outgoing",
                        shipmentType: shipmentType?.id,
                        origin      : incoming ? (params.origin && params.origin != "null" ? origin?.id : null) : null,
                        destination : !incoming ? destination?.id : null,
                ],
                filterOptions: [
                        statuses     : ShipmentStatusCode.list().collect { [id: it.name(), name: localizeMetadata(it)] },
                        shipmentTypes: ShipmentType.list().collect { [id: it.id, name: localizeMetadata(it.name)] },
                        locations    : Location.list().sort { it?.name?.toLowerCase() }.collect { [id: it.id, name: it.name] },
                ],
        ]] as JSON)
    }

    private Map getShipmentItemDetails(shipmentItem, Shipment shipment) {
        boolean isOrigin = shipment?.origin?.id == session?.warehouse?.id
        boolean isDestination = shipment?.destination?.id == session?.warehouse?.id
        return [
                id              : shipmentItem.id,
                container       : getContainerSummary(shipmentItem.container),
                productCode     : shipmentItem.inventoryItem?.product?.productCode ?: shipmentItem.product?.productCode,
                product         : [
                        id  : shipmentItem.inventoryItem?.product?.id ?: shipmentItem.product?.id,
                        name: localize(shipmentItem.inventoryItem?.product?.name ?: shipmentItem.product?.name),
                ],
                binLocationName : isOrigin ? (shipmentItem.binLocation?.name ?: g.message(code: 'default.label')) : null,
                receiptBins     : isDestination ? shipmentItem.receiptItems?.collect {
                    [
                            binLocationName : it.binLocation?.name ?: g.message(code: 'default.label'),
                            quantityReceived: it.quantityReceived,
                            unitOfMeasure   : it.inventoryItem?.product?.unitOfMeasure ?: 'EA',
                    ]
                } : null,
                lotNumber       : shipmentItem.inventoryItem?.lotNumber,
                expirationDate  : shipmentItem.inventoryItem?.expirationDate ?
                        new SimpleDateFormat("d MMM yyyy").format(shipmentItem.inventoryItem.expirationDate) : null,
                quantity        : shipmentItem.quantity,
                quantityReceived: shipmentItem.quantityReceived(),
                quantityCanceled: shipmentItem.quantityCanceled(),
                unitOfMeasure   : shipmentItem.inventoryItem?.product?.unitOfMeasure ?: g.message(code: 'default.each.label'),
                recipient       : shipmentItem.recipient ? [name: shipmentItem.recipient.name, email: shipmentItem.recipient.email] : null,
                comments        : shipmentItem.comments ?: [],
                isFullyReceived : shipmentItem.isFullyReceived(),
        ]
    }

    def showDetails() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }
        def shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)
        PrettyTime prettyTime = new PrettyTime(currentLocale)
        SimpleDateFormat dateFormat = new SimpleDateFormat("MMM d, yyyy")
        SimpleDateFormat timeFormat = new SimpleDateFormat("hh:mma")
        boolean isOrigin = shipment.origin?.id == session?.warehouse?.id
        boolean isDestination = shipment.destination?.id == session?.warehouse?.id

        render([data: [
                summary        : getShipmentSummary(shipment),
                statusCode     : shipment.status?.code?.name(),
                statusName     : localizeMetadata(shipment.currentStatus),
                isFromPurchaseOrder: shipment.isFromPurchaseOrder,
                originCode     : shipment.isFromPurchaseOrder ? localizeMetadata(shipment.origin?.organization?.code) : null,
                originName     : shipment.origin?.name,
                destinationName: shipment.destination?.name,
                totalWeightInPounds: shipment.totalWeightInPounds() ?: 0.00,
                totalValue     : shipment.totalValue ?: 0.00,
                currencyCode   : Holders.grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                showTotalValue : !shipmentWorkflow?.isExcluded('totalValue'),
                carrier        : (!shipmentWorkflow?.isExcluded('carrier') && shipment.carrier) ? [
                        firstName: shipment.carrier.firstName,
                        lastName : shipment.carrier.lastName,
                ] : null,
                additionalInformation: (!shipmentWorkflow?.isExcluded('additionalInformation')) ? shipment.additionalInformation : null,
                documentTemplate: shipmentWorkflow?.documentTemplate ? localizeMetadata(shipmentWorkflow.shipmentType?.name) : null,
                referenceNumbers: (shipmentWorkflow?.referenceNumberTypes && shipment.referenceNumbers) ?
                        shipmentWorkflow.referenceNumberTypes.collect { referenceNumberType ->
                            [
                                    name       : localizeMetadata(referenceNumberType.name),
                                    identifiers: shipment.referenceNumbers.findAll {
                                        it.referenceNumberType.id == referenceNumberType.id
                                    }.collect { it.identifier },
                            ]
                        } : [],
                comments       : shipment.comments ? shipment.comments.collect { comment ->
                    [
                            id         : comment.id,
                            senderId   : comment.sender?.id,
                            senderName : comment.sender?.name,
                            senderHasPhoto: comment.sender?.photo != null,
                            dateCreated: comment.dateCreated ? prettyTime.format(comment.dateCreated) : null,
                            recipient  : comment.recipient ? [name: comment.recipient.name, username: comment.recipient.username] : null,
                            comment    : comment.comment,
                    ]
                } : [],
                documents      : (shipment.documents + (shipmentWorkflow?.documentTemplates ?: [])).collect { document ->
                    [
                            id          : document.id,
                            name        : localizeMetadata(document.name),
                            filename    : document.filename,
                            hasFileUri  : document.fileUri != null,
                            isShippingTemplate: document.documentType?.documentCode == DocumentCode.SHIPPING_TEMPLATE,
                    ]
                },
                leadTime       : [
                        timeToProcess: formatTimeDuration(shipment.timeToProcess()),
                        timeInCustoms: formatTimeDuration(shipment.timeInCustoms()),
                        timeInTransit: formatTimeDuration(shipment.timeInTransit()),
                ],
                shipmentItems  : shipment.shipmentItems ? shipment.sortShipmentItems().collect { getShipmentItemDetails(it, shipment) } : [],
                receiptItems   : shipment.receipt?.receiptItems ? shipment.receipt.receiptItems.sort().collect { receiptItem ->
                    [
                            id              : receiptItem.id,
                            productCode     : receiptItem.product?.productCode,
                            product         : [id: receiptItem.product?.id, name: localize(receiptItem.product?.name)],
                            binLocationName : receiptItem.binLocation?.name,
                            lotNumber       : receiptItem.inventoryItem?.lotNumber,
                            expirationDate  : receiptItem.inventoryItem?.expirationDate ?
                                    new SimpleDateFormat("d MMM yyyy").format(receiptItem.inventoryItem.expirationDate) : null,
                            quantityShipped : receiptItem.quantityShipped ?: 0,
                            quantityReceived: receiptItem.quantityReceived ?: 0,
                            quantityCanceled: receiptItem.quantityCanceled ?: 0,
                    ]
                } : [],
                hasReceipt     : shipment.receipt != null,
                events         : ([[
                        id          : null,
                        name        : g.message(code: 'default.created.label'),
                        date        : shipment.dateCreated ? dateFormat.format(shipment.dateCreated) : null,
                        time        : shipment.dateCreated ? timeFormat.format(shipment.dateCreated) : null,
                        locationName: shipment.origin?.name,
                ]] + (shipment.events ? shipment.events.sort { it?.eventDate }.collect { event ->
                    [
                            id          : event.id,
                            name        : localizeMetadata(event.eventType?.name),
                            date        : event.eventDate ? dateFormat.format(event.eventDate) : null,
                            time        : event.eventDate ? timeFormat.format(event.eventDate) : null,
                            locationName: event.eventLocation?.name,
                    ]
                } : [])),
                eventTypes     : EventType.list().collect { [id: it.id, name: localizeMetadata(it.name)] },
                eventLocations : Location.list().collect { [id: it.id, name: it.name] },
                documentTypes  : DocumentType.list().sort().collect { [id: it.id, name: localizeMetadata(it.name)] },
                defaultEventLocationId: session?.warehouse?.id,
                context        : [
                        isOrigin              : isOrigin,
                        isDestination         : isDestination,
                        hasShipped            : shipment.hasShipped(),
                        wasReceived           : shipment.wasReceived(),
                        isSendAllowed         : shipment.isSendAllowed(),
                        isReceiveAllowed      : shipment.isReceiveAllowed(),
                        isPartialReceiveAllowed: shipment.isPartialReceiveAllowed(),
                        requisitionId         : shipment.requisition?.id,
                ],
        ]] as JSON)
    }

    def packingList() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }
        def shipmentItems = shipment.shipmentItems ? shipment.shipmentItems.sort() : []
        render([data: [
                summary      : getShipmentSummary(shipment),
                wasReceived  : shipment.wasReceived(),
                shipmentItems: shipmentItems.collect { shipmentItem ->
                    [
                            id                 : shipmentItem.id,
                            container          : getContainerSummary(shipmentItem.container),
                            product            : [
                                    id  : shipmentItem.product?.id,
                                    name: localize(shipmentItem.product?.name),
                            ],
                            lotNumber          : shipmentItem.lotNumber,
                            expirationDate     : shipmentItem.expirationDate ?
                                    new SimpleDateFormat("d MMM yyyy").format(shipmentItem.expirationDate) : null,
                            quantity           : shipmentItem.quantity,
                            quantityReceived   : shipmentItem.quantityReceived(),
                            recipientName      : shipmentItem.recipient?.name,
                    ]
                },
        ]] as JSON)
    }

    def sendShipmentForm() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }
        def shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)
        def recipients = []
        if (!shipmentWorkflow?.isExcluded('carrier') && shipment.carrier) {
            recipients << [id: shipment.carrier.id, name: shipment.carrier.name, email: shipment.carrier.email, role: g.message(code: 'shipping.traveler.label')]
        }
        if (!shipmentWorkflow?.isExcluded('recipient') && shipment.recipient) {
            recipients << [id: shipment.recipient.id, name: shipment.recipient.name, email: shipment.recipient.email, role: g.message(code: 'shipping.recipient.label')]
        }
        shipment.allShipmentItems*.recipient?.findAll { it && it.id != shipment.recipient?.id }?.unique { it.id }?.each { recipient ->
            recipients << [id: recipient.id, name: recipient.name, email: recipient.email, role: g.message(code: 'shipping.recipient.label')]
        }

        render([data: [
                summary             : getShipmentSummary(shipment),
                originName          : shipment.origin?.name,
                destinationName     : shipment.destination?.name,
                originIsWarehouse   : shipment.origin?.isWarehouse(),
                statusCode          : shipment.status?.code?.name(),
                statusName          : localizeMetadata(shipment.status?.code),
                statusCreated       : localizeMetadata(ShipmentStatusCode.CREATED),
                statusShipped       : localizeMetadata(ShipmentStatusCode.SHIPPED),
                statusReceived      : localizeMetadata(ShipmentStatusCode.RECEIVED),
                expectedShippingDate: shipment.expectedShippingDate ?
                        new SimpleDateFormat("MM/dd/yyyy").format(shipment.expectedShippingDate) : null,
                shipmentItems       : (shipment.shipmentItems ? shipment.shipmentItems.sort() : []).collect { item ->
                    [
                            id           : item.id,
                            containerName: item.container?.name,
                            product      : [id: item.product?.id, name: localize(item.product?.name)],
                            lotNumber    : item.lotNumber,
                            quantity     : item.quantity,
                    ]
                },
                recipients          : recipients,
        ]] as JSON)
    }

    def sendShipment() {
        Shipment shipmentInstance = Shipment.get(params.id)
        if (!shipmentInstance) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }

        // make sure a shipping date has been specified and that is not the future
        if (!params.actualShippingDate || Date.parse("MM/dd/yyyy HH:mm XXX", params.actualShippingDate) > new Date()) {
            render([success: false, errors: [g.message(code: 'shipping.specifyValidShipmentDate.message')]] as JSON)
            return
        }

        try {
            shipmentService.sendShipment(shipmentInstance, params.comment, session.user, session.warehouse,
                    Date.parse("MM/dd/yyyy HH:mm XXX", params.actualShippingDate))
        }
        catch (TransactionException e) {
            render([success: false, errors: resolveErrors(e.transaction?.errors)] as JSON)
            return
        }

        if (shipmentInstance.hasErrors()) {
            render([success: false, errors: resolveErrors(shipmentInstance.errors)] as JSON)
            return
        }

        render([success: true, message: g.message(code: 'default.updated.message',
                args: [g.message(code: 'shipment.label', default: 'Shipment'), shipmentInstance.id])] as JSON)
    }

    def receiveShipmentForm() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }
        Location location = Location.get(session.warehouse.id)
        String warningMessage = null
        if (shipment.destination != location) {
            warningMessage = g.message(code: 'shipping.mustBeLoggedIntoDestinationToReceive.message', args: [shipment.destination])
        }
        Receipt receiptInstance = shipmentService.findOrCreateReceipt(shipment)

        Location currentLocation = Location.get(session?.warehouse?.id)
        boolean hasBinLocationSupport = currentLocation.hasBinLocationSupport()
        List binLocations = hasBinLocationSupport ?
                Location.findAllByParentLocationAndActive(currentLocation, true).sort { it?.name?.toLowerCase() }.collect {
                    [id: it.id, name: it.name]
                } : []

        SimpleDateFormat shippedOnFormat = new SimpleDateFormat("d MMMMM yyyy hh:mm a z")
        PrettyTime prettyTime = new PrettyTime(currentLocale)

        int i = 0
        List receiptItems = []
        shipment.shipmentItems.sort().each { shipmentItem ->
            shipmentItem.receiptItems.eachWithIndex { receiptItem, innerStatus ->
                receiptItems << [
                        index            : i++,
                        id               : receiptItem.id,
                        isFirstForShipmentItem: innerStatus == 0,
                        container        : getContainerSummary(receiptItem.shipmentItem?.container),
                        productCode      : receiptItem.product?.productCode,
                        product          : [id: receiptItem.product?.id, name: localize(receiptItem.product?.name)],
                        shipmentItemId   : receiptItem.shipmentItem?.id,
                        inventoryItemId  : receiptItem.inventoryItem?.id,
                        lotNumber        : receiptItem.lotNumber,
                        expirationDate   : receiptItem.inventoryItem?.expirationDate ?
                                new SimpleDateFormat("d MMM yyyy").format(receiptItem.inventoryItem.expirationDate) : null,
                        quantityShipped  : receiptItem.shipmentItem?.quantity,
                        quantityReceivedTotal: receiptItem.shipmentItem?.quantityReceived(),
                        hasQuantityMismatch: receiptItem.shipmentItem?.quantity != receiptItem.shipmentItem?.quantityReceived() && innerStatus == 0,
                        quantityReceived : receiptItem.quantityReceived,
                        binLocationId    : receiptItem.binLocation?.id,
                        comment          : receiptItem.comment,
                ]
            }
        }

        render([data: [
                summary              : getShipmentSummary(shipment),
                warningMessage       : warningMessage,
                receiptId            : receiptInstance?.id,
                actualShippingDate   : shipment.actualShippingDate ? shippedOnFormat.format(shipment.actualShippingDate) : null,
                actualShippingDatePretty: shipment.actualShippingDate ? prettyTime.format(shipment.actualShippingDate) : null,
                actualDeliveryDate   : receiptInstance?.actualDeliveryDate ?
                        new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").format(receiptInstance.actualDeliveryDate) : null,
                recipient            : receiptInstance?.recipient ? [id: receiptInstance.recipient.id, name: receiptInstance.recipient.name] : null,
                destinationIsWarehouse: shipment.destination?.isWarehouse(),
                hasBinLocationSupport: hasBinLocationSupport,
                binLocations         : binLocations,
                receiptItems         : receiptItems,
        ]] as JSON)
    }

    def receiveShipment() {
        Shipment shipmentInstance = Shipment.get(params.id)
        if (!shipmentInstance) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Shipment with ID ${params.id} not found"] as JSON)
            return
        }

        Receipt receiptInstance = shipmentInstance.receipt
        if (!receiptInstance) {
            receiptInstance = shipmentService.findOrCreateReceipt(shipmentInstance)
        }

        if (params.actualDeliveryDate) {
            receiptInstance.actualDeliveryDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").parse(params.actualDeliveryDate)
        } else {
            receiptInstance.actualDeliveryDate = null
        }
        if (params.containsKey("recipient.id")) {
            receiptInstance.recipient = params["recipient.id"] ? Person.get(params["recipient.id"]) : null
        }

        def receiptItemIds = params.list("receiptItems.id")
        def quantitiesReceived = params.list("receiptItems.quantityReceived")
        def binLocationIds = params.list("receiptItems.binLocation.id")
        def comments = params.list("receiptItems.comment")
        receiptItemIds.eachWithIndex { receiptItemId, index ->
            ReceiptItem receiptItem = receiptInstance.receiptItems.find { it.id == receiptItemId }
            if (receiptItem) {
                String quantityReceived = quantitiesReceived[index]
                receiptItem.quantityReceived = quantityReceived ? quantityReceived.toInteger() : null
                String binLocationId = binLocationIds[index]
                receiptItem.binLocation = binLocationId && binLocationId != "null" ? Location.get(binLocationId) : null
                receiptItem.comment = comments[index] ?: null
            }
        }

        if (receiptInstance.hasErrors() || !receiptInstance.validate()) {
            render([success: false, errors: resolveErrors(receiptInstance.errors)] as JSON)
            return
        }
        receiptInstance.save(flush: true)

        if (params.saveButton == 'receiveShipment') {
            try {
                shipmentService.receiveShipment(shipmentInstance.id, params.comment, session?.user?.id, session.warehouse?.id, true)
                if (!shipmentInstance.hasErrors()) {
                    render([success: true, received: true, message: g.message(code: 'default.received.message',
                            args: [g.message(code: 'shipment.label', default: 'Shipment'), shipmentInstance.shipmentNumber ?: shipmentInstance?.id])] as JSON)
                    return
                }
                render([success: false, errors: resolveErrors(shipmentInstance.errors)] as JSON)
                return
            } catch (ValidationException e) {
                render([success: false, errors: resolveErrors(e.errors)] as JSON)
                return
            }
        }

        render([success: true, received: false, message: g.message(code: 'default.updated.message',
                args: [g.message(code: 'shipment.label', default: 'Shipment'), shipmentInstance.shipmentNumber ?: shipmentInstance?.id])] as JSON)
    }

    def splitReceiptItem() {
        ReceiptItem receiptItem1 = ReceiptItem.get(params.id)
        if (!receiptItem1) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Receipt item with ID ${params.id} not found"] as JSON)
            return
        }
        ReceiptItem receiptItem2 = new ReceiptItem(receiptItem1.properties)
        receiptItem2.quantityReceived = 0
        receiptItem1.receipt.addToReceiptItems(receiptItem2)
        receiptItem1.receipt.save(flush: true)

        Shipment shipment = receiptItem1?.receipt?.shipment
        render([success: true, message: g.message(code: 'default.updated.message',
                args: [g.message(code: 'shipment.label', default: 'Shipment'), shipment.id])] as JSON)
    }

    def deleteReceiptItem() {
        ReceiptItem receiptItem = ReceiptItem.get(params.id)
        Shipment shipmentInstance = receiptItem?.receipt?.shipment

        if (receiptItem) {
            if (receiptItem.shipmentItem.receiptItems.size() <= 1) {
                render([success: false, errors: [g.message(code: 'shipping.mustHaveAtLeastOneReceiptItemPerShimentItem',
                        default: 'shipping.mustHaveAtLeastOneReceiptItemPerShimentItem')]] as JSON)
                return
            } else {
                Receipt receipt = receiptItem.receipt
                receipt.removeFromReceiptItems(receiptItem)
                receiptItem.shipmentItem.removeFromReceiptItems(receiptItem)
                receiptItem.delete()
                receipt.save(flush: true)
                render([success: true, message: g.message(code: 'default.updated.message',
                        args: [g.message(code: 'shipment.label', default: 'Shipment'), shipmentInstance.id])] as JSON)
                return
            }
        }
        render([success: false, errors: [g.message(code: 'default.not.found.message',
                args: [g.message(code: 'receiptItem.label', default: 'Receipt Item'), params.id])]] as JSON)
    }

    def deleteReceipt() {
        Receipt receiptInstance = Receipt.get(params.id)
        if (!receiptInstance) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Receipt with ID ${params.id} not found"] as JSON)
            return
        }
        Shipment shipmentInstance = receiptInstance?.shipment
        if (shipmentInstance) {
            shipmentInstance.receipt = null
        }
        receiptInstance.delete(flush: true)
        render([success: true] as JSON)
    }

    def putawayLocations() {
        Location location = Location.get(session.warehouse.id)
        ReceiptItem receiptItem = ReceiptItem.get(params.id)
        if (!receiptItem) {
            response.status = 404
            render([errorCode: 404, errorMessage: "Receipt item with ID ${params.id} not found"] as JSON)
            return
        }

        def productInstance = receiptItem.inventoryItem?.product
        def binLocations = inventoryService.getProductQuantityByBinLocation(location, productInstance)

        render([data: [
                product     : productInstance ? [id: productInstance.id, name: localize(productInstance.name)] : null,
                binLocations: binLocations.collect { entry ->
                    [
                            binLocationName: entry?.binLocation?.name ?: g.message(code: 'default.label'),
                            lotNumber      : entry?.inventoryItem?.lotNumber,
                            expirationDate : entry?.inventoryItem?.expirationDate ?
                                    new SimpleDateFormat("d MMM yyyy").format(entry.inventoryItem.expirationDate) : null,
                            quantity       : entry?.quantity,
                            unitOfMeasure  : entry?.product?.unitOfMeasure ?: "EA",
                    ]
                },
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
