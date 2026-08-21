package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductAssociation
import org.pih.warehouse.product.ProductAssociationTypeCode
import org.springframework.dao.DataIntegrityViolationException

class ProductAssociationApiController {

    def productService
    def messageSource
    def localizationService

    def search() {
        params.max = Math.min(params.int('max', 10), 100)
        params.offset = params.int('offset', 0)

        def terms = params.q ? params?.q?.split(" ") : null
        def products = terms ? productService.searchProducts(terms, null) : []
        def selectedTypes = params.list("code").findAll { it }.collect { it as ProductAssociationTypeCode }

        def productAssociations = ProductAssociation.createCriteria().list(
                [max: params.max, offset: params.offset, sort: params.sort, order: params.order]) {
            if (selectedTypes) {
                'in'("code", selectedTypes)
            }
            or {
                if (params.q) {
                    ilike("id", params.q + "%")
                }
                if (products) {
                    or {
                        'in'("product", products)
                        'in'("associatedProduct", products)
                    }
                }
            }
        }

        render([data: productAssociations.collect { toJson(it) }, totalCount: productAssociations.totalCount] as JSON)
    }

    def details() {
        ProductAssociation productAssociation = ProductAssociation.get(params.id)
        if (!productAssociation) {
            throw new ObjectNotFoundException(params.id, "ProductAssociation")
        }
        render(toJson(productAssociation) as JSON)
    }

    /**
     * Create a product association. Mirrors ProductAssociationController.save(),
     * including the mutual (two-way) association handling.
     */
    @Transactional
    def save() {
        Map data = request.JSON as Map
        ProductAssociation productAssociationInstance = new ProductAssociation()
        bindAssociationData(productAssociationInstance, data)
        if (data.hasMutualAssociation) {
            ProductAssociation mutualAssociationInstance = new ProductAssociation()
            bindMutualAssociationData(mutualAssociationInstance, data)
            mutualAssociationInstance.mutualAssociation = productAssociationInstance
            mutualAssociationInstance.save(flush: true)
            productAssociationInstance.mutualAssociation = mutualAssociationInstance
        }
        productAssociationInstance.validate()
        if (!productAssociationInstance.hasErrors() && productAssociationInstance.save(flush: true)) {
            render([
                    id     : productAssociationInstance.id,
                    message: "${warehouse.message(code: 'default.created.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), productAssociationInstance.id])}",
            ] as JSON)
        } else {
            transactionStatus.setRollbackOnly()
            response.status = 400
            render([errorCode: 400, errorMessages: errorMessages(productAssociationInstance)] as JSON)
        }
    }

    /**
     * Update a product association. Mirrors ProductAssociationController.update(),
     * including optimistic locking and mutual (two-way) association handling.
     */
    @Transactional
    def update() {
        Map data = request.JSON as Map
        ProductAssociation productAssociationInstance = ProductAssociation.get(params.id)
        if (!productAssociationInstance) {
            response.status = 404
            render([
                    errorCode   : 404,
                    errorMessage: "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), params.id])}",
            ] as JSON)
            return
        }
        if (data.version != null) {
            Long version = data.version as Long
            if (productAssociationInstance.version > version) {
                productAssociationInstance.errors.rejectValue("version", "default.optimistic.locking.failure", [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation')] as Object[], "Another user has updated this ProductAssociation while you were editing")
                response.status = 400
                render([errorCode: 400, errorMessages: errorMessages(productAssociationInstance)] as JSON)
                return
            }
        }

        def mutualAssociationInstance
        if (data.hasMutualAssociation) {
            if (productAssociationInstance.mutualAssociation) {
                mutualAssociationInstance = productAssociationInstance.mutualAssociation
            } else {
                mutualAssociationInstance = new ProductAssociation()
                mutualAssociationInstance.mutualAssociation = productAssociationInstance
                productAssociationInstance.mutualAssociation = mutualAssociationInstance
            }

            bindMutualAssociationData(mutualAssociationInstance, data)
            if (!mutualAssociationInstance.validate()) {
                mutualAssociationInstance.errors.allErrors.each { error ->
                    productAssociationInstance.errors.addError(error)
                }
                transactionStatus.setRollbackOnly()
                response.status = 400
                render([errorCode: 400, errorMessages: errorMessages(productAssociationInstance)] as JSON)
                return
            }
            mutualAssociationInstance.save(flush: true, failOnError: true)
        } else if (productAssociationInstance.mutualAssociation) {
            mutualAssociationInstance = productAssociationInstance.mutualAssociation
            productAssociationInstance.mutualAssociation = null
            mutualAssociationInstance.delete()
        }

        bindAssociationData(productAssociationInstance, data)
        if (!productAssociationInstance.hasErrors() && productAssociationInstance.save(flush: true)) {
            render([
                    id     : productAssociationInstance.id,
                    message: "${warehouse.message(code: 'default.updated.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), productAssociationInstance.id])}",
            ] as JSON)
        } else {
            transactionStatus.setRollbackOnly()
            response.status = 400
            render([errorCode: 400, errorMessages: errorMessages(productAssociationInstance)] as JSON)
        }
    }

    @Transactional
    def delete() {
        ProductAssociation productAssociationInstance = ProductAssociation.get(params.id)
        if (!productAssociationInstance) {
            response.status = 404
            render([
                    errorCode   : 404,
                    errorMessage: "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), params.id])}",
            ] as JSON)
            return
        }
        try {
            if (productAssociationInstance.mutualAssociation) {
                ProductAssociation mutualAssociation = ProductAssociation.get(productAssociationInstance.mutualAssociation.id)
                mutualAssociation.mutualAssociation = null
                productAssociationInstance.mutualAssociation = null
                if (Boolean.valueOf(params.mutualDelete as String)) {
                    mutualAssociation.delete()
                } else {
                    mutualAssociation.save()
                }
            }
            productAssociationInstance.delete(flush: true)
            render([message: "${warehouse.message(code: 'default.deleted.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), params.id])}"] as JSON)
        } catch (DataIntegrityViolationException e) {
            response.status = 400
            render([
                    errorCode   : 400,
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'productAssociation.label', default: 'ProductAssociation'), params.id])}",
            ] as JSON)
        }
    }

    private void bindAssociationData(ProductAssociation association, Map data) {
        association.product = data.product?.id ? Product.get(data.product.id) : null
        association.associatedProduct = data.associatedProduct?.id ? Product.get(data.associatedProduct.id) : null
        association.code = data.code ? data.code as ProductAssociationTypeCode : null
        association.quantity = parseQuantity(data.quantity)
        association.comments = data.comments
    }

    // Mirrors ProductAssociationController.bindMutualAssociationData()
    private void bindMutualAssociationData(ProductAssociation mutualAssociation, Map data) {
        mutualAssociation.product = data.associatedProduct?.id ? Product.get(data.associatedProduct.id) : null
        mutualAssociation.associatedProduct = data.product?.id ? Product.get(data.product.id) : null
        def quantity = data.quantity as Integer
        mutualAssociation.quantity = quantity != 0 ? (1 / quantity) : 0 as BigDecimal
        mutualAssociation.code = ProductAssociationTypeCode.valueOf(ProductAssociationTypeCode, data.code as String)
        mutualAssociation.comments = data.comments
    }

    private BigDecimal parseQuantity(quantity) {
        if (quantity == null || quantity.toString().trim() == "") {
            return null
        }
        try {
            return new BigDecimal(quantity.toString())
        } catch (NumberFormatException ignored) {
            return null
        }
    }

    private List errorMessages(ProductAssociation productAssociation) {
        return productAssociation.errors.allErrors.collect {
            messageSource.getMessage(it, localizationService.currentLocale)
        }
    }

    private Map toJson(ProductAssociation productAssociation) {
        return [
                id               : productAssociation.id,
                code             : productAssociation.code?.name(),
                product          : toProductJson(productAssociation.product),
                associatedProduct: toProductJson(productAssociation.associatedProduct),
                quantity         : productAssociation.quantity,
                comments         : productAssociation.comments,
                mutualAssociation: productAssociation.mutualAssociation != null,
                version          : productAssociation.version,
                dateCreated      : productAssociation.dateCreated?.toString(),
                lastUpdated      : productAssociation.lastUpdated?.toString(),
        ]
    }

    private Map toProductJson(Product product) {
        return product ? [
                id         : product.id,
                productCode: product.productCode,
                name       : product.name,
        ] : null
    }
}
