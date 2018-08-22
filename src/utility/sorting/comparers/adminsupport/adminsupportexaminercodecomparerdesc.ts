﻿import comparerInterface = require('../../sortbase/comparerinterface');

/**
 * This is a Admin Support Examiner Code comparer class and method
 */
class AdminSupportExaminerCodeComparerDesc implements comparerInterface {

	/** Comparer to sort the Admin Support Examiner list in descending order of Employee number */
	public compare(a: SupportAdminExaminers, b: SupportAdminExaminers) {
		if (a.employeeNum.trim().toLowerCase() > b.employeeNum.trim().toLowerCase()) {
			return -1;
		}
		if (a.employeeNum.trim().toLowerCase() < b.employeeNum.trim().toLowerCase()) {
			return 1;
		}
		return 0;
	}
}

export = AdminSupportExaminerCodeComparerDesc;