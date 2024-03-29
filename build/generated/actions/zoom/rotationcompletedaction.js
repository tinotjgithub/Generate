"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var action = require('../base/action');
var actionType = require('../base/actiontypes');
var RotationCompletedAction = (function (_super) {
    __extends(RotationCompletedAction, _super);
    /**
     * Creates an instance of RotationCompletedAction.
     */
    function RotationCompletedAction() {
        _super.call(this, action.Source.View, actionType.ROTATION_COMPLETED_ACTION);
        this.auditLog.logContent = this.auditLog.logContent;
    }
    return RotationCompletedAction;
}(action));
module.exports = RotationCompletedAction;
//# sourceMappingURL=rotationcompletedaction.js.map