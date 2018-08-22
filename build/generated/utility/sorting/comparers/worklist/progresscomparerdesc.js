"use strict";
var enums = require('../../../../components/utility/enums');
var configurablecharacteristicshelper = require('../../../configurablecharacteristic/configurablecharacteristicshelper');
var configurablecharacteristicsnames = require('../../../configurablecharacteristic/configurablecharacteristicsnames');
/**
 * This is a Marking progress comparer class and method
 */
var ProgressComparerDesc = (function () {
    function ProgressComparerDesc() {
    }
    /** Comparer to sort the work list in descending order based on marking progress */
    ProgressComparerDesc.prototype.compare = function (a, b) {
        if (this.getMarkingProgressDetail(a) > this.getMarkingProgressDetail(b)) {
            return -1;
        }
        if (this.getMarkingProgressDetail(a) < this.getMarkingProgressDetail(b)) {
            return 1;
        }
        if (+a.displayId > +b.displayId) {
            return 1;
        }
        if (+a.displayId < +b.displayId) {
            return -1;
        }
        return 0;
    };
    /**
     * Returns 200 as marking progress, if submit button is enabled else corresponding marking progress will be returned.
     * @param response
     */
    ProgressComparerDesc.prototype.getMarkingProgressDetail = function (response) {
        /** taking the cc from cc helper */
        var isAllPagesAnnotatedCC = configurablecharacteristicshelper.getCharacteristicValue(configurablecharacteristicsnames.ForceAnnotationOnEachPage, response.markSchemeGroupId).toLowerCase() === 'true' ? true : false;
        var isAllSLAOAnnotatedCC = configurablecharacteristicshelper.getCharacteristicValue(configurablecharacteristicsnames.SLAOForcedAnnotations, response.markSchemeGroupId).toLowerCase() === 'true' ? true : false;
        if (response.markingProgress === 100) {
            if (!isAllPagesAnnotatedCC && isAllSLAOAnnotatedCC && response.hasAllPagesAnnotated === false ||
                isAllPagesAnnotatedCC && response.hasAllPagesAnnotated === false ||
                response.hasBlockingExceptions ||
                (response.markChangeReasonVisible && response.accuracyIndicatorTypeID !== enums.AccuracyIndicatorType.Accurate
                    && !response.markChangeReason)) {
                return response.markingProgress;
            }
            else {
                return 200;
            }
        }
        else {
            return response.markingProgress;
        }
    };
    return ProgressComparerDesc;
}());
module.exports = ProgressComparerDesc;
//# sourceMappingURL=progresscomparerdesc.js.map