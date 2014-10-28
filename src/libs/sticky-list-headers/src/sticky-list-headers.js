var swlStickyListHeadersProto = Object.create(HTMLDivElement.prototype, {
	createdCallback: {
		value: function() {
			this.cache = {
				ui: {
					timer: null,
					lastExecThrottle: 100,
					lastExec: new Date()
				}
			}
			this.createShadowRoot();
			this.shadowRoot.resetStyleInheritance = false; // <-- get rid of anything inherited
			this.shadowRoot.applyAuthorStyles = true; // <-- deprecated but need to add 'cause applying parent style
			
			this.shadowRoot.appendChild(document.createElement('content'));
			
			this.swlHeaderSelector = this.getAttribute('selector');
			
			this.addEventListener('scroll', function() {
				this.scroll();
			}.bind(this));
			
			
			window.addEventListener('resize', this.checkWindowSize.bind(this));
			
		}
	},
	attachedCallback: {
		value: function() {
			
			var headers = Array.prototype.slice.call(this.shadowRoot.querySelectorAll('div:not(content)'));
			headers.forEach(function(ele, i) {
				ele.parentNode.removeChild(ele);
			}.bind(this));
			
			this.swlHeaders = Array.prototype.slice.call(this.querySelectorAll(this.swlHeaderSelector));
			
			this.swlHeaders.forEach(function(header, i) {
				var style = header.getAttribute('style') || "";
				if(style.indexOf('opacity:') != -1) {
					header.style.opacity = "";
				}
				
				var div = document.createElement('div');
				//div.appendChild(header.cloneNode(true));
				div.appendChild(this.cloneMassive(header));
				
				//var clone = div.querySelector(':last-child');
				
				
				if(header.style.hasOwnProperty('opacity')) {
					header.style.opacity = 0;
				} else {
					header.setAttribute('style', style + "opacity:0;");
				}
				
				
				var style = "position: absolute; width: 100%;"
				style += " top: " + header.offsetTop + "px;";
				div.setAttribute('style', style);
				
				div.setAttribute('data-offset-top', "");
				
				this.shadowRoot.appendChild(div);
			}.bind(this));
			
		}
	},
	attributeChangedCallback: {
		value: function(attrName, oldVal, newVal) {
			if(attrName == 'selector') {
				this.rebuild();
			}
		}
	},
	rebuild: {
		value: function() {
			this.swlHeaderSelector = this.getAttribute('selector');
			this.attachedCallback();
		}
	},
	refresh: {
		value: function() {
			this.calculateOffsets();
		}
	}
});
swlStickyListHeadersProto.checkWindowSize = function(evt) {
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
	this.calculateOffsets();
}
swlStickyListHeadersProto.calculateOffsets = function() {
	
	this.swlHeaders.forEach(function(header, i) {
		//this.shadowRoot.querySelector('div[data-offset-top]:nth-of-type('+(i+1)+')').setAttribute('data-offset-top', header.offsetTop);
		var ele = this.shadowRoot.querySelectorAll('div[data-offset-top]')[i];
		ele.setAttribute('data-offset-top', header.offsetTop);
		
		if(header.offsetTop > header.parentNode.scrollTop) {
			ele.style.top = header.offsetTop + "px";
		}
		
		
	}.bind(this));
}
swlStickyListHeadersProto.scroll = function() {
	if(this.swlHeaders.length < this.querySelectorAll(this.swlHeaderSelector).length) {
		this.attachedCallback();
	}
	
	if(this.shadowRoot.querySelectorAll('div[data-offset-top=""]').length > 0) {
		this.calculateOffsets();
	}
	
	
	this.swlHeaders.forEach(function(header, i) {
		var	current = this.shadowRoot.children[i+1],
			next = this.shadowRoot.children[i+2],
			prev = this.shadowRoot.children[i];
		
		
		if(current.offsetTop <= this.scrollTop) {
			current.style.top = this.scrollTop + "px";
			if(next) {
				if(current.offsetTop + current.offsetHeight >= parseInt(next.getAttribute('data-offset-top'))) {
					current.style.top = (next.offsetTop - current.offsetHeight) + "px";
				}
			} else {
				current.style.top = this.scrollTop + "px";
			}
			
		} else {
			if(current.offsetTop > parseInt(current.getAttribute('data-offset-top'))) {
				if(current.offsetTop >= parseInt(prev.getAttribute('data-offset-top')) + prev.offsetHeight || prev.tagName == 'CONTENT') {
					current.style.top = this.scrollTop + "px";
				}
			}
			if(current.offsetTop < parseInt(current.getAttribute('data-offset-top'))) {
				current.style.top = parseInt(current.getAttribute('data-offset-top')) + "px";
			}
		}
	}.bind(this));
}
swlStickyListHeadersProto.scrollToElement = function(ele) {
	var style =  ele.currentStyle || window.getComputedStyle(ele);
	var header = this.getHeaderOfElement(ele);
	if(header) {
		var headerStyle = header.currentStyle || window.getComputedStyle(header);
		ele.parentNode.scrollTop = ele.offsetTop - header.offsetHeight - parseInt(style.marginTop) - parseInt(headerStyle.marginTop);
	} else {
		ele.parentNode.scrollTop = ele.offsetTop - parseInt(style.marginTop);
	}
<<<<<<< HEAD
	swlStickyListHeadersProto.scrollToElement = function(ele) {
		var style =  ele.currentStyle || window.getComputedStyle(ele);
		var header = this.getHeaderOfElement(ele);
		if(header) {
			var headerStyle = header.currentStyle || window.getComputedStyle(header);
			ele.parentNode.scrollTop = ele.offsetTop - header.offsetHeight - parseInt(style.marginTop) - parseInt(headerStyle.marginTop);
		} else {
			ele.parentNode.scrollTop = ele.offsetTop - parseInt(style.marginTop);
		}
	}
	swlStickyListHeadersProto.getHeaderOfElement = function(ele) {
		var children = Array.prototype.slice.call(ele.parentNode.children);
		for(var i = 0; i < this.swlHeaders.length; i++) {
			if(children.indexOf(this.swlHeaders[i]) > children.indexOf(ele)) {
				return this.swlHeaders[i-1];
			}
		}
		return null;
	}
	
=======
}
swlStickyListHeadersProto.getHeaderOfElement = function(ele) {
	var children = Array.prototype.slice.call(ele.parentNode.children);
	for(var i = 0; i < this.swlHeaders.length; i++) {
		if(children.indexOf(this.swlHeaders[i]) > children.indexOf(ele)) {
			return this.swlHeaders[i-1];
		}
	}
	return null;
}
swlStickyListHeadersProto.cloneMassive = function(node) {
	var clone = node.cloneNode(false);
>>>>>>> a3b27df9a6dbf70abe652e4a0fe0469c01f444e6
	
	if(!clone.hasOwnProperty('swlOriginal')) {
		Object.defineProperty(clone, 'swlOriginal', {
			writable: true,
			value: node
		});
	} else {
		clone.swlOriginal = node;
	}
	
	if(!clone.hasOwnProperty('swlListeners')) {
		Object.defineProperty(clone, 'swlListeners', {
			writable: true,
			value: []
		});
	} else {
		clone.swlListeners = [];
	}
	
	if(!node.hasOwnProperty('swlClone')) {
		Object.defineProperty(node, 'swlClone', {
			writable: true,
			value: clone
		})
	} else {
		node.swlClone = clone;
	}
	
	// create an observer instance
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if(mutation.type === "attributes") {
				if(mutation.attributeName === "class") {
					Array.prototype.slice.call(clone.classList).forEach(function(cls, i) {
						clone.classList.remove(cls);
					});
					Array.prototype.slice.call(node.classList).forEach(function(cls, i) {
						clone.classList.add(cls);
					});
				} else {
					if(mutation.attributeName !== 'style') {
						clone.setAttribute(mutation.attributeName, node.getAttribute(mutation.attributeName));
					}
				}
			}
		});
	});
	observer.observe(node, { attributes: true });
	
	// overwrite node event listener
	var addListener = node.__proto__.addEventListener;
	node.addEventListener = function(type, listener, useCapture) {
		// and bind the orginial node to the handler
		var binded = listener.bind(node);
		clone.swlListeners.push({
			listener: listener,
			binded: binded,
			type: type
		});
		
		return addListener.call(clone, type, binded, useCapture);
	}
	
	var removeListener = node.__proto__.removeEventListener;
	node.removeEventListener = function(type, listener, useCapture) {
		var binded = listener;
		for(var i = 0; i < clone.swlListeners.length; i++) {
			if(clone.swlListeners[i].type === type && clone.swlListeners[i].listener === listener) {
				binded = clone.swlListeners[i].binded;
			}
		}
		return removeListener.call(clone, type, binded, useCapture);
	}
	
	
	for(var i = 0; i < node.childNodes.length; i++) {
		clone.appendChild(this.cloneMassive(node.childNodes[i]));
	}
	
	return clone;
	
}

var SwlStickyListHeaders = document.registerElement('swl-sticky-list-headers', {
	prototype: swlStickyListHeadersProto,
	extends: 'div'
});

