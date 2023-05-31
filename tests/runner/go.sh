#!/bin/bash

DIR_TEST=/code

export API_URL="http://localhost:8000"
export AUTH="admin:admin"
echo "+ API_URL= $API_URL"

echo "+ RUNNING TESTS"
cd $DIR_TEST && npm run test && npm run test e2e

exit $?