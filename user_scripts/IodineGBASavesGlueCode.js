"use strict";
/*
 * This file is part of IodineGBA
 *
 * Copyright (C) 2012-2013 Grant Galitz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */
function ImportSaveCallback(name) {
    try {
        var save = findValue("SAVE_" + name);
        if (save != null) {
            writeRedTemporaryText("Loaded save.");
            return base64ToArray(save);
        }
    }
    catch (error) {
        alert("Could not read save: " + error.message);
    }
    return null;
}
function ExportSave() {
    Iodine.exportSave();
}
function ExportSaveCallback(name, save) {
    if (name != "") {
        try {
            setValue("SAVE_" + name, arrayToBase64(save));
        }
        catch (error) {
            alert("Could not store save: " + error.message);
        }
    }
}
function registerSaveHandlers() {
    Iodine.attachSaveExportHandler(ExportSaveCallback);
    Iodine.attachSaveImportHandler(ImportSaveCallback);
}
//Wrapper for localStorage getItem, so that data can be retrieved in various types.
function findValue(key) {
    try {
        if (window.localStorage.getItem(key) != null) {
            return JSON.parse(window.localStorage.getItem(key));
        }
    }
    catch (error) {
        //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
        if (window.globalStorage[location.hostname].getItem(key) != null) {
            return JSON.parse(window.globalStorage[location.hostname].getItem(key));
        }
    }
    return null;
}
//Wrapper for localStorage setItem, so that data can be set in various types.
function setValue(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
        window.globalStorage[location.hostname].setItem(key, JSON.stringify(value));
    }
}
//Wrapper for localStorage removeItem, so that data can be set in various types.
function deleteValue(key) {
    try {
        window.localStorage.removeItem(key);
    }
    catch (error) {
        //An older Gecko 1.8.1/1.9.0 method of storage (Deprecated due to the obvious security hole):
        window.globalStorage[location.hostname].removeItem(key);
    }
}