﻿import comparerInterface = require('../../sortbase/comparerinterface');

/**
 * This comparer is used for sorting in Help Examiners Grid.
 */
class TotalQIGActiveComparer implements comparerInterface {
    /**
     * Comparer to sort the help examiners grid in ascending order of active qig count.
     */
    public compare(a: ExaminerDataForHelpExaminer, b: ExaminerDataForHelpExaminer) {
        if (+a.activeQigCount > +b.activeQigCount) {
            return 1;
        }
        if (+a.activeQigCount < +b.activeQigCount) {
            return -1;
        }
        return 0;
    }
}

export = TotalQIGActiveComparer;