class JobListController {
    constructor(SharedData, SearchService) {
        'ngInject';
        this.SearchService = SearchService;
        this.SharedData = SharedData;
        // Set the view state
        this.SharedData.viewState = 'overview-closed';

    }

    loadMoreData() {
        this.SearchService.searchParams.reloadAllData = false;
        // this.SearchService.findJobs();
    }

    clearSearchParamsAndLoadData() {
        this.SearchService.helper.clearSearchParams();
    }
}

export default JobListController;
