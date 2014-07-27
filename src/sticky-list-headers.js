(function() {
	
	var swlStickyListHeadersProto = Object.create(HTMLDivElement.prototype, {
		createdCallback: {
			value: function() {
				this.createShadowRoot();
				//this.shadowRoot.resetStyleInheritance = true; // <-- get rid of anything inherited
				//root.applyAuthorStyles = true;
				
				this.shadowRoot.appendChild(document.createElement('content'));
				
				this.swlHeaderSelector = this.getAttribute('selector');
				
				this.addEventListener('scroll', function() {
					this.scroll();
				}.bind(this));
				
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
					var container = header.parentNode;
					
					var div = document.createElement('div');
					
					div.appendChild(header.cloneNode(true));
					
					header.setAttribute('style', header.getAttribute('style') + "filter:alpha(opacity=0); opacity:0;");
					
					
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
					this.swlHeaderSelector = this.getAttribute('selector');
					this.attachedCallback();
				}
			}
		}
	});
	swlStickyListHeadersProto.calculateOffsets = function() {
		this.swlHeaders.forEach(function(header, i) {
			this.shadowRoot.querySelector('div[data-offset-top]:nth-of-type('+(i+1)+')').setAttribute('data-offset-top', header.offsetTop);
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
			var	container = header.parentNode,
				current = this.shadowRoot.children[i+1],
				next = this.shadowRoot.children[i+2],
				prev = this.shadowRoot.children[i];
			
			
			if(current.offsetTop <= container.scrollTop) {
				current.style.top = container.scrollTop + "px";
				if(next) {
					if(current.offsetTop + current.offsetHeight >= parseInt(next.getAttribute('data-offset-top'))) {
						current.style.top = (next.offsetTop - current.offsetHeight) + "px";
					}
				} else {
					current.style.top = container.scrollTop + "px";
				}
				
			} else {
				if(current.offsetTop > parseInt(current.getAttribute('data-offset-top'))) {
					if(current.offsetTop >= parseInt(prev.getAttribute('data-offset-top')) + prev.offsetHeight || prev.tagName == 'CONTENT') {
						current.style.top = container.scrollTop + "px";
					}
				}
				if(current.offsetTop < parseInt(current.getAttribute('data-offset-top'))) {
					current.style.top = parseInt(current.getAttribute('data-offset-top')) + "px";
				}
			}
		}.bind(this));
	}
	
	document.registerElement('swl-sticky-list-headers', {
		prototype: swlStickyListHeadersProto,
		extends: 'div'
	});
	
	
})();

