package org.pih.warehouse.api

import grails.converters.JSON
import grails.core.GrailsApplication
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.apache.commons.io.FilenameUtils
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentCode
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.SynonymTypeCode
import org.pih.warehouse.core.Tag
import org.pih.warehouse.core.UploadService
import org.pih.warehouse.core.User
import org.pih.warehouse.importer.CSVUtils
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.inventory.InventoryLevel
import org.pih.warehouse.inventory.InventoryStatus
import org.pih.warehouse.product.Attribute
import org.pih.warehouse.product.Category
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductAttribute
import org.pih.warehouse.product.ProductCatalog
import org.pih.warehouse.product.ProductField
import org.pih.warehouse.product.ProductType
import org.pih.warehouse.core.EntityTypeCode
import util.FileUtil
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.multipart.MultipartFile

class ProductScreenApiController {

    def productService
    def documentService
    def userService
    def categoryService
    def localizationService
    def messageSource
    def mailService
    def groovyPageRenderer
    UploadService uploadService
    GrailsApplication grailsApplication

    @Value('${openboxes.import.product.createMissingCategories}')
    boolean createMissingCategories

    /**
     * Data for the React product edit page (and create page when no id is given).
     * Mirrors the model provided to product/edit.gsp and its tab templates.
     */
    def editData() {
        User user = User.get(session?.user?.id)
        Location location = Location.get(session?.warehouse?.id)
        Product product = params.id ? Product.get(params.id) : null

        if (params.id && !product) {
            response.status = 404
            render([errorMessage: warehouseMessage('default.not.found.message',
                    [warehouseMessage('product.label', null, 'Product'), params.id])] as JSON)
            return
        }

        ProductType defaultProductType = ProductType.defaultProductType.list()?.first()
        boolean isAdmin = userService.isUserAdmin(user)
        boolean isProductManager = userService.hasRoleProductManager(user)
        boolean hasRoleFinance = userService.hasRoleFinance(user)

        render([
                product              : product ? toProductDetails(product, hasRoleFinance) : null,
                defaultProductTypeId : defaultProductType?.id,
                productTypes         : ProductType.list().collect {
                    [
                            id             : it.id,
                            name           : it.name,
                            displayedFields: it.displayedFields ? it.displayedFields*.name() : ProductField.values()*.name(),
                    ]
                },
                attributes           : availableProductAttributes().collect { attribute ->
                    ProductAttribute productAttribute = product?.attributes?.find { it.attribute?.id == attribute.id }
                    [
                            id        : attribute.id,
                            code      : attribute.code,
                            name      : localizationService.getLocalizedString(attribute.name),
                            required  : attribute.required ?: false,
                            allowOther: attribute.allowOther ?: false,
                            options   : attribute.options ?: [],
                            value     : productAttribute?.value,
                    ]
                },
                productSupplierAttributes: Attribute.findAllByActive(true).findAll {
                    it.entityTypeCode == EntityTypeCode.PRODUCT_SUPPLIER
                }.collect { [id: it.id, name: it.name, code: it.code] },
                synonymTypeCodes     : SynonymTypeCode.values().collect { it.name() },
                supportedLocales     : grailsApplication.config.openboxes.locale.supportedLocales?.sort() ?: [],
                currencyCode         : grailsApplication.config.openboxes.locale.defaultCurrencyCode,
                bomEnabled           : grailsApplication.config.openboxes.bom.enabled ?: false,
                mergeProductsEnabled : grailsApplication.config.openboxes.products.merge.enabled ?: false,
                assigningParentCategoryToProductEnabled: categoryService.isAssigningParentToProductEnabled(),
                isAccountingRequired : location?.isAccountingRequired() ?: false,
                permissions          : [
                        isUserAdmin            : isAdmin,
                        isUserManager          : userService.isUserManager(user),
                        isSuperuser            : userService.isSuperuser(user),
                        hasRoleFinance         : hasRoleFinance,
                        hasRoleProductManager  : isProductManager,
                        canManageProductSources: isAdmin && isProductManager,
                ],
        ] as JSON)
    }

    /**
     * Create or update product details. Mirrors ProductController.save()/update()
     * including tag/attribute handling, product type validation, optimistic locking
     * and required-fields-in-location validation.
     */
    @Transactional
    def saveDetails() {
        Location location = Location.get(session?.warehouse?.id)
        Product productInstance
        boolean isNew = !params.id

        if (isNew) {
            productInstance = new Product()
            productInstance.properties = params
        } else {
            productInstance = Product.get(params.id)
            if (!productInstance) {
                response.status = 404
                render([errorMessages: [warehouseMessage('default.not.found.message',
                        [warehouseMessage('product.label', null, 'Product'), params.id])]] as JSON)
                return
            }
            if (params.version) {
                long version = params.version.toLong()
                if (productInstance.version > version) {
                    productInstance.errors.rejectValue("version", "default.optimistic.locking.failure", [
                            warehouseMessage('product.label', null, 'Product')] as Object[],
                            "Another user has updated this product while you were editing")
                    renderErrors(productInstance)
                    return
                }
            }
            productInstance.properties = params
        }

        ProductType defaultProductType = ProductType.defaultProductType.list()?.first()
        if (productInstance.productType?.id != defaultProductType?.id && !productInstance.productType?.code &&
                !productInstance.productType?.productIdentifierFormat) {
            productInstance.errors.reject("product.productType.emptyCodeAndIdentifier.error.message")
            renderErrors(productInstance)
            return
        }

        try {
            updateTags(productInstance, params)
            if (!isNew) {
                updateAttributes(productInstance, params)

                def toBeDeleted = productInstance.categories.findAll { (it?.deleted || (it == null)) }
                if (toBeDeleted) {
                    productInstance.categories.removeAll(toBeDeleted)
                }
            }

            if (!productInstance?.id || productInstance.validate()) {
                if (!productInstance.productCode) {
                    productInstance.productCode = productService.generateProductIdentifier(productInstance)
                }
            }

            productInstance.validateRequiredFieldsInLocation(location)

            boolean saved
            if (isNew) {
                saved = !productInstance.hasErrors() && productService.saveProduct(productInstance)
            } else {
                saved = !productInstance.hasErrors() && productInstance.save(failOnError: true, flush: true)
            }

            if (saved) {
                if (isNew) {
                    sendProductCreatedNotification(productInstance)
                }
                String messageCode = isNew ? 'default.created.message' : 'default.updated.message'
                render([
                        success: true,
                        id     : productInstance.id,
                        message: warehouseMessage(messageCode,
                                [warehouseMessage('product.label', null, 'Product'), productInstance.productCode ?: productInstance.name]),
                ] as JSON)
            } else {
                renderErrors(productInstance)
            }
        } catch (ValidationException e) {
            def errorMessages = e.errors.allErrors.collect {
                messageSource.getMessage(it, localizationService.currentLocale)
            }
            if (!isNew) {
                // Clear attributes to prevent transient object exception (mirrors legacy update())
                productInstance.attributes.clear()
                productInstance.discard()
            }
            response.status = 400
            render([errorMessages: errorMessages] as JSON)
        }
    }

    /**
     * Data for the batch edit screen. Mirrors ProductController.batchEdit():
     * products are only fetched when a category or tag filter is present.
     */
    def batchEditData() {
        Category category = Category.get(params.categoryId)
        def tagIds = params.list("tagId")

        def products = []
        Integer totalCount = 0
        if (category || tagIds) {
            products = productService.getProducts(category, tagIds, params)
            totalCount = products?.totalCount ?: 0
        }

        render([
                products    : products.collect { Product product ->
                    [
                            id              : product.id,
                            productCode     : product.productCode,
                            name            : product.name,
                            category        : product.category ? [id: product.category.id, name: product.category.name] : null,
                            manufacturer    : product.manufacturer,
                            manufacturerCode: product.manufacturerCode,
                            brandName       : product.brandName,
                            unitOfMeasure   : product.unitOfMeasure,
                            coldChain       : product.coldChain ?: false,
                            createdBy       : product.createdBy?.name,
                            updatedBy       : product.updatedBy?.name,
                            dateCreated     : product.dateCreated,
                            lastUpdated     : product.lastUpdated,
                    ]
                },
                totalCount  : totalCount,
                categoryName: category?.name,
        ] as JSON)
    }

    /**
     * Batch save products. Mirrors ProductController.batchSave().
     */
    @Transactional
    def batchSave() {
        def jsonRequest = request.JSON
        def productEdits = jsonRequest?.products

        if (!productEdits) {
            response.status = 400
            render([errorMessages: [warehouseMessage('default.noResults.message', null, 'No results')]] as JSON)
            return
        }

        List errorMessages = []
        productEdits.each { productEdit ->
            Product product = Product.get(productEdit.id)
            if (!product) {
                return
            }
            product.productCode = productEdit.productCode
            product.name = productEdit.name
            product.manufacturer = productEdit.manufacturer
            product.manufacturerCode = productEdit.manufacturerCode
            product.brandName = productEdit.brandName
            product.unitOfMeasure = productEdit.unitOfMeasure
            product.coldChain = productEdit.coldChain ?: false
            if (productEdit.categoryId) {
                product.category = Category.get(productEdit.categoryId)
            }

            if (!product.hasErrors() && product.save()) {
                // saved with no errors
            } else {
                product.errors.getAllErrors().each {
                    errorMessages << messageSource.getMessage(it, localizationService.currentLocale)
                }
            }
        }

        if (errorMessages) {
            response.status = 400
            render([errorMessages: errorMessages] as JSON)
        } else {
            render([success: true, message: warehouseMessage('product.allSavedSuccessfully.message')] as JSON)
        }
    }

    /**
     * Upload a CSV of products for import. Mirrors ProductController.uploadCsv()
     * (including storing the uploaded file on the session for the import step).
     */
    def importUpload(ImportDataCommand command) {
        MultipartFile uploadFile = command?.importFile

        def columns = []
        def localFile
        String tag = ""

        if (!uploadFile || uploadFile.empty) {
            response.status = 400
            render([errorMessages: [warehouseMessage('import.emptyFile.message', null, 'File is empty')]] as JSON)
            return
        }

        try {
            localFile = uploadService.createLocalFile(uploadFile.originalFilename)
            uploadFile.transferTo(localFile)
            session.localFile = localFile
            String fileEncoding = CSVUtils.detectCsvCharset(localFile)
            def csv = localFile.getText(fileEncoding)

            columns = productService.getColumns(csv)
            tag = FilenameUtils.getBaseName(uploadFile.originalFilename)
            command.products = productService.validateProducts(csv, createMissingCategories)
        } catch (FileNotFoundException e) {
            log.error("File not found exception occurred while uploading product import CSV " + e.message, e)
            response.status = 400
            render([errorMessages: ["File '${localFile?.absolutePath}' could not be uploaded.  This is most likely due to a file permission error.  Make sure that the 'uploads' directory exists and has the proper read/write permissions."]] as JSON)
            return
        } catch (Exception e) {
            log.error("An error occurred while uploading product import CSV " + e.message, e)
            response.status = 400
            render([errorMessages: [e.message ?: "Unknown error"]] as JSON)
            return
        }

        render([
                success  : true,
                message  : "Uploaded file ${uploadFile.originalFilename} to ${localFile.absolutePath}".toString(),
                filename : uploadFile.originalFilename,
                contentType: uploadFile.contentType,
                size     : uploadFile.size,
                columns  : columns.collect { it?.replace("\"", "") },
                tag      : tag,
                products : command.products.collect { toImportPreviewRow(it) },
        ] as JSON)
    }

    /**
     * Import previously uploaded CSV. Mirrors ProductController.importCsv().
     */
    def importConfirm() {
        if (!session.localFile) {
            response.status = 400
            render([errorMessages: [warehouseMessage('import.product.uploadDataFile.message', null,
                    'You must upload a data file before proceeding to this step.')]] as JSON)
            return
        }

        try {
            String fileEncoding = CSVUtils.detectCsvCharset(session.localFile)
            def csv = session.localFile.getText(fileEncoding)
            def tags = params?.tagsToBeAdded?.split(",") as List ?: []
            def products = productService.validateProducts(csv, createMissingCategories)
            productService.importProducts(products, tags)
            render([
                    success: true,
                    message: "All ${products?.size()} product(s) were imported successfully.".toString(),
                    tag    : tags ? tags[0] : null,
            ] as JSON)
        } catch (ValidationException e) {
            def errorMessages = e.errors.allErrors.collect {
                messageSource.getMessage(it, localizationService.currentLocale)
            }
            response.status = 400
            render([errorMessages: errorMessages] as JSON)
        }
    }

    /**
     * Context for the add document screen: product summary + non-template document types.
     * Mirrors ProductController.addDocument().
     */
    def addDocumentContext() {
        Product product = Product.get(params.id)
        if (!product) {
            response.status = 404
            render([errorMessage: warehouseMessage('default.not.found.message',
                    [warehouseMessage('product.label', null, 'Product'), params.id])] as JSON)
            return
        }
        List<DocumentType> documentTypes = documentService.getNonTemplateDocumentTypes()
        render([
                product      : [
                        id         : product.id,
                        productCode: product.productCode,
                        name       : product.name,
                ],
                documentTypes: documentTypes.collect {
                    [id: it.id, name: localizationService.getLocalizedString(it.name)]
                },
        ] as JSON)
    }

    /**
     * Upload a document and attach it to a product. Mirrors the product branch of
     * DocumentController.uploadDocument() including validation and messages.
     */
    @Transactional
    def uploadDocument() {
        Product product = Product.get(params.id ?: params["productId"])
        if (!product) {
            response.status = 404
            render([errorMessages: [warehouseMessage('default.not.found.message',
                    [warehouseMessage('product.label', null, 'Product'), params.id])]] as JSON)
            return
        }

        MultipartFile file = request.respondsTo("getFile") ? request.getFile("fileContents") : null
        String fileUri = params.fileUri

        // file must not be empty and must be less than 10MB (mirrors DocumentController)
        if (!((file && !file.empty && file.size) || fileUri)) {
            response.status = 400
            render([errorMessages: [warehouseMessage('document.documentCannotBeEmpty.message')]] as JSON)
            return
        }
        if (file && file.size && !Document.isAllowedFile(file.originalFilename, file.contentType, file.inputStream)) {
            response.status = 400
            render([errorMessages: [warehouseMessage('document.uploadNotAllowed.message',
                    [Document.allowedExtensions().join(', ')])]] as JSON)
            return
        }
        if (file && file.size >= 10 * 1024 * 1000) {
            response.status = 400
            render([errorMessages: [warehouseMessage('document.documentTooLarge.message', null, 'Document is too large')]] as JSON)
            return
        }

        String typeId = params.typeId ?: Constants.DEFAULT_DOCUMENT_TYPE_ID
        DocumentType documentType = DocumentType.get(typeId)

        Document documentInstance = new Document(
                size: file?.size,
                name: params.name ?: file?.originalFilename,
                filename: file?.originalFilename,
                fileContents: file?.bytes,
                fileUri: fileUri,
                contentType: file?.contentType,
                extension: file?.originalFilename ? FileUtil.getExtension(file.originalFilename) : null,
                documentType: documentType)

        documentInstance.validate()

        List<DocumentCode> forbiddenDocumentCodes = DocumentCode.templateList()
        if (documentType && forbiddenDocumentCodes.contains(documentType.documentCode)) {
            documentInstance.errors.reject("documentType", "Template types are not allowed for this document upload")
        }

        if (!documentInstance.hasErrors()) {
            product.addToDocuments(documentInstance).save(flush: true)
            render([success: true, message: warehouseMessage('document.succesfullyUpdatedDocument.message')] as JSON)
        } else {
            response.status = 400
            render([errorMessages: [warehouseMessage('document.cannotSave.message', [documentInstance.errors.toString()])]] as JSON)
        }
    }

    /**
     * Add a synonym to a product. Mirrors ProductController.addSynonymToProduct()
     * but returns JSON errors instead of re-rendering the template.
     */
    @Transactional
    def addSynonym() {
        try {
            productService.addSynonymToProduct(params.id, params.synonymTypeCode, params.synonym, params.locale)
            render([success: true] as JSON)
        } catch (ValidationException e) {
            def errorMessages = e.errors.allErrors.collect {
                messageSource.getMessage(it, localizationService.currentLocale)
            }
            response.status = 400
            render([errorMessages: errorMessages] as JSON)
        }
    }

    private List<Attribute> availableProductAttributes() {
        // Same filtering as /attribute/renderFormList with entityTypeCodes=[PRODUCT], showUnlinkedAttributes=true
        return Attribute.findAllByActive(true).findAll {
            !it.entityTypeCodes || it.entityTypeCodes.any { code -> code == EntityTypeCode.PRODUCT }
        }
    }

    private Map toProductDetails(Product product, boolean hasRoleFinance) {
        return [
                id                 : product.id,
                version            : product.version,
                active             : product.active,
                productType        : product.productType ? [id: product.productType.id, name: product.productType.name] : null,
                productCode        : product.productCode,
                name               : product.name,
                displayName        : product.displayNameOrDefaultName,
                category           : product.category ? [id: product.category.id, name: product.category.name] : null,
                productFamily      : product.productFamily ? [id: product.productFamily.id, name: product.productFamily.name] : null,
                glAccount          : product.glAccount ? [id: product.glAccount.id, code: product.glAccount.code, name: product.glAccount.name] : null,
                unitOfMeasure      : product.unitOfMeasure,
                pricePerUnit       : hasRoleFinance ? product.pricePerUnit : null,
                description        : product.description,
                tags               : product.tagsToString(),
                abcClass           : product.abcClass,
                coldChain          : product.coldChain ?: false,
                controlledSubstance: product.controlledSubstance ?: false,
                hazardousMaterial  : product.hazardousMaterial ?: false,
                reconditioned      : product.reconditioned ?: false,
                lotAndExpiryControl: product.lotAndExpiryControl ?: false,
                brandName          : product.brandName,
                manufacturer       : product.manufacturer,
                manufacturerCode   : product.manufacturerCode,
                manufacturerName   : product.manufacturerName,
                modelNumber        : product.modelNumber,
                vendor             : product.vendor,
                vendorCode         : product.vendorCode,
                vendorName         : product.vendorName,
                upc                : product.upc,
                ndc                : product.ndc,
                productCatalogs    : product.productCatalogs?.collect { [id: it.id, code: it.code, name: it.name] } ?: [],
                tagList            : product.tags?.collect { [id: it.id, tag: it.tag] } ?: [],
                suppliers          : toSuppliers(product, hasRoleFinance),
                inventoryLevels    : toInventoryLevels(product),
                documents          : toDocuments(product),
                associations       : toAssociations(product),
                packages           : toPackages(product, hasRoleFinance),
                productGroups      : toProductGroups(product),
                synonyms           : toSynonyms(product),
                allProductCatalogs : ProductCatalog.list().collect { [id: it.id, name: it.name] },
        ]
    }

    private List toSuppliers(Product product, boolean hasRoleFinance) {
        String currencyCode = grailsApplication.config.openboxes.locale.defaultCurrencyCode
        return product.productSuppliers?.findAll { it.active }?.sort()?.collect { productSupplier ->
            def defaultProductPackage = productSupplier.defaultProductPackageDerived
            BigDecimal packagePrice = defaultProductPackage?.productPrice?.price
            [
                    id              : productSupplier.id,
                    code            : productSupplier.code,
                    name            : productSupplier.name,
                    productCode     : productSupplier.productCode,
                    supplier        : productSupplier.supplier?.name,
                    supplierCode    : productSupplier.supplierCode,
                    manufacturer    : productSupplier.manufacturer?.name,
                    manufacturerCode: productSupplier.manufacturerCode,
                    ratingTypeCode  : productSupplier.ratingTypeCode?.name(),
                    unitOfMeasure   : defaultProductPackage ? "${defaultProductPackage.uom?.code}/${defaultProductPackage.quantity}".toString() : null,
                    packagePrice    : (defaultProductPackage?.productPrice && hasRoleFinance) ? "${packagePrice} ${currencyCode}".toString() : null,
                    unitPrice       : (defaultProductPackage?.productPrice && defaultProductPackage?.quantity && hasRoleFinance) ?
                            "${packagePrice / defaultProductPackage.quantity} ${currencyCode}".toString() : null,
                    priceRestricted : !hasRoleFinance && defaultProductPackage?.productPrice != null,
                    attributes      : productSupplier.attributes?.collect {
                        [attributeId: it.attribute?.id, value: it.value, unitOfMeasure: it.unitOfMeasure?.code]
                    } ?: [],
            ]
        } ?: []
    }

    private List toInventoryLevels(Product product) {
        return product.inventoryLevels?.sort { it?.inventory?.warehouse?.name }?.collect { InventoryLevel level ->
            String statusType = level.status in InventoryStatus.listEnabled() ? "enabled" :
                    level.status in InventoryStatus.listDisabled() ? "disabled" : "other"
            [
                    id                    : level.id,
                    status                : level.status?.name(),
                    statusType            : statusType,
                    location              : level.inventory?.warehouse?.name,
                    internalLocation      : level.internalLocation?.name,
                    abcClass              : level.abcClass,
                    preferredBinLocation  : level.preferredBinLocation?.name,
                    replenishmentLocation : level.replenishmentLocation?.name,
                    minQuantity           : level.minQuantity ?: 0,
                    reorderQuantity       : level.reorderQuantity ?: 0,
                    maxQuantity           : level.maxQuantity ?: 0,
                    forecastQuantity      : level.forecastQuantity ?: 0,
                    forecastPeriodDays    : level.forecastPeriodDays ?: 0,
                    comments              : level.comments,
                    lastUpdated           : level.lastUpdated,
            ]
        } ?: []
    }

    private List toDocuments(Product product) {
        return product.documents?.collect { Document document ->
            [
                    id         : document.id,
                    name       : document.name,
                    filename   : document.filename,
                    fileUri    : document.fileUri,
                    contentType: document.contentType,
                    lastUpdated: document.lastUpdated,
            ]
        } ?: []
    }

    private List toAssociations(Product product) {
        return product.associations?.collect { association ->
            [
                    id               : association.id,
                    code             : association.code?.name(),
                    associatedProduct: association.associatedProduct ? [
                            id         : association.associatedProduct.id,
                            productCode: association.associatedProduct.productCode,
                            name       : association.associatedProduct.name,
                            displayName: association.associatedProduct.displayNameOrDefaultName,
                    ] : null,
                    quantity         : association.quantity,
                    comments         : association.comments,
                    dateCreated      : association.dateCreated,
                    mutualAssociation: association.mutualAssociation ?: false,
            ]
        } ?: []
    }

    private List toPackages(Product product, boolean hasRoleFinance) {
        return product.packages?.collect { pkg ->
            [
                    id             : pkg.id,
                    name           : pkg.name,
                    uom            : pkg.uom ? [id: pkg.uom.id, name: pkg.uom.name, code: pkg.uom.code] : null,
                    quantity       : pkg.quantity,
                    productSupplier: pkg.productSupplier?.code,
                    gtin           : pkg.gtin,
                    price          : hasRoleFinance ? pkg.productPrice?.price : null,
                    hasPrice       : pkg.productPrice != null,
            ]
        } ?: []
    }

    private List toProductGroups(Product product) {
        return product.productGroups?.collect { group ->
            [
                    id      : group.id,
                    name    : group.name,
                    products: group.products?.collect {
                        [id: it.id, productCode: it.productCode, name: it.name]
                    } ?: [],
            ]
        } ?: []
    }

    private List toSynonyms(Product product) {
        return product.synonyms?.collect { synonym ->
            [
                    id             : synonym.id,
                    name           : synonym.name,
                    locale         : synonym.locale?.toString(),
                    synonymTypeCode: synonym.synonymTypeCode?.name(),
            ]
        } ?: []
    }

    private Map toImportPreviewRow(Map productProperties) {
        Product existingProduct = productProperties.product
        return [
                id                 : productProperties.id,
                isNew              : !productProperties.id,
                active             : productProperties.active,
                productCode        : productProperties.productCode,
                productType        : productProperties.productType?.name,
                name               : productProperties.name,
                productFamily      : productProperties.productFamily?.toString(),
                category           : productProperties.category?.toString(),
                glAccountCode      : productProperties.glAccount?.code,
                description        : productProperties.description,
                unitOfMeasure      : productProperties.unitOfMeasure,
                tags               : productProperties.tags?.collect { it?.toString() } ?: [],
                pricePerUnit       : productProperties.pricePerUnit,
                lotAndExpiryControl: productProperties.lotAndExpiryControl,
                coldChain          : productProperties.coldChain,
                controlledSubstance: productProperties.controlledSubstance,
                hazardousMaterial  : productProperties.hazardousMaterial,
                reconditioned      : productProperties.reconditioned,
                manufacturer       : productProperties.manufacturer,
                brandName          : productProperties.brandName,
                manufacturerCode   : productProperties.manufacturerCode,
                manufacturerName   : productProperties.manufacturerName,
                vendor             : productProperties.vendor,
                vendorCode         : productProperties.vendorCode,
                vendorName         : productProperties.vendorName,
                upc                : productProperties.upc,
                ndc                : productProperties.ndc,
                dateCreated        : existingProduct?.dateCreated,
                lastUpdated        : existingProduct?.lastUpdated,
                existing           : existingProduct ? [
                        active             : existingProduct.active,
                        productCode        : existingProduct.productCode,
                        productType        : existingProduct.productType?.name,
                        name               : existingProduct.name,
                        productFamily      : existingProduct.productFamily?.toString(),
                        category           : existingProduct.category?.toString(),
                        glAccountCode      : existingProduct.glAccount?.code,
                        description        : existingProduct.description,
                        unitOfMeasure      : existingProduct.unitOfMeasure,
                        tags               : existingProduct.tags?.collect { it.tag } ?: [],
                        pricePerUnit       : existingProduct.pricePerUnit,
                        lotAndExpiryControl: existingProduct.lotAndExpiryControl,
                        coldChain          : existingProduct.coldChain,
                        controlledSubstance: existingProduct.controlledSubstance,
                        hazardousMaterial  : existingProduct.hazardousMaterial,
                        reconditioned      : existingProduct.reconditioned,
                        manufacturer       : existingProduct.manufacturer,
                        brandName          : existingProduct.brandName,
                        manufacturerCode   : existingProduct.manufacturerCode,
                        manufacturerName   : existingProduct.manufacturerName,
                        vendor             : existingProduct.vendor,
                        vendorCode         : existingProduct.vendorCode,
                        vendorName         : existingProduct.vendorName,
                        upc                : existingProduct.upc,
                        ndc                : existingProduct.ndc,
                ] : null,
        ]
    }

    private void updateTags(Product productInstance, params) {
        // Mirrors ProductController.updateTags()
        try {
            def tagList = []
            if (params.tagsToBeAdded) {
                params.tagsToBeAdded.split(",").each { tagText ->
                    Tag tag = Tag.findByTag(tagText)
                    if (!tag) tag = new Tag(tag: tagText)
                    tagList << tag
                }
            }
            productInstance?.tags?.clear()
            tagList.each { tag ->
                productInstance?.addToTags(tag)
            }
        } catch (Exception e) {
            log.error("Error occurred: " + e.message)
        }
    }

    private void updateAttributes(Product productInstance, Map params) {
        // Mirrors ProductController.updateAttributes()
        Map existingAtts = new HashMap()
        productInstance.attributes.each() {
            existingAtts.put(it.attribute.id, it)
        }

        Attribute.findAllByActive(true).each() {
            String value = params["productAttributes." + it.id + ".value"]
            if (value == "_other" || value == null || value == '') {
                value = params["productAttributes." + it.id + ".otherValue"]
            }

            if (it.active && it.required && !value) {
                productInstance.errors.rejectValue("attributes", "product.attribute.required",
                        [] as Object[],
                        "Product attribute ${it.name} is required")
                throw new ValidationException("Attribute required", productInstance.errors)
            }

            ProductAttribute existingAttribute = existingAtts.get(it.id)
            if (value) {
                if (!existingAttribute) {
                    existingAttribute = new ProductAttribute("attribute": it, value: value)
                    productInstance.addToAttributes(existingAttribute)
                    productInstance.save()
                } else {
                    existingAttribute.value = value
                    existingAttribute.save()
                }
            } else {
                if (existingAttribute?.attribute?.active) {
                    productInstance.removeFromAttributes(existingAttribute)
                    existingAttribute.delete()
                    productInstance.save()
                }
            }
        }
    }

    private void sendProductCreatedNotification(Product productInstance) {
        // Mirrors ProductController.sendProductCreatedNotification()
        try {
            def recipientList = userService.findUsersByRoleType(RoleType.ROLE_PRODUCT_NOTIFICATION).collect {
                it.email
            }
            if (recipientList) {
                String subject = warehouseMessage('email.productCreated.message',
                        [productInstance?.name, productInstance?.createdBy?.name])
                String body = groovyPageRenderer.render(template: '/email/productCreated',
                        model: [productInstance: productInstance])
                mailService.sendHtmlMail(subject, body, recipientList)
            }
        } catch (Exception e) {
            log.error("Error sending product notification email: " + e.message, e)
        }
    }

    private void renderErrors(Product productInstance) {
        def errorMessages = productInstance.errors.allErrors.collect {
            messageSource.getMessage(it, localizationService.currentLocale)
        }
        response.status = 400
        render([errorMessages: errorMessages] as JSON)
    }

    private String warehouseMessage(String code, List args = null, String defaultMessage = null) {
        return messageSource.getMessage(code, args as Object[], defaultMessage ?: code, localizationService.currentLocale)
    }
}
