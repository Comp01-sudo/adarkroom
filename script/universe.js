/**
 * Module that registers the simple room functionality
 */
var Universe = {
  // times in (minutes * seconds * milliseconds)
	_Engine_MOVE_DELAY: 5 * 1000, // time after a stoke before the fire cools
	_SHAKE_DELAY: 30 * 1000, // time between room temperature updates
	buttons: {},
	Craftables: {
		'shuttle': {
			name: _('shuttle'),
			button: null,
			availableMsg: _('builder thinks there are other planets and stars out there. Need shuttles'),
			buildMsg: _('The roar of the engines are deafening. Let\'s get this outside.'),
			type: 'Ubuilding',
			cost: function () {
				var n = $SM.get('game.buildings["trap"]', true);
				return {
					'steel': 10 + (n * 10)
				};
			},
		},
		'storage room': {
			name: _('storage room'),
			button: null,
			availableMsg: _('Going to need storage to hold everything you\'re bringing in'),
			buildMsg: _('More storage = more pull in the world'),
			type: 'Ubuilding',
			cost: function () {
				return {
					'steel': 30
				};
			},
		},
		'addition': {
			name: _('addition'),
			button: null,
			availableMsg: _("builder says there are more wanderers. says we need space."),
			buildMsg: _('builder adds a part to the outside of the space station'),
			type: 'Ubuilding',
			cost: function () {
				var n = $SM.get('game.buildings["hut"]', true);
				return {
					'steel': 100 + (n * 50),
          'cloth': 10 + (n * 10),
				};
			},
		},
		'ambassador': {
			name: _('ambassador'),
			button: null,
			maximum: 1,
			availableMsg: _("an  ambassador would make commerce easier to and from other planets"),
			buildMsg: _("now the others in the universe know you exist, you'll be able to get trade"),
			type: 'Ubuilding',
			cost: function () {
				return {
					'meat': 400,
					'cloth': 100
				};
			},
		},
		'headlights': {
			name: _('headlights'),
			button: null,
			type: 'Utool',
			buildMsg: _(''),
			cost: function () {
				return {
					'glass': 1,
					'energy cell': 1
				};
			},
		},
		'water tank': {
			name: _('water tank'),
			button: null,
			type: 'Uupgrade',
			maximum: 1,
			buildMsg: _('this\'ll hold a bit of water, at least enough to get to the nearest planet'),
			cost: function () {
				return {
					'steel': 50
				};
			},
		},
		'shuttle hold': {
			name: _('shuttle hold'),
			button: null,
			type: 'Uupgrade',
			maximum: 1,
			buildMsg: _('carrying more means longer expeditions to the outer reaches.'),
			cost: function () {
				return {
					'steel': 200
				};
			},
    },
		'fleet': {
			name: _('convoy'),
			button: null,
			type: 'upgrade',
			maximum: 1,
			buildMsg: _('the convoy can haul mostly everything'),
			cost: function () {
				return {
					'shuttle': 10,
					'iron': 200,
					'steel': 100
				};
			},
		},
	TradeGoods: {
		'scales': {
			type: 'good',
			cost: function () {
				return { fur: 150 };
			},
			audio: AudioLibrary.BUY_SCALES
		},
		'teeth': {
			type: 'good',
			cost: function () {
				return { fur: 300 };
			},
			audio: AudioLibrary.BUY_TEETH
		},
		'iron': {
			type: 'good',
			cost: function () {
				return {
					'fur': 150,
					'scales': 50
				};
			},
			audio: AudioLibrary.BUY_IRON
		},
		'coal': {
			type: 'good',
			cost: function () {
				return {
					'fur': 200,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_COAL
		},
		'steel': {
			type: 'good',
			cost: function () {
				return {
					'fur': 300,
					'scales': 50,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_STEEL
		},
		'medicine': {
			type: 'good',
			cost: function () {
				return {
					'scales': 50, 'teeth': 30
				};
			},
			audio: AudioLibrary.BUY_MEDICINE
		},
		'bullets': {
			type: 'good',
			cost: function () {
				return {
					'scales': 10
				};
			},
			audio: AudioLibrary.BUY_BULLETS
		},
		'energy cell': {
			type: 'good',
			cost: function () {
				return {
					'scales': 10,
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_ENERGY_CELL
		},
		'bolas': {
			type: 'weapon',
			cost: function () {
				return {
					'teeth': 10
				};
			},
			audio: AudioLibrary.BUY_BOLAS
		},
		'grenade': {
			type: 'weapon',
			cost: function () {
				return {
					'scales': 100,
					'teeth': 50
				};
			},
			audio: AudioLibrary.BUY_GRENADES
		},
		'bayonet': {
			type: 'weapon',
			cost: function () {
				return {
					'scales': 500,
					'teeth': 250
				};
			},
			audio: AudioLibrary.BUY_BAYONET
		},
		'alien alloy': {
			type: 'good',
			cost: function () {
				return {
					'fur': 1500,
					'scales': 750,
					'teeth': 300
				};
			},
			audio: AudioLibrary.BUY_ALIEN_ALLOY
		},
		'galactic map': {
			type: 'special',
			maximum: 1,
			cost: function () {
				return {
					fur: 400,
					scales: 20,
					teeth: 10
				};
			},
			audio: AudioLibrary.BUY_COMPASS
		}
        },
                
	name: _("Universe"),
	init: function (options) {
		this.options = $.extend(
			this.options,
			options
		);

		Room.pathDiscovery = Boolean($SM.get('stores["compass"]'));

		if (Engine._debug) {
			this._ROOM_WARM_DELAY = 5000;
			this._BUILDER_STATE_DELAY = 5000;
			this._STOKE_COOLDOWN = 0;
			this._NEED_WOOD_DELAY = 5000;
		}

		if (typeof $SM.get('features.location.room') == 'undefined') {
			$SM.set('features.location.room', true);
			$SM.set('game.builder.level', -1);
		}

		// If this is the first time playing, the fire is dead and it's freezing. 
		// Otherwise grab past save state temp and fire level.
		$SM.set('game.temperature', $SM.get('game.temperature.value') === undefined ? this.TempEnum.fine : $SM.get('game.temperature'));
		$SM.set('game.fire', $SM.get('game.fire.value') === undefined ? this.FireEnum.fine : $SM.get('game.fire'));

		// Create the room tab
		this.tab = Header.addLocation(_("Center"), "", Universe);

		// Create the Room panel
		this.panel = $('<div>')
			.attr('id', "UPanel")
			.addClass('location')
			.appendTo('div#locationSlider');

		Engine.updateSlider();

		// Create the light button
		new Button.Button({
			id: 'EngineFire',
			text: _('Fire Thrusters'),
			click: Room.lightFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: { 'coal': 5 }
		}).appendTo('div#roomPanel');

		// Create the stoke button
		new Button.Button({
			id: 'moveButton',
			text: _("Keep Orbit"),
			click: Room.stokeFire,
			cooldown: Room._STOKE_COOLDOWN,
			width: '80px',
			cost: { 'coal': 1 }
		}).appendTo('div#roomPanel');

		// Create the stores container
		$('<div>').attr('id', 'storesContainer').prependTo('div#roomPanel');

		//subscribe to stateUpdates
		$.Dispatch('stateUpdate').subscribe(Room.handleStateUpdates);

		Room.updateButton();
		Room.updateStoresView();
		Room.updateIncomeView();
		Room.updateBuildButtons();

		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._SHAKE_DELAY);
	},

	options: {}, // Nothing for now

	onArrival: function (transition_diff) {
		Room.setTitle();
		if (Room.changed) {
			Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text));
			Notifications.notify(Room, _("the room is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text));
			Room.changed = false;
		}
		if ($SM.get('game.builder.level') == 3) {
			$SM.add('game.builder.level', 1);
			$SM.setIncome('builder', {
				delay: 10,
				stores: { 'coal': 2 }
			});
			Room.updateIncomeView();
			Notifications.notify(Room, _("builder realizes you need coal to keep this up and running."));
		}

		Engine.moveStoresView(null, transition_diff);
		
		Room.setMusic();
	},

	TempEnum: {
		fromInt: function (value) {
			for (var k in this) {
				if (typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		gameover: { value: 0, text: _('You fall to the nearest planet, everyone dead.') },
		terminal: { value: 1, text: _('terminal') },
		falling: { value: 2, text: _('falling') },
		shifting: { value: 3, text: _('shifting') },
		Fine: { value: 4, text: _('fine') }
	},

	FireEnum: {
		fromInt: function (value) {
			for (var k in this) {
				if (typeof this[k].value != 'undefined' && this[k].value == value) {
					return this[k];
				}
			}
			return null;
		},
		Gameover: { value: 0, text: _('The world fades') },
		Terminal: { value: 1, text: _('terminal') },
		Falling: { value: 2, text: _('falling') },
		Shifting: { value: 3, text: _('shifting') },
		Fine: { value: 4, text: _('fine') }
	},

	setTitle: function () {
		var title = $SM.get('game.fire.value') < 2 ? _("A Shaking Space Station") : _("A Space Station");
		if (Engine.activeModule == this) {
			document.title = title;
		}
		$('div#location_room').text(title);
	},

	updateButton: function () {
		var light = $('#lightButton.button');
		var stoke = $('#stokeButton.button');
		if ($SM.get('game.fire.value') == Room.FireEnum.Dead.value && stoke.css('display') != 'none') {
			stoke.hide();
			light.show();
			if (stoke.hasClass('disabled')) {
				Button.cooldown(light);
			}
		} else if (light.css('display') != 'none') {
			stoke.show();
			light.hide();
			if (light.hasClass('disabled')) {
				Button.cooldown(stoke);
			}
		}

		if (!$SM.get('stores.wood')) {
			light.addClass('free');
			stoke.addClass('free');
		} else {
			light.removeClass('free');
			stoke.removeClass('free');
		}
	},

	_fireTimer: null,
	_tempTimer: null,
	lightFire: function () {
		var coal = $SM.get('stores.coal');
		if (coal < 5) {
			Notifications.notify(Room, _("not enough coal to get the engines going"));
			Button.clearCooldown($('#lightButton.button'));
			return;
		} else if (coal > 4) {
			$SM.set('stores.coal', coal - 5);
		}
		$SM.set('game.fire', Room.FireEnum.Shifting);
		AudioEngine.playSound(AudioLibrary.LIGHT_FIRE);
		Room.onFireChange();
	},

	stokeFire: function () {
		var wood = $SM.get('stores.wood');
		if (wood === 0) {
			Notifications.notify(Room, _("the coal has run out"));
			Button.clearCooldown($('#stokeButton.button'));
			return;
		}
		if (wood > 0) {
			$SM.set('stores.wood', wood - 1);
		}
		if ($SM.get('game.fire.value') < 4) {
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		AudioEngine.playSound(AudioLibrary.STOKE_FIRE);
		Room.onFireChange();
	},

	onFireChange: function () {
		if (Engine.activeModule != Room) {
			Room.changed = true;
		}
		Notifications.notify(Room, _("the fire is {0}", Room.FireEnum.fromInt($SM.get('game.fire.value')).text), true);
		if ($SM.get('game.fire.value') > 1 && $SM.get('game.builder.level') < 0) {
			$SM.set('game.builder.level', 0);
			Notifications.notify(Room, _("the light from the fire spills from the windows, out into the dark"));
			Engine.setTimeout(Room.updateBuilderState, Room._BUILDER_STATE_DELAY);
		}
		window.clearTimeout(Room._fireTimer);
		Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
		Room.updateButton();
		Room.setTitle();

		// only update music if in the room
		if (Engine.activeModule == Room) {
			Room.setMusic();
		}
	},

	coolFire: function () {
		var wood = $SM.get('stores.wood');
		if ($SM.get('game.fire.value') <= Room.FireEnum.Flickering.value &&
			$SM.get('game.builder.level') > 3 && wood > 0) {
			Notifications.notify(Room, _("builder stokes the fire"), true);
			$SM.set('stores.wood', wood - 1);
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') + 1));
		}
		if ($SM.get('game.fire.value') > 0) {
			$SM.set('game.fire', Room.FireEnum.fromInt($SM.get('game.fire.value') - 1));
			Room._fireTimer = Engine.setTimeout(Room.coolFire, Room._FIRE_COOL_DELAY);
			Room.onFireChange();
		}
	},

	adjustTemp: function () {
		var old = $SM.get('game.temperature.value');
		if ($SM.get('game.temperature.value') > 0 && $SM.get('game.temperature.value') > $SM.get('game.fire.value')) {
			$SM.set('game.temperature', Room.TempEnum.fromInt($SM.get('game.temperature.value') - 1));
			Notifications.notify(Room, _("The ship is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if ($SM.get('game.temperature.value') < 4 && $SM.get('game.temperature.value') < $SM.get('game.fire.value')) {
			$SM.set('game.temperature', Room.TempEnum.fromInt($SM.get('game.temperature.value') + 1));
			Notifications.notify(Room, _("the ship is {0}", Room.TempEnum.fromInt($SM.get('game.temperature.value')).text), true);
		}
		if ($SM.get('game.temperature.value') != old) {
			Room.changed = true;
		}
		Room._tempTimer = Engine.setTimeout(Room.adjustTemp, Room._ROOM_WARM_DELAY);
	},
	updateBuilderState: function () {
		Engine.saveGame();
	},

	updateStoresView: function () {
		var stores = $('div#stores');
		var resources = $('div#resources');
		var special = $('div#special');
		var weapons = $('div#weapons');
		var needsAppend = false, rNeedsAppend = false, sNeedsAppend = false, wNeedsAppend = false, newRow = false;
		if (stores.length === 0) {
			stores = $('<div>').attr({
				'id': 'stores',
				'data-legend': _('stores')
			}).css('opacity', 0);
			needsAppend = true;
		}
		if (resources.length === 0) {
			resources = $('<div>').attr({
				id: 'resources'
			}).css('opacity', 0);
			rNeedsAppend = true;
		}
		if (special.length === 0) {
			special = $('<div>').attr({
				id: 'special'
			}).css('opacity', 0);
			sNeedsAppend = true;
		}
		if (weapons.length === 0) {
			weapons = $('<div>').attr({
				'id': 'weapons',
				'data-legend': _('weapons')
			}).css('opacity', 0);
			wNeedsAppend = true;
		}
		for (var k in $SM.get('stores')) {

			var type = null;
			if (Room.Craftables[k]) {
				type = Room.Craftables[k].type;
			} else if (Room.TradeGoods[k]) {
				type = Room.TradeGoods[k].type;
			} else if (Room.MiscItems[k]) {
				type = Room.MiscItems[k].type;
			}

			var location;
			switch (type) {
				case 'upgrade':
					// Don't display upgrades on the Room screen
					continue;
				case 'building':
					// Don't display buildings either
					continue;
				case 'weapon':
					location = weapons;
					break;
				case 'special':
					location = special;
					break;
				default:
					location = resources;
					break;
			}

			var id = "row_" + k.replace(' ', '-');
			var row = $('div#' + id, location);
			var num = $SM.get('stores["' + k + '"]');

			if (typeof num != 'number' || isNaN(num)) {
				// No idea how counts get corrupted, but I have reason to believe that they occassionally do.
				// Build a little fence around it!
				num = 0;
				$SM.set('stores["' + k + '"]', 0);
			}

			var lk = _(k);

			// thieves?
			if (typeof $SM.get('game.thieves') == 'undefined' && num > 5000 && $SM.get('features.location.world')) {
				$SM.startThieves();
			}

			if (row.length === 0) {
				row = $('<div>').attr('id', id).addClass('storeRow');
				$('<div>').addClass('row_key').text(lk).appendTo(row);
				$('<div>').addClass('row_val').text(Math.floor(num)).appendTo(row);
				$('<div>').addClass('clear').appendTo(row);
				var curPrev = null;
				location.children().each(function (i) {
					var child = $(this);
					var cName = child.children('.row_key').text();
					if (cName < lk) {
						curPrev = child.attr('id');
					}
				});
				if (curPrev == null) {
					row.prependTo(location);
				} else {
					row.insertAfter(location.find('#' + curPrev));
				}
				newRow = true;
			} else {
				$('div#' + row.attr('id') + ' > div.row_val', location).text(Math.floor(num));
			}
		}

		if (rNeedsAppend && resources.children().length > 0) {
			resources.prependTo(stores);
			resources.animate({ opacity: 1 }, 300, 'linear');
		}

		if (sNeedsAppend && special.children().length > 0) {
			special.appendTo(stores);
			special.animate({ opacity: 1 }, 300, 'linear');
		}

		if (needsAppend && stores.find('div.storeRow').length > 0) {
			stores.appendTo('div#storesContainer');
			stores.animate({ opacity: 1 }, 300, 'linear');
		}

		if (wNeedsAppend && weapons.children().length > 0) {
			weapons.appendTo('div#storesContainer');
			weapons.animate({ opacity: 1 }, 300, 'linear');
		}

		if (newRow) {
			Room.updateIncomeView();
		}

		if ($("div#outsidePanel").length) {
			Outside.updateVillage();
		}

		if ($SM.get('stores.compass') && !Room.pathDiscovery) {
			Room.pathDiscovery = true;
			Path.openPath();
		}
	},

	updateIncomeView: function () {
		var stores = $('div#resources');
		var totalIncome = {};
		if (stores.length === 0 || typeof $SM.get('income') == 'undefined') return;
		$('div.storeRow', stores).each(function (index, el) {
			el = $(el);
			$('div.tooltip', el).remove();
			var ttPos = index > 10 ? 'top right' : 'bottom right';
			var tt = $('<div>').addClass('tooltip ' + ttPos);
			var storeName = el.attr('id').substring(4).replace('-', ' ');
			for (var incomeSource in $SM.get('income')) {
				var income = $SM.get('income["' + incomeSource + '"]');
				for (var store in income.stores) {
					if (store == storeName && income.stores[store] !== 0) {
						$('<div>').addClass('row_key').text(_(incomeSource)).appendTo(tt);
						$('<div>')
							.addClass('row_val')
							.text(Engine.getIncomeMsg(income.stores[store], income.delay))
							.appendTo(tt);
						if (!totalIncome[store] || totalIncome[store].income === undefined) {
							totalIncome[store] = { income: 0 };
						}
						totalIncome[store].income += Number(income.stores[store]);
						totalIncome[store].delay = income.delay;
					}
				}
			}
			if (tt.children().length > 0) {
				var total = totalIncome[storeName].income;
				$('<div>').addClass('total row_key').text(_('total')).appendTo(tt);
				$('<div>').addClass('total row_val').text(Engine.getIncomeMsg(total, totalIncome[storeName].delay)).appendTo(tt);
				tt.appendTo(el);
			}
		});
	},

	buy: function (buyBtn) {
		var thing = $(buyBtn).attr('buildThing');
		var good = Room.TradeGoods[thing];
		var numThings = $SM.get('stores["' + thing + '"]', true);
		if (numThings < 0) numThings = 0;
		if (good.maximum <= numThings) {
			return;
		}

		var storeMod = {};
		var cost = good.cost();
		for (var k in cost) {
			var have = $SM.get('stores["' + k + '"]', true);
			if (have < cost[k]) {
				Notifications.notify(Room, _("not enough " + k));
				return false;
			} else {
				storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);

		Notifications.notify(Room, good.buildMsg);

		$SM.add('stores["' + thing + '"]', 1);

		// audio
		AudioEngine.playSound(AudioLibrary.BUY);
	},

	build: function (buildBtn) {
		var thing = $(buildBtn).attr('buildThing');
		if ($SM.get('game.temperature.value') <= Room.TempEnum.Cold.value) {
			Notifications.notify(Room, _("builder just shivers"));
			return false;
		}
		var craftable = Room.Craftables[thing];

		var numThings = 0;
		switch (craftable.type) {
			case 'good':
			case 'weapon':
			case 'tool':
			case 'upgrade':
				numThings = $SM.get('stores["' + thing + '"]', true);
				break;
			case 'building':
				numThings = $SM.get('game.buildings["' + thing + '"]', true);
				break;
		}

		if (numThings < 0) numThings = 0;
		if (craftable.maximum <= numThings) {
			return;
		}

		var storeMod = {};
		var cost = craftable.cost();
		for (var k in cost) {
			var have = $SM.get('stores["' + k + '"]', true);
			if (have < cost[k]) {
				Notifications.notify(Room, _("not enough " + k));
				return false;
			} else {
				storeMod[k] = have - cost[k];
			}
		}
		$SM.setM('stores', storeMod);

		Notifications.notify(Room, craftable.buildMsg);

		switch (craftable.type) {
			case 'good':
			case 'weapon':
			case 'upgrade':
			case 'tool':
				$SM.add('stores["' + thing + '"]', 1);
				break;
			case 'building':
				$SM.add('game.buildings["' + thing + '"]', 1);
				break;
		}

		// audio
		switch (craftable.type) {
			case 'weapon':
			case 'upgrade':
			case 'tool':
				AudioEngine.playSound(AudioLibrary.CRAFT);
				break;
			case 'building':
				AudioEngine.playSound(AudioLibrary.BUILD);
				break;
		}
	},

	needsWorkshop: function (type) {
		return type == 'weapon' || type == 'upgrade' || type == 'tool';
	},

	craftUnlocked: function (thing) {
		if (Room.buttons[thing]) {
			return true;
		}
		if ($SM.get('game.builder.level') < 4) return false;
		var craftable = Room.Craftables[thing];
		if (Room.needsWorkshop(craftable.type) && $SM.get('game.buildings["' + 'workshop' + '"]', true) === 0) return false;
		var cost = craftable.cost();

		//show button if one has already been built
		if ($SM.get('game.buildings["' + thing + '"]') > 0) {
			Room.buttons[thing] = true;
			return true;
		}
		// Show buttons if we have at least 1/2 the wood, and all other components have been seen.
		if ($SM.get('stores.wood', true) < cost['wood'] * 0.5) {
			return false;
		}
		for (var c in cost) {
			if (!$SM.get('stores["' + c + '"]')) {
				return false;
			}
		}

		Room.buttons[thing] = true;
		//don't notify if it has already been built before
		if (!$SM.get('game.buildings["' + thing + '"]')) {
			Notifications.notify(Room, craftable.availableMsg);
		}
		return true;
	},

	buyUnlocked: function (thing) {
		if (Room.buttons[thing]) {
			return true;
		} else if ($SM.get('game.buildings["trading post"]', true) > 0) {
			if (thing == 'compass' || typeof $SM.get('stores["' + thing + '"]') != 'undefined') {
				// Allow the purchase of stuff once you've seen it
				return true;
			}
		}
		return false;
	},

	updateBuildButtons: function () {
		var buildSection = $('#buildBtns');
		var needsAppend = false;
		if (buildSection.length === 0) {
			buildSection = $('<div>').attr({ 'id': 'buildBtns', 'data-legend': _('build:') }).css('opacity', 0);
			needsAppend = true;
		}

		var craftSection = $('#craftBtns');
		var cNeedsAppend = false;
		if (craftSection.length === 0 && $SM.get('game.buildings["workshop"]', true) > 0) {
			craftSection = $('<div>').attr({ 'id': 'craftBtns', 'data-legend': _('craft:') }).css('opacity', 0);
			cNeedsAppend = true;
		}

		var buySection = $('#buyBtns');
		var bNeedsAppend = false;
		if (buySection.length === 0 && $SM.get('game.buildings["trading post"]', true) > 0) {
			buySection = $('<div>').attr({ 'id': 'buyBtns', 'data-legend': _('buy:') }).css('opacity', 0);
			bNeedsAppend = true;
		}

		for (var k in Room.Craftables) {
			craftable = Room.Craftables[k];
			var max = $SM.num(k, craftable) + 1 > craftable.maximum;
			if (craftable.button == null) {
				if (Room.craftUnlocked(k)) {
					var loc = Room.needsWorkshop(craftable.type) ? craftSection : buildSection;
					craftable.button = new Button.Button({
						id: 'build_' + k,
						cost: craftable.cost(),
						text: _(k),
						click: Room.build,
						width: '80px',
						ttPos: loc.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', k).appendTo(loc).animate({ opacity: 1 }, 300, 'linear');
				}
			} else {
				// refresh the tooltip
				var costTooltip = $('.tooltip', craftable.button);
				costTooltip.empty();
				var cost = craftable.cost();
				for (var c in cost) {
					$("<div>").addClass('row_key').text(_(c)).appendTo(costTooltip);
					$("<div>").addClass('row_val').text(cost[c]).appendTo(costTooltip);
				}
				if (max && !craftable.button.hasClass('disabled')) {
					Notifications.notify(Room, craftable.maxMsg);
				}
			}
			if (max) {
				Button.setDisabled(craftable.button, true);
			} else {
				Button.setDisabled(craftable.button, false);
			}
		}

		for (var g in Room.TradeGoods) {
			good = Room.TradeGoods[g];
			var goodsMax = $SM.num(g, good) + 1 > good.maximum;
			if (good.button == null) {
				if (Room.buyUnlocked(g)) {
					good.button = new Button.Button({
						id: 'build_' + g,
						cost: good.cost(),
						text: _(g),
						click: Room.buy,
						width: '80px',
						ttPos: buySection.children().length > 10 ? 'top right' : 'bottom right'
					}).css('opacity', 0).attr('buildThing', g).appendTo(buySection).animate({ opacity: 1 }, 300, 'linear');
				}
			} else {
				// refresh the tooltip
				var goodsCostTooltip = $('.tooltip', good.button);
				goodsCostTooltip.empty();
				var goodCost = good.cost();
				for (var gc in goodCost) {
					$("<div>").addClass('row_key').text(_(gc)).appendTo(goodsCostTooltip);
					$("<div>").addClass('row_val').text(goodCost[gc]).appendTo(goodsCostTooltip);
				}
				if (goodsMax && !good.button.hasClass('disabled')) {
					Notifications.notify(Room, good.maxMsg);
				}
			}
			if (goodsMax) {
				Button.setDisabled(good.button, true);
			} else {
				Button.setDisabled(good.button, false);
			}
		}

		if (needsAppend && buildSection.children().length > 0) {
			buildSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
		if (cNeedsAppend && craftSection.children().length > 0) {
			craftSection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
		if (bNeedsAppend && buildSection.children().length > 0) {
			buySection.appendTo('div#roomPanel').animate({ opacity: 1 }, 300, 'linear');
		}
	},

	compassTooltip: function (direction) {
		var ttPos = $('div#resources').children().length > 10 ? 'top right' : 'bottom right';
		var tt = $('<div>').addClass('tooltip ' + ttPos);
		$('<div>').addClass('row_key').text(_('the compass points ' + direction)).appendTo(tt);
		tt.appendTo($('#row_compass'));
	},

	handleStateUpdates: function (e) {
		if (e.category == 'stores') {
			Room.updateStoresView();
			Room.updateBuildButtons();
		} else if (e.category == 'income') {
			Room.updateStoresView();
			Room.updateIncomeView();
		} else if (e.stateName.indexOf('game.buildings') === 0) {
			Room.updateBuildButtons();
		}
	},

	setMusic() {
		// set music based on fire level
		var fireValue = $SM.get('game.fire.value');
		switch (fireValue) {
			case 0:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_DEAD);
				break;
			case 1:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_SMOLDERING);
				break;
			case 2:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_FLICKERING);
				break;
			case 3:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_BURNING);
				break;
			case 4:
				AudioEngine.playBackgroundMusic(AudioLibrary.MUSIC_FIRE_ROARING);
				break;
		}
	}
};
