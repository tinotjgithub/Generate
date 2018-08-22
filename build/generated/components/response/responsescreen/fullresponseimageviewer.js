"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/* tslint:disable:no-unused-variable */
var React = require('react');
var ReactDom = require('react-dom');
var pureRenderComponent = require('../../base/purerendercomponent');
var localeStore = require('../../../stores/locale/localestore');
var responseStore = require('../../../stores/response/responsestore');
var responseActionCreator = require('../../../actions/response/responseactioncreator');
var enums = require('../../utility/enums');
var AnnotationOverlay = require('./annotationoverlay');
var $ = require('jquery');
var PageOptions = require('./pageoptions');
var annotationHelper = require('../../utility/annotation/annotationhelper');
var markingStore = require('../../../stores/marking/markingstore');
var scriptStore = require('../../../stores/script/scriptstore');
var SuppressedPage = require('./suppressedpage');
var classNames = require('classnames');
var AnnotatedMessageHolder = require('../annotatedmessageholder');
var worklistStore = require('../../../stores/worklist/workliststore');
var exceptionStore = require('../../../stores/exception/exceptionstore');
var exceptionHelper = require('../../utility/exception/exceptionhelper');
var constants = require('../../utility/constants');
var scriptHelper = require('../../../utility/script/scripthelper');
var LinkIcon = require('./linktopage/linkicon');
var pageLinkHelper = require('./linktopage/pagelinkhelper');
var responseHelper = require('../../utility/responsehelper/responsehelper');
var markerOperationModeFactory = require('../../utility/markeroperationmode/markeroperationmodefactory');
var htmlUtilities = require('../../../utility/generic/htmlutilities');
var treeViewDataHelper = require('../../../utility/treeviewhelpers/treeviewdatahelper');
var onPageCommentHelper = require('../../utility/annotation/onpagecommenthelper');
var eCourseworkHelper = require('../../utility/ecoursework/ecourseworkhelper');
var markingActionCreator = require('../../../actions/marking/markingactioncreator');
var eCourseworkFileStore = require('../../../stores/response/digital/ecourseworkfilestore');
var eCourseworkResponseActionCreator = require('../../../actions/ecoursework/ecourseworkresponseactioncreator');
var LoadingIndicator = require('../../utility/loadingindicator/loadingindicator');
var messageStore = require('../../../stores/message/messagestore');
/**
 * React component class for FullResponseImageViewer
 */
var FullResponseImageViewer = (function (_super) {
    __extends(FullResponseImageViewer, _super);
    /**
     * @constructor
     */
    function FullResponseImageViewer(props, state) {
        var _this = this;
        _super.call(this, props, state);
        this.imagesLoaded = 0;
        // Get the total image count, exclude the suppressed url and the list contain converted images.
        this.totalImageCount = this.props.fileMetadataList.filter((function (x) {
            return x.isSuppressed === false && x.isConvertible === true;
        })).count();
        this.imageWidths = [];
        this.flagAsSeenInLastSLAO = false;
        this.doSetScroll = false;
        this.pageIds = [];
        this.isComponenetMounted = false;
        /**
         * Function to find page option div's height
         */
        this.optionButtonWrapperHeight = function (pageOptionRect) {
            var windowHeight = window.innerHeight;
            return (Math.min(windowHeight - constants.FRV_TOOLBAR_HEIGHT, Math.min(pageOptionRect.bottom, windowHeight) - Math.max(pageOptionRect.top, constants.FRV_TOOLBAR_HEIGHT)) / 2);
        };
        /**
         * Function to find page option div's top
         */
        this.optionButtonWrapperTop = function (calculatedOptionButtonWrapperHeight, optionButtonWrapper, pageOptionRect) {
            var obnWrapperTop = Math.round(optionButtonWrapper.height < (calculatedOptionButtonWrapperHeight * 2) ?
                calculatedOptionButtonWrapperHeight + Math.max(constants.FRV_TOOLBAR_HEIGHT, pageOptionRect.top) :
                pageOptionRect.bottom - (optionButtonWrapper.height));
            obnWrapperTop = obnWrapperTop - (optionButtonWrapper.height / 2);
            return obnWrapperTop;
        };
        /**
         * Function to find page option div's left
         */
        this.optionButtonWrapperLeft = function (pageOptionRect, optionButtonWrapper) {
            return Math.round(pageOptionRect.left + pageOptionRect.width / 2 - (optionButtonWrapper.width / 2));
        };
        /**
         * Function to find the button wrapper div's position
         */
        this.buttonWrapperPositionUpdate = function () {
            var obwHeight;
            var obwTop;
            var obwLeft;
            var obwMaxWidth = 0;
            if (_this.pageOptionElement && _this.optionButtonWrapperElement) {
                if (_this.optionButtonWrapperElement.clientHeight === 0
                    && _this.optionButtonWrapperElement.childElementCount > 0
                    && _this.optionButtonWrapperElement.children[0].id.indexOf(_this.state.hoveredPageNo) >= 0) {
                    _this.updatePageOptionButtonPosition(false, -1);
                }
                else {
                    var pageOptionRect = _this.pageOptionElement.getBoundingClientRect();
                    var optionButtonWrapper = _this.optionButtonWrapperElement.getBoundingClientRect();
                    obwHeight = _this.optionButtonWrapperHeight(pageOptionRect);
                    obwMaxWidth = pageOptionRect.width;
                    _this.optionButtonWrapperElement.style.maxWidth = obwMaxWidth.toString() + 'px';
                    // Get new dimensions of button wrapper after applying the max width
                    optionButtonWrapper = _this.optionButtonWrapperElement.getBoundingClientRect();
                    if (((obwHeight * 2) <= optionButtonWrapper.height) || _this.optionButtonWrapperElement.clientHeight === 0) {
                        /* Hiding the button wrappers by setting the top and left with height and width of page option
                           if all the buttons doesnt fits in the avilable space */
                        obwTop = -5000;
                        obwLeft = -5000;
                        obwMaxWidth = 0;
                    }
                    else {
                        obwTop = _this.optionButtonWrapperTop(obwHeight, optionButtonWrapper, pageOptionRect);
                        obwLeft = _this.optionButtonWrapperLeft(pageOptionRect, optionButtonWrapper);
                        // display the buttons for the hovered page
                        _this.optionButtonWrapperElement.style.opacity = '1';
                    }
                    _this.optionButtonWrapperElement.style.top = obwTop.toString() + 'px';
                    _this.optionButtonWrapperElement.style.left = obwLeft.toString() + 'px';
                }
            }
        };
        /**
         * Handler for touch start event
         */
        this.onTouchHandler = function (imageOrder, event) {
            if (!(_this.state.isMarkSheetHolderHovered && imageOrder === _this.state.hoveredPageNo)) {
                _this.updatePageOptionButtonPosition(false, -1);
            }
        };
        /*
         * Scroll event handler
         */
        this.onScrollHandler = function (event) {
            _this.buttonWrapperPositionUpdate();
        };
        /*
         * On Wheel handler
         */
        this.onWheelHandler = function (event) {
            var element = htmlUtilities.getElementFromPosition(event.pageX, event.pageY);
            var str = element.id;
            var pageNo = parseInt(str.split('_')[1]);
            if (!isNaN(pageNo) &&
                ((element.getBoundingClientRect().height > (window.innerHeight - constants.FRV_TOOLBAR_HEIGHT))
                    || (element.className.indexOf('page-options hovered') === -1))) {
                _this.updatePageOptionButtonPosition(true, pageNo);
            }
        };
        /*
         * Call back method to set the option button wrapper ref
         */
        this.pageOptionElementRefCallback = function (element) {
            if (element !== undefined) {
                _this.pageOptionElement = element;
            }
        };
        /*
         * Call back method to set the page option ref
         */
        this.optionButtonWrapperElementRefCallback = function (element) {
            if (element !== undefined) {
                _this.optionButtonWrapperElement = element;
            }
        };
        /**
         * Function to update the page option button postion
         */
        this.updatePageOptionButtonPosition = function (isMouseIn, pageNo) {
            // when mouse released from page hide the button wrapper.
            if (!isMouseIn && _this.optionButtonWrapperElement) {
                _this.optionButtonWrapperElement.style.opacity = '0';
                _this.optionButtonWrapperElement.style.top = '-5000px';
                _this.optionButtonWrapperElement.style.left = '-5000px';
                _this.optionButtonWrapperElement.style.maxWidth = '0px';
            }
            _this.setState({
                renderedOn: Date.now(),
                idOfMarksheetClicked: -1,
                isMarkSheetHolderHovered: isMouseIn,
                hoveredPageNo: pageNo
            });
        };
        /**
         * Call back function for mark this page button click for non ecoursework components
         */
        this.markThisPageButtonClick = function (pageNumber) {
            var imageElementId = 'img_' + pageNumber;
            if ((_this.props.componentType === enums.MarkingMethod.Structured || responseHelper.isEbookMarking) &&
                !responseHelper.isAtypicalResponse()) {
                var imageZones = _this.scriptHelper.getImageZonesAgainstPageNo(pageNumber);
                var linkedAnnotations = pageLinkHelper.getAllLinkedItemsAgainstPage(pageNumber);
                responseActionCreator.imageZonesAgainstPageNumber(imageZones, linkedAnnotations);
            }
            else {
                _this.props.switchViewCallback(responseStore.instance.selectedImageOffsetTop(imageElementId));
            }
        };
        /**
         * Triggering switchView once the file is selected for ecoursework components
         */
        this.onEcourseWorkFileChanged = function (isInFullResponseView) {
            // call only when navigating to zone view by clicking images in full response view
            if (isInFullResponseView) {
                _this.markThisPageButtonClick(_this._pageNumber);
                _this._pageNumber = undefined;
            }
        };
        /**
         * For structured Resposnes Call switch view callback After saving ImageZones
         * against Mark This Page button click page number.
         */
        this.imageZonesAgainstPageNoSaved = function () {
            _this.props.switchViewCallback(0);
        };
        /*
         * Mouse move event handler
         */
        this.onMouseMoveHandler = function (isMouseIn, pageNumber, event) {
            if (!htmlUtilities.isTabletOrMobileDevice) {
                _this.updatePageOptionButtonPosition(isMouseIn, pageNumber);
            }
        };
        /**
         * This method will find the offset top of active image container after loading the images.
         */
        this.findActiveImageContainerOffsetTop = function () {
            if (_this.refs != null) {
                // In full responseview the refs does not have output pageID
                var refId = responseStore.instance.currentlyVisibleImageContainerRefId;
                var ele = ReactDom.findDOMNode(_this.refs[refId.substring(0, refId.lastIndexOf('_'))]);
                if (ele) {
                    // set the offsetTop - substract change-view-holder size for getting correct scroll position.
                    return ele.offsetTop - constants.FULL_RESPONSE_VIEW_ITEM_MARGIN;
                }
            }
        };
        /**
         *  This method will find offset top of active image container and call the callback function with
         *  full response view option and offsetTop
         */
        this.fullResponseViewOptionChanged = function (fullResponseViewOption) {
            var that = _this;
            _this.updatePageOptionButtonPosition(false, -1);
            // .3 sesond is the trannsition effect.
            setTimeout(function () {
                that.scrollToOffset(fullResponseViewOption);
            }, constants.FULLRESPONSEVIEW_TRANSITION_TIME);
        };
        /**
         *  This method will find the visible page and setting scroll position in FRV
         */
        this.setScrollTop = function () {
            $('.marksheet-container').scrollTop(_this.findActiveImageContainerOffsetTop() + constants.FULL_RESPONSE_VIEW_ITEM_MARGIN);
        };
        /**
         *  This method will find the first unknown content page and setting scroll position in FRV
         */
        this.scrollToFirstUnknownContentPageOnPopUpOKClick = function () {
            _this.marksheetcontainerElement.scrollTop = (_this.findUnknownContentPagePositionToScroll());
        };
        /**
         *  This method will find the page reference to scroll
         */
        this.findUnknownContentPagePositionToScroll = function () {
            if (_this.refs != null) {
                var ele = ReactDom.findDOMNode(_this.refs['img_' + responseHelper.findFirstUnknownContentPage()]);
                if (ele) {
                    return ele.offsetTop;
                }
            }
        };
        /**
         * Rerender the component
         */
        this.reRender = function () {
            _this.setState({
                renderedOn: Date.now(),
                idOfMarksheetClicked: -1
            });
        };
        /**
         * Sets the properties of a full response image viewer.
         */
        this.setImagePropertiesForFullResponseImage = function () {
            var that = _this;
            if (_this.props.fileMetadataList) {
                _this.props.fileMetadataList.forEach(function (metadata) {
                    if (metadata.isConvertible) {
                        _this.getImageProperties(metadata.url, function (context) {
                            var imageWidth = { pageNo: metadata.pageNumber, height: context.height, width: context.width };
                            that.imageWidths.push(imageWidth);
                            if (that.totalImageCount === that.imageWidths.length && that.isComponenetMounted) {
                                that.setState({
                                    renderedOn: Date.now(),
                                    idOfMarksheetClicked: -1
                                });
                            }
                        });
                    }
                    else {
                        _this.setState({
                            renderedOn: Date.now(),
                            idOfMarksheetClicked: -1
                        });
                    }
                });
            }
        };
        this.scriptHelper = new scriptHelper();
        this.treeViewHelper = new treeViewDataHelper();
        var treeItem = this.treeViewHelper.treeViewItem();
        this.state = {
            renderedOn: 0,
            idOfMarksheetClicked: -1,
            isMarkSheetHolderHovered: false,
            hoveredPageNo: -1
        };
        this.buttonWrapperPositionUpdate = this.buttonWrapperPositionUpdate.bind(this);
        this.hidePageOptionButton = this.hidePageOptionButton.bind(this);
    }
    /**
     * This function gets invoked when the component is about to be mounted
     */
    FullResponseImageViewer.prototype.componentWillMount = function () {
        // clear the on page comments side view collections
        onPageCommentHelper.resetSideViewCollections();
        this.imageWidths = [];
        this.isStructuredComponent = this.props.isEbookmarking || this.props.componentType === enums.MarkingMethod.Structured;
        this.pageNumbers = this.isStructuredComponent ?
            this.scriptHelper.getPageNumbersForImageZones(this.props.isEbookmarking ?
                this.treeViewHelper.markSchemeIdsCollection : this.treeViewHelper.imageClusterIdCollection) : null;
    };
    /**
     * Render method of the component
     */
    FullResponseImageViewer.prototype.render = function () {
        var _this = this;
        if (this.state.renderedOn === 0) {
            return null;
        }
        var suppressedImageTooltip = localeStore.instance.TranslateText('marking.full-response-view.script-page.suppressed-page-tooltip');
        var suppressedPageText = localeStore.instance.TranslateText('marking.full-response-view.script-page.suppressed-page');
        var additionalPageText = localeStore.instance.TranslateText('marking.full-response-view.script-page.additional-page-indicator');
        var that = this;
        var currentImageWidth = that.imageWidths.length > 0 ? that.imageWidths[0].width : 100;
        var currentImageHeight = that.imageWidths.length > 0 ? that.imageWidths[0].height : 100;
        var imageOrder = 0;
        this.numberOfImagesToRender = 0;
        // to set order of non convertible files
        var nonConvertibleFileOrder = 0;
        var order = 0;
        // to add last-page class
        var totalNumberOfFiles = 0;
        var additionalObjectPageOrder = 0;
        var suppressedPageCount = 0;
        var firstItemPageId = 0;
        var pageItemIndex = 1;
        var isEcoursework = this.props.isECourseworkComponent;
        var toRender = this.props.fileMetadataList.map(function (fileMetadata) {
            totalNumberOfFiles++;
            imageOrder++;
            order = isEcoursework ? fileMetadata.pageNumber : imageOrder;
            var actualPageNo = fileMetadata.pageNumber;
            var isAdditionalObject = false;
            var isPageLinked = !responseHelper.isEResponse && pageLinkHelper.isPageLinked(order);
            if (_this.isStructuredComponent) {
                isAdditionalObject = scriptStore.instance.getAdditionalObjectFlagValue(order);
                if (isAdditionalObject) {
                    additionalObjectPageOrder++;
                }
            }
            if (_this.props.isEbookmarking === true && that.props.hasUnmanagedImageZones && !that.props.hasUnmanagedImageZoneInRemark) {
                var isUnManaged = responseHelper.hasUnManagedImageZoneForThePage(fileMetadata.pageNumber);
                if (that.props.isShowAllPagesOfScriptOptionSelected === false && isUnManaged === false && isPageLinked === false) {
                    return null;
                }
            }
            // Calculate page index for each files in the ecoursework component.
            if (fileMetadata.pageId !== 0) {
                if (firstItemPageId !== fileMetadata.pageId) {
                    firstItemPageId = fileMetadata.pageId;
                    pageItemIndex = 1;
                }
                else {
                    pageItemIndex++;
                }
            }
            // For suppressed images, the image url will be empty.
            if (fileMetadata.isSuppressed) {
                if (that.props.isShowAnnotatedPagesOptionSelected ||
                    _this.props.isShowUnAnnotatedAdditionalPagesOptionSelected ||
                    ((_this.props.hasUnmanagedSLAO || _this.props.hasUnmanagedImageZones)
                        && !_this.props.isShowAllPagesOfScriptOptionSelected)) {
                    return null;
                }
                var padding = {
                    'paddingTop': (currentImageHeight / currentImageWidth) * 100 + '%'
                };
                suppressedPageCount++;
                return (React.createElement(SuppressedPage, {imageOrder: order, showPageNumber: true, key: 'suppressed-page-' + suppressedPageCount, isAdditionalObject: isAdditionalObject, additionalObjectPageOrder: additionalObjectPageOrder, isECourseworkComponent: _this.props.isECourseworkComponent}));
            }
            var hasPageContainsCurrentMarkGroupAnnotation = true;
            // Check the page having any annotations
            if (that.props.componentType === enums.MarkingMethod.Unstructured) {
                hasPageContainsCurrentMarkGroupAnnotation =
                    annotationHelper.HasPageContainsCurrentMarkGroupAnnotation(actualPageNo);
                if (_this.props.isShowAnnotatedPagesOptionSelected && hasPageContainsCurrentMarkGroupAnnotation) {
                    return null;
                }
            }
            if (_this.props.hasUnmanagedSLAO) {
                if (!_this.props.isShowAllPagesOfScriptOptionSelected) {
                    if (isAdditionalObject) {
                        hasPageContainsCurrentMarkGroupAnnotation =
                            annotationHelper.HasPageContainsCurrentMarkGroupAnnotation(actualPageNo, true);
                        if (hasPageContainsCurrentMarkGroupAnnotation) {
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
            else {
                if (that.props.isShowUnAnnotatedAdditionalPagesOptionSelected) {
                    if (isAdditionalObject) {
                        hasPageContainsCurrentMarkGroupAnnotation =
                            annotationHelper.HasPageContainsCurrentMarkGroupAnnotation(actualPageNo, false);
                        if (hasPageContainsCurrentMarkGroupAnnotation) {
                            return null;
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
            _this.numberOfImagesToRender++;
            for (var arrayIndex = 0; arrayIndex < that.imageWidths.length; arrayIndex++) {
                if (that.imageWidths[arrayIndex].pageNo === actualPageNo) {
                    currentImageWidth = that.imageWidths[arrayIndex].width;
                    currentImageHeight = that.imageWidths[arrayIndex].height;
                    break;
                }
            }
            /* Flagged As seen button should be visible If
                    1. Component is Unstructured
                AND 2. Component has seen Annotation Configured
                AND 3. Page does not have any annotations on it.
                AND 4. Response Should not be in closed state
                AND 5. Not team management mode
                AND 6. Page not linked in unmanaged SLAO mode
                AND 7. If Not in Marking Check Mode
                AND 8. If a Page linked to a question item, for structured response*/
            var isFlaggedAsSeenButtonVisible = ((_this.isFlaggedAsSeenButtonVisible(isAdditionalObject, isPageLinked, actualPageNo, hasPageContainsCurrentMarkGroupAnnotation))
                && !_this.props.isECourseworkComponent && !that.props.isShowUnAnnotatedAdditionalPagesOptionSelected);
            var isPageOptionRender = _this.isPageOptionRender(isAdditionalObject, fileMetadata.pageNumber);
            var isPageOptionButtonsShown = isPageOptionRender ? (_this.state.isMarkSheetHolderHovered &&
                (isEcoursework ? (order === _this.state.hoveredPageNo) :
                    (imageOrder === _this.state.hoveredPageNo))) : false;
            var pageOptionRender = isPageOptionRender ? (React.createElement(PageOptions, {pageNumber: order, markThisButtonClickCallback: _this.markThisPageButtonClick, id: 'po_' + order, key: 'po_' + order, selectedLanguage: _this.props.selectedLanguage, isFlaggedAsSeenButtonVisisble: isFlaggedAsSeenButtonVisible, isMarkThisPageButtonVisible: _this.canShowMarkThisPageButton(actualPageNo, isPageLinked), currentImageMaxWidth: currentImageWidth, lastMarkSchemeId: _this.lastMarkSchemeID, markSheetIdClicked: _this.state.idOfMarksheetClicked, reRender: _this.reRender, onLinkToButtonClick: _this.props.onLinkToButtonClick, isLinkToPagePopupShowing: _this.props.isLinkToPagePopupShowing, hasUnmanagedSLAO: _this.props.hasUnmanagedSLAO, unManagedSLAOFlagAsSeenClick: _this.props.unManagedSLAOFlagAsSeenClick, isAdditionalObject: isAdditionalObject, hasUnKnownContent: responseHelper.hasUnManagedImageZoneForThePage(order), unKnownContentFlagAsSeenClick: _this.props.unKnownContentFlagAsSeenClick, hasUnmanagedImageZones: _this.props.hasUnmanagedImageZones, updatePageOptionButtonPositionCallback: _this.updatePageOptionButtonPosition, pageOptionElementRefCallback: _this.pageOptionElementRefCallback, optionButtonWrapperElementRefCallback: _this.optionButtonWrapperElementRefCallback, buttonWrapperPositionUpdate: _this.buttonWrapperPositionUpdate, doWrapperReRender: (_this.state.isMarkSheetHolderHovered && imageOrder === _this.state.hoveredPageNo), isPageOptionButtonsShown: isPageOptionButtonsShown})) : null;
            var pageIndicator = fileMetadata.name !== '' ?
                React.createElement("div", {className: 'file-name'}, fileMetadata.name +
                    (fileMetadata.isConvertible ? '(P' + pageItemIndex + ')' : '')) :
                React.createElement("div", {className: classNames('page-number', { 'with-icon': isPageLinked }), id: _this.getPageElementId(order, isAdditionalObject, additionalObjectPageOrder)}, isAdditionalObject ? React.createElement("span", {className: 'ad-pg-number'}, additionalPageText + ' ' + additionalObjectPageOrder) : order, _this.renderLinkIcon(order, isPageLinked));
            var frvBusyIndicator = (React.createElement(LoadingIndicator, {id: 'fileloading', key: 'fileloading', selectedLanguage: localeStore.instance.Locale, cssClass: 'file-pre-loader', isFrv: true}));
            if (fileMetadata.isConvertible) {
                // if ecoursework component, then compare order and hovered page number as
                // image order and page number is different as coursework contain file types other than images.
                return (React.createElement("div", {className: classNames((isPageOptionRender ? (isPageOptionButtonsShown ?
                    'marksheet-holder pageoption-fixed' : 'marksheet-holder') : 'marksheet-holder no-hover'), { 'loading': that.pageIds.indexOf('img_' + order) === -1 }, { 'last-page': (that.props.fileMetadataList.count() === totalNumberOfFiles) }), id: 'img_' + order, ref: 'img_' + order, key: 'img_' + order, onClick: _this.onMarkSheetHolderClick.bind(_this, order, fileMetadata.pageId), onTouchStart: _this.onTouchHandler.bind(_this, order)}, _this.getAnnotationOverlay(order, currentImageHeight, currentImageWidth, isPageLinked, isAdditionalObject), React.createElement("div", {className: 'frv-marksheet-img'}, React.createElement("img", {src: fileMetadata.url, onLoad: _this.imageLoaded.bind(_this, order, 'img_' + order)})), pageOptionRender, pageIndicator, frvBusyIndicator));
            }
            else if (fileMetadata.isImage) {
                nonConvertibleFileOrder++;
                // TODO:
                // The < img /> tag can be made as a new component.
                // so that the binding can be moved to the constructor.
                return (React.createElement("div", {className: classNames((isPageOptionRender ? (isPageOptionButtonsShown ?
                    'marksheet-holder media-wrapper pageoption-fixed' : 'marksheet-holder media-wrapper') :
                    'marksheet-holder no-hover'), { 'loading': that.pageIds.indexOf('img_' + order) === -1 }, { 'last-page': that.props.fileMetadataList.count() === totalNumberOfFiles }), id: 'img_' + order, ref: 'img_' + order, key: 'img_' + order, onClick: _this.onMarkSheetHolderClick.bind(_this, order, fileMetadata.pageId), onMouseOver: _this.onMouseMoveHandler.bind(_this, true, order), onMouseOut: _this.onMouseMoveHandler.bind(_this, false, order)}, pageOptionRender, _this.getAnnotationOverlay(order, currentImageHeight, currentImageWidth, isPageLinked, isAdditionalObject), React.createElement("div", {className: 'media-box', id: fileMetadata.name + '.' + fileMetadata.linkType}, React.createElement("div", {className: 'media-img-wraper'}, React.createElement("div", {className: 'media-img-holder'}, React.createElement("img", {src: fileMetadata.url, onLoad: _this.imageLoaded.bind(_this, order, 'img_' + order)})))), pageIndicator, frvBusyIndicator));
            }
            else {
                // non convertible files like audio,video,jpg,zip,xls
                nonConvertibleFileOrder++;
                return (React.createElement("div", {className: classNames((isPageOptionRender ? (isPageOptionButtonsShown ?
                    'marksheet-holder media-wrapper pageoption-fixed' : 'marksheet-holder media-wrapper') :
                    'marksheet-holder no-hover media-wrapper'), { ' last-page': that.props.fileMetadataList.count() === totalNumberOfFiles }), id: 'img_' + order, ref: 'img_' + order, key: 'img_' + order, onClick: _this.onMarkSheetHolderClick.bind(_this, order, fileMetadata.pageId), onMouseOver: _this.onMouseMoveHandler.bind(_this, true, order), onMouseOut: _this.onMouseMoveHandler.bind(_this, false, order)}, React.createElement("div", {className: 'page-options hovered'}, " "), React.createElement("div", {className: 'media-box', id: fileMetadata.name + '.' + fileMetadata.linkType}, React.createElement("div", {className: 'media-img-wraper'}, React.createElement("div", {className: 'media-img-holder'}, React.createElement("div", {className: 'svg-media-ico'}, React.createElement("span", {className: 'svg-icon'}, React.createElement("svg", {viewBox: '0 0 32 32', className: eCourseworkHelper.getIconStyleForSvg(fileMetadata.linkType).svgClass}, React.createElement("use", {xmlnsXlink: 'http://www.w3.org/1999/xlink', xlinkHref: '#' + eCourseworkHelper.getIconStyleForSvg(fileMetadata.linkType).icon}))))))), React.createElement("div", {className: 'page-number', title: fileMetadata.name}, fileMetadata.name)));
            }
        });
        // if in hasUnmanagedSLAO mode and all slaos are managed the show the all slao managed popup
        if (this.props.hasUnmanagedSLAO && !responseHelper.hasUnManagedSLAOInMarkingMode && this.props.allSLAOManaged) {
            this.props.allSLAOManaged();
        }
        if (this.props.hasUnmanagedImageZones && !responseHelper.hasUnManagedImageZone() && this.props.allUnknownContentManaged) {
            this.props.allUnknownContentManaged();
            if (htmlUtilities.isTabletOrMobileDevice) {
                this.setState({ isMarkSheetHolderHovered: false });
            }
        }
        return (React.createElement("div", {className: 'marksheets-inner-images'}, this.renderDefinitions(), React.createElement("div", {className: 'marksheet-container clearfix', onWheel: this.onWheelHandler.bind(this), onScroll: this.onScrollHandler.bind(this), ref: function (marksheetcontainer) { _this.marksheetcontainerElement = marksheetcontainer; }}, React.createElement("div", {className: classNames('frv-holder', { 'frv-single-page': this.props.fullResponseOption === enums.FullResponeViewOption.onePage })}, !this.props.isECourseworkComponent ? this.renderFirstPageHolder() : null, toRender, React.createElement(AnnotatedMessageHolder, {id: 'annotatedMessageHolder', componentType: this.props.componentType, key: 'annotatedMessageHolder'})))));
    };
    /**
     * Function to find whether page option available for the page.
     */
    FullResponseImageViewer.prototype.isPageOptionRender = function (isAdditionalObject, pageNumber) {
        if (this.props.isStandardisationsetupmode) {
            return true;
        }
        else {
            return ((this.props.hasUnmanagedSLAO || this.props.hasUnmanagedImageZones) ?
                (isAdditionalObject || responseHelper.isUnkNownContentPage(pageNumber) ? true : false) : true);
        }
    };
    /**
     * Function for rendering definitions
     */
    FullResponseImageViewer.prototype.renderDefinitions = function () {
        if (this.props.isECourseworkComponent) {
            return eCourseworkHelper.renderDefinitions();
        }
        else {
            return null;
        }
    };
    /**
     *  Mark this page button should be visible If
     *                           1. Component is Unstructured and not ebookmarking or Structured response rendered as Unstructured(Atypical)
     *                           2. Structured and If one or more image zones available against that particular page
     *                           3. Not team management mode
     *                           4. Not ecoursework component
     *                           5. in ebookmarking pages with imagezones zoned to current QIG
     */
    FullResponseImageViewer.prototype.canShowMarkThisPageButton = function (actualPageNo, isPageLinked) {
        return ((((this.props.componentType === enums.MarkingMethod.Unstructured &&
            !responseHelper.isEbookMarking) ||
            (responseHelper.isAtypicalResponse())) ||
            (this.pageNumbers && this.pageNumbers.indexOf(actualPageNo) !== -1 && !this.props.hasUnmanagedImageZones) ||
            (isPageLinked && this.props.componentType === enums.MarkingMethod.Structured && !this.props.hasUnmanagedSLAO) ||
            (isPageLinked && responseHelper.isEbookMarking && !this.props.hasUnmanagedImageZones)) &&
            !this.props.isECourseworkComponent);
    };
    /**
     * return FlagAsSeenButton visibility.
     * @param isAdditionalObject
     * @param isPageLinked
     * @param actualPageNo
     * @param hasPageContainsCurrentMarkGroupAnnotation
     */
    FullResponseImageViewer.prototype.isFlaggedAsSeenButtonVisible = function (isAdditionalObject, isPageLinked, actualPageNo, hasPageContainsCurrentMarkGroupAnnotation) {
        if (markerOperationModeFactory.operationMode.isFlaggedAsSeenButtonVisible) {
            if (this.props.hasUnmanagedSLAO && !this.props.hasUnmanagedImageZones) {
                // Need to display the flagseen button when the additionalObject which has not linked.
                if (isAdditionalObject) {
                    if (isPageLinked) {
                        return !isPageLinked;
                    }
                    else {
                        return !annotationHelper.HasPageContainsCurrentMarkGroupAnnotation(actualPageNo);
                    }
                }
                else {
                    return false;
                }
            }
            else if (this.props.hasUnmanagedImageZones && responseHelper.hasUnManagedImageZoneForThePage(actualPageNo) &&
                worklistStore.instance.getResponseMode !== enums.ResponseMode.closed) {
                return true;
            }
            else {
                return annotationHelper.IsSeenStampConfiguredForQIG
                    && worklistStore.instance.getResponseMode !== enums.ResponseMode.closed
                    && !hasPageContainsCurrentMarkGroupAnnotation
                    && (!responseHelper.isEbookMarking && !responseHelper.isAtypicalResponse());
            }
        }
        else {
            return false;
        }
    };
    Object.defineProperty(FullResponseImageViewer.prototype, "lastMarkSchemeID", {
        /**
         * get the last MarkSchemeID.
         */
        get: function () {
            return this.props.lastMarkSchemeId ? this.props.lastMarkSchemeId : this.treeViewHelper.lastMarkSchemeId;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * returns ID for additional page element.
     * @param imageOrder
     * @param isAdditionalObject
     * @param additionalObjectPageOrder
     */
    FullResponseImageViewer.prototype.getPageElementId = function (imageOrder, isAdditionalObject, additionalObjectPageOrder) {
        return isAdditionalObject ? 'AdditionalPage_' + additionalObjectPageOrder : 'pn_' + imageOrder;
    };
    /**
     * render link icon if the page is linked against any question item
     * @param pageNumber
     */
    FullResponseImageViewer.prototype.renderLinkIcon = function (pageNumber, isPageLinked) {
        if (isPageLinked) {
            return React.createElement(LinkIcon, {id: 'link_icon_' + pageNumber.toString()});
        }
        else {
            return null;
        }
    };
    /**
     * click event for marksheet holder
     * @param evt
     */
    FullResponseImageViewer.prototype.onMarkSheetHolderClick = function (pageNumber, pageId, evt) {
        var elementToFindId = evt.target.parentElement && evt.target.parentElement.parentElement
            || evt.target.parentNode && evt.target.parentNode.parentNode;
        var id = elementToFindId.id.replace('img_', '');
        if (id.indexOf('annotationoverlay') >= 0) {
            id = evt.target.getAttribute('data-pageno');
        }
        // Handling click outside annotation overlay. ( For hover effect in ipad)
        if (id === null && evt.target.id.indexOf('annotationoverlay') >= 0) {
            id = evt.target.parentElement.id.replace('img_', '');
        }
        // To get the id of ebookmarking page in FRV
        if (id !== null && (id.indexOf('unzone_content_wrapper_') >= 0 ||
            id.indexOf('unzone_content_holder_') >= 0 || id.indexOf('po_') >= 0)) {
            if (evt.target.id.indexOf('unzone_content_wrapper_') >= 0) {
                id = evt.target.id.replace('unzone_content_wrapper_', '');
            }
            else if (evt.target.id.indexOf('unzone_content_holder_') >= 0) {
                id = evt.target.parentElement.id.replace('unzone_content_wrapper_', '');
            }
            else {
                id = evt.target.id.replace('po_', '');
            }
        }
        if (pageNumber !== this.state.hoveredPageNo) {
            this.setState({
                renderedOn: Date.now(),
                idOfMarksheetClicked: parseInt(id),
                isMarkSheetHolderHovered: true,
                hoveredPageNo: pageNumber
            });
        }
        if (this.props.isECourseworkComponent) {
            this._pageNumber = pageNumber;
            // to save clicked pagenumber in store
            markingActionCreator.setMarkThisPageNumber(pageNumber);
            // filter the coursework file of particular response
            if (responseStore.instance.selectedDisplayId) {
                var responseData = worklistStore.instance.getResponseDetails(responseStore.instance.selectedDisplayId.toString());
                var eCourseworkFiles = responseData ? eCourseworkFileStore.instance.
                    getCourseWorkFilesAgainstMarkGroupId(responseData.markGroupId) : null;
                var doAutoPlay = eCourseworkFileStore.instance.getSelectedECourseWorkFiles().count() > 1 ?
                    eCourseworkFileStore.instance.doAutoPlay() : true;
                // find the current file while clicking the page in FRV
                var courseworkFile = eCourseworkFiles ? eCourseworkFiles.filter(function (x) { return x.docPageID === pageId; }) : null;
                if (courseworkFile) {
                    // To avoid displaying file name in expanded view
                    if (eCourseworkFileStore.instance.isFilelistPanelCollapsed) {
                        eCourseworkResponseActionCreator.displayFileName(courseworkFile[0].title);
                    }
                    // Invoke action creator to save selected ecourse file in the store.
                    eCourseworkResponseActionCreator.eCourseworkFileSelect(courseworkFile[0], doAutoPlay, true, true);
                }
            }
        }
    };
    /**
     * Render a space area in fullresponse view if the Only Show unannotated pages option is OFF
     */
    FullResponseImageViewer.prototype.renderFirstPageHolder = function () {
        if (!this.props.isShowAnnotatedPagesOptionSelected && !this.props.isShowUnAnnotatedAdditionalPagesOptionSelected
            && !this.props.hasUnmanagedSLAO && !this.props.hasUnmanagedImageZones && !this.props.isShowAllPagesOfScriptOptionSelected) {
            return React.createElement("div", {className: 'marksheet-holder first-page'});
        }
    };
    /**
     * This function gets invoked when the component is about to be mounted
     */
    FullResponseImageViewer.prototype.componentDidMount = function () {
        this.isComponenetMounted = true;
        // Sets the image properties oncce after first render.
        this.setImagePropertiesForFullResponseImage();
        responseStore.instance.addListener(responseStore.ResponseStore.FULL_RESPONSE_VIEW_OPTION_CHANGED_EVENT, this.fullResponseViewOptionChanged);
        markingStore.instance.addListener(markingStore.MarkingStore.ANNOTATION_ADDED, this.reRender);
        markingStore.instance.addListener(markingStore.MarkingStore.REMOVE_ANNOTATION, this.reRender);
        exceptionStore.instance.addListener(exceptionStore.ExceptionStore.CLOSE_EXCEPTION, this.reloadExceptionDetailsOnCloseException);
        exceptionStore.instance.addListener(exceptionStore.ExceptionStore.MINIMIZE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        exceptionStore.instance.addListener(exceptionStore.ExceptionStore.MAXIMIZE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        exceptionStore.instance.addListener(exceptionStore.ExceptionStore.CLOSE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        messageStore.instance.addListener(messageStore.MessageStore.MESSAGE_MINIMIZE_EVENT, this.hidePageOptionButton);
        messageStore.instance.addListener(messageStore.MessageStore.MESSAGE_MAXIMIZE_EVENT, this.hidePageOptionButton);
        messageStore.instance.addListener(messageStore.MessageStore.MESSAGE_CLOSE_EVENT, this.hidePageOptionButton);
        window.addEventListener('resize', this.hidePageOptionButton);
        window.addEventListener('orientationchange', this.hidePageOptionButton);
        responseStore.instance.addListener(responseStore.ResponseStore.IMAGE_ZONES_AGAINST_PAGE_NO_SAVED, this.imageZonesAgainstPageNoSaved);
        eCourseworkFileStore.instance.addListener(eCourseworkFileStore.ECourseWorkFileStore.ECOURSE_WORK_FILE_SELECTION_CHANGED_EVENT, this.onEcourseWorkFileChanged);
        responseStore.instance.addListener(responseStore.ResponseStore.FOUND_VISIBLE_IMAGE, this.setScrollTop);
        responseStore.instance.addListener(responseStore.ResponseStore.FRV_SCROLL_EVENT, this.scrollToFirstUnknownContentPageOnPopUpOKClick);
        responseStore.instance.addListener(responseStore.ResponseStore.FRV_TOGGLE_BUTTON_EVENT, this.hidePageOptionButton);
        this.doSetScroll = true;
    };
    /**
     * This function gets invoked when the component is about to be mounted
     */
    FullResponseImageViewer.prototype.componentWillUnmount = function () {
        this.isComponenetMounted = false;
        responseStore.instance.removeListener(responseStore.ResponseStore.FULL_RESPONSE_VIEW_OPTION_CHANGED_EVENT, this.fullResponseViewOptionChanged);
        markingStore.instance.removeListener(markingStore.MarkingStore.ANNOTATION_ADDED, this.reRender);
        markingStore.instance.removeListener(markingStore.MarkingStore.REMOVE_ANNOTATION, this.reRender);
        exceptionStore.instance.removeListener(exceptionStore.ExceptionStore.CLOSE_EXCEPTION, this.reloadExceptionDetailsOnCloseException);
        exceptionStore.instance.removeListener(exceptionStore.ExceptionStore.MINIMIZE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        exceptionStore.instance.removeListener(exceptionStore.ExceptionStore.MAXIMIZE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        exceptionStore.instance.removeListener(exceptionStore.ExceptionStore.CLOSE_EXCEPTION_WINDOW, this.hidePageOptionButton);
        messageStore.instance.removeListener(messageStore.MessageStore.MESSAGE_MINIMIZE_EVENT, this.hidePageOptionButton);
        messageStore.instance.removeListener(messageStore.MessageStore.MESSAGE_MAXIMIZE_EVENT, this.hidePageOptionButton);
        messageStore.instance.removeListener(messageStore.MessageStore.MESSAGE_CLOSE_EVENT, this.hidePageOptionButton);
        window.removeEventListener('resize', this.hidePageOptionButton);
        window.removeEventListener('orientationchange', this.hidePageOptionButton);
        responseStore.instance.removeListener(responseStore.ResponseStore.IMAGE_ZONES_AGAINST_PAGE_NO_SAVED, this.imageZonesAgainstPageNoSaved);
        eCourseworkFileStore.instance.removeListener(eCourseworkFileStore.ECourseWorkFileStore.ECOURSE_WORK_FILE_SELECTION_CHANGED_EVENT, this.onEcourseWorkFileChanged);
        responseStore.instance.removeListener(responseStore.ResponseStore.FOUND_VISIBLE_IMAGE, this.setScrollTop);
        responseStore.instance.removeListener(responseStore.ResponseStore.FRV_SCROLL_EVENT, this.scrollToFirstUnknownContentPageOnPopUpOKClick);
        responseStore.instance.removeListener(responseStore.ResponseStore.FRV_TOGGLE_BUTTON_EVENT, this.hidePageOptionButton);
    };
    /**
     * This function gets invoked after the component is rendered
     */
    FullResponseImageViewer.prototype.componentDidUpdate = function () {
        // add 'last-page' classname to the last element
        var elementList = htmlUtilities.getElementsByClassName('marksheet-holder');
        if (elementList.length > 0 && !elementList[elementList.length - 1].classList.contains('last-page')) {
            elementList[elementList.length - 1].className += ' last-page';
        }
        // call to set class name 'all-annotated' correctly
        this.props.hasElementsToRenderInFRViewMode(this.numberOfImagesToRender >= 1);
    };
    /**
     * Get the React component for Annotation Overlay
     * @param pageNumber
     * @param currentImageHeight
     * @param currentImageWidth
     * @param isPageLinked
     * @param isAdditionalObject
     */
    FullResponseImageViewer.prototype.getAnnotationOverlay = function (pageNumber, currentImageHeight, currentImageWidth, isPageLinked, isAdditionalObject) {
        // we need to set this true as we need to get the current annotations which are placed against
        // pages linked by previous marker
        if (!isPageLinked && this.props.linkedPagesByPreviousMarkers &&
            this.props.linkedPagesByPreviousMarkers.indexOf(pageNumber) > -1) {
            isPageLinked = true;
        }
        if (this.props.displayAnnotations) {
            return (React.createElement(AnnotationOverlay, {id: pageNumber.toString(), key: 'annotationOverlay_' + pageNumber, outputPageNo: 0, selectedLanguage: this.props.selectedLanguage, imageClusterId: 0, currentOutputImageHeight: currentImageHeight, currentImageMaxWidth: currentImageWidth, pageNo: pageNumber, isDrawStart: this.props.isDrawStart, renderedOn: this.state.renderedOn, panEndData: this.props.panEndData, isReadOnly: true, currentImageNaturalWidth: currentImageWidth, isAdditionalObject: isAdditionalObject, isALinkedPage: isPageLinked, isEBookMarking: this.props.isEbookmarking}));
        }
        else {
            return null;
        }
    };
    /**
     * Go to the corresponding element if all images rendered.
     * @param page
     */
    FullResponseImageViewer.prototype.imageLoaded = function (pageNumber, id) {
        // TODO: elementToRemove implementation can be done without using JQuery
        // as the binding for imageLoaded() is moved to the constructor and new component is created.
        var elementToRemove = '#' + id + ' .file-pre-loader';
        // remove busy indicator after image has been loaded
        if ($(elementToRemove)) {
            $(elementToRemove).remove();
            $('#' + id).removeClass('loading');
        }
        var imageOffsetTop;
        this.imagesLoaded++;
        if (this.pageIds.indexOf(id) === -1) {
            this.pageIds[this.pageIds.length] = id;
        }
        // in ecoursework case once the first image loads we need to set scroll,
        // no need to wait for all images to be loaded
        if (!this.props.setScrollTopAfterAllImagesLoaded && this.doSetScroll) {
            this.setScrollTop();
            this.doSetScroll = false;
        }
        // find and save the offset of active image container.
        if (this.totalImageCount === this.imagesLoaded) {
            // This will find the offsetTop value of active image container.
            imageOffsetTop = this.props.setScrollTopAfterAllImagesLoaded ? this.findActiveImageContainerOffsetTop() : undefined;
            // reset images loaded count;
            this.imagesLoaded = 0;
        }
        this.props.onImageLoaded(pageNumber, imageOffsetTop);
    };
    /**
     * To set scroll offset
     * @param {enums.FullResponeViewOption} fullResponseViewOption
     */
    FullResponseImageViewer.prototype.scrollToOffset = function (fullResponseViewOption) {
        var imageOffsetTop = this.findActiveImageContainerOffsetTop();
        this.props.onFullResponseViewOptionChanged(fullResponseViewOption, imageOffsetTop);
    };
    /**
     * get the image properties
     * @param {string} image
     * @param {Function} callback
     */
    FullResponseImageViewer.prototype.getImageProperties = function (image, callback) {
        var img = $('<img />');
        img.attr('src', image);
        img.unbind('load');
        img.bind('load', function () {
            callback(this);
        });
    };
    /**
     * to reload exceptions after closing an exception
     */
    FullResponseImageViewer.prototype.reloadExceptionDetailsOnCloseException = function () {
        exceptionHelper.getNewExceptions(markerOperationModeFactory.operationMode.isTeamManagementMode);
    };
    /**
     * Hide Page Option Button whenever exception/message panel resize/close
     */
    FullResponseImageViewer.prototype.hidePageOptionButton = function () {
        this.updatePageOptionButtonPosition(false, -1);
    };
    return FullResponseImageViewer;
}(pureRenderComponent));
module.exports = FullResponseImageViewer;
//# sourceMappingURL=fullresponseimageviewer.js.map