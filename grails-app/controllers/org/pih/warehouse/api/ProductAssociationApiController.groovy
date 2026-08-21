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

    private Map toJson(ProductAssociation productAssociation) {
        return [
                id               : productAssociation.id,
                code             : productAssociation.code?.name(),
                product          : toProductJson(productAssociation.product),
                associatedProduct: toProductJson(productAssociation.associatedProduct),
                quantity         : productAssociation.quantity,
                comments         : productAssociation.comments,
                mutualAssociation: productAssociation.mutualAssociation != null,
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
