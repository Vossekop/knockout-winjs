/// <reference path="typings/winjs/winjs.d.ts" />
/*!
* knockout-winjs
*
* Copyright 2015 Jeroen Vos
* based on knockout-winjs by Josh Williams and other contributors
* Released under the MIT license
*/
module ConcreteCoding.KnockoutToWinJS {
    "use strict";

    export function addBindings(controls) {
        Object.keys(controls).forEach(function (name) {
            var controlConfiguration = controls[name];
            var ctor = WinJS.Utilities.getMember(name);
            var eventName = controlConfiguration.changeEvent;
            var changedProperty = controlConfiguration.changedProperty;
            var eventProcessor = controlConfiguration.eventProcessor;
            var propertyProcessor = controlConfiguration.propertyProcessor;
            var bindDescendants = controlConfiguration.bindDescendants || false;
            var bindingName = "win" + name.substr(name.lastIndexOf(".") + 1);
            var changeOverride = controlConfiguration.changeOverride;

            ko.bindingHandlers[bindingName] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {

                    // The options for the control
                    var value = valueAccessor();

                    // Options record for the WinJS Control
                    var options = {};

                    // Iterate over the observable properties to get their value
                    for (var property in value) {
                        // Don't parse properties starting with "on" since they are event handlers and should be treated differently.
                        if (value.hasOwnProperty(property) && (property.toString().substr(0, 2) != "on")) {
                            if (propertyProcessor && propertyProcessor[property] !== undefined) {
                                options[property] = propertyProcessor[property](value[property], function () { return element });
                            } else {
                                options[property] = ko.unwrap(value[property]);
                            }
                        }
                    }

                    // If the WinJS control depends on having child elements 
                    if (element.children.length > 0 && bindDescendants) {
                        // This is done synchronously
                        ko.applyBindingsToDescendants(bindingContext, element);
                    }
                     
                    // Create a new instance of the control with the element and options
                    var control = new ctor(element, options);

                    // After the control is created we can bind the event handlers.
                    for (var property in value) {
                        if (value.hasOwnProperty(property) && (property.toString().substr(0, 2) === "on")) {
                            if (eventProcessor && eventProcessor[property] !== undefined) {
                                control[property] = (eventInfo) => {
                                    eventProcessor[property](value["on" + eventInfo.type], viewModel, eventInfo);
                                };
                            } else {
                                control[property] = (eventInfo) => {
                                    // Must use eventInfo.type here because 'property' will
                                    // be changed by the time the actual event is fired.
                                    value["on" + eventInfo.type].bind(viewModel, viewModel, eventInfo)();
                                };
                            }
                        }
                    }

                    handleChangeEvents(eventName, changedProperty, control, value, changeOverride);

                    // Add disposal callback to dispose the WinJS control when it's not needed anymore
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function (e) {
                        if (element.winControl) {
                            element.winControl.dispose();
                        }
                    });

                    return { controlsDescendantBindings: bindDescendants };
                },

                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // Get the WinJS control 
                    var control = element.winControl;
                    var value = valueAccessor();

                    // Only update the control properties that are different with the unpacked value
                    for (var property in value) {
                        if (value.hasOwnProperty(property)) {
                            if (property.toString().substr(0, 2) != "on") {
                                var unwrappedValue = ko.unwrap(value[property]);
                                if (control[property] !== unwrappedValue) {
                                    if (propertyProcessor && propertyProcessor[property] !== undefined) {
                                        var returnValue = propertyProcessor[property](value[property],
                                            function () { return element }, control[property]);
                                        if (returnValue !== null) {
                                            control[property] = returnValue;
                                        }

                                    } else {
                                        control[property] = unwrappedValue;
                                    }
                                }
                            }
                            else {
                                // I think we are fine here if we just override the
                                // event handler even if it may not have changed at all.
                                if (eventProcessor && eventProcessor[property] !== undefined) {
                                    control[property] = (eventInfo) => {
                                        eventProcessor[property](value["on" + eventInfo.type], viewModel, eventInfo);
                                    };
                                } else {
                                    control[property] = (eventInfo) => {
                                        value["on" + eventInfo.type].bind(viewModel, viewModel, eventInfo)();
                                    };
                                }
                            }
                        }
                    }

                    handleChangeEvents(eventName, changedProperty, control, value, changeOverride);
                }
            }
        });
    }

    export function handleChangeEvents(eventName: string, changedProperty: string, control: any, value: any, changeOverride?: any) {
        // Add event handler that will kick off changes to the observable values
        // For most controls this is the "change" event
        if (eventName) {
            // If the change event is already bound we wrap the current handler with our update routine.
            var currentEventHandler = null;
            if (control[eventName]) {
                currentEventHandler = control[eventName];
            }

            control[eventName] = (eventInfo) => {
                if (value.hasOwnProperty(changedProperty)) {
                    // Determine if that value is a writableObservable property
                    if (ko.isWriteableObservable(value[changedProperty])) {
                        if (changeOverride) {
                            value[changedProperty](changeOverride(value[changedProperty](), control[changedProperty]));
                        } else {
                            // Kickoff updates 
                            value[changedProperty](control[changedProperty]);
                        }
                    }
                }

                if (currentEventHandler) {
                    currentEventHandler(eventInfo);
                }
            };
        }
    }

    // Helper for adding and remove click handlers between two elements
    export function addRemoveClickHandlers(anchor, oldAnchor, sourceElement) {
        var retVal = null;
        var value = ko.unwrap(anchor);
        var element = <any>document.querySelector(value);

        var sourceElement = sourceElement();

        if (!oldAnchor || value !== sourceElement.dataset['cachedAnchor']) {
            var showMenu = function (e) {
                sourceElement.winControl.show();
            };
            element._handler = showMenu;
            element.addEventListener("click", element._handler);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function (e) {
                element.removeEventListener("click", element._handler);
            });

            if (oldAnchor) {
                oldAnchor.removeEventListener("click", oldAnchor._handler);
            }

            sourceElement.dataset['cachedAnchor'] = value;
            retVal = element;
        }

        return retVal;
    }

    // Helper for differencing between an observable array and binding list
    export function bindingListWatch(value, oldValue, sourceElement) {
        var unpacked = ko.unwrap(value);
        // Will create a bindingList once
        var retVal = null;
        if (!oldValue || oldValue.referenceId !== value.referenceId) {
            var bindingList = new WinJS.Binding.List(unpacked);

            // We do the following to make sure that if the control's data binding gets entirely reapplied
            // and another observable array is bound, we have to recreate the dataSource for the control.
            (<any>bindingList.dataSource).referenceId = Math.random().toString();
            value.referenceId = (<any>bindingList.dataSource).referenceId;

            value.subscribe((newValue) => {
                var indexOffset = 0;
                for (var i = 0, len = newValue.length; i < len; i++) {
                    var item = newValue[i];
                    switch (item.status) {
                        case "deleted":
                            bindingList.splice(item.index + indexOffset, 1);
                            indexOffset--;
                            break;
                        case "added":
                            if (item.index === len) {
                                indexOffset++;
                                bindingList.push(item.value);
                            } else if (item.index === 0) {
                                indexOffset++;
                                bindingList.unshift(item.value);
                            } else {
                                indexOffset++;
                                bindingList.push(item.value)
                                bindingList.move(value().length - 1, item.index);
                            }
                            break;
                    }
                }
            }, this, "arrayChange");

            retVal = bindingList.dataSource;
        }

        return retVal;
    }

    // Helper for itemTemplate changes
    export function itemTemplateWatch(value, oldValue, sourceElement) {
        var retVal = null;
        var template = ko.unwrap(value);
        var sourceElement = sourceElement();
        var context = ko.contextFor(sourceElement);

        // @TODO: add support for wiring up item disposal to binding cleanup
        var renderer = (<any>WinJS.UI).simpleItemRenderer((item) => {
            var element = document.createElement("div");
            var childContext = context.createChildContext(item.data);
            
            // If we apply the bindings to this element which will contain the actual template
            // it will make it easier for us to retrieve the bound data when an item is clicked.
            ko.applyBindings(childContext, element);
            ko.renderTemplate(template, childContext, {}, element);
            return element;
        });

        if (!oldValue || template !== sourceElement.dataset['lastTemplate']) {
            sourceElement.dataset['lastTemplate'] = template;
            retVal = renderer;
        }

        return retVal;
    }

    export var controls = {
        "WinJS.UI.AppBar": {
            bindDescendants: true
        },
        "WinJS.UI.AppBarCommand": {},
        "WinJS.UI.BackButton": {},
        "WinJS.UI.DatePicker": {
            changeEvent: "onchange",
            changedProperty: "current",
            changeOverride: (currentValue: Date, newValue: Date): Date => {
                var hours = 0;
                var minutes = 0;
                var seconds = 0;
                var milliseconds = 0;
                if (currentValue) {
                    hours = currentValue.getHours();
                    minutes = currentValue.getMinutes();
                    seconds = currentValue.getSeconds();
                    milliseconds = currentValue.getMilliseconds();
                }
                if (newValue) {
                    newValue.setHours(hours);
                    newValue.setMinutes(minutes);
                    newValue.setSeconds(seconds);
                    newValue.setMilliseconds(milliseconds);
                }
                return newValue;
            }
        },
        "WinJS.UI.FlipView": {
            propertyProcessor: {
                'itemTemplate': (value, flipViewElement, update) => {
                    return itemTemplateWatch(value, update, flipViewElement);
                },
                'itemDataSource': (value, flipViewElement, update) => {
                    return bindingListWatch(value, update, flipViewElement);
                }
            },
            bindDescendants: true
        },
        "WinJS.UI.Flyout": {
            propertyProcessor: {
                'anchor': (value, flyoutElement, oldAnchor) => {
                    return addRemoveClickHandlers(value, oldAnchor, flyoutElement);
                }
            }
        },
        "WinJS.UI.Hub": {
            bindDescendants: true
        },
        "WinJS.UI.HubSection": {},
        "WinJS.UI.ItemContainer": {
            changeEvent: "onselectionchanged",
            changedProperty: "selected"
        },
        "WinJS.UI.ListView": {
            changeEvent: "onselectionchanged",
            changedProperty: "selection",
            propertyProcessor: {
                'itemTemplate': (value, listViewElement, update) => {
                    return itemTemplateWatch(value, update, listViewElement);
                },
                'itemDataSource': (value, listViewElement, update) => {
                    return bindingListWatch(value, update, listViewElement);
                },
                'layout': function (value, listViewElement, update) {
                    var retVal = null;
                    var unpacked = ko.unwrap(value);
                    var listViewElement = listViewElement();
                    var layout = (unpacked.type) ? new unpacked.type(unpacked) : unpacked;

                    if (!update || '' + layout !== listViewElement.dataset['cachedLayout']) {
                        retVal = layout;
                        listViewElement.dataset['cachedLayout'] = '' + layout;
                    }

                    return retVal;
                }
            },
            eventProcessor: {
                'oniteminvoked': (handler, viewModel, eventInfo) => {
                    // The srcElement will be a win-item-container with one child
                    // (the div we created in our template handler).
                    if (eventInfo.srcElement.children.length > 0) {
                        var data = ko.dataFor(eventInfo.srcElement.children[0]);
                        handler.bind(viewModel, data, eventInfo)();
                    }
                }
            },
            bindDescendants: true
        },
        "WinJS.UI.Menu": {
            propertyProcessor: {
                'anchor': function (value, menuElement, oldAnchor) {
                    return addRemoveClickHandlers(value, oldAnchor, menuElement);
                }
            },
            bindDescendants: true
        },
        "WinJS.UI.MenuCommand": {},
        "WinJS.UI.NavBar": {},
        "WinJS.UI.NavBarCommand": {},
        "WinJS.UI.NavBarContainer": {},
        "WinJS.UI.Rating": {
            changeEvent: "onchange",
            changedProperty: "userRating"
        },
        "WinJS.UI.SearchBox": {
            changeEvent: "onquerychanged",
            changedProperty: "queryText"
        },
        // @TODO: Semantic Zoom
        "WinJS.UI.TimePicker": {
            changeEvent: "onchange",
            changedProperty: "current",
            changeOverride: (currentValue: Date, newValue: Date): Date => {
                var hours = 0;
                var minutes = 0;
                var seconds = 0;
                var milliseconds = 0;
                if (newValue) {
                    hours = newValue.getHours();
                    minutes = newValue.getMinutes();
                    seconds = newValue.getSeconds();
                    milliseconds = newValue.getMilliseconds();
                }
                if (currentValue) {
                    currentValue.setHours(hours);
                    currentValue.setMinutes(minutes);
                    currentValue.setSeconds(seconds);
                    currentValue.setMilliseconds(milliseconds);
                    return currentValue;
                } else {
                    return newValue;
                }             
            }
        },
        "WinJS.UI.ToggleSwitch": {
            changeEvent: "onchange",
            changedProperty: "checked"
        },
        // @TODO: Determine a better way to update Tooltip
        "WinJS.UI.Tooltip": {
            propertyProcessor: {
                'contentElement': function (value, toolTipElement, update) {
                    var value = ko.unwrap(value);
                    var element = document.querySelector(value);
                    return element;
                }
            }

        }
    };
}

(function () {
    WinJS.Application.addEventListener("ready",(eventInfo) => {
        ConcreteCoding.KnockoutToWinJS.addBindings(ConcreteCoding.KnockoutToWinJS.controls);
    });
})();