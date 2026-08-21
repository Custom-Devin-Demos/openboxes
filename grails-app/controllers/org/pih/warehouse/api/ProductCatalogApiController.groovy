package org.pih.warehouse.api

import grails.converters.JSON
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.UploadService
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductCatalog
import org.pih.warehouse.product.ProductCatalogItem
import org.pih.warehouse.product.ProductService
import org.springframework.dao.DataIntegrityViolationException

class ProductCatalogApiController {

    UploadService uploadService
    ProductService productService

    def search() {
        params.max = Math.min(params.int('max', 10), 100)
        params.offset = params.int('offset', 0)
        List<ProductCatalog> productCatalogs = ProductCatalog.createCriteria().list(
                [max: params.max, offset: params.offset, sort: params.sort, order: params.order]) {}
        render([data: productCatalogs.collect { toJson(it) }, totalCount: productCatalogs.totalCount] as JSON)
    }

    def details() {
        ProductCatalog productCatalog = ProductCatalog.get(params.id)
        if (!productCatalog) {
            throw new ObjectNotFoundException(params.id, "ProductCatalog")
        }
        render(toDetailedJson(productCatalog) as JSON)
    }

    @Transactional
    def saveCatalog() {
        def data = request.JSON ?: params
        ProductCatalog productCatalogInstance = data.id ? ProductCatalog.get(data.id) : null
        if (data.id && !productCatalogInstance) {
            throw new ObjectNotFoundException(data.id as String, "ProductCatalog")
        }
        if (!productCatalogInstance) {
            productCatalogInstance = new ProductCatalog()
        } else if (data.version != null) {
            def version = data.version.toString().toLong()
            if (productCatalogInstance.version > version) {
                productCatalogInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'productCatalog.label', default: 'ProductCatalog')] as Object[],
                        "Another user has updated this ProductCatalog while you were editing")
                throw new ValidationException("Unable to save product catalog due to errors", productCatalogInstance.errors)
            }
        }

        productCatalogInstance.code = data.code
        productCatalogInstance.name = data.name
        productCatalogInstance.description = data.description ?: null
        productCatalogInstance.active = data.active as boolean
        if (data.containsKey("color")) {
            productCatalogInstance.color = data.color ?: null
        }

        if (!productCatalogInstance.hasErrors() && productCatalogInstance.save(flush: true)) {
            render(toDetailedJson(productCatalogInstance) as JSON)
        } else {
            throw new ValidationException("Unable to save product catalog due to errors", productCatalogInstance.errors)
        }
    }

    @Transactional
    def deleteCatalog() {
        ProductCatalog productCatalogInstance = ProductCatalog.get(params.id)
        if (!productCatalogInstance) {
            response.status = 404
            render([
                    errorCode   : 404,
                    errorMessage: "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'productCatalog.label', default: 'ProductCatalog'), params.id])}",
            ] as JSON)
            return
        }
        try {
            productCatalogInstance.delete(flush: true)
            render([message: "${warehouse.message(code: 'default.deleted.message', args: [warehouse.message(code: 'productCatalog.label', default: 'ProductCatalog'), params.id])}"] as JSON)
        } catch (DataIntegrityViolationException e) {
            response.status = 400
            render([
                    errorCode   : 400,
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'productCatalog.label', default: 'ProductCatalog'), params.id])}",
            ] as JSON)
        }
    }

    @Transactional
    def addItem() {
        def data = request.JSON ?: params
        ProductCatalog productCatalog = ProductCatalog.get(data.productCatalog?.id)
        Product product = Product.get(data.product?.id)
        if (productCatalog && product) {
            productCatalog.addToProductCatalogItems([product: product])
            productCatalog.save()
        }
        render([message: "${warehouse.message(code: 'default.added.message', args: [warehouse.message(code: 'productCatalogItem.label', default: 'Product Catalog Item'), data.productCatalog?.id])}"] as JSON)
    }

    @Transactional
    def removeItem() {
        ProductCatalogItem productCatalogItem = ProductCatalogItem.get(params.id)
        if (!productCatalogItem) {
            response.status = 404
            render([
                    errorCode   : 404,
                    errorMessage: "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'productCatalogItem.label', default: 'Product Catalog Item'), params.id])}",
            ] as JSON)
            return
        }
        try {
            ProductCatalog productCatalog = productCatalogItem.productCatalog
            if (productCatalog) {
                productCatalog.removeFromProductCatalogItems(productCatalogItem)
                productCatalog.save()
            }
            productCatalogItem.delete()
            render([message: "${warehouse.message(code: 'default.deleted.message', args: [warehouse.message(code: 'productCatalogItem.label', default: 'Product Catalog Item'), params.id])}"] as JSON)
        } catch (DataIntegrityViolationException e) {
            response.status = 400
            render([
                    errorCode   : 400,
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'productCatalogItem.label', default: 'Product Catalog Item'), params.id])}",
            ] as JSON)
        }
    }

    @Transactional
    def importItems(ImportDataCommand command) {
        def uploadFile = command?.importFile
        if (uploadFile && !uploadFile?.empty) {
            try {
                def localFile = uploadService.createLocalFile(uploadFile.originalFilename)
                uploadFile?.transferTo(localFile)
                def csv = localFile.getText()
                def rows = productService.parseProductCatalogItems(csv)
                rows.each {
                    if (it.productCatalog && it.product) {
                        if (!it.productCatalog.contains(it.product)) {
                            it.productCatalog.addToProductCatalogItems(new ProductCatalogItem(product: it.product))
                        }
                    }
                }
                render([message: "Imported ${rows.size()} catalog items from uploaded file ${uploadFile?.originalFilename}"] as JSON)
            } catch (Exception e) {
                log.error("Exception occurred while uploading product import CSV " + e.message, e)
                response.status = 400
                render([errorCode: 400, errorMessage: e.message] as JSON)
            }
        } else {
            log.warn("Cannot import product catalog items as file was empty")
            response.status = 400
            render([errorCode: 400, errorMessage: "${warehouse.message(code: 'import.emptyFile.message', default: 'File is empty')}"] as JSON)
        }
    }

    private Map toJson(ProductCatalog productCatalog) {
        return [
                id         : productCatalog.id,
                code       : productCatalog.code,
                name       : productCatalog.name,
                description: productCatalog.description,
                active     : productCatalog.active,
                color      : productCatalog.color,
                dateCreated: productCatalog.dateCreated,
                lastUpdated: productCatalog.lastUpdated,
        ]
    }

    private Map toDetailedJson(ProductCatalog productCatalog) {
        return toJson(productCatalog) + [
                version            : productCatalog.version,
                productCatalogItems: productCatalog.productCatalogItems ?
                        productCatalog.productCatalogItems.sort { it.product?.name }.collect {
                            [
                                    id      : it.id,
                                    product : [
                                            id          : it.product?.id,
                                            productCode : it.product?.productCode,
                                            name        : it.product?.name,
                                            categoryName: it.product?.category?.name,
                                    ],
                            ]
                        } : [],
        ]
    }
}
