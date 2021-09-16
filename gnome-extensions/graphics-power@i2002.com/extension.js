/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const PowerDaemon = Gio.DBusProxy.makeProxyWrapper('<node>\
  <interface name="com.system76.PowerDaemon">\
    <method name="Performance"/>\
    <method name="Balanced"/>\
    <method name="Battery"/>\
    <method name="GetProfile">\
        <arg name="profile" type="s" direction="out"/>\
    </method>\
    <method name="GetGraphics">\
      <arg name="vendor" type="s" direction="out"/>\
    </method>\
    <method name="SetGraphics">\
      <arg name="vendor" type="s" direction="in"/>\
    </method>\
    <method name="GetSwitchable">\
      <arg name="switchable" type="b" direction="out"/>\
    </method>\
    <method name="GetGraphicsPower">\
      <arg name="power" type="b" direction="out"/>\
    </method>\
    <method name="SetGraphicsPower">\
      <arg name="power" type="b" direction="in"/>\
    </method>\
    <method name="AutoGraphicsPower"/>\
    <signal name="HotPlugDetect">\
      <arg name="port" type="t"/>\
    </signal>\
    <signal name="PowerProfileSwitch">\
      <arg name="profile" type="s"/>\
    </signal>\
  </interface>\
</node>');

var PopupGraphicsMenuItem = GObject.registerClass(class PopupGraphicsMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(title, text, params) {
        super._init(params);
        this.box = new St.BoxLayout({ vertical: true });
        this.label = new St.Label({
            style_class: "pop-menu-title",
            text: title,
        });
        this.description = new St.Label({
            style_class: "pop-menu-description",
            text: "",
        });
        if (text != null) {
            this.description.text = text;
        }
        else {
            this.description.hide();
        }
        this.box.add(this.label);
        this.box.add(this.description);
        this.actor.add(this.box);
        this.actor.label_actor = this.box;
    }
});

class Extension {
    constructor() {
     
    }

    enable() {
        // setup connection
        this.bus = new PowerDaemon(Gio.DBus.system, 'com.system76.PowerDaemon', '/com/system76/PowerDaemon');
        this.bus.set_default_timeout(300000);
        
        // query data
        let graphics = this.bus.GetGraphicsSync();
        let power = this.bus.GetGraphicsPowerSync() ? "on" : "off";
        
        // parse graphics
        let graphics_text = null;

        if(graphics == "hybrid")
            graphics_text = "hybrid";
        else if(graphics == "integrated")
            graphics_text = "integrated";
        else
            graphics_text = "error";
        
        // generate label
        let label = `${graphics}; power ${power}`;
        
        // update view
        this.power_menu = Main.panel.statusArea['aggregateMenu']._power._item.menu;
        this.separator = new PopupMenu.PopupSeparatorMenuItem();
        this.power_menu.addMenuItem(this.separator);

        this.menu_item = new PopupGraphicsMenuItem(label);
        this.menu_item.setting = false;
        this.power_menu.addMenuItem(this.menu_item);
    }

    disable() {
        this.menu_item.destroy();
        this.menu_item = null;
    }
}

function init() {
    return new Extension();
}
