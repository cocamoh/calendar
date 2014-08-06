/*
http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html

/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --allow-file-access-from-files

//if (navigator.onLine) {}
*/

(function() {
	
	Date.prototype.monthDays = function() {
		var d = new Date(this.getFullYear(), this.getMonth()+1, 0);
		d.setHours(0, -d.getTimezoneOffset(), 0, 0)
		return d.getDate();
	}
	Date.prototype.mGetDay = function() {
		// starting at monday = 0 (sunday = 6)
		return (this.getDay() + 6) % 7;
	}
	Date.prototype.mGetUTCDay = function() {
		// starting at monday = 0 (sunday = 6)
		return (this.getUTCDay() + 6) % 7;
	}
	/*
	Date.prototype.getWeek = function() {
		var d = new Date(this.getFullYear(), 0, 1);
		return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7);
	}
	*/
	Date.prototype.getWeek = function () {  
		var target  = new Date(this.valueOf());  
		var dayNr   = (this.getDay() + 6) % 7;  
		target.setDate(target.getDate() - dayNr + 3); 
		var firstThursday = target.valueOf();  
		target.setMonth(0, 1);  
		if (target.getDay() != 4) {  
			target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);  
		}  
		return 1 + Math.ceil((firstThursday - target) / 604800000); // 604800000 = 7 * 24 * 3600 * 1000  
	}  
	
	Date.prototype.getUTCWeek = function() {
		var onejan = new Date(this.getFullYear(),0,1);
		onejan.setHours(0, -onejan.getTimezoneOffset(), 0, 0)
		return Math.ceil((((this - onejan) / 86400000) + onejan.mGetUTCDay()+1)/7);
	}	
	Date.prototype.getWeeksOfMonth = function () {
		var firstDay = new Date(this.setDate(1)).getDay();
		var totalDays = new Date(this.getFullYear(), this.getMonth() + 1, 0).getDate();
		return Math.ceil((firstDay + totalDays) / 7);
	}
	
	
	Date.getDateOfISOWeek = function(w, y) {
		var simple = new Date(y, 0, 1 + (w - 1) * 7);
		var dow = simple.getDay();
		var ISOweekStart = simple;
		if (dow <= 4)
			ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
		else
			ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
		return ISOweekStart;
	}
	Date.getISOWeeksOfYear = function(year) {
		var d, isLeap;
		
		d = new Date(year, 0, 1);
		isLeap = new Date(year, 1, 29).getMonth() === 1;
		
		//check for a Jan 1 that's a Thursday or a leap year that has a 
		//Wednesday jan 1. Otherwise it's 52
		return d.getDay() === 4 || isLeap && d.getDay() === 3 ? 53 : 52;
	}
	
	var swlCalendarConfig = function() {
		return {
			locale: "en-US",
			time: {
				hour12: false,
				hour: "2-digit",
				minute: "2-digit"
			},
			date: {
				full: {
					weekday: "long",
					day: "numeric",
					month: "long",
					year: "numeric"
				},
				date: {
					day: '2-digit',
					month: 'long',
					year: 'numeric'
				},
				day: {
					weekday: "short",
					day: "numeric"
				}
			}
		}
	}();
	
	// _currentScript polymer polyfill import hack
	var currentDoc = ((!('import' in document.createElement('link'))) ? document._currentScript.ownerDocument : document.currentScript.ownerDocument);
	var rootDoc = document;
	
	var swlCalendarProto = Object.create(HTMLElement.prototype, {
		createdCallback: {
			value: function() {
				this.cache = {
					entry: {
						height: 0
					},
					calendar: {
						size: {
							last: {
								width: 0,
								height: 0
							}
						}
					},
					ui: {
						timer: null,
						lastExecThrottle: 100,
						lastExec: new Date()
					}
				}
				
				this.createShadowRoot();
				//this.shadowRoot.resetStyleInheritance = true; // <-- get rid of anything inherited
				//this.shadowRoot.applyAuthorStyles = true;
				window.addEventListener('resize', this.checkWindowSize.bind(this));
			}
		},
		attachedCallback: {
			value: function() {
				var template = currentDoc.querySelector('#swl-calendar-' + this.getAttribute('view')).content.cloneNode(true);
				this.shadowRoot.appendChild(template);
				
				if(this.getAttribute('view') == "year") {
					this.yearCalendar();
					this.setYearEvents();
					return;
				}
				
				if(this.getAttribute('view') == "month") {
					this.monthCalendar();
					this.clearMonthHiddenLabel();
					this.setMonthEvents();
					window.setTimeout(function() {
						this.resizeMonth()
					}.bind(this), 10);
					return;
				}
				
				if(this.getAttribute('view') == "week") {
					this.weekCalendar();
					this.setWeekEvents();
					this.setWeekListeners();
					window.setTimeout(function() {
						this.scrollToWeekNow();
					}.bind(this), 10);
					return;
				}
				
				if(this.getAttribute('view') == 'day') {
					this.dayCalendar();
					this.setDayEvents();
					this.setDayListeners();
					window.setTimeout(function() {
						this.scrollToDayNow();
					}.bind(this), 10);
					return;
				}
			}
		},
		attributeChangedCallback: {
			value: function(attrName, oldVal, newVal) {
				if(attrName == 'view') {
					this.clear();
					this.attachedCallback();
					return;
				}
				
				// if old value is null, then this value is set by function called by attachedCallback. So do nothing in this case
				if(oldVal && oldVal != newVal) {
					if(this.getAttribute('view') == 'year') {
						var calendar = this.shadowRoot.querySelector('div[class="swl-calendar year"]');
						while (calendar.firstChild) calendar.removeChild(calendar.firstChild);
						this.yearCalendar();
						return;
					}
					
					
					if(this.getAttribute('view') == 'month') {
						var calendar = this.shadowRoot.querySelector('div[class="swl-calendar month"]');
						while (calendar.firstChild) calendar.removeChild(calendar.firstChild);
						this.monthCalendar();
						this.clearMonthHiddenLabel();
						window.setTimeout(function() {
							this.resizeMonth()
						}.bind(this), 10);
						return;
					}
					
					if(this.getAttribute('view') == 'week') {
						var calendar = this.shadowRoot.querySelector('div[class="swl-calendar week"]');
						while (calendar.firstChild) calendar.removeChild(calendar.firstChild);
						this.weekCalendar();
						this.setWeekListeners();
						this.scrollToWeekNow();
						return;
					}
					
					if(this.getAttribute('view') == 'day') {
						var calendar = this.shadowRoot.querySelector('div[class="swl-calendar day"]');
						while (calendar.firstChild) calendar.removeChild(calendar.firstChild);
						this.dayCalendar();
						this.setDayListeners();
						this.scrollToDayNow();
						return;
					}
				}
			}
		},
		detachedCallback: {
			value: function() {
				window.removeEventListener('resize', this.cache.ui.resize);
			}
		}
	});
	
	swlCalendarProto.checkWindowSize = function(evt) {
		if(!this.cache) return false;
		var d = new Date();
		if (d-this.cache.ui.lastExec < this.cache.ui.lastExecThrottle) {
			if (this.cache.ui.timer) {
				window.clearTimeout(this.cache.ui.timer);
			}
			this.cache.ui.timer = window.setTimeout(this.checkWindowSize, this.cache.ui.lastExecThrottle);
			return false; // exit
		}
		this.cache.ui.lastExec = d; // update "last exec" time
		if(this.getAttribute('view') == 'month') {
			this.resizeMonth();
		}
	}
	swlCalendarProto.clear = function() {
		while(this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild);
	}
	
	
	swlCalendarProto.setYearEvents = function() {
		this.shadowRoot.querySelector('header menu:first-of-type button:first-of-type').addEventListener('click', function(evt) {
			this.setAttribute('year', parseInt(this.getAttribute('year')) - 1);
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			this.setAttribute('year', parseInt(this.getAttribute('year')) + 1);
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			var now = new Date();
			this.setAttribute('year', now.getFullYear());
			this.setAttribute('month', now.getMonth()+1);
			this.setAttribute('week', now.getWeek());
			this.setAttribute('day', now.getDate());
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:first-of-type').addEventListener('click', function(evt) {
			this.setAttribute('view', 'month');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'week');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'day');
		}.bind(this));
	}
	swlCalendarProto.yearCalendar = function() {
		var today = new Date();
		today.setHours(0, -today.getTimezoneOffset(), 0, 0);
		var year = today.getFullYear();
		if(this.getAttribute('year')) {
			if(parseInt(this.getAttribute('year'))) {
				year = parseInt(this.getAttribute('year'));
			}
		}
		this.setAttribute('year', year);
		this.shadowRoot.querySelector('header div').textContent = year;
		
		var monthTpl = currentDoc.querySelector('#swl-calendar-year').content.querySelector('template').content;
		var headerTpl = monthTpl.querySelector('.header template').content;
		var weekTpl = monthTpl.querySelector('.content template').content;
		var dayTpl = weekTpl.querySelector('template').content;
		
		for(var m = 0; m < 12; m++) {
			var start = new Date(year, m, 1);
			start.setHours(0, -start.getTimezoneOffset(), 0, 0);
			
			var end = new Date(year, m, start.monthDays());
			end.setHours(0, -end.getTimezoneOffset(), 0, 0);
			
			var month = monthTpl.cloneNode(true);
			var week = weekTpl.cloneNode(true);
			var day = null;
			
			month.querySelector('header h1').textContent = start.toLocaleString(swlCalendarConfig.locale, {month: "long"})
			
			for(var i = 0; i < 7; i++) {
				var header = headerTpl.cloneNode(true);
				
				var tmp = new Date();
				tmp.setDate(i);
				header.querySelector('span').textContent = tmp.toLocaleString(swlCalendarConfig.locale, {weekday: "short"});
				
				month.querySelector('.header').appendChild(header);
			}
			
			// fill empty days
			for(var d = 0; d < start.mGetDay(); d++) {
				day = dayTpl.cloneNode(true);
				day.querySelector('time').textContent = " ";
				day.querySelector('time').classList.add('inactive');
				week.querySelector('div:first-of-type').appendChild(day);
			}
			
			for(var d = 0; d < start.monthDays(); d++) {
				var now = new Date(year, m, d+1);
				now.setHours(0, -now.getTimezoneOffset(), 0, 0);
				if(0 == now.mGetDay()) {
					month.querySelector('div > div:last-child').appendChild(week);
					week = weekTpl.cloneNode(true);
				}
				day = dayTpl.cloneNode(true);
				day.querySelector('time').textContent = d+1;
				day.querySelector('time').setAttribute('datetime', now.toISOString().slice(0,10));
				if(now.getTime() == today.getTime()) {
					day.querySelector('time').classList.add('today');
				}
				week.querySelector('div:first-of-type').appendChild(day);
			}
			
			// fill empty days
			for(var d = 0; d < (6 - end.mGetDay()); d++) {
				day = dayTpl.cloneNode(true);
				day.querySelector('time').textContent = " ";
				day.querySelector('time').classList.add('inactive');
				week.querySelector('div:first-of-type').appendChild(day);
			}
			
			month.querySelector('div > div:last-child').appendChild(week);
			
			this.shadowRoot.querySelector('div[class="swl-calendar year"]').appendChild(month);
		}
		
		// update calendar entries
		var children = Array.prototype.slice.call(this.children);
		children.forEach(function(ele, i) {
			if(typeof ele.attachedCallback == 'function') {
				ele.attachedCallback();
			}
		});
	}
	
	
	swlCalendarProto.setMonthEvents = function() {
		this.shadowRoot.querySelector('header menu:first-of-type button:first-of-type').addEventListener('click', function(evt) {
			var month = parseInt(this.getAttribute('month'));
			if(month-1 < 1) {
				this.setAttribute('year', parseInt(this.getAttribute('year')) - 1);
				this.setAttribute('month', 12);
				return;
			}
			this.setAttribute('month', month - 1);
			
			if(this.getAttribute('week')) {
				var start = new Date(this.getAttribute('year'), month-2, 1);
				var end = new Date(this.getAttribute('year'), month-2, start.monthDays());
				this.setAttribute('week', end.getWeek());
			}
			
			if(this.getAttribute('day') && this.getAttribute('week')) {
				var start = Date.getDateOfISOWeek(this.getAttribute('week'), this.getAttribute('year'));
				this.setAttribute('day', start.getDate());
			}
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			var month = parseInt(this.getAttribute('month'));
			if(month+1 > 12) {
				this.setAttribute('year', parseInt(this.getAttribute('year')) + 1)
				this.setAttribute('month', 1);
				return;
			}
			this.setAttribute('month', month + 1);
			
			if(this.getAttribute('week')) {
				var start = new Date(this.getAttribute('year'), month, 1);
				this.setAttribute('week', start.getWeek());
			}
			
			if(this.getAttribute('day') && this.getAttribute('week')) {
				var start = Date.getDateOfISOWeek(this.getAttribute('week'), this.getAttribute('year'));
				this.setAttribute('day', start.getDate());
			}
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			var now = new Date();
			this.setAttribute('year', now.getFullYear());
			this.setAttribute('month', now.getMonth()+1);
			this.setAttribute('week', now.getWeek());
			this.setAttribute('day', now.getDate());
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:first-of-type').addEventListener('click', function(evt) {
			this.setAttribute('view', 'year');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'week');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'day');
		}.bind(this));
	}
	swlCalendarProto.monthCalendar = function() {
		var today = new Date();
		today.setHours(0, -today.getTimezoneOffset(), 0, 0);
		var year = today.getFullYear();
		var month = today.getMonth() + 1;
		var items = 3;
		
		if(this.getAttribute('year')) {
			if(parseInt(this.getAttribute('year'))) {
				year = this.getAttribute('year');
			}
		}
		if(this.getAttribute('month')) {
			if(parseInt(this.getAttribute('month'))) {
				month = parseInt(this.getAttribute('month'));
			}
		}
		this.setAttribute('year', year);
		this.setAttribute('month', month);
		
		var start = new Date(year, month-1, 1); start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		var end = new Date(year, month-1, start.monthDays()); end.setHours(0, -end.getTimezoneOffset(), 0, 0);
		
		
		this.shadowRoot.querySelector('header div').innerHTML = "<strong>" + start.toLocaleString(swlCalendarConfig.locale, {month: "long"}) + "</strong> " + year;
		
		
		var monthTpl = currentDoc.querySelector('#swl-calendar-month').content.querySelector('.swl-calendar.month template').content;
		var headerTpl = monthTpl.querySelector('.header template').content;
		
		var backgroundWeekTpl = monthTpl.querySelector('.background template').content;
		var dayBackgroundTpl = backgroundWeekTpl.querySelector('.week template').content;
		
		var foregroundWeekTpl = monthTpl.querySelector('.foreground template').content;
		var dayForegroundTpl = foregroundWeekTpl.querySelector('.week template').content;
		
		var monthObj = monthTpl.cloneNode(true);
		
		for(var i = 0; i < 7; i++) {
			var header = headerTpl.cloneNode(true);
			
			var tmp = new Date();
			tmp.setDate(i);
			header.querySelector('span').textContent = tmp.toLocaleString(swlCalendarConfig.locale, {weekday: "short"});
			
			monthObj.querySelector('.header').appendChild(header);
		}
		
		var backgroundWeek = backgroundWeekTpl.cloneNode(true);
		var foregroundWeek = foregroundWeekTpl.cloneNode(true);
		
		
		// fill empty days
		for(var d = 0; d < start.mGetDay(); d++) {
			day = dayBackgroundTpl.cloneNode(true);
			day.querySelector('div').classList.add('inactive');
			
			foregroundWeek.querySelector('div:first-of-type').appendChild(dayForegroundTpl.cloneNode(true));
			backgroundWeek.querySelector('div:first-of-type').appendChild(day);
		}
		
		// writing month
		for(var d = 0; d < start.monthDays(); d++) {
			var now = new Date(year, month-1, d+1);
			now.setHours(0, -now.getTimezoneOffset(), 0, 0);
			
			if(0 == now.mGetDay() && (d > 0 || start.mGetDay() > 0)) {
				
				var weeknumber = backgroundWeek.querySelector('div.day:first-of-type > div.header > div:first-of-type');
				weeknumber.textContent = now.getWeek()-1;
				weeknumber.classList.add('weeknumber');
				
				backgroundWeek.querySelector('.week').setAttribute('number', now.getWeek()-1);
				monthObj.querySelector('div > div.background').appendChild(backgroundWeek);
				backgroundWeek = backgroundWeekTpl.cloneNode(true);
				
				foregroundWeek.querySelector('.week').setAttribute('number', now.getWeek()-1);
				monthObj.querySelector('div > div.foreground').appendChild(foregroundWeek);
				foregroundWeek = foregroundWeekTpl.cloneNode(true);
				
			}
			
			day = dayBackgroundTpl.cloneNode(true);
			day.querySelector('div').setAttribute('datetime', now.toISOString().slice(0,10));
			
			foregroundDay = dayForegroundTpl.cloneNode(true);
			foregroundDay.querySelector('div').setAttribute('datetime', now.toISOString().slice(0,10));
			
			foregroundWeek.querySelector('div:first-of-type').appendChild(foregroundDay);
			
			if(now.getTime() == today.getTime()) {
				day.querySelector('div').classList.add('today');
			}
			day.querySelector('div > div.header > div:last-of-type').textContent = d+1;
			backgroundWeek.querySelector('div:first-of-type').appendChild(day);
			
		}
		
		// fill empty days
		for(var d = 0; d < (6 - end.mGetDay()); d++) {
			day = dayBackgroundTpl.cloneNode(true);
			day.querySelector('div').classList.add('inactive');
			foregroundWeek.querySelector('div:first-of-type').appendChild(dayForegroundTpl.cloneNode(true));
			backgroundWeek.querySelector('div:first-of-type').appendChild(day);
		}
		
		var weeknumber = backgroundWeek.querySelector('div.day:first-of-type > div.header > div:first-of-type');
		weeknumber.textContent = now.getWeek();
		weeknumber.classList.add('weeknumber');
		
		backgroundWeek.querySelector('.week').setAttribute('number', now.getWeek());
		monthObj.querySelector('div > div.background').appendChild(backgroundWeek);
		foregroundWeek.querySelector('.week').setAttribute('number', now.getWeek());
		monthObj.querySelector('div > div.foreground').appendChild(foregroundWeek);
		
		
		this.shadowRoot.querySelector('div[class="swl-calendar month"]').appendChild(monthObj);
		
		// update calendar entries
		for(var i = 0; i < this.children.length; i++) {
			if(typeof this.children[i].attachedCallback == 'function') {
				this.children[i].attachedCallback();
			}
		}
	}
	swlCalendarProto.resizeMonth = function() {
		Array.prototype.slice.call(this.shadowRoot.querySelectorAll('.foreground .week')).forEach(function(week, i) {
			// compute week height
			//var rowStyle = window.getComputedStyle(week);
			var rowHeight = week.clientHeight; //Math.ceil(week.offsetHeight + parseFloat(rowStyle['marginTop']) + parseFloat(rowStyle['marginBottom']));
			
			var height = this.monthWeekHeight(week);
			var footerHeight = this.monthFooterHeight(week);
			var entryHeight = this.monthEntryHeight(week);
			
			if(rowHeight <= (height + footerHeight)) {
				// hide last entry
				var entry = Array.prototype.slice.call(week.querySelectorAll('.entry:not(.hidden)')).pop();
				if(entry) {
					this.hideMonthEntry(entry.swlDOMElement);
					this.addMonthHiddenLabel(entry.swlDOMElement);
				}
			}
			
			
			// show hidden entry
			if(rowHeight > (height + entryHeight + footerHeight)) {
				if(week.querySelectorAll('.entry.hidden').length > 0) {
					var dom = week.querySelectorAll('.entry.hidden')[0].swlDOMElement;
					if(this.canShowMonthEntry(dom)) {
						this.showMonthEntry(dom);
						this.removeMonthHiddenLabel(dom);
					}
				}
			}
			
		}.bind(this));
	}
	swlCalendarProto.monthEntryHeight = function(week) {
		var entry = week.parentNode.querySelector('.entry:not(.hidden)');
		if(entry) {
			var styles = window.getComputedStyle(entry);
			this.cache.entry.height = Math.ceil(entry.offsetHeight + parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']));
		}
		
		return this.cache.entry.height;
	}
	swlCalendarProto.monthWeekHeight = function(week) {
		// compute day label height
		var day = week.querySelector('.day');
		var dayStyles = window.getComputedStyle(day);
		var dayHeight = Math.ceil(day.offsetHeight + parseFloat(dayStyles['marginTop']) + parseFloat(dayStyles['marginBottom']));
		
		// calculating the height of the elements
		var height = 0;
		var entries = week.querySelectorAll('.entry:not(.hidden)');
		for(var i = 0; i < entries.length; i++) {
			var styles = window.getComputedStyle(entries[i]);
			var margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);
			height += Math.ceil(entries[i].offsetHeight + margin);
		}
		
		return dayHeight + height;
	}
	swlCalendarProto.monthFooterHeight = function(week) {
		var height = 0;
		
		var bgWeek = this.shadowRoot.querySelector('.background .week[number="'+week.getAttribute('number')+'"]');
		var footer = bgWeek.querySelector('.day .footer:not(.hidden)');
		if(footer) {
			var styles = window.getComputedStyle(footer);
			height = Math.ceil(footer.offsetHeight + parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']));
		}
		
		return height + 3;
	}
	swlCalendarProto.hideMonthEntry = function(entry) {
		// hide all entries
		for(var i = 0; i < entry.swlShadowElements.length; i++) {
			entry.swlShadowElements[i].classList.add('hidden');
		}
	}
	swlCalendarProto.clearMonthHiddenLabel = function() {
		var footers = this.shadowRoot.querySelectorAll('.background .footer');
		for(var i = 0; i < footers.length; i++) {
			if(!footers[i].hasOwnProperty("swlHidden")) {
				Object.defineProperty(footers[i], "swlHidden", {
					value: 0,
					writable: true
				});
			}
			footers[i].swlHidden = 0;
			footers[i].textContent = "";
			footers[i].classList.add('hidden');
		}
	}
	swlCalendarProto.addMonthHiddenLabel = function(dom) {
		for(var e = 0; e < dom.swlShadowElements.length; e++) {
			var bgWeek = this.shadowRoot.querySelector('.background .week[number="' + dom.swlShadowElements[e].parentNode.getAttribute('number') + '"]');
			var start = parseInt(dom.swlShadowElements[e].style.gridColumnStart);
			var steps = parseInt(dom.swlShadowElements[e].style.gridColumnEnd) - start;
			for(var i = 0; i < (steps); i++) {
				var footer = bgWeek.children[start+i].querySelector('.footer');
				footer.swlHidden += 1;
				footer.textContent = footer.swlHidden + " more ...";
				footer.classList.remove('hidden');
			}
		}
	}
	swlCalendarProto.removeMonthHiddenLabel = function(dom) {
		for(var e = 0; e < dom.swlShadowElements.length; e++) {
			var bgWeek = this.shadowRoot.querySelector('.background .week[number="' + dom.swlShadowElements[e].parentNode.getAttribute('number') + '"]');
			var start = parseInt(dom.swlShadowElements[e].style.gridColumnStart);
			var steps = parseInt(dom.swlShadowElements[e].style.gridColumnEnd) - start;
			for(var i = 0; i < (steps); i++) {
				var footer = bgWeek.children[start+i].querySelector('.footer');
				footer.swlHidden -= 1;
				if(footer.swlHidden <= 0) {
					footer.swlHidden = 0;
					footer.classList.add('hidden');
				}
				footer.textContent = footer.swlHidden + " more ...";
			}
		}
	}
	swlCalendarProto.canShowMonthEntry = function(dom) {
		for(var i = 0; i < dom.swlShadowElements.length; i++) {
			var week = dom.swlShadowElements[i].parentNode;
			
			var rowHeight = week.clientHeight;
			var height = this.monthWeekHeight(week);
			var footerHeight = this.monthFooterHeight(week);
			var entryHeight = this.monthEntryHeight(week);
			
			if(rowHeight <= (height + entryHeight + footerHeight)) {
				return false;
			}
		}
		
		return true;
	}
	swlCalendarProto.showMonthEntry = function(entry) {
		for(var i = 0; i < entry.swlShadowElements.length; i++) {
			entry.swlShadowElements[i].classList.remove('hidden');
		}
	}
	
	
	swlCalendarProto.setWeekEvents = function() {
		this.shadowRoot.querySelector('header menu:first-of-type button:first-of-type').addEventListener('click', function(evt) {
			var week = parseInt(this.getAttribute('week'));
			if(week-1 < 1) {
				this.setAttribute('year', parseInt(this.getAttribute('year')) - 1);
				this.setAttribute('month', 12);
				week = Date.getISOWeeksOfYear(this.getAttribute('year'));
			}
			this.setAttribute('week', week-1);
			this.setAttribute('month', new Date(this.getAttribute('year'), 0, 1+((week-2)*7)).getMonth() + 1);
			
			if(this.getAttribute('day')) {
				var start = Date.getDateOfISOWeek(week-1, this.getAttribute('year'));
				this.setAttribute('day', start.getDate());
			}
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			var week = parseInt(this.getAttribute('week'));
			if(week+1 > Date.getISOWeeksOfYear(this.getAttribute('year'))) {
				this.setAttribute('year', parseInt(this.getAttribute('year')) + 1);
				this.setAttribute('month', 1);
				week = 0;
			}
			this.setAttribute('week', week+1);
			this.setAttribute('month', new Date(this.getAttribute('year'), 0, 1+((week)*7)).getMonth() + 1);
			
			if(this.getAttribute('day')) {
				var start = Date.getDateOfISOWeek(week+1, this.getAttribute('year'));
				this.setAttribute('day', start.getDate());
			}
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			var now = new Date();
			this.setAttribute('year', now.getFullYear());
			this.setAttribute('month', now.getMonth()+1);
			this.setAttribute('week', now.getWeek());
			this.setAttribute('day', now.getDate());
			this.scrollToWeekNow();
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:first-of-type').addEventListener('click', function(evt) {
			this.setAttribute('view', 'year');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'month');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'day');
		}.bind(this));
	}
	swlCalendarProto.setWeekListeners = function() {
		this.shadowRoot.querySelector('.foreground .content').addEventListener('scroll', function(evt) {
			this.shadowRoot.querySelector('.background .content').scrollTop = this.shadowRoot.querySelector('.foreground .content').scrollTop;
		}.bind(this));
	}
	swlCalendarProto.scrollToWeekNow = function() {
		var start = Date.getDateOfISOWeek(this.getAttribute('week'), this.getAttribute('year'));
		start.setHours(0, 0, 0, 0);
		var startNow = new Date();
		startNow.setYear(start.getFullYear());
		startNow.setMonth(start.getMonth());
		startNow.setDate(start.getDate());
		
		var position = Math.floor((startNow - start) / (1000 * 60 * 30));
		
		var obj = this.shadowRoot.querySelector('.background .content .day [x="2"][y="' + position + '"]');
		this.shadowRoot.querySelector('.background .content').scrollTop = obj.offsetTop;
		this.shadowRoot.querySelector('.foreground .content').scrollTop = obj.offsetTop;
	}
	swlCalendarProto.weekCalendar = function() {
		var today = new Date();
		today.setHours(0, -today.getTimezoneOffset(), 0, 0);
		
		var year = today.getFullYear();
		var month = today.getMonth() + 1;
		var weekNr = today.getWeek();
		
		if(this.getAttribute('year')) {
			if(parseInt(this.getAttribute('year'))) {
				year = parseInt(this.getAttribute('year'));
			}
		}
		if(this.getAttribute('month')) {
			if(parseInt(this.getAttribute('month'))) {
				month = parseInt(this.getAttribute('month'));
			}
		}
		if(this.getAttribute('week')) {
			if(parseInt(this.getAttribute('week'))) {
				weekNr = parseInt(this.getAttribute('week'));
			}
		}
		this.setAttribute('year', year);
		this.setAttribute('month', month);
		this.setAttribute('week', weekNr);
		
		
		var start = Date.getDateOfISOWeek(weekNr, year);
		start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		
		var end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
		end.setHours(0, -end.getTimezoneOffset(), 0, 0);
		end.setDate(end.getDate() + 6);
		
		
		this.shadowRoot.querySelector('header div').innerHTML = "<strong>" + end.toLocaleString(swlCalendarConfig.locale, {month: "long"} ) + "</strong> " + year;
		
		
		var weekTpl = currentDoc.querySelector('#swl-calendar-week').content.querySelector('template').content;
		var headerTpl = weekTpl.querySelector('.week .header template').content;
		
		var week = weekTpl.cloneNode(true);
		
		
		// writing header (day name and day number)
		var header = headerTpl.cloneNode(true);
		var div = document.createElement('div');
		div.textContent = weekNr;
		div.classList.add('weeknumber');
		header.querySelector('div').appendChild(div);
		week.querySelector('.header').appendChild(header);
		
		var date = new Date(start.valueOf());
		date.setHours(0, -date.getTimezoneOffset(), 0, 0);
		for(var i = 0; i < 7; i++) {
			var header = headerTpl.cloneNode(true);
			header.querySelector('div').textContent = date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.day);
			if(date.valueOf() == today.valueOf()) {
				header.querySelector('div').classList.add('today');
			}
			week.querySelector('.header').appendChild(header);
			date.setDate(date.getDate() + 1);
		}
		
		
		// allday
		var bgDayTpl = weekTpl.querySelector('.week .content .background .allday template').content;
		var fgDayTpl = weekTpl.querySelector('.week .content .foreground .allday template').content;
		
		var div = document.createElement('div');
		div.textContent = "all-day";
		div.classList.add('label');
		week.querySelector('.week .content .background .allday').appendChild(div);
		
		var date = new Date(start.valueOf());
		date.setHours(0, -date.getTimezoneOffset(), 0, 0);
		for(var i = 0; i < 7; i++) {
			var bgDay = bgDayTpl.cloneNode(true);
			bgDay.querySelector('div').setAttribute('datetime', date.toISOString().slice(0,10));
			week.querySelector('.week .content .background .allday').appendChild(bgDay);
			date.setDate(date.getDate() + 1);
		}
		
		
		// day
		var bgMinTpl = weekTpl.querySelector('.background .day template').content;
		var fgMinTpl = weekTpl.querySelector('.foreground .day template').content;
		
		// create times
		var date = new Date(start.valueOf());
		date.setHours(0,0,0,0);
		for(var i = 0; i < 48; i++) {
			if(i % 2 == 0) {
				var bgTime = document.createElement('div');
				var style = "grid-row: " + (i+1) + " / span 2;";
				style += "position: relative; top: calc(-0.5em); text-align: right; height: 100%; vertical-align: middle;"
				bgTime.setAttribute('style', style);
				
				if(i > 0) {
					bgTime.textContent = date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time);
				}
				week.querySelector('.background .day').appendChild(bgTime);
			}
			date.setMinutes(date.getMinutes() + 30);
		}
		
		// create background grid
		var date = new Date(start.valueOf());
		for(var i = 0; i < 7; i++) {
			date.setHours(0,0,0,0);
			for(var t = 0; t < 48; t++) {
				var bgMin = bgMinTpl.cloneNode(true);
				var style = "grid-column: " + (i + 1) + ";";
				if(t == 0) {
					bgMin.querySelector('div').setAttribute('style', 'border-bottom: none;');
				}
				bgMin.querySelector('div').setAttribute('x', i+1);
				bgMin.querySelector('div').setAttribute('y', t+1);
				week.querySelector('.background .day').appendChild(bgMin);
			}
			date.setDate(date.getDate() + 1);
		}
		
		
		this.shadowRoot.querySelector('div[class="swl-calendar week"]').appendChild(week);
		
		// update calendar entries
		for(var i = 0; i < this.children.length; i++) {
			if(typeof this.children[i].attachedCallback == 'function') {
				this.children[i].attachedCallback();
			}
		}
	}
	swlCalendarProto.weekUpdateHeights = function() {
		
		window.setTimeout(function() {
			//TODO: need to be changed to the new css3 features such as calc() and attr()
			var foreground = this.shadowRoot.querySelector('.content .foreground');
		
			var styles = window.getComputedStyle(foreground.querySelector('.allday'));
			height = Math.ceil(foreground.querySelector('.allday').offsetHeight + parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']));
		
			var background = this.shadowRoot.querySelector('.content .background');
			background.querySelector('.allday').style.minHeight = height + "px";
			
			foreground.querySelector('.content').style.height = 'calc(100% - ' + height + 'px)';
			background.querySelector('.content').style.height = 'calc(100% - ' + height + 'px)';
		}.bind(this), 2);
		
	}
	
	
	swlCalendarProto.setDayEvents = function() {
		
		this.shadowRoot.querySelector('header menu:first-of-type button:first-of-type').addEventListener('click', function(evt) {
			var date = new Date(this.getAttribute('year'), parseInt(this.getAttribute('month')) - 1, this.getAttribute('day'));
			date.setHours(0, -date.getTimezoneOffset(), 0, 0);
			date.setDate(date.getDate() - 1);
			
			this.setAttribute('year', date.getFullYear());
			this.setAttribute('month', date.getMonth()+1);
			this.setAttribute('week', date.getWeek());
			this.setAttribute('day', date.getDate());
			this.scrollToDayNow();
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			var date = new Date(this.getAttribute('year'), parseInt(this.getAttribute('month')) - 1, this.getAttribute('day'));
			date.setHours(0, -date.getTimezoneOffset(), 0, 0);
			date.setDate(date.getDate() + 1);
			
			this.setAttribute('year', date.getFullYear());
			this.setAttribute('month', date.getMonth()+1);
			this.setAttribute('week', date.getWeek());
			this.setAttribute('day', date.getDate());
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:first-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			var now = new Date();
			this.setAttribute('year', now.getFullYear());
			this.setAttribute('month', now.getMonth()+1);
			this.setAttribute('week', now.getWeek());
			this.setAttribute('day', now.getDate());
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:first-of-type').addEventListener('click', function(evt) {
			this.setAttribute('view', 'year');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(2)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'month');
		}.bind(this));
		
		this.shadowRoot.querySelector('header menu:last-of-type button:nth-of-type(3)').addEventListener('click', function(evt) {
			this.setAttribute('view', 'week');
		}.bind(this));
	}
	swlCalendarProto.setDayListeners = function() {
		this.shadowRoot.querySelector('.foreground .content').addEventListener('scroll', function(evt) {
			this.shadowRoot.querySelector('.background .content').scrollTop = this.shadowRoot.querySelector('.foreground .content').scrollTop;
		}.bind(this));
	}
	swlCalendarProto.scrollToDayNow = function() {
		var start = new Date(this.getAttribute('year'), parseInt(this.getAttribute('month'))-1, this.getAttribute('day'));
		start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		
		var startNow = new Date();
		startNow.setYear(start.getFullYear());
		startNow.setMonth(start.getMonth());
		startNow.setDate(start.getDate());
		
		var position = Math.floor((startNow - start) / (1000 * 60 * 30));
		
		var obj = this.shadowRoot.querySelector('.background .content .day [x="2"][y="' + position + '"]');
		this.shadowRoot.querySelector('.background .content').scrollTop = obj.offsetTop;
		this.shadowRoot.querySelector('.foreground .content').scrollTop = obj.offsetTop;
		
		var entry = this.shadowRoot.querySelector('[is="swl-sticky-list-headers"] [datetime="' + start.toISOString().slice(0,10) + '"]');
		if(entry) {
			entry.parentNode.scrollTop = entry.offsetTop;
		} else {
			this.shadowRoot.querySelector('[is="swl-sticky-list-headers"]').scrollTop = 1;
			this.shadowRoot.querySelector('[is="swl-sticky-list-headers"]').scrollTop = 0;
		}
	}
	swlCalendarProto.dayCalendar = function() {
		var today = new Date();
		today.setHours(0, -today.getTimezoneOffset(), 0, 0);
		
		var year = today.getFullYear();
		var month = today.getMonth() + 1;
		var weekNr = today.getWeek();
		var day = today.getDate();
		
		if(this.getAttribute('year')) {
			if(parseInt(this.getAttribute('year'))) {
				year = parseInt(this.getAttribute('year'));
			}
		}
		if(this.getAttribute('month')) {
			if(parseInt(this.getAttribute('month'))) {
				month = parseInt(this.getAttribute('month'));
			}
		}
		if(this.getAttribute('week')) {
			if(parseInt(this.getAttribute('week'))) {
				weekNr = parseInt(this.getAttribute('week'));
			}
		}
		if(this.getAttribute('day')) {
			if(parseInt(this.getAttribute('day'))) {
				day = parseInt(this.getAttribute('day'));
			}
		}
		this.setAttribute('year', year);
		this.setAttribute('month', month);
		this.setAttribute('week', weekNr);
		this.setAttribute('day', day);
		
		var date = new Date(year, month-1, day);
		date.setHours(0, -date.getTimezoneOffset(), 0, 0);
		
		var dayTpl = currentDoc.querySelector('#swl-calendar-day').content.querySelector('template').content;
		
		var dayObj = dayTpl.cloneNode(true);
		
		// sidebar label
		dayObj.querySelector('.sidebar .label :first-child').textContent = date.getDate();
		dayObj.querySelector('.sidebar .label :last-child').textContent = date.toLocaleString(swlCalendarConfig.locale, { weekday: 'long' });
		
		// sidebar month
		var cellTpl = dayTpl.querySelector('.sidebar .month .content template').content;
		
		var start = new Date(year, month-1, 1); start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		var end = new Date(year, month-1, start.monthDays()); end.setHours(0, -end.getTimezoneOffset(), 0, 0);
		
		// sidebar month day label
		dayObj.querySelector('.sidebar .month .content').appendChild(cellTpl.cloneNode(true));
		for(var i = 0; i < 7; i++) {
			var cell = cellTpl.cloneNode(true);
			
			var tmp = new Date();
			tmp.setDate(i);
			cell.querySelector('div').textContent = tmp.toLocaleString(swlCalendarConfig.locale, {weekday: "short"});
			
			dayObj.querySelector('.sidebar .month .content').appendChild(cell);
		}

		// fill empty days
		var cell = cellTpl.cloneNode(true);
		cell.querySelector('div').appendChild(document.createElement('div')).textContent = start.getWeek();
		cell.querySelector('div').setAttribute('number', start.getWeek());
		dayObj.querySelector('.sidebar .month .content').appendChild(cell);
		
		for(var d = 0; d < start.mGetDay(); d++) {
			var cell = cellTpl.cloneNode(true);
			cell.querySelector('div').classList.add('inactive');
			dayObj.querySelector('.sidebar .month .content').appendChild(cell);
		}
		
		// writing month
		for(var d = 0; d < start.monthDays(); d++) {
			var now = new Date(year, month-1, d+1);
			now.setHours(0, -now.getTimezoneOffset(), 0, 0);
			
			if(0 == now.mGetDay() && (d > 0 || start.mGetDay() > 0)) {
				var weeknumber = cellTpl.cloneNode(true);
				weeknumber.querySelector('div').appendChild(document.createElement('div')).textContent = now.getWeek();
				weeknumber.querySelector('div').setAttribute('number', now.getWeek());
				
				dayObj.querySelector('.sidebar .month .content').appendChild(weeknumber);
			}
			
			var cell = cellTpl.cloneNode(true);
			cell.querySelector('div').setAttribute('datetime', now.toISOString().slice(0,10));
			
			if(now.getTime() == today.getTime()) {
				cell.querySelector('div').classList.add('today');
			}
			if(now.getTime() == date.getTime()) {
				cell.querySelector('div').classList.add('active');
			}
			cell.querySelector('div').textContent = d+1;
			dayObj.querySelector('.sidebar .month .content').appendChild(cell);
		}
		
		// fill empty days
		for(var d = 0; d < (6 - end.mGetDay()); d++) {
			var cell = cellTpl.cloneNode(true);
			cell.querySelector('div').classList.add('inactive');
			dayObj.querySelector('.sidebar .month .content').appendChild(cell);
		}
		
		
		// sidebar list
		var listTpl = dayTpl.querySelector('.sidebar .list template:first-of-type').content;
		
		
		// need to be recreated because inside template it is not working
		var clone = document.createElement('div', 'swl-sticky-list-headers');
		clone.setAttribute('selector', '.label');
		clone.classList.add('list');
		
		var list = listTpl.cloneNode(true);
		list.querySelector('.label').setAttribute('datetime', date.toISOString().slice(0,10));
		list.querySelector('.label div:first-of-type').textContent = date.toLocaleString(swlCalendarConfig.locale, { weekday: 'long' });
		list.querySelector('.label div:last-of-type').textContent = date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.date);
		clone.appendChild(list);
		
		
		dayObj.querySelector('.sidebar').replaceChild(clone, dayObj.querySelector('.sidebar .list'));
		//dayObj.querySelector('.sidebar .list').appendChild(list);
		
		
		
		dayObj.querySelector('.content .header').innerHTML = "<strong>" + date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.full) + "</strong>";
		
		
		// allday
		var bgDayTpl = dayTpl.querySelector('.day .content .events .background .allday template').content;
		var fgDayTpl = dayTpl.querySelector('.day .content .events .foreground .allday template').content;
		
		var div = bgDayTpl.cloneNode(true);
		div.querySelector('div').textContent = "all-day";
		div.querySelector('div').classList.add('label');
		dayObj.querySelector('.day .content .events .background .allday').appendChild(div);
		
		var bgDay = bgDayTpl.cloneNode(true);
		bgDay.querySelector('div').setAttribute('datetime', date.toISOString().slice(0,10));
		dayObj.querySelector('.day .content .events .background .allday').appendChild(bgDay);
		
		
		// day
		var bgMinTpl = dayTpl.querySelector('.background .content .day template').content;
		var fgMinTpl = dayTpl.querySelector('.foreground .content .day template').content;
		
		// create times
		var dLabel = new Date(date.valueOf());
		dLabel.setHours(0,0,0,0);
		for(var i = 0; i < 48; i++) {
			if(i % 2 == 0) {
				var bgTime = document.createElement('div');
				var style = "grid-row: " + (i+1) + " / span 2;";
				style += "position: relative; top: calc(-0.5em); text-align: right; height: 100%; vertical-align: middle;"
				bgTime.setAttribute('style', style);
				
				if(i > 0) {
					bgTime.textContent = date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time);
				}
				dayObj.querySelector('.background .content .day').appendChild(bgTime);
			}
			date.setMinutes(date.getMinutes() + 30);
		}
		
		// create background grid
		var dLabel = new Date(date.valueOf());
		dLabel.setHours(0,0,0,0);
		for(var t = 0; t < 48; t++) {
			var bgMin = bgMinTpl.cloneNode(true);
			var style = "grid-column: " + (i + 1) + ";";
			if(t == 0) {
				bgMin.querySelector('div').setAttribute('style', 'border-bottom: none;');
			}
			bgMin.querySelector('div').setAttribute('x', 2);
			bgMin.querySelector('div').setAttribute('y', t+1);
			dayObj.querySelector('.background .day').appendChild(bgMin);
		}
		
		
		this.shadowRoot.querySelector('div[class="swl-calendar day"]').appendChild(dayObj);
		
		// update calendar entries
		for(var i = 0; i < this.children.length; i++) {
			if(typeof this.children[i].attachedCallback == 'function') {
				this.children[i].attachedCallback();
			}
		}
	}
	swlCalendarProto.dayUpdateHeights = function() {
		
		window.setTimeout(function() {
			//TODO: need to be changed to the new css3 features such as calc() and attr()
			var foreground = this.shadowRoot.querySelector('.content .foreground');
		
			var styles = window.getComputedStyle(foreground.querySelector('.allday'));
			var height = Math.ceil(foreground.querySelector('.allday').offsetHeight + parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']));
		
			var background = this.shadowRoot.querySelector('.content .background');
			background.querySelector('.allday').style.minHeight = height + "px";
			
			foreground.querySelector('.content').style.height = 'calc(100% - ' + height + 'px)';
			background.querySelector('.content').style.height = 'calc(100% - ' + height + 'px)';
			
		}.bind(this), 2);
		
	}
	
	
	document.registerElement('swl-calendar', {
		prototype: swlCalendarProto
//		, extends: 'div'
	});
	
	
	
	var swlCalendarItemProto = Object.create(HTMLElement.prototype, {
		createdCallback: {
			value: function() {
				this.createShadowRoot();
				this.shadowRoot.resetStyleInheritance = true; // <-- get rid of anything inherited
				//root.applyAuthorStyles = true;
			}
		},
		attachedCallback: {
			value: function() {
				this.clearBindings();
				this.calculateDefaults();
				
				if(this.parentNode.getAttribute('view') == 'year') {
					this.yearCalendar();
					return;
				}
				
				if(this.parentNode.getAttribute('view') == 'month') {
					this.monthCalendar();
					return;
				}
				
				if(this.parentNode.getAttribute('view') == 'week') {
					this.weekCalendar();
					return;
				}
				
				if(this.parentNode.getAttribute('view') == 'day') {
					this.dayCalendar();
					return;
				}
			}
		}
	});
	
	swlCalendarItemProto.clearBindings = function() {
		if(!this.hasOwnProperty("swlShadowElements")) {
			Object.defineProperty(this, "swlShadowElements", {
				value: [],
				writable: true
			});
		}
		this.swlShadowElements.splice(0, this.swlShadowElements.length);
	}
	swlCalendarItemProto.calculateDefaults = function() {
		this.allday = (this.getAttribute('allday').toLowerCase() === 'true');;
		this.from = new Date(this.getAttribute('from'));
		this.to = new Date(this.from.valueOf());
		this.days = 0;
		this.minutes = 0;
		
		if(this.getAttribute('to') != "") {
			this.to = new Date(this.getAttribute('to'));
			
			var d1 = new Date(this.from.valueOf());
			d1.setHours(0, -d1.getTimezoneOffset(), 0, 0);
			
			var d2 = new Date(this.to.valueOf());
			d2.setHours(0, -d2.getTimezoneOffset(), 0, 0);
			d2.setDate(d2.getDate());
			
			this.days = (d2 - d1)/(1000*60*60*24);
			
			this.minutes = (this.to - this.from) / ( 1000 * 60 );
		}
		
		this.template = null;
		if(this.allday) {
			this.template = currentDoc.querySelector('#swl-calendar-week').content
				.querySelector('.swl-calendar.week template').content
				.querySelector('.foreground .allday template').content;
			if(!this.template) {
				this.template = currentDoc.querySelector('#swl-calendar-day').content
					.querySelector('.swl-calendar.day template').content
					.querySelector('.foreground .allday template').content;
			}
		} else {
			this.template = currentDoc.querySelector('#swl-calendar-week').content
				.querySelector('.swl-calendar.week template').content
				.querySelector('.foreground .content .day template').content;
			if(!this.template) {
				this.template = currentDoc.querySelector('#swl-calendar-day').content
					.querySelector('.swl-calendar.day template').content
					.querySelector('.foreground .content .day template').content;
			}
		}
		this.listHeaderTpl = currentDoc.querySelector('#swl-calendar-day').content.querySelector('template').content.querySelector('.sidebar .list template:first-of-type').content;
		this.listEntryTpl = currentDoc.querySelector('#swl-calendar-day').content.querySelector('template').content.querySelector('.sidebar .list template:last-of-type').content;
	}
	swlCalendarItemProto.hoverListener = function(ele) {
		ele.addEventListener('mouseover', function() {
			this.swlShadowElements.forEach(function(obj, i) {
				obj.classList.add('hover');
			});
		}.bind(this));
		
		ele.addEventListener('mouseout', function() {
			this.swlShadowElements.forEach(function(obj, i) {
				obj.classList.remove('hover');
			});
		}.bind(this));
	}
	swlCalendarItemProto.focusListener = function(ele) {
		ele.addEventListener('focus', function() {
			this.swlShadowElements.forEach(function(obj, i) {
				obj.classList.add('focus');
			});
			this.selectEvent();
		}.bind(this));
	
		ele.addEventListener('blur', function() {
			this.swlShadowElements.forEach(function(obj, i) {
				obj.classList.remove('focus');
			});
			this.unselectEvent();
		}.bind(this));
		
	}
	
	swlCalendarItemProto.selectEvent = function() {
		this.bringEventToTop();
	}
	swlCalendarItemProto.unselectEvent = function() {
		this.swlShadowElements.forEach(function(obj, i) {
			this.rearrangeOverlappingEvents(parseInt(obj.getAttribute('x')));
		}.bind(this));
	}
	swlCalendarItemProto.bringEventToTop = function() {
		this.swlShadowElements.forEach(function(shadow, i) {
			var elements = Array.prototype.slice.call(shadow.parentNode.querySelectorAll('.foreground .content *[x="' + shadow.getAttribute('x') + '"]'));
			elements.sort(function (a, b) {
				return +parseInt(b.getAttribute('y')) - +parseInt(a.getAttribute('y'));
			});
			shadow.style.zIndex = elements[0].getAttribute('y')+1;
		}.bind(this));
	}
	swlCalendarItemProto.rearrangeOverlappingEvents = function(dayIdx) {
		// find overlapping entries
		var dayEntries = Array.prototype.slice.call(this.parentNode.shadowRoot.querySelectorAll('.foreground .content *[x="' + dayIdx + '"]'));
		dayEntries.sort(function (a, b) {
			return +parseInt(a.getAttribute('y')) - +parseInt(b.getAttribute('y'));
		});
		if(dayEntries.length > 1) {
			for(idx in dayEntries) {
				dayEntries[idx].style.zIndex = dayEntries[idx].getAttribute('y');
				dayEntries[idx].style.marginRight = ((dayEntries.length-1 - idx) * 20) + "px";
				dayEntries[idx].style.marginLeft = (idx * 20) + "px";
			}
		}
	}
	
	
	
	
	swlCalendarItemProto.yearCalendar = function() {
		var d = new Date(this.from.valueOf());
		d.setHours(0, -d.getTimezoneOffset(), 0, 0);
		
		for(var i = 0; i < this.days+1; i++) {
			var ele = this.parentNode.shadowRoot.querySelector('time[datetime="' + d.toISOString().slice(0,10) + '"]');
			if(ele) {
				ele.classList.add("busy");
			}
			d.setDate(d.getDate()+1);
		}
	}
	
	
	swlCalendarItemProto.monthCalendar = function() {
		var day = this.parentNode.shadowRoot.querySelector('div.foreground div[datetime="' + this.from.toISOString().slice(0,10) + '"]');
		
		// from date is inside month
		if(day) {
			this.monthEntry(day.parentNode, [].indexOf.call(day.parentNode.children, day), this.days);
			return;
		}
		
		// from-to date is inside month
		var year = this.parentNode.getAttribute('year');
		var month = parseInt(this.parentNode.getAttribute('month'));
		
		var start = new Date(year, month-1, 1); start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		var end = new Date(year, month-1, start.monthDays()); end.setHours(0, -end.getTimezoneOffset(), 0, 0);
		
		var d1 = new Date(this.from.valueOf());
		d1.setHours(0, -d1.getTimezoneOffset(), 0, 0);
		
		var d2 = new Date(this.to.valueOf());
		d2.setHours(0, -d2.getTimezoneOffset(), 0, 0);
		d2.setDate(d2.getDate());
		
		if(d1 <= start && d2 >= start) {
			var week = this.parentNode.shadowRoot.querySelector('div.foreground .week:first-of-type');
			var days = (d2-start)/(1000*60*60*24) + start.mGetDay();
			this.monthEntry(week, 1, days, {style: 'left'});
			return;
		}
	}
	swlCalendarItemProto.monthEntry = function(week, dayIdx, days, options) {
		if(!week) return;
		
		var options = options || {};
		
		var ele = document.createElement('div');
		
		var style = "grid-row: " + (week.querySelectorAll('.entry').length + 2) + ";";
		
		var rest = 7-dayIdx;
		var span = days + 1;
		
		this.swlShadowElements.push(ele);
		
		if((rest-days) < 0) {
			span = rest + 1;
			ele.classList.add('right');
			
			var weekIdx = [].indexOf.call(week.parentNode.children, week);
			this.monthEntry(
				week.parentNode.children[weekIdx + 1],
				1,
				days-rest-1,
				{style: 'left'}
			);
		}
		style += "grid-column: " + dayIdx  + " / " + (dayIdx + span);
		
		ele.setAttribute('style', style);
		if('style' in options) {
			ele.classList.add(options.style);
		}
		ele.classList.add('entry');
		
		ele.textContent = this.getAttribute('summary');
		
		this.hoverListener(ele);
		this.focusListener(ele);
		
		week.children[dayIdx].parentNode.appendChild(ele);
		
		
		if(!ele.hasOwnProperty("swlDOMElement")) {
			Object.defineProperty(ele, "swlDOMElement", {
				value: null,
				writable: true
			});
		}
		ele.swlDOMElement = this;
		
	}
	
	
	swlCalendarItemProto.weekCalendar = function() {
		var day = this.parentNode.shadowRoot.querySelector('div.background div[datetime="' + this.from.toISOString().slice(0,10) + '"]');
		
		// from date is inside week
		if(day) {
			if(this.allday) {
				this.weekAlldayEntry([].indexOf.call(day.parentNode.children, day), this.days);
			} else {
				this.weekDayEntry([].indexOf.call(day.parentNode.children, day), this.from, this.minutes);
			}
			this.parentNode.weekUpdateHeights();
			return;
		}
		
		var start = Date.getDateOfISOWeek(this.parentNode.getAttribute('week'), this.parentNode.getAttribute('year'));
		start.setHours(0, -start.getTimezoneOffset(), 0, 0);
		
		var end = new Date(start.getFullYear(), start.getMonth(), start.getDate());
		end.setHours(24, -end.getTimezoneOffset(), 0, 0);
		end.setDate(end.getDate() + 6);
		
		var d1 = new Date(this.from.valueOf());
		d1.setHours(0, -d1.getTimezoneOffset(), 0, 0);
		
		var d2 = new Date(this.to.valueOf());
		d2.setHours(0, -d2.getTimezoneOffset(), 0, 0);
		d2.setDate(d2.getDate());
		
		if(d1 <= start && d2 >= start) {
			var days = (d2-start)/(1000*60*60*24) + start.mGetDay();
			if(this.allday) {
				this.weekAlldayEntry(2, days, {style: 'left'});
			} else {
				this.weekDayEntry(2, new Date(start.setHours(0,0,0,0)), this.minutes, {style: "top", time: false});
			}
			this.parentNode.weekUpdateHeights();
			return;
		}
	}
	swlCalendarItemProto.weekAlldayEntry = function(dayIdx, days, options) {
		
		var options = options || {};
		
		var ele = this.template.cloneNode(true);
		var y = (this.parentNode.shadowRoot.querySelectorAll('.foreground .allday .entry').length + 1);
		
		var style = "grid-row: " + y + ";";
		ele.querySelector('div').setAttribute('y', y);
		
		var rest = 8-dayIdx;
		var span = days + 1;
		
		if((rest-days) < 0) {
			span = rest+1;
			ele.querySelector('div').classList.add('right');
		}
		
		ele.querySelector('div').setAttribute('x', dayIdx);
		ele.querySelector('div').setAttribute('span', (dayIdx + span));
		
		style += "grid-column: " + dayIdx + " / " + (dayIdx + span);
		ele.querySelector('div').setAttribute('style', style);
		if('style' in options) {
			ele.querySelector('div').classList.add(options.style);
		}
		ele.querySelector('.summary').textContent = this.getAttribute('summary');
		
		if(this.days > 0) {
			ele.querySelector('.time').textContent = "from " + this.from.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.day) + " to " + this.to.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.day);
		}
		
		this.hoverListener(ele.querySelector('div'));
		this.focusListener(ele.querySelector('div'));
		
		this.swlShadowElements.push(ele.querySelector('div'));
		
		this.parentNode.shadowRoot.querySelector('.foreground .allday').appendChild(ele);
		
		
		if(!ele.hasOwnProperty("swlDOMElement")) {
			Object.defineProperty(ele, "swlDOMElement", {
				value: null,
				writable: true
			});
		}
		ele.swlDOMElement = this;
	}
	swlCalendarItemProto.weekDayEntry = function(dayIdx, from, minutes, options) {
		if(minutes < 0 || dayIdx > 8) return;
		
		var options = options || {};
		
		var ele = this.template.cloneNode(true);
		
		var style = "grid-column: " + dayIdx + ";";
		
		var midnight = new Date(from.valueOf());
		midnight.setHours(24, 0, 0, 0);
		
		var start = new Date(from.valueOf());
		start.setHours(0, 0, 0, 0);
		
		var startRow = Math.floor((from - start) / (1000 * 60 * 30));
		var span = Math.floor((this.to - from) / (1000 * 60 * 30));
		
		var rest = (midnight - this.to) / (1000 * 60);
		if(rest < 0) {
			ele.querySelector('div').classList.add('bottom');
			
			span = (midnight - from) / (1000 * 60 * 30);
			start.setDate(start.getDate() + 1);
			this.weekDayEntry(dayIdx + 1, start, minutes-(span*30), {style: 'top', time: false});
		}
		
		style += "grid-row: " + (startRow+1) + " / span " + span + ";";
		style += "z-index: " + (startRow+1) + ";";
		
		if(from.getMinutes() > 0 && from.getMinutes() < 30) {
			var adjustment = 1.5 / 30 * from.getMinutes();
			style += "top: " + adjustment + "em; position: relative;";
		} else if(from.getMinutes() > 30 && from.getMinutes() <= 59) {
			var adjustment = 1.5 / 30 * (from.getMinutes() - 30);
			style += "top: " + adjustment + "em; position: relative;";
		}
		
		
		if('style' in options) {
			ele.querySelector('div').classList.add(options.style);
		}
		ele.querySelector('div').setAttribute("x", dayIdx);
		ele.querySelector('div').setAttribute("y", startRow+1);
		ele.querySelector('div').setAttribute("span", span);
		ele.querySelector('div').setAttribute('style', style);
		
		ele.querySelector('div').setAttribute('tabindex', 0);
		
		
		ele.querySelector('.summary').textContent = this.getAttribute('summary');
		if(!('time' in options) || (options.time)) {
			ele.querySelector('.time').textContent = "from " + this.from.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time) + " to " + this.to.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time);;
		}
		
		this.hoverListener(ele.querySelector('div'));
		this.focusListener(ele.querySelector('div'));
		
		this.swlShadowElements.push(ele.querySelector('div'));
		
		this.parentNode.shadowRoot.querySelector('.foreground .content .day').appendChild(ele);
		
		if(!ele.hasOwnProperty("swlDOMElement")) {
			Object.defineProperty(ele, "swlDOMElement", {
				value: null,
				writable: true
			});
		}
		ele.swlDOMElement = this;
		
		this.rearrangeOverlappingEvents(dayIdx);
		
	}
	
	
	swlCalendarItemProto.dayCalendar = function() {
		this.dayListEntry();
		
		var start = new Date(this.parentNode.getAttribute('year'), parseInt(this.parentNode.getAttribute('month')) - 1, this.parentNode.getAttribute('day'));
		start.setHours(0,0,0,0);
		
		var end = new Date(start.valueOf());
		end.setHours(24,0,0,0);
		
		
		if(this.to < start || this.from > end) {
			return;
		}
		
		var options = { classes: [] };
		
		if(this.allday) {
			if(this.from < start) {
				options.classes.push("left");
			}
			if(this.to > end) {
				options.classes.push("right");
			}
			
			this.dayAlldayEntry(options);
		} else {
			if(this.from < start) {
				options.classes.push("top");
			}
			if(this.to > end) {
				options.classes.push("bottom");
			}
			
			this.dayDayEntry(options);
		}
		
		this.parentNode.dayUpdateHeights();
	}
	swlCalendarItemProto.dayAlldayEntry = function(options) {
		var options = options || {};
		var ele = this.template.cloneNode(true);
		
		var x = (this.parentNode.shadowRoot.querySelectorAll('.foreground .allday .entry').length + 1);
		
		var style = "grid-row: " + x + ";";
		
		style += "grid-column: 2 / span 1;";
		
		ele.querySelector('div').setAttribute('style', style);
		
		ele.querySelector('div').setAttribute('x', x);
		ele.querySelector('div').setAttribute('y', 2);
		ele.querySelector('div').setAttribute('span', 1);
		
		if('classes' in options) {
			for(idx in options.classes) {
				ele.querySelector('div').classList.add(options.classes[idx]);
			}
		}
		
		
		ele.querySelector('.summary').textContent = this.getAttribute('summary');
		if(this.days > 0) {
			ele.querySelector('.time').textContent = "from " + this.from.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.day) + " to " + this.to.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.day);
		}
		
		this.hoverListener(ele.querySelector('div'));
		this.focusListener(ele.querySelector('div'));
		
		this.swlShadowElements.push(ele.querySelector('div'));
		
		this.parentNode.shadowRoot.querySelector('.foreground .allday').appendChild(ele);
		
		if(!ele.hasOwnProperty("swlDOMElement")) {
			Object.defineProperty(ele, "swlDOMElement", {
				value: null,
				writable: true
			});
		}
		ele.swlDOMElement = this;
	}
	swlCalendarItemProto.dayDayEntry = function(options) {
		var options = options || {};
		var ele = this.template.cloneNode(true);
		
		var style = "grid-column: 2;";
		
		var morning = new Date(this.parentNode.getAttribute('year'), parseInt(this.parentNode.getAttribute('month'))-1, this.parentNode.getAttribute('day'));
		morning.setHours(0, -morning.getTimezoneOffset(), 0, 0);
		
		var evening = new Date(morning.valueOf());
		evening.setHours(24, -evening.getTimezoneOffset(), 0, 0);
		
		var from = this.from;
		var to = this.to;
		
		if(this.from < morning) {
			from = morning;
		}
		if(this.to > evening) {
			to = evening;
		}
		
		var startRow = Math.floor((from - morning) / (1000 * 60 * 30));
		var span = Math.floor((to - from) / (1000 * 60 * 30));
		
		style += "grid-row: " + (startRow+1) + " / span " + span + ";";
		style += "z-index: " + (startRow+1) + ";";
		
		
		if(from.getMinutes() > 0 && from.getMinutes() < 30) {
			var adjustment = 1.5 / 30 * from.getMinutes();
			style += "top: " + adjustment + "em; position: relative;";
		} else if(from.getMinutes() > 30 && from.getMinutes() <= 59) {
			var adjustment = 1.5 / 30 * (from.getMinutes() - 30);
			style += "top: " + adjustment + "em; position: relative;";
		}
		
		if('classes' in options) {
			for(idx in options.classes) {
				ele.querySelector('div').classList.add(options.classes[idx]);
			}
		}
		
		ele.querySelector('div').setAttribute('x', 2);
		ele.querySelector('div').setAttribute('y', startRow+1);
		ele.querySelector('div').setAttribute('span', span);
		ele.querySelector('div').setAttribute('style', style);
		
		ele.querySelector('div').setAttribute('tabindex', 0);
		
		this.hoverListener(ele.querySelector('div'));
		this.focusListener(ele.querySelector('div'));
		
		
		ele.querySelector('.summary').textContent = this.getAttribute('summary');
		if(!('time' in options) || (options.time)) {
			ele.querySelector('.time').textContent = "from " + this.from.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time) + " to " + this.to.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time);;
		}
		
		
		this.swlShadowElements.push(ele.querySelector('div'));
		
		this.parentNode.shadowRoot.querySelector('.foreground .content .day').appendChild(ele);
		
		if(!ele.hasOwnProperty("swlDOMElement")) {
			Object.defineProperty(ele, "swlDOMElement", {
				value: null,
				writable: true
			});
		}
		ele.swlDOMElement = this;
		
		this.rearrangeOverlappingEvents(2);
	}
	swlCalendarItemProto.dayListEntry = function(options) {
		var options = options || {};
		
		var start = new Date(this.from.valueOf());
		start.setHours(0,-start.getTimezoneOffset(),0,0);
		
		var end = new Date(this.to.valueOf());
		end.setHours(0,-start.getTimezoneOffset(),0,0)
		
		var days = (end - start) / (1000 * 60 * 60 * 24);
		
		
		var listObj = this.parentNode.shadowRoot.querySelector('[is="swl-sticky-list-headers"]');
		
		var date = new Date(start.valueOf());
		//date.setTime(0,-date.getTimezoneOffset(),0,0);
		for(var i = 0; i < days+1; i++) {
			// find header label
			
			var header = listObj.querySelector('[datetime="' + date.toISOString().slice(0,10) + '"]');
			
			if(!header) {
				// header not found. create it
				header = this.dayListHeader(date, listObj);
			}
			
			var entry = this.listEntryTpl.cloneNode(true);
			entry.querySelector('span:first-of-type').textContent = this.getAttribute('summary')
			if(this.allday) {
				entry.querySelector('span:last-of-type').textContent = 'all-day'
			} else {
				entry.querySelector('span:last-of-type').textContent = "from " + this.from.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time) + " to " + this.to.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.time)
			}
			
			var childs = Array.prototype.slice.call(listObj.children);
			var idx = childs.indexOf(header);
			
			var headers = Array.prototype.slice.call(listObj.querySelectorAll('.label'));
			var idx2 = headers.indexOf(header);
			
			
			if(idx >= listObj.children.length+1) {
				listObj.append(entry);
			} else {
				listObj.insertBefore(entry, listObj.children[childs.indexOf(headers[idx2+1])])
			}
			
			date.setDate(date.getDate() + 1);
		}
		
	}
	swlCalendarItemProto.dayListHeader = function(date, listObj) {
		var entry = this.listHeaderTpl.cloneNode(true);
		
		entry.querySelector('.label').setAttribute('datetime', date.toISOString().slice(0,10));
		entry.querySelector('.label div:first-of-type').textContent = date.toLocaleString(swlCalendarConfig.locale, { weekday: 'long' });
		entry.querySelector('.label div:last-of-type').textContent = date.toLocaleString(swlCalendarConfig.locale, swlCalendarConfig.date.date);
		
		// check where to append
		var headers = Array.prototype.slice.call(listObj.querySelectorAll(listObj.getAttribute('selector')));
		for(var i = 0; i < headers.length; i++) {
			var hDate0 = new Date(headers[i].getAttribute('datetime')); hDate0.setHours(0,-hDate0.getTimezoneOffset(),0,0);
			var hDate1 = null;
			if(headers[i+1]) {
				hDate1 = new Date(headers[i+1].getAttribute('datetime'));
				hDate1.setHours(0,-hDate0.getTimezoneOffset(),0,0);
			}
			
			if(hDate0 > date) {
				var ret = entry.querySelector('.label')
				listObj.insertBefore(entry, headers[i]);
				return ret;
			} else if (headers.length == 1 && hDate0 > date) {
				var ret = entry.querySelector('.label')
				listObj.insertBefore(entry, headers[0]);
				return ret;
			} else if(hDate1 > date) {
				var ret = entry.querySelector('.label')
				listObj.insertBefore(entry, headers[i+1]);
				return ret;
			}
		}
		
		var ret = entry.querySelector('.label')
		listObj.appendChild(entry);
		return ret;
	}
	
	document.registerElement('swl-calendar-item', {
		prototype: swlCalendarItemProto
	});
	
	
})();
