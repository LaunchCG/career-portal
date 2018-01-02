class SearchService {
    constructor($http, configuration, $q) {
        'ngInject';
        this.$http = $http;
        this.configuration = configuration;
        this.$q = $q;
    }

    get _API_MAX_COUNT() {
        return 500; //Max from Bullhorn docs
    }

    static get _() {
        return SearchService.__ || (SearchService.__ = Object.create(null));
    }

    static get _count() {
        return SearchService._.pageSize || (SearchService._.pageSize = 20);
    }

    static get _fields() {
        return SearchService._.fields || (SearchService._.fields = 'id,title,publishedCategory(id,name),address(city,state),employmentType,dateLastPublished,publicDescription,isOpen,isPublic,isDeleted,customText3,customText5');
    }

    static get _sort() {
        return SearchService._.sort || (SearchService._.sort = '-dateLastPublished');
    }

    get _() {
        return this.__ || (this.__ = Object.create(null));
    }

    get currentDetailData() {
        return this._.currentDetailData || (this._.currentDetailData = {});
    }

    set currentDetailData(value) {
        this._.currentDetailData = value;
    }

    get searchCache() {
        return this._.searchCache || (this._.searchCache = []);
    }

    set searchCache(value) {
        this._.searchCache = value;
    }

    get currentListData() {
        return this._.currentListData || (this._.currentListData = []);
    }

    set currentListData(value) {
        this._.currentListData = value;
    }

    get helper() {
        return this._.helper || (this._.helper = {
                hasMore: true,
                emptyCurrentDataList: () => this.currentListData.length = 0,
                updateStart: (count) => {
                    if (count) {
                        this.searchParams.start = (parseInt(count) + parseInt(this.requestParams.start()));
                    } else {
                        this.searchParams.start = (parseInt(this.requestParams.count()) + parseInt(this.requestParams.start()));
                    }
                },
                resetStartAndTotal: () => {
                    this.helper.hasMore = true;
                    this.searchParams.total = 0;
                    this.searchParams.start = 0;
                },
                moreRecordsExist: () => ((parseInt(this.searchParams.total) - parseInt(this.requestParams.start())) > 0),
                clearSearchParams: (specificParam) => {
                    if (specificParam === 'location') {
                        this.searchParams.locations.length = 0;
                    } else if (specificParam === 'category') {
                        this.searchParams.categories.length = 0;
                    } else if (specificParam === 'industry') {
                        this.searchParams.industries.length = 0;
                    } else if (specificParam === 'specialty') {
                        this.searchParams.specialties.length = 0;
                    } else if (specificParam === 'state') {
                        this.searchParams.states.length = 0;
                    } else if (specificParam === 'city') {
                        this.searchParams.cities.length = 0;
                    } else if (specificParam === 'employmentType') {
                        this.searchParams.employmentTypes.length = 0;
                    } else if (specificParam === 'text') {
                        this.searchParams.textSearch = '';
                    } else {
                        this.searchParams.textSearch = '';
                        this.searchParams.locations.length = 0;
                        this.searchParams.categories.length = 0;
                        this.searchParams.industries.length = 0;
                        this.searchParams.specialties.length = 0;
                        this.searchParams.states.length = 0;
                        this.searchParams.cities.length = 0;
                        this.searchParams.employmentTypes.length = 0;
                    }
                }
            });
    }

    get _publicServiceUrl() {
        let result = this._.publicServiceUrl;

        if (!result) {
            let corpToken = this.configuration.service.corpToken;
            let port = parseInt(this.configuration.service.port) || 443;
            let scheme = `http${port === 443 ? 's' : ''}`;
            let swimlane = this.configuration.service.swimlane;

            //result = this._.publicServiceUrl = `${scheme}://public-rest${swimlane}.bullhornstaffing.com:${port}/rest-services/${corpToken}`;
            result = this._.publicServiceUrl = "/wp-json/bh-api/v1";
        }

        return result;
    }

    get _queryUrl() {
        return this._.queryUrl || (this._.queryUrl = `${this._publicServiceUrl}/query`);
        // return this._.queryUrl || (this._.queryUrl = `${this._publicServiceUrl}/query/JobBoardPost`);
    }

    get requestParams() {
        return this._.requestParams || (this._.requestParams = {
                sort: () => this.searchParams.sort || SearchService._sort,
                count: () => this.searchParams.count || SearchService._count,
                start: () => this.searchParams.start || 0,
                publishedCategory: (isSearch, fields) => {
                    if ('publishedCategory(id,name)' !== fields) {
                        if (this.searchParams.categories.length > 0) {
                            let equals = isSearch ? ':' : '=';

                            let fragment = ' AND (';
                            let first = true;

                            for (let i = 0; i < this.searchParams.categories.length; i++) {
                                if (!first) {
                                    fragment += ' OR ';
                                } else {
                                    first = false;
                                }

                                fragment += 'publishedCategory.id' + equals + this.searchParams.categories[i];
                            }

                            return fragment + ')';
                        }
                    }

                    return '';
                },
                location: (isSearch, fields) => {
                    if ('address(city,state)' !== fields) {
                        if (this.searchParams.locations.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = ' AND (';
                            let first = true;

                            for (let j = 0; j < this.searchParams.locations.length; j++) {
                                if (!first) {
                                    fragment += ' OR ';
                                } else {
                                    first = false;
                                }

                                let location = this.searchParams.locations[j];

                                let city = isSearch ? location.split('|')[0] : location.split('|')[0].replace(/'/g, '\'\'');
                                let state = location.split('|')[1];

                                fragment += '(address.city' + equals + delimiter + city + delimiter + ' AND address.state' + equals + delimiter + state + delimiter + ')';
                            }

                            return fragment + ')';
                        }
                    }
                    return '';
                },
                division: (isSearch, fields) => {
                    const divisionField = 'customText3';
                    if (divisionField !== fields) {
                        if (this.searchParams.divisions.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = ' AND (';
                            let first = true;

                            for (let j = 0; j < this.searchParams.divisions.length; j++) {
                                if (!first) {
                                    fragment += ' OR ';
                                } else {
                                    first = false;
                                }

                                let division = this.searchParams.divisions[j];

                                fragment += divisionField + equals + delimiter + division;
                            }
                            return fragment + ')';
                        }
                    }
                    return '';
                },
                specialty: (isSearch, fields) => {
                    const specialtyField = 'customText5';
                    if (specialtyField !== fields) {
                        if (this.searchParams.specialty.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = ' AND (';
                            let first = true;

                            for (let j = 0; j < this.searchParams.specialty.length; j++) {
                                if (!first) {
                                    fragment += ' OR ';
                                } else {
                                    first = false;
                                }

                                let specialty = this.searchParams.specialty[j];

                                fragment += specialtyField + equals + delimiter + specialty;
                            }
                            return fragment + ')';
                        }
                    }
                    return '';
                },
                state: (isSearch, fields) => {
                  if ('address(state)' !== fields) {
                      if (this.searchParams.states.length > 0) {
                          let delimiter = isSearch ? '"' : '\'';
                          let equals = isSearch ? ':' : '=';
                          let fragment = ' AND (';
                          let first = true;
                          for (let j = 0; j < this.searchParams.states.length; j++) {
                              if (!first) {
                                  fragment += ' OR ';
                              } else {
                                  first = false;
                              }
                              let state = this.searchParams.states[j];
                              fragment += 'address.state' + equals + delimiter + state;
                          }
                          return fragment + ')';
                      }
                  }
                  return '';
                },
                city: (isSearch, fields) => {
                  if ('address(city)' !== fields) {
                      if (this.searchParams.cities.length > 0) {
                          let delimiter = isSearch ? '"' : '\'';
                          let equals = isSearch ? ':' : '=';
                          let fragment = ' AND (';
                          let first = true;
                          for (let j = 0; j < this.searchParams.cities.length; j++) {
                              if (!first) {
                                  fragment += ' OR ';
                              } else {
                                  first = false;
                              }
                              let city = this.searchParams.cities[j];
                              fragment += 'address.city' + equals + delimiter + city;
                          }
                          return fragment + ')';
                      }
                  }
                  return '';
                },
                employmentType: (isSearch, fields) => {
                  if ('employmentType' !== fields) {
                      if (this.searchParams.employmentTypes.length > 0) {
                          let delimiter = isSearch ? '"' : '\'';
                          let equals = isSearch ? ':' : '=';
                          let fragment = ' AND (';
                          let first = true;
                          for (let j = 0; j < this.searchParams.employmentTypes.length; j++) {
                              if (!first) {
                                  fragment += ' OR ';
                              } else {
                                  first = false;
                              }
                              let state = this.searchParams.employmentTypes[j];
                              fragment += 'employmentType' + equals + delimiter + employmentType;
                          }
                          return fragment + ')';
                      }
                  }
                  return '';
                },
                text: () => {
                    if (this.searchParams.textSearch) {
                        return ' AND (title:' + this.searchParams.textSearch + '* OR publicDescription:' + this.searchParams.textSearch + '*)';
                    }

                    return '';
                },
                query: (isSearch, additionalQuery, fields) => {
                    let query = `(isOpen${isSearch ? ':1' : '=true'})`;

                    // if (additionalQuery) {
                    //     query += ` AND (${additionalQuery})`;
                    // }
                    //
                    // if (isSearch) {
                    //     query += this.requestParams.text();
                    // }
                    //
                    // query += this.requestParams.publishedCategory(isSearch, fields);
                    // query += this.requestParams.location(isSearch, fields);
                    // query += this.requestParams.division(isSearch, fields);
                    // query += this.requestParams.specialty(isSearch, fields);
                    // query += this.requestParams.state(isSearch, fields);
                    // query += this.requestParams.city(isSearch, fields);
                    // query += this.requestParams.employmentType(isSearch, fields);

                    return query;
                },
                whereIDs: (jobs, isSearch) => {
                    let getValue = isSearch ? (job) => 'id:' + job.id : (job) => job.id;
                    let join = isSearch ? ' OR ' : ',';
                    let prefix = isSearch ? '' : 'id IN ';

                    let values = [];

                    for (let i = 0; i < jobs.length; i++) {
                        values.push(getValue(jobs[i]));
                    }

                    return prefix + '(' + values.join(join) + ')';
                },
                relatedJobs: (publishedCategoryID, idToExclude) => {
                    let query = `(isOpen=true) AND publishedCategory.id=${publishedCategoryID}`;

                    if (idToExclude && parseInt(idToExclude) > 0) {
                        query += ' AND id <>' + idToExclude;
                    }

                    return query;
                },
                find: (jobID) => {
                    return 'id=' + jobID;
                },
                assembleForSearchWhereIDs: (jobs) => {
                    let where = this.requestParams.query(true, this.requestParams.whereIDs(jobs, true));

                    return '?start=0&query=' + where + '&fields=id&count=' + SearchService._count;
                },
                assembleForQueryForIDs: (start, count) => {
                    return '?where=' + this.requestParams.query(false) + '&fields=' + SearchService._fields + '&count=' + count + '&orderBy=' + SearchService._sort + '&start=' + start;
                },
                assembleForSearchForJobs: (start, count) => {
                    count = Math.max(count, this._API_MAX_COUNT);
                    return '?query=' + this.requestParams.query(true) + '&fields=' + SearchService._fields + '&count=' + count + '&sort=' + SearchService._sort + '&start=' + start;
                },
                assembleForGroupByWhereIDs: (fields, orderByFields, start, count, jobs) => {
                    return '?where=' + this.requestParams.whereIDs(jobs, false) + '&groupBy=' + fields + '&fields=' + fields + ',count(id)&count=' + count + '&orderBy=+' + orderByFields + ',-count.id&start=' + start;
                },
                assembleForSearchForIDs: (start, count, fields) => {
                    return '?showTotalMatched=true&query=' + this.requestParams.query(true, undefined, fields) + '&fields=id&sort=id&count=' + count + '&start=' + start;
                },
                assembleForRelatedJobs: (publishedCategoryID, idToExclude) => {
                    return '?start=0&where=' + this.requestParams.relatedJobs(publishedCategoryID, idToExclude) + '&fields=' + SearchService._fields + '&sort=' + this.requestParams.sort() + '&count=' + this.configuration.maxRelatedJobs;
                },
                assembleForFind: (jobID) => {
                    return '?start=0&count=1&where=' + this.requestParams.find(jobID) + '&fields=' + SearchService._fields;
                }
            });
    }

    get searchParams() {
        return this._.searchParams || (this._.searchParams = {
                textSearch: '',
                locations: [], // TODO DEPRECATE
                categories: [],
                industries: [],
                specialties: [],
                states: [],
                cities: [],
                employmentTypes: [],
                sort: '',
                count: '',
                start: '',
                total: '',
                reloadAllData: true
            });
    }

    get _searchUrl() {
        return this._.searchUrl || (this._.searchUrl = `${this._publicServiceUrl}/search`);
        // return this._.searchUrl || (this._.searchUrl = `${this._publicServiceUrl}/search/JobOrder`);
    }

    getCountByDivision(callback, errorCallback) {
      return this.getCountBy('customText3', 'customText3', callback, errorCallback);
    }

    getCountBySpecialty(callback, errorCallback) {
      return this.getCountBy('customText5', 'customText5', callback, errorCallback);
    }

    getCountByState(callback, errorCallback) {
      return this.getCountBy('address(state)', 'address.state', callback, errorCallback);
    }

    getCountByCity(callback, errorCallback) {
      return this.getCountBy('address(city)', 'address.city', callback, errorCallback);
    }

    getCountByEmploymentType(callback, errorCallback) {
      return this.getCountBy('employmentType', 'employmentType', callback, errorCallback);
    }

    // TODO : DEPRECATE
    getCountByLocation(callback, errorCallback) {
        return this.getCountBy('address(city,state)', 'address.city,address.state', callback, errorCallback);
    }

    // TODO DEPRECATE
    getCountByCategory(callback, errorCallback) {
        return this.getCountBy('publishedCategory(id,name)', 'publishedCategory.name', callback, errorCallback);
    }

    getCountWhereIDs() {
        this.$http({
            method: 'GET',
            url: this._queryUrl + this.requestParams.assembleForGroupByWhereIDs(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4])
        }).success(data => {
            arguments[5](data);
        }).error(() => {
        });
    }

    recursiveSearchForIDs(callback, start, count, fields) {
        this.$http({
            method: 'GET',
            url: this._searchUrl + this.requestParams.assembleForSearchForIDs(start, count, fields)
        }).success(data => {
            callback(data);
        }).error(() => {
        });
    }

    getCountBy(fields, orderByFields, callback, errorCallback) {
        errorCallback = errorCallback || function () {
            };

        let totalRecords = [];
        let start = 0;
        callback([]);
        // let controller = this;
        // controller.
        // return callback({
        //   idCount: 4,
        //   name:
        // })



        // let callbackIfNoMore = (data) => {
        //     if (data.data.length) {
        //         controller.getCountWhereIDs(fields, orderByFields, start, controller.configuration.service.batchSize, data.data, (counts) => {
        //             totalRecords = totalRecords.concat(counts.data);
        //
        //             if (data.total > data.count) {
        //                 start += controller.configuration.service.batchSize;
        //
        //                 controller.recursiveSearchForIDs(callbackIfNoMore, start, controller.configuration.service.batchSize);
        //             } else {
        //                 callback(totalRecords);
        //             }
        //         });
        //     } else {
        //         callback(totalRecords);
        //     }
        // };
        //
        // this.recursiveSearchForIDs(callbackIfNoMore, start, this.configuration.service.batchSize, fields);
    }

    searchWhereIDs(jobs, callback) {
        this.$http({
            method: 'GET',
            url: this._searchUrl + this.requestParams.assembleForSearchWhereIDs(jobs)
        }).success(data => {
            callback(data.data);
        }).error(() => {
        });
    }

    recursiveSearchForJobs(callbackIfNoMore, start, count, errorCallback) {
        errorCallback = errorCallback || (() => {
            });

        this
            .$http({
                method: 'GET',
                url: this._searchUrl + this.requestParams.assembleForSearchForJobs(start, count)
            })
            .success(callbackIfNoMore)
            .error(errorCallback);
    }

    updateCurrentData(callback, updateFilterCountCache) {

      const getFiltersFromJob = job => {
        return {
          categories: job.publishedCategory ? job.publishedCategory.name : 'Other', // These come with Ids, use them?
          specialties: job.customText3,
          industries: job.customText5,
          cities: job.address.city,
          states: job.address.state,
          employmentTypes: job.employmentType
        }
      }
      const defaultFilterCounts = {
        categories: [],
        specialties: [],
        industries: [],
        cities: [],
        states: [],
        employmentTypes: []
      };

      const filterCategories = Object.keys(defaultFilterCounts);

      let activeFilters = filterCategories.reduce((filters, category) => {
        if (this.searchParams[category].length) {
          filters[category] = this.searchParams[category].map(filter => filter.id);
        }
        return filters;
      }, {});
      // Apply and count filters
      let filterCounts = defaultFilterCounts;
      const activeFilterCategories = Object.keys(activeFilters);
      this.currentListData = this.searchCache.filter(job => {
        let jobFilters = getFiltersFromJob(job);
        // Check if job matches active filters;
        let includeInResults = activeFilterCategories.every(filterCategory => {
          let filterId = jobFilters[filterCategory] ? jobFilters[filterCategory].replace(/[^\w\-:\/]/gi, '').toLowerCase() || 'other' : 'other';
          return activeFilters[filterCategory].includes(filterId);
        })
        if (this.searchParams.textSearch) {
          includeInResults = includeInResults && job.title.toLowerCase().indexOf(this.searchParams.textSearch) !== -1
        }
        // Not included, exit before counting filters
        if (!includeInResults) return false;

        // Add each filter category value to filter list/count
        filterCategories.forEach(filterCategory => {
          let filterId = jobFilters[filterCategory] ? jobFilters[filterCategory].replace(/[^\w\-:\/]/gi, '').toLowerCase() || 'other' : 'other';
          let filterIndex = filterCounts[filterCategory].findIndex(filter => filter.id === filterId);
          if (filterIndex !== -1) {
            filterCounts[filterCategory][filterIndex].idCount += 1;
          } else {
            filterCounts[filterCategory].push({
              label: jobFilters[filterCategory] ? jobFilters[filterCategory].trim() : 'Other',
              id: filterId,
              idCount: 1
            });
          }
        })
        return includeInResults;
      });

      if (updateFilterCountCache) {
        this.filterCountsCache = filterCounts
      }

      this.filterCounts = filterCounts;
      if (typeof callback === 'function') {
        callback();
      }
    }

    getJobs(callback) {
      this.helper.isSearching = true;

      let allJobs = [];

      let onComplete = () => {
        this.searchCache = allJobs;
        this.helper.isSearching = false;
        this.updateCurrentData(callback, true);
      };

      let onData = results => {
        if (results.data.length) {
          allJobs = allJobs.concat(results.data);
          if (results.start + results.count < results.total) {
            this.recursiveSearchForJobs(onData, results.start + results.count, this._API_MAX_COUNT);
          } else {
            return onComplete();
          }
        } else {
          return onComplete();
        }
      };
      this.recursiveSearchForJobs(onData, 0, this._API_MAX_COUNT)
    }

    findJobs() {
        if (this.searchParams.reloadAllData) {
            this.helper.emptyCurrentDataList();
            this.helper.resetStartAndTotal();
        }

        let controller = this;

        let allJobs = [];
        let start = this.requestParams.start();
        let count = this.requestParams.count();

        this.helper.hasMore = false;
        this.helper.isSearching = true;

        let doneFinding = (jobs) => {
            controller.helper.isSearching = false;
            controller.helper.updateStart();
            if (controller.searchParams.reloadAllData) {
                controller.currentListData = jobs;
                controller.searchCache = jobs;
            } else {
                controller.searchCache.push.apply(controller.searchCache, jobs);
                // controller.currentListData.push.apply(controller.currentListData, jobs);
            }
        };

        let callbackIfNoMore = (data) => {
            if (data.data.length) {
                for (let i = 0; i < data.data.length; i++) {
                    allJobs.push(data.data[i]);
                }

                if (data.count < count) {
                    doneFinding(allJobs);
                } else if (allJobs.length >= controller.requestParams.count()) {
                    this.helper.hasMore = true;
                    doneFinding(allJobs);
                } else {
                    controller.helper.updateStart(count);
                    start = controller.requestParams.start();
                    controller.recursiveSearchForJobs(callbackIfNoMore, start, count);
                }
            } else {
                doneFinding(allJobs);
            }
        };

        this.recursiveSearchForJobs(callbackIfNoMore, start, count);
    }

    loadJobData(jobID, callback, errorCallback) {
        errorCallback = errorCallback || function () {
            };

        this.$http({
            method: 'GET',
            url: this._queryUrl + this.requestParams.assembleForFind(jobID)
        }).success(data => {
            if (data && data.data && data.data.length) {
                callback(data.data[0]);
            }
            else {
                errorCallback();
            }
        }).error(() => errorCallback());
    }

    loadJobDataByCategory(categoryID, idToExclude) {
        let deferred = this.$q.defer();

        this.$http({
            method: 'GET',
            url: this._queryUrl + this.requestParams.assembleForRelatedJobs(categoryID, idToExclude)
        }).success(data => {
            if (data && data.data && data.data.length) {
                deferred.resolve(data.data);
            }
            else {
                deferred.reject({message: 'no data was returned from the server'});
            }
        }).error(error => {
            deferred.reject(error);
        });

        return deferred.promise;
    }
}

export default SearchService;
