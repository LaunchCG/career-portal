class OmitFilters {
    constructor() {
        return function (collection, type, params) {
            if (!angular.isArray(collection) || angular.isUndefined(type)) {
                return collection;
            }
            // If filtering in a category show the entire category to allow additional values
            if (params.length) {
              return collection;
            }
            // If not filtering, remove any filters with 0 results
            return collection.filter(fValue => fValue.idCount);
        };
    }
}

export default OmitFilters;
