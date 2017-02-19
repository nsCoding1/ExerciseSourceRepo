angular.module('controllers.transactions', [])
.controller('transactions', ['$scope', '$http', 'commonService', function ($scope, $http, commonService) {
    $scope.commonService = commonService;
    $scope.errors = [];
    $scope.data = [];
    $scope.filteredData = [];
    $scope.aggregates = [];
    $scope.averages = [];
    $scope.ignoreDonuts = false;
    $scope.ignoreCCPayments = false;
    $scope.addProjection = false;
    accounting.settings.currency.format = {
        pos: "%s %v",   // for positive values, eg. "$ 1.00" (required)
        neg: "%s (%v)", // for negative values, eg. "$ (1.00)" [optional]
        zero: "%s  -- "  // for zero values, eg. "$  --" [optional]
    };

    $scope.reset = function () {
        $scope.errors = [];
        $scope.data = [];
        $scope.filterdData = [];
        $scope.aggregates = [];
        $scope.averages = [];
    };

    //Define the grid options for Aggregate and average transactions grid
    $scope.gridOptions = {
        paginationPageSizes: [25, 50, 75],
        paginationPageSize: 25,
        selectedItems: [],
        enableSorting: true,
        enableScrollbars: true,
        i18n: 'en',
        columnDefs: [
               {
                   field: 'YearAndMonth',
                   displayName: 'Year And Month',
                   enableSorting: true,
                   cellTemplate: '<div class="ngCellText" title="{{COL_FIELD}}" > {{COL_FIELD}}</div>'

               },
               {
                   name: 'Income',
                   displayName: 'Income ',
                   cellTemplate: '<span class="ngCellText" title="{{COL_FIELD}}" >{{COL_FIELD}} </span>',
                   enableSorting: true


               },
			   {
			       name: 'Spending',
			       displayName: 'Spending ',
			       cellTemplate: '<span class="ngCellText" title="{{COL_FIELD}}" >{{COL_FIELD}} </span>',
			       enableSorting: true


			   }


        ],
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;

        }
    };
    //Define the grid options for credit card payments grid
    $scope.ccPaymentGridOptions = {
        paginationPageSizes: [25, 50, 75],
        paginationPageSize: 25,
        selectedItems: [],
        enableSorting: true,
        enableScrollbars: true,
        i18n: 'en',
        columnDefs: [
               {
                   field: 'transactionTime',
                   displayName: 'Day and Time',
                   enableSorting: true,
                   cellFilter: 'date:\'yyyy-MM-dd\''

               },
               {
                   name: 'amount',
                   displayName: 'Amount ',
                   cellTemplate: '<span class="ngCellText" title="{{COL_FIELD}}" >{{COL_FIELD}} </span>',
                   enableSorting: true

               },
			   {
			       name: 'rawMerchant',
			       displayName: 'Merchant ',
			       cellTemplate: '<span class="ngCellText" title="{{COL_FIELD}}" >{{COL_FIELD}} </span>',
			       enableSorting: true


			   }


        ],
        onRegisterApi: function (gridApi) {
            $scope.ccGridApi = gridApi;

        }
    };


    /*
       This common function is called on each filter state change .This way it will add &&  conditions to the filter
     * 
     */
    $scope.applyFilterChange = function () {
        $scope.reset();
        $scope.commonService.transactions.loadTransactions($scope);


    }

    $scope.updateGrids = function () {
        $scope.applyAdditionalFilters();
        $scope.caluculateAggregates();
        $scope.gridOptions.data = $scope.aggregates;
        $scope.getCCPayments();

    }


    $scope.applyAdditionalFilters = function () {
        $scope.filterdData = $scope.data;
        if ($scope.ignoreDonuts) {
            $scope.filterdData = _.filter($scope.filterdData, function (val) { return val.rawMerchant != 'Krispy Kreme Donuts' && val.rawMerchant != 'DUNKIN #336784'; });
        }
        if ($scope.ignoreCCPayments) {
            $scope.filterdData = _.filter($scope.filterdData, function (val) { return val.rawMerchant != 'CC PAYMENT' && val.rawMerchant != 'CREDIT CARD PAYMENT' });
        }
    }
    /*
     * The method does the calculations for net income and salary for each month for each year and then
     * calculates the avaerage monthly income and salary for 
     * each year. 
     */

    $scope.caluculateAggregates = function () {
        $scope.aggregates = [];
        $scope.averages = [];
        //
        var uniqYearAndMonth = _.uniq(_.map($scope.filterdData, function (val) { return val.yearAndMonth; }), function (val) { return val; });
        var uniqYears = _.uniq(_.map($scope.filterdData, function (val) { return val.year; }), function (val) { return val; });

        //create array place holder for summed up monthly incomes and spending 
        _.each(uniqYearAndMonth, function (val) {
            $scope.aggregates.push({
                'YearAndMonth': val,
                'Income': 0,
                'Spending': 0
            })
        });
        //create array place holder for per year average monthly incomes and spending   
        _.each(uniqYears, function (val) {
            $scope.averages.push({
                'YearAndMonth': val,
                'Income': 0,
                'Spending': 0
            })
        });


        //get all records with income values 
        var income = _.filter($scope.filterdData, function (val) { return val.amount >= 0; });
        //group by year and month
        var groupedIncome = _.groupBy(income, function (val) { return val.yearAndMonth; })
        //add ammount for each grouping 
        var addedGroupedIncome = _(groupedIncome).map(function (g, key) {
            return {
                YearAndMonth: key,
                Year: key.substr(0, 4),
                Amount: _(g).reduce(function (m, x) { return m + x.amount; }, 0)
            };
        });
        //add incomes to the corresponding records in the aggregates array 
        _.each(addedGroupedIncome, function (val) {
            _.each($scope.aggregates, function (aggr) {
                if (aggr.YearAndMonth == val.YearAndMonth) {
                    aggr.Income = accounting.formatMoney(val.Amount, [symbol = "$"], [precision = 2], [thousand = ","], [decimal = "."]);
                }
            })
        });

        //group incomes from the year per month array  by year  
        var groupedByYearIncome = _.groupBy(addedGroupedIncome, function (val) { return val.Year; })
        //find average for each grouping 
        var avgPerYeaPerMonthIncome = _(groupedByYearIncome).map(function (g, key) {
            return {

                YearAndMonth: key,
                Amount: accounting.formatMoney((_(g).reduce(function (m, x) { return m + x.Amount; }, 0) / g.length), [symbol = "$"], [precision = 2], [thousand = ","], [decimal = "."])
            };
        });
        //add incomes to the corresponding year records in the averages array
        _.each(avgPerYeaPerMonthIncome, function (val) {
            _.each($scope.averages, function (avg) {
                if (avg.YearAndMonth == val.YearAndMonth) {
                    avg.Income = val.Amount;
                }
            })
        });




        //get all records with spending values 
        var spending = _.filter($scope.filterdData, function (val) { return val.amount < 0; });
        //group by year and month
        var groupedSpending = _.groupBy(spending, function (val) { return val.yearAndMonth; })
        //add spendings for each grouping 
        var addedGroupedSpending = _(groupedSpending).map(function (g, key) {
            return {
                YearAndMonth: key,
                Year: key.substr(0, 4),
                Amount: _(g).reduce(function (m, x) { return m + x.amount; }, 0)
            };
        });
        //add spendings to the corresponding records in the aggregates array 
        _.each(addedGroupedSpending, function (val) {
            _.each($scope.aggregates, function (aggr) {
                if (aggr.YearAndMonth == val.YearAndMonth) {
                    aggr.Spending = accounting.formatMoney(val.Amount, [symbol = "$"], [precision = 2], [thousand = ","], [decimal = "."]);
                }
            })
        });

        //group spendings from the year per month array  by year  
        var groupedByYearSpending = _.groupBy(addedGroupedSpending, function (val) { return val.Year; })
        //find average for each grouping 
        var avgPerYeaPerMonthSpending = _(groupedByYearSpending).map(function (g, key) {
            return {
                YearAndMonth: key,
                Amount: accounting.formatMoney(_(g).reduce(function (m, x) { return m + x.Amount; }, 0) / g.length, [symbol = "$"], [precision = 2], [thousand = ","], [decimal = "."])
            };
        });

        //add spendings to the corresponding year records in the averages array 
        _.each(avgPerYeaPerMonthSpending, function (val) {
            _.each($scope.averages, function (avg) {
                if (avg.YearAndMonth == val.YearAndMonth) {
                    avg.Spending = val.Amount;
                }
            })
        });

        //concatenate the averages to the aggreates so the averages would show at the end of the grid
        _.each($scope.averages, function (avg) {
            avg.YearAndMonth = avg.YearAndMonth + "_PerMonth_Avg"

        });
        $scope.aggregates = $scope.aggregates.concat($scope.averages);


    }




    /*
     * Function filters all the records for CC payment from the raw transacions
     * 
     */
    $scope.getCCPayments = function () {
        $('.ccpayments-grid-container').showLoading();
        var ccPaymentsData = [].concat($scope.commonService.transactions.raw);
        $scope.ccPaymentGridOptions.data = _.filter(ccPaymentsData, function (val) { return val.rawMerchant == 'CC PAYMENT' });
        _.each($scope.ccPaymentGridOptions.data, function (val) {
            val.amount = accounting.formatMoney(val.amount, [symbol = "$"], [precision = 2], [thousand = ","], [decimal = "."]);
        });
        $('.ccpayments-grid-container').hideLoading();
    }




    /*
     * Event handler called when the projected transactions loaded event is fired from the common service 
     */
    $scope.$on($scope.commonService.transactions.projectionLoadingSuccessful, function () {
        // $scope.data = [];
        //$scope.data = $scope.commonService.transactions.raw;
        $scope.data = $scope.data.concat($scope.commonService.transactions.projected);
        $scope.updateGrids();
    });
    /*
    * Event handler called when the normal transactions loaded event is fired from the common service 
    */
    $scope.$on($scope.commonService.transactions.loadingSuccessful, function () {
        $scope.data = [];
        $scope.data = $scope.commonService.transactions.raw;
        if ($scope.addProjection) {
            $scope.commonService.transactions.loadProjectedTransactions($scope);
        } else {
            $scope.updateGrids();
        }

    });


    /*
     *  Event handlers which can be used to intercept loadingStarted(Ajax begin) and loadingComplete (Ajax complete) and error (Ajax error) events
     */
    $scope.$on($scope.commonService.transactions.loadingStarted, function () {
        $('.grid-container').showLoading();
    });
    $scope.$on($scope.commonService.transactions.transactionsLoadingError, function () {
        $scope.errors=[];
        $scope.errors.push($scope.commonService.transactions.transactionsLoadingErrors);

    });
    $scope.$on($scope.commonService.transactions.loadingCompleted, function () {
        $('.grid-container').hideLoading();
    });

    /*
     * Responsible for initial loading of the grids
     */

    $scope.getPage = function () {
        $scope.commonService.transactions.loadTransactions($scope);
    };

    $scope.getPage();

}])
