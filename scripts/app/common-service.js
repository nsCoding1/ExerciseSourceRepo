angular.module('services.common', [])
.service('commonService', ['$rootScope', "$http", function ($rootScope, $http) {

    this.raiseEvent = function (name) {
        $rootScope.$broadcast(name);
    };


    this.transactions = {
        loadingStarted: 'transactions.loadingStarted',
        loadingSuccessful: 'transactions.loadingSuccessful',
        transactionsLoadingError: 'transactions.transactionsLoadingError',
        ignoreDonutSpending: 'transactions.ignoreDonutSpending',
        loadingCompleted: 'transactions.loadingCompleted',
        projectionLoadingSuccessful: 'projectionLoadingSuccessful',
        transactionsLoadingErrors: [],
        raw: [],
        aggregates: [],
        projected: [],
        loadTransactions: function (scope) {
            this.transactionsLoadingErrors = [];
            this.raw = [];
            var url = 'https://2016.api.levelmoney.com/api/v2/core/get-all-transactions';
            var args = {
                "uid": 1110590645,
                "token": "E7CDC65CD33EFA42BFC52772A356B2AD",
                "api-token": "AppTokenForInterview",
                "json-strict-mode": false,
                "json-verbose-response": false
            }

            scope.commonService.raiseEvent(scope.commonService.transactions.loadingStarted);
            $http({
                method: 'POST',
                url: url,
                data: {
                    'args': args
                }
            }).success(function (response) {
                if (!(response.error == "no-error")) {
                    scope.commonService.transactions.transactionsLoadingErrors = ["There was an error encountered an  error in fetching transactions"];;
                    scope.commonService.raiseEvent(scope.commonService.transactions.transactionsLoadingError);
                    return;
                }

                if (!(response.transactions.length > 0)) {
                    return;
                }
                scope.commonService.transactions.raw = [];
                //Success function also formats the yean and months which will be used later for grouping
                $(response.transactions).each(function (index, val) {
                    scope.commonService.transactions.raw.push({
                        'accountId': val["account-id"],
                        'amount': val.amount,
                        'rawMerchant': val["raw-merchant"],
                        'categorization': val.categorization,
                        'transactionTime': val["transaction-time"],
                        'yearAndMonth': moment(val["transaction-time"]).year() + "_" + moment(val["transaction-time"]).format("MM"),
                        'year': moment(val["transaction-time"]).year() 
                    })
                });

                scope.commonService.raiseEvent(scope.commonService.transactions.loadingSuccessful);

            }).error(function (jqXHR, textStatus, errorThrown) {
                scope.commonService.transactions.transactionsLoadingErrors = ["Server encountered an  error in loading transactions"];
                scope.commonService.raiseEvent(scope.commonService.transactions.transactionsLoadingError);
            }).finally(function () {
                scope.commonService.raiseEvent(scope.commonService.transactions.loadingCompleted);
            });
        },

        loadProjectedTransactions: function (scope) {
            this.transactionsLoadingErrors = [];
            this.projected = [];
            var url = 'https://2016.api.levelmoney.com/api/v2/core/projected-transactions-for-month';
            var args = {
                "uid": 1110590645,
                "token": "E7CDC65CD33EFA42BFC52772A356B2AD",
                "api-token": "AppTokenForInterview",
                "json-strict-mode": false,
                "json-verbose-response": false
            }

            scope.commonService.raiseEvent(scope.commonService.transactions.loadingStarted);
            $http({
                method: 'POST',
                url: url,
                data: {
                    'args': args,
                    'year': 2017,
                    'month': 2
                }
            }).success(function (response) {
                if (!(response.error == "no-error")) {
                    scope.commonService.transactions.transactionsLoadingErrors = ["There was an error encountered an  error in fetching transactions"];;
                    scope.commonService.raiseEvent(scope.commonService.transactions.transactionsLoadingError);
                    return;
                }

                if (!(response.transactions.length > 0)) {
                    return;
                } 
                //Success function also formats the yean and months which will be used later for grouping
                scope.commonService.transactions.projected = [];
                $(response.transactions).each(function (index, val) {
                    scope.commonService.transactions.projected.push({
                        'accountId': val["account-id"],
                        'amount': val.amount,
                        'rawMerchant': val["raw-merchant"],
                        'categorization': val.categorization,
                        'transactionTime': val["transaction-time"],
                        'yearAndMonth': moment(val["transaction-time"]).year() + "_" + moment(val["transaction-time"]).format("MM"),
                        'year': moment(val["transaction-time"]).year() 
                    })
                });

                scope.commonService.raiseEvent(scope.commonService.transactions.projectionLoadingSuccessful);

            }).error(function (jqXHR, textStatus, errorThrown) {
                scope.commonService.transactions.transactionsLoadingErrors = ["Server encountered an  error in loading transactions"];
                scope.commonService.raiseEvent(scope.commonService.transactions.transactionsLoadingError);
            }).finally(function () {
                scope.commonService.raiseEvent(scope.commonService.transactions.loadingCompleted);
            });
        }
    }

}])

