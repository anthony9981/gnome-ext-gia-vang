
const St = imports.gi.St;
const Main = imports.ui.main;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;

const GV_URL = 'https://service.baomoi.com/gold.json';
const GV_REFERER = 'https://baomoi.com/';

let _httpSession;
const GiaVangIndicator = new GObject.registerClass(
	class GiaVangIndicator extends PanelMenu.Button {

	_init () {
		super._init(St.Align.START);

		//this.parent(0.0, 'Giá Vàng', false);
		this.buttonText = new St.Label({
			text: _('Loading...'),
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add_actor(this.buttonText);
		this._refresh();
	}

	_refresh() {
		this._loadData(this._refreshUI);
		this._removeTimeout();
		this._timeout = Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refresh));
		return true;
	}

	_loadData() {
		let params = {};
		_httpSession = new Soup.Session();
		let message = Soup.form_request_new_from_hash('GET', GV_URL, params);
		message.request_headers.append('Referer', GV_REFERER);
		_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
			
			if (message.status_code !== 200)
				return;
			let json = JSON.parse(message.response_body.data); // change this
			this._refreshUI(json);
		}));
	}

	_refreshUI(data) {
		for (var i = 0; i < data.length; i++) {
			if (data[i].CityName.toString() === 'Hà Nội') {
				let rate = data[i].GoldRateInfo[0];
				let buy = this._format(rate.Buy.toString(), 0);
				let sell = this._format(rate.Sell.toString(), 0);
				let txt = '[' + data[i].CityName.toString() + ' ' + rate.GoldName.toString() + '] ' + 'Mua: ' + buy + ' Bán: ' + sell;
				this.buttonText.set_text(txt);
				break;
			}
		}
	}


	_removeTimeout() {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}


	stop () {
		if (_httpSession !== undefined) {
			_httpSession.abort();
		}
		_httpSession = undefined;

		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
		}
		this._timeout = undefined;

		this.menu.removeAll();
	}

	_format(amount, decimalCount = 2, decimal = ".", thousands = ",") {
		try {
		  decimalCount = Math.abs(decimalCount);
		  decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
	  
		  const negativeSign = amount < 0 ? "-" : "";
	  
		  let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
		  let j = (i.length > 3) ? i.length % 3 : 0;
	  
		  return negativeSign + (j ? i.substring(0, j) + thousands : '') + i.substring(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
		} catch (e) {
		  global.log(e)
		}
	  }
});

let gvMenu;

function init() {}
function enable() {
	gvMenu = new GiaVangIndicator;
	
	Main.panel.addToStatusArea('gv-indicator', gvMenu);
}
function disable() {
	gvMenu.stop();
	gvMenu.destroy();
}
