knockout-winjs
=============

Project to smooth the KnockoutJS/WinJS interaction, this code is a shim layer which facilitates usage of WinJS UI controls in an Knockout Windows application. It achieves this by creating bindings for the various controls which allow them to show up in Knockout data-bind attributes like:

    The current rating is: <span data-bind="text: userRating"></span><br/>
    <div data-bind="winRating: {userRating: userRating}"></div>

How to use this in your Knockout project?
----------------------------------------

Just make sure to include WinJS 3.0.1 NuGet package in your Visual Studio project, and then include the shim.

    <link href="WinJS/css/ui-light.css" rel="stylesheet" />
    <script src="WinJS/js/WinJS.js"></script>
    <script src="/scripts/knockout-winjs.js"></script>

Also make sure that you run the following WinJS command in your code

	WinJS.Application.start();
	
And make sure that both Knockout's ko.applyBindings and WinJS.UI.processAll are run in the WinJS.Application.onready event or later.
	
__Note #1: this shim library has only been tested against Knockout 3.3.0 and WinJS 3.0.1__

__Note #2: this shim library is adapted from its original version to improve some of the controls. I have not yet been able to test all controls that are explained below. However, I see no reason why they should not at least work as good as they did in spankyj's original.

Examples of control usage
-------------------------

### AppBar and AppBarCommand

    <!-- Shows up on the bottom of the screen, use right-click or touch edgy gesture to show -->
    <div data-bind="winAppBar: {placement: 'bottom'}">
        <button data-bind="winAppBarCommand: {label: 'AppBarButton', type: 'button', icon:'add'}"></button>
    </div>

### BackButton

    <!-- Won't show up unless you use WinJS.Navigation stack -->
    <button data-bind="winBackButton"></button>

### DatePicker

    <div data-bind="winDatePicker: {current: date}"></div>

### FlipView

    <div class="flipView" data-bind="winFlipView: {itemTemplate: templateName, itemDataSource: flipViewArray}"></div>
    <script type="text/html" id="flipViewTemplate">
      <div>
        <span>Name: </span><span data-bind="text: text"></span>
      </div>
      <div>
        <span>Rating: </span><span data-bind="text: rating"></span>
      </div>
    </script>

### Flyout

    <button id="flyoutAnchor">Show a flyout!</button>
    <div data-bind="winFlyout: {anchor: '#flyoutAnchor', placement: 'right'}">
        <div>This is a flyout</div>
    </div>

### Hub and HubSection

    <div class="hub" data-bind="winHub">
      <div class="hubSection" data-bind="winHubSection: {header: 'Section1'}"></div>
      <div class="hubSection" data-bind="winHubSection: {header: 'Section2'}"></div>
      <div class="hubSection" data-bind="winHubSection: {header: 'Section3'}"></div>
    </div>

### ItemContainer

    <!-- shown here used within a ko foreach -->
    <div data-bind="foreach: ratings">
      <div class="item" data-bind="winItemContainer: {swipeBehavior: 'select', swipeOrientation: 'horizontal', selected: selected}">
        <div class="content"><span>Person: </span><span data-bind="text: text"></span>&nbsp;
        <span>Rating: </span><span data-bind="text: rating"></span>&nbsp;
        <span>Selected: </span><span data-bind="text: selected"></span></div>
      </div>
    </div>
    
### ListView

    <div class="listView" data-bind="winListView: {itemTemplate: 'listViewItemTemplate', itemDataSource: listViewArray, layout: {type: WinJS.UI.GridLayout}}"></div>
    <script type="text/html" id="listViewItemTemplate">
      <div class="listViewItem">
        <div>
          <span>Name: </span><span data-bind="text: text"></span>
        </div>
        <div>
          <span>Rating: </span><span data-bind="text: rating"></span>
        </div>
      </div>
    </script>
	
__Note: Data binding of the layout property is currently not supported. I'm open to suggestions on how to make that work correctly.__

### Menu and MenuCommand

    <button id="menuAnchor">Show a menu!</button>
    <div data-bind="winMenu: {anchor: '#menuAnchor', placement: 'right' }">
      <button data-bind="winMenuCommand: {id: 'menu2', label: 'Menu2', type: 'button'}"></button>
      <hr data-bind="winMenuCommand: {type: 'separator'}" />
      <button data-bind="winMenuCommand: {id: 'menu3', label: 'Menu3', type: 'button'}"></button>
    </div>
    
### NavBar and friends

    <!-- Shows up on the top of the screen, use right-click or touch edgy gesture to show -->
    <div data-bind="winNavBar">
      <div data-bind="winNavBarContainer">
        <div data-bind="winNavBarCommand: {label: 'Navigation Item', icon: 'add'}"></div>
      </div>
    </div>

### Rating

    The current rating is: <span data-bind="text: userRating"></span><br/>
    <div data-bind="winRating: {userRating: userRating}"></div>

### SearchBox

    <div data-bind="winSearchBox"></div>

### TimePicker

    <div data-bind="winTimePicker: {current: time}"></div>

### ToggleSwitch
    
    <div data-bind="winToggleSwitch: {checked: toggleValue, title: toggleTitle, labelOff: toggleLabelOff, labelOn: 'world'}"></div>

### Tooltip

    <div data-bind="winTooltip: {contentElement: '#tip', infotip: true}">
      <div>Hover for infoTip</div>
    </div>
    <div style="display: none">
      <div id="tip">
        <div>Tooltip only allows one time binding of with contentElement:</div>
        <div data-bind="text: toolTipContent"></div>
      </div>
    </div>
