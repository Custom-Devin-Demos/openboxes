// Spock 2 validates @Unroll expressions by default and fails tests whose names
// reference data variables that don't exist. Keep the lenient Spock 1 behavior.
unroll {
    validateExpressions false
}
