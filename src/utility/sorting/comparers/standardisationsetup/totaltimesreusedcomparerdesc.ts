﻿import comparerInterface = require('../../sortbase/comparerinterface');
import comparerhelper = require('../../comparerhelper');

/**
 * Total times reused comparer class and method.
 */
class TotalTimesReUsedComparerDesc implements comparerInterface {

    /**
     * Comparer method for total times reused.
     * @param a 
     * @param b 
     */
    public compare(a: StandardisationResponseDetails, b: StandardisationResponseDetails) {
        let value: number;
        value = comparerhelper.integerSortDesc(a.timesReUsed, b.timesReUsed);
        if (value === 0) {
            return comparerhelper.integerSort(a.candidateScriptId, b.candidateScriptId);
        }
        return value;
    }
}

export = TotalTimesReUsedComparerDesc;