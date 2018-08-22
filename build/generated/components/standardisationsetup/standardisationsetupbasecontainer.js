"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* tslint:disable:no-unused-variable */
var React = require('react');
var pureRenderComponent = require('../base/purerendercomponent');
/* tslint:disable:variable-name */
var StandardisationSetup;
/**
 * React component class for standardisationsetup base container
 */
var StandardisationSetupBaseContainer = (function (_super) {
    __extends(StandardisationSetupBaseContainer, _super);
    /**
     * Constructor LoginForm
     * @param props
     * @param state
     */
    function StandardisationSetupBaseContainer(props, state) {
        _super.call(this, props, state);
        this.state = {
            renderedOn: Date.now()
        };
    }
    /**
     * Render
     */
    StandardisationSetupBaseContainer.prototype.render = function () {
        if (StandardisationSetup) {
            return (React.createElement(StandardisationSetup, {id: 'container_standardisationsetup', key: 'container_standardisationsetup_key', renderedOn: this.state.renderedOn, selectedLanguage: this.props.selectedLanguage, isOnline: this.props.isOnline}));
        }
        else {
            return null;
        }
    };
    /**
     * Subscribe to component did mount event
     */
    StandardisationSetupBaseContainer.prototype.componentDidMount = function () {
        this.loadDependencies();
    };
    /**
     *  This will load the dependencies dynamically during component mount.
     */
    StandardisationSetupBaseContainer.prototype.loadDependencies = function () {
        require.ensure([
            './standardisationsetup'
        ], function () {
            StandardisationSetup = require('./standardisationsetup');
            this.setState({ renderedOn: Date.now() });
        }.bind(this));
    };
    return StandardisationSetupBaseContainer;
}(pureRenderComponent));
module.exports = StandardisationSetupBaseContainer;
//# sourceMappingURL=standardisationsetupbasecontainer.js.map