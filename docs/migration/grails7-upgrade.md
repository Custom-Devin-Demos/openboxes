# P1.6 — Grails 6 → Grails 7 / Spring Boot 3 / javax → jakarta

Final platform stage of the modernization program. The application now runs on
the Apache Grails 7 stack.

## Resulting versions

| Component            | Before (develop)     | After                          |
|----------------------|----------------------|--------------------------------|
| Grails               | 6.2.3                | 7.2.2 (Apache)                 |
| Grails Gradle plugin | 6.2.4                | 7.2.2 (`org.apache.grails.gradle`) |
| Gradle               | 8.11.1               | 8.14.5                         |
| Spring Boot          | 2.7.18               | 3.5.16                         |
| Spring Framework     | 5.3.39               | 6.2.19                         |
| Groovy               | 3.0.23               | 4.0.33 (`org.apache.groovy`)   |
| GORM                 | 8.1.2 (standalone)   | 7.2.2 (`org.apache.grails:grails-data-*`, unified with Grails) |
| Hibernate            | 5.6.15.Final (javax) | 5.6.15.Final **jakarta** (`hibernate-core-jakarta`) |
| Servlet container    | Tomcat 9 (javax)     | Tomcat 10.1 (jakarta)          |
| Liquibase            | 4.19.x               | 4.27.0                         |
| Quartz plugin        | org.grails.plugins:quartz 3.0.0-SNAPSHOT-inline | org.apache.grails:grails-quartz 4.0.1 |

## Deviation: Hibernate 6 / "GORM 9" is not part of Grails 7

The program target named Hibernate 6 / GORM 9. After investigation this is
**not achievable on any released Grails 7.x (or 8.0.0-M1)**:

- GORM is now versioned with the framework (`org.apache.grails:grails-data-*`).
  The only Hibernate implementation published for Grails 7.2.2 — and still for
  Grails 8.0.0-M1 — is `grails-data-hibernate5`, which ships
  `org.hibernate:hibernate-core-jakarta:5.6.15.Final` (the Jakarta-namespace
  build of Hibernate 5.6). There is no `grails-data-hibernate6`/`hibernate7`
  artifact on Maven Central or repo.grails.org.
- The same applies to database-migration: the Grails 7 module is
  `grails-data-hibernate5-dbmigration` (Liquibase 4.27 +
  `liquibase-hibernate5`).

So the Jakarta EE / Spring 6 / Boot 3 requirement is met (Hibernate runs on the
jakarta.persistence namespace), but the Hibernate *engine* stays at 5.6.15 by
framework decision, which is what keeps the existing mappings and schema
byte-for-byte compatible (zero new Liquibase changesets were needed).

## Plugin decisions

| Grails 6 plugin | Grails 7 resolution |
|---|---|
| gorm-hibernate5 8.1.1 | `org.apache.grails:grails-data-hibernate5` (BOM-managed) |
| database-migration 5.0.0 | `org.apache.grails:grails-data-hibernate5-dbmigration` |
| cache 7.0.0 | `org.apache.grails:grails-cache` (unified version) |
| views-json 3.2.3 | `org.apache.grails:grails-views-json` (unified version) |
| asset-pipeline 4.5.2 (com.bertramlabs) | 5.0.34 (`cloud.wondrify:asset-pipeline-*`, the maintained Grails 7 line) |
| quartz 2.0.13 | `org.apache.grails:grails-quartz:4.0.1`; the quartz-monitor job factory classes were inlined under `src/main/groovy/grails/plugins/quartz/` |
| mail 3.0.0 | replaced by direct `jakarta.mail` (Angus Mail) + `commons-email2-jakarta`; mail sending code in `MailService` unchanged in behavior |
| external-config 4.0.0 | inlined under `src/main/groovy/grails/plugin/externalconfig/` (no Grails 7 release; ~2 classes) with Groovy 4 static-compilation fixes |
| rendering 2.0.3 | inlined under `src/main/groovy/grails/plugins/rendering/` (+ `RenderingSupport` trait replacing the plugin's runtime `renderPdf` meta-method injection) |
| export 2.0.0 / excel-import 3.0.0 | minimal needed classes inlined (`grails/plugins/csv/`, `org/grails/plugins/excelimport/`, `imexporter/`) |
| ajaxtags / prettytime / browser-detection | taglibs and helpers inlined (used by retained GSPs) |
| build-test-data 4.0.1 | `io.github.longwa:build-test-data:6.0.0` (maintained Grails 7 line) |
| sentry (javax) | `io.sentry:sentry-spring-jakarta` / `sentry-servlet-jakarta`, filter registered in `resources.groovy` |

## javax → jakarta

All application-controlled `javax.*` imports were migrated to `jakarta.*`
(servlet, mail/activation, validation, annotation). Remaining `javax.*`
imports are:

- JDK namespaces that never moved (`javax.crypto`, `javax.sql`, `javax.print`,
  `javax.imageio`, `javax.swing`).
- `javax.xml.bind.*` (5 files): pinned by docx4j 8.x, which is the JAXB-2 line
  used for .docx generation (`DocumentService`, `FileService`) and whose API
  returns `javax.xml.bind.JAXBElement`. Upgrading to the jakarta-based docx4j
  11.x is a larger, behavior-affecting change deliberately left out of this
  stage. `javax.xml.bind.ValidationException` (used as a generic error type in
  a few services) is kept for identical API error behavior.

## Behavior-preserving code fixes (Groovy 4 / Grails 7)

- `Boolean isX()` domain/DTO methods changed to primitive `boolean isX()` so
  Groovy 4 still exposes them as readable bean properties (`order.pending`
  etc.). Bodies unchanged.
- `grails.env=test` is now set explicitly on Gradle `Test` tasks (the Grails 7
  Gradle plugin no longer does this automatically).
- Groovy 4 static-compilation fixes in the inlined external-config classes and
  `import groovy.xml.XmlParser` (moved package in Groovy 4).
- Ehcache-era Hibernate second-level-cache provider settings removed from
  `application.yml` (second-level cache remains disabled, as before).

## Test-environment note

`~/.grails/openboxes-config.properties` (the external config from
`baseline-setup.md`) is also loaded in the `test` environment and its flat
`dataSource.url` overrides the Testcontainers datasource used by
`integrationTest`. When running `./gradlew integrationTest` on a dev box that
has that file, temporarily move it aside. CI is unaffected (no such file).

## Verification evidence (fresh reseeded DB)

- Liquibase clean install: 983 changesets run, zero errors; reboot against the
  seeded DB with zero checksum errors.
- `./gradlew assemble` — OK.
- `./gradlew test` — 1432 tests, 0 failures (114 skipped).
- `./gradlew integrationTest` — 59 tests, 0 failures (3 skipped).
- API snapshots — 122 passed / 0 failed.
- OpenAPI — lint valid; contract tests 747 passed / 0 failed / 58 skipped.
- Playwright e2e — 10/10 passed (includes picklist/packing-list document flows).
- `npm test` (213 passed), `npm run eslint` (0 errors), `npm run bundle` — OK.
- Quartz jobs fire on schedule; mail remains disabled via external config.
