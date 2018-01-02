class CareerPortalSidebarController {
    /*jshint -W072 */
    constructor($scope, SharedData, $location, SearchService, $timeout, configuration) {
    /*jshint +W072 */
        'ngInject';

        this.SharedData = SharedData;
        this.$location = $location;
        this.$timeout = $timeout;
        this.SearchService = SearchService;
        this.configuration = configuration || {};

        const LIMIT = 8;

        this.categoryLimitTo = LIMIT;
        this.industryLimitTo = LIMIT;
        this.stateLimitTo = LIMIT;
        this.cityLimitTo = LIMIT;
        this.specialtyLimitTo = LIMIT;
        this.employmentTypeLimitTo = LIMIT;

        this.SearchService.getJobs(() => {
          this.setFilters();
          this.setFiltersFromUrl()
        });

        // Set the grid state based on configurations
        switch (this.configuration.defaultGridState) {
            case 'grid-view':
                this.SharedData.gridState = 'grid-view';
                break;
            case 'list-view':
                /* falls through */
            default:
                this.SharedData.gridState = 'list-view';
        }

        $scope.$on('$locationChangeSuccess', ($event, old, next) => {
          this.setFiltersFromUrl()
        })
    }

    updateCategoryLimitTo(value) {
        this.categoryLimitTo = value;
    }
    updateIndustryLimitTo(value) {
        this.industryLimitTo = value;
    }
    updateSpecialtyLimitTo(value) {
        this.specialtyLimitTo = value;
    }
    updateStateLimitTo(value) {
        this.stateLimitTo = value;
    }
    updateCityLimitTo(value) {
        this.cityLimitTo = value;
    }
    updateEmploymentTypeLimitTo(value) {
        this.employmentTypeLimitTo = value;
    }

    getFilterCountByCategory (category) {
      let activeCount = this.SearchService.filterCounts;
      let totalCount = this.SearchService.filterCountsCache;
      let filters = (this.SearchService.searchParams[category].length ? totalCount[category] : activeCount[category]) || [];
      return filters.map(filter => {
        filter.active = this.hasFilter(category, filter)
        return filter
      })
    }

    setFiltersFromUrl() {
      if (this.$location.$$path !== '/jobs') return
      const setFilter = (filterType, value) => {
        let filterId = value.replace(/[^\w\-:\/]/gi, '').toLowerCase()
        let filter = this.SearchService.filterCountsCache[filterType].find(filt => filt.id === filterId)
        if (filter && !this.hasFilter(filterType, filter)) {
          this.SearchService.searchParams[filterType].push(filter)
        }
      }
      Object.entries(this.$location.$$search).forEach(entry => {
        let filterType = entry[0]
        let value = entry[1]
        if (value instanceof Array) {
          value.forEach(v => {
            setFilter(filterType, v)
          })
        } else {
          setFilter(filterType, value)
        }
      })
      this.searchJobs()
    }

    setFilters() {
      this.industries = this.getFilterCountByCategory('industries')
      this.categories = this.getFilterCountByCategory('categories')
      this.specialties = this.getFilterCountByCategory('specialties')
      this.cities = this.getFilterCountByCategory('cities')
      this.states = this.getFilterCountByCategory('states')
      this.employmentTypes = this.getFilterCountByCategory('employmentTypes')
    }

    updateCountsByIntersection(oldCounts, newCounts, getID, getLabel) {
        if (!getLabel) {
            getLabel = getID;
        }

        angular.forEach(oldCounts, function (oldCount) {
            let found = false;

            angular.forEach(newCounts, function (newCount) {
                if (getID.call(oldCount) === getID.call(newCount)) {
                    oldCount.idCount = newCount.idCount;

                    found = true;
                }
            });

            if (!found) {
                oldCount.idCount = 0;
            }
        });

        oldCounts.sort(function (count1, count2) {
            let name1 = getLabel.call(count1);
            let name2 = getLabel.call(count2);

            if (name1 < name2) {
                return -1;
            } else if (name1 > name2) {
                return 1;
            } else {
                let idCount1 = count1.idCount;
                let idCount2 = count2.idCount;

                return idCount2 - idCount1;
            }
        });
    }

    updateFilterCounts() {
        let controller = this;
    }

    updateFilterCountsAnonymous() {
        let controller = this;

        return function () {
            controller.updateFilterCounts();
        };
    }

    switchViewStyle(type) {
        this.SharedData.gridState = type + '-view';
    }

    searchJobs() {
      this.SearchService.updateCurrentData(() => {
        this.setFilters();
      })
    }

    clearSearchParamsAndLoadData(param) {
        this.SearchService.helper.clearSearchParams(param);
        this.searchJobs();
    }

    goBack() {
        if (this.SharedData.viewState === 'overview-open') {
            this.$location.path('/jobs');
        }
    }

    searchOnDelay(value) {
        if (this.searchTimeout) {
            this.$timeout.cancel(this.searchTimeout);
        }

        this.searchTimeout = this.$timeout(angular.bind(this, function () {
            this.searchJobs();
        }), 400);
    }

    toggleFilterByType(type, filter) {
      let index = this.getFilterIndexByType(type, filter.id);
      if (index === -1) {
        this.SearchService.searchParams[type].push(filter);
      } else {
        this.SearchService.searchParams[type].splice(index, 1);
      }
      this.searchJobs();
    }

    hasFilter(type, filter) {
      return this.getFilterIndexByType(type, filter.id) !== -1;
    }

    getFilterIndexByType(type, filterId) {
      return this.SearchService.searchParams[type].findIndex(param => param.id === filterId);
    }
}

export default CareerPortalSidebarController;
