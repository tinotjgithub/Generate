﻿import comparerInterface = require('../../sortbase/comparerinterface');
import enums = require('../../../../components/utility/enums');
import localeStore = require('../../../../stores/locale/localestore');

/**
 * This is a Accuracy comparer class and method
 */
class OriginalMarkAccuracyComparer implements comparerInterface {

    /**
     * Get the Accuracy indicator type
     * @param AccuracyIndicatorType
     */
    private getAccuracyIndicatorText(indicatorType: enums.AccuracyIndicatorType): any {
        switch (indicatorType) {
            case enums.AccuracyIndicatorType.Accurate:
            case enums.AccuracyIndicatorType.AccurateNR:
                return localeStore.instance.TranslateText('generic.accuracy-indicators.accurate');
            case enums.AccuracyIndicatorType.OutsideTolerance:
            case enums.AccuracyIndicatorType.OutsideToleranceNR:
                return localeStore.instance.TranslateText('generic.accuracy-indicators.inaccurate');
            case enums.AccuracyIndicatorType.WithinTolerance:
            case enums.AccuracyIndicatorType.WithinToleranceNR:
                return localeStore.instance.TranslateText('generic.accuracy-indicators.in-tolerance');
            default:
                return '';
        }
    }

    /** Comparer to sort the work list in ascending order of Accuracy indicator */
    public compare(a: ResponseBase, b: ResponseBase) {

        if (((a.markingProgress < 100) ? '0' : this.getAccuracyIndicatorText(a.accuracyIndicatorTypeID)) >
            ((b.markingProgress < 100) ? '0' : this.getAccuracyIndicatorText(b.accuracyIndicatorTypeID))) {
            return 1;
        }
        if (((a.markingProgress < 100) ? '0' : this.getAccuracyIndicatorText(a.accuracyIndicatorTypeID)) <
            ((b.markingProgress < 100) ? '0' : this.getAccuracyIndicatorText(b.accuracyIndicatorTypeID))) {
            return -1;
        }

        /* The unary plus operator converts it into a number if it is not a number */
        if (+a.displayId > +b.displayId) {
            return 1;
        }
        if (+a.displayId < +b.displayId) {
            return -1;
        }
        return 0;
    }
}

export = OriginalMarkAccuracyComparer;