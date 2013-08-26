// /js/mixins/snappi.js
(function ( mixins ) {
	
// dependencies got LayoutEngine.Typeset
/**
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 * 
 * https://github.com/bramstein/typeset
 * 
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */
if("undefined"===typeof Typeset){var Typeset={}}Typeset.LinkedList=(function(undefined){function LinkedList(){this.head=null;this.tail=null;this.listSize=0}LinkedList.Node=function(data){this.prev=null;this.next=null;this.data=data};LinkedList.Node.prototype.toString=function(){return this.data.toString()};LinkedList.prototype.isLinked=function(node){return !((node&&node.prev===null&&node.next===null&&this.tail!==node&&this.head!==node)||this.isEmpty())};LinkedList.prototype.size=function(){return this.listSize};LinkedList.prototype.isEmpty=function(){return this.listSize===0};LinkedList.prototype.first=function(){return this.head};LinkedList.prototype.last=function(){return this.last};LinkedList.prototype.toString=function(){return this.toArray().toString()};LinkedList.prototype.toArray=function(){var node=this.head,result=[];while(node!==null){result.push(node);node=node.next}return result};LinkedList.prototype.forEach=function(fun){var node=this.head;while(node!==null){fun(node);node=node.next}};LinkedList.prototype.contains=function(n){var node=this.head;if(!this.isLinked(n)){return false}while(node!==null){if(node===n){return true}node=node.next}return false};LinkedList.prototype.at=function(i){var node=this.head,index=0;if(i>=this.listLength||i<0){return null}while(node!==null){if(i===index){return node}node=node.next;index+=1}return null};LinkedList.prototype.insertAfter=function(node,newNode){if(!this.isLinked(node)){return this}newNode.prev=node;newNode.next=node.next;if(node.next===null){this.tail=newNode}else{node.next.prev=newNode}node.next=newNode;this.listSize+=1;return this};LinkedList.prototype.insertBefore=function(node,newNode){if(!this.isLinked(node)){return this}newNode.prev=node.prev;newNode.next=node;if(node.prev===null){this.head=newNode}else{node.prev.next=newNode}node.prev=newNode;this.listSize+=1;return this};LinkedList.prototype.push=function(node){if(this.head===null){this.unshift(node)}else{this.insertAfter(this.tail,node)}return this};LinkedList.prototype.unshift=function(node){if(this.head===null){this.head=node;this.tail=node;node.prev=null;node.next=null;this.listSize+=1}else{this.insertBefore(this.head,node)}return this};LinkedList.prototype.remove=function(node){if(!this.isLinked(node)){return this}if(node.prev===null){this.head=node.next}else{node.prev.next=node.next}if(node.next===null){this.tail=node.prev}else{node.next.prev=node.prev}this.listSize-=1;return this};LinkedList.prototype.pop=function(){var node=this.tail;this.tail.prev.next=null;this.tail=this.tail.prev;this.listSize-=1;node.prev=null;node.next=null;return node};LinkedList.prototype.shift=function(){var node=this.head;this.head.next.prev=null;this.head=this.head.next;this.listSize-=1;node.prev=null;node.next=null;return node};return LinkedList})();Typeset.linebreak=(function(){var linebreak=function(nodes,lines,settings){var options={demerits:{line:settings&&settings.demerits&&settings.demerits.line||10,flagged:settings&&settings.demerits&&settings.demerits.flagged||100,fitness:settings&&settings.demerits&&settings.demerits.fitness||3000},tolerance:settings&&settings.tolerance||2},activeNodes=new Typeset.LinkedList(),sum={width:0,stretch:0,shrink:0},lineLengths=lines,breaks=[],tmp={data:{demerits:Infinity}};function breakpoint(position,demerits,ratio,line,fitnessClass,totals,previous){return{position:position,demerits:demerits,ratio:ratio,line:line,fitnessClass:fitnessClass,totals:totals||{width:0,stretch:0,shrink:0},previous:previous}}function computeCost(start,end,active,currentLine){var width=sum.width-active.totals.width,stretch=0,shrink=0,lineLength=currentLine<lineLengths.length?lineLengths[currentLine-1]:lineLengths[lineLengths.length-1];if(nodes[end].type==="penalty"){width+=nodes[end].width}if(width<lineLength){stretch=sum.stretch-active.totals.stretch;if(stretch>0){return(lineLength-width)/stretch}else{return linebreak.infinity}}else{if(width>lineLength){shrink=sum.shrink-active.totals.shrink;if(shrink>0){return(lineLength-width)/shrink}else{return linebreak.infinity}}else{return 0}}}function computeSum(breakPointIndex){var result={width:sum.width,stretch:sum.stretch,shrink:sum.shrink},i=0;for(i=breakPointIndex;i<nodes.length;i+=1){if(nodes[i].type==="glue"){result.width+=nodes[i].width;result.stretch+=nodes[i].stretch;result.shrink+=nodes[i].shrink}else{if(nodes[i].type==="box"||(nodes[i].type==="penalty"&&nodes[i].penalty===-linebreak.infinity&&i>breakPointIndex)){break}}}return result}function mainLoop(node,index,nodes){var active=activeNodes.first(),next=null,ratio=0,demerits=0,candidates=[],badness,currentLine=0,tmpSum,currentClass=0,fitnessClass,candidate,newNode;while(active!==null){candidates=[{demerits:Infinity},{demerits:Infinity},{demerits:Infinity},{demerits:Infinity}];while(active!==null){next=active.next;currentLine=active.data.line+1;ratio=computeCost(active.data.position,index,active.data,currentLine);if(ratio<-1||(node.type==="penalty"&&node.penalty===-linebreak.infinity)){activeNodes.remove(active)}if(-1<=ratio&&ratio<=options.tolerance){badness=100*Math.pow(Math.abs(ratio),3);if(node.type==="penalty"&&node.penalty>=0){demerits=Math.pow(options.demerits.line+badness+node.penalty,2)}else{if(node.type==="penalty"&&node.penalty!==-linebreak.infinity){demerits=Math.pow(options.demerits.line+badness-node.penalty,2)}else{demerits=Math.pow(options.demerits.line+badness,2)}}if(node.type==="penalty"&&nodes[active.data.position].type==="penalty"){demerits+=options.demerits.flagged*node.flagged*nodes[active.data.position].flagged}if(ratio<-0.5){currentClass=0}else{if(ratio<=0.5){currentClass=1}else{if(ratio<=1){currentClass=2}else{currentClass=3}}}if(Math.abs(currentClass-active.data.fitnessClass)>1){demerits+=options.demerits.fitness}demerits+=active.data.demerits;if(demerits<candidates[currentClass].demerits){candidates[currentClass]={active:active,demerits:demerits,ratio:ratio}}}active=next;if(active!==null&&active.data.line>=currentLine){break}}tmpSum=computeSum(index);for(fitnessClass=0;fitnessClass<candidates.length;fitnessClass+=1){candidate=candidates[fitnessClass];if(candidate.demerits<Infinity){newNode=new Typeset.LinkedList.Node(breakpoint(index,candidate.demerits,candidate.ratio,candidate.active.data.line+1,fitnessClass,tmpSum,candidate.active));if(active!==null){activeNodes.insertBefore(active,newNode)}else{activeNodes.push(newNode)}}}}}activeNodes.push(new Typeset.LinkedList.Node(breakpoint(0,0,0,0,0,undefined,null)));nodes.forEach(function(node,index,nodes){if(node.type==="box"){sum.width+=node.width}else{if(node.type==="glue"){if(index>0&&nodes[index-1].type==="box"){mainLoop(node,index,nodes)}sum.width+=node.width;sum.stretch+=node.stretch;sum.shrink+=node.shrink}else{if(node.type==="penalty"&&node.penalty!==linebreak.infinity){mainLoop(node,index,nodes)}}}});if(activeNodes.size()!==0){activeNodes.forEach(function(node){if(node.data.demerits<tmp.data.demerits){tmp=node}});while(tmp!==null){breaks.push({position:tmp.data.position,ratio:tmp.data.ratio});tmp=tmp.data.previous}return breaks.reverse()}return[]};linebreak.infinity=10000;linebreak.glue=function(width,stretch,shrink){return{type:"glue",width:width,stretch:stretch,shrink:shrink}};linebreak.box=function(width,value){return{type:"box",width:width,value:value}};linebreak.penalty=function(width,penalty,flagged){return{type:"penalty",width:width,penalty:penalty,flagged:flagged}};return linebreak})();


	
	mixins.LayoutEngine = {	}
	
	/*
	 * Flickr-style layout using the typeset linebreak algorithm to justify thumbnails
	 * 	1. call linebreak() with array of items to create justified rows
	 * 	2. call layout() to position/resize items inside justified rows 
	 */
	mixins.LayoutEngine.Typeset = {
		initialize: function(options){
			if (options && !options.complete) {
				var defaults = {
					outerContainer: '.gallery',
					thumbsContainer: '.gallery .body', // or .body .page,
					thumbSelector: '.thumb',
					imgSelector: '.crop-wrap > .crop > img',
					
					// layout config options
		            targetHeight: 160, // Each row of images will be at least this high
		            targetWidth: 940, // Set large enough to accomodate the odd image that spans the entire screen width
		            showCaptions: true, // Should we overlay captions on top of images?
		            space : {
						width: 15, // What spacing should we try to achieve between images
						stretch: 35, // How many pixels should the gap between images grow by at most?
						shrink: 50 // How many pixels should we allow that gap to shrink by (it can safely end up negative! images will have edges cropped) 
					},
					maxVertScale: 1.4, //What is the largest factor we should scale lines by vertically to fill gaps?
					classes: {
						boundingbox: 'flickrd',	// apply class to GalleryView.$el
						throttle: 'working',
					},
					
					// browser support
					supportsBackgroundStretch : ('backgroundSize' in document.documentElement.style),
					
					// static variables for multi-page layouts 
					_last_layout_container_width : 0,		// ???:used to check container resize
					_layout_y : 0,				// set _layout_y==0 to start from top
					containerWidth: 0,
					
					// just merge options once
					complete: true,	
				}
				options = _.extend(defaults, options || {});
			}
			return options;
		},
		/**
		 * @param jquery container, .gallery .body, GalleryView.$(.body .page)
		 * @param jquery items jquery array of img objects [ThumbView.$('img')]
		 * 		note: items may be NEW IMGs rendered offscreen, or
		 * 			if null, then existing IMGs in container for relayout 
		 * @param Object options, defaults for layout engine, including 'context' for multi-page layouts
		 */	
		run: function(container, items, collection, options){
			var engine = mixins.LayoutEngine.Typeset;
			// TODO: need to keep a static options avail for relayout
			if (!options.complete) options = engine.initialize(options);
			if (options.outerContainer.hasClass(options.classes.throttle)){
				console.warn('throttle LayoutEngine.Typeset.run()  ');
				return false;
			}
			/* 
			 * Ensure there is a vertical scrollbar on the body, so that laying out images doesn't cause the image 
             * container to shrink horizontally, which would invalidate the layout immediately.
             */
            var originalOverflowY = document.body.style["overflow-y"];
            if (originalOverflowY != "scroll") {
            	document.body.style["overflow-y"] = "scroll";
            }
            options.containerWidth = options.thumbsContainer.outerWidth() - 15;
            
            /*
             * this is where the work is done
             */
            options.outerContainer.addClass(options.classes.throttle);
            var lines = engine._linebreak.call(this, container, items, collection, options);
            engine._layout.call(this, lines, options);
            options.outerContainer.removeClass(options.classes.throttle);
            /*
             * done
             */

			// cleanup
			container.css('height', options._layout_y + "px");
			if (originalOverflowY != "scroll") {
            	document.body.style["overflow-y"] = originalOverflowY;
            }
            // add class to indicate layout engine  
            options.outerContainer.addClass(options.classes.boundingbox);
            
            return {
            	state : options, // return options/state for multi-page layouts using same settings
            	items: items
            };		
		},
		/**
		 * @param jquery container, .gallery .body, GalleryView.$(.body .page)
		 * @param jquery items jquery array of img objects [ThumbView.$('img')]
		 * 		note: items may be NEW imgs to add to container.
		 * @param Object options, 'context' for layout 
		 */		
		_linebreak: function(container, items, collection, options){
            
            // sanity checks
            if (!items || items.length === 0) items = container.find(options.imgSelector);
            if (items.get(0).tagName != 'IMG') {
            	items = items.find(options.imgSelector);
            	if (items.get(0).tagName != 'IMG')  throw ('expecting IMG tags');
            }
            
			var nodes = [],
    			breaks = [],
    			lines = [],
    			images = [],
    			image, model,
    			i, point, r, lineStart = 0,
    			x;
    			
    		for (i = 0; i < items.length; i++) {
    			var img_tag = items.get(i);
    			
    			/*
    			 * get related model
    			 */
    			try {
    				model = collection.findWhere({id:img_tag.parentNode.parentNode.parentNode.id});
    					thumbAttr = model.toJSON();
    			} catch (ex) {
    				console.error('Model not found for img='+img_tag);
    			}
    			
    			    			
    			image = {
    				width: thumbAttr.origW / thumbAttr.origH * options.targetHeight, 
    				height: options.targetHeight, 
    				model: thumbAttr, 
    				tag: img_tag
    			};
    			
    			images.push(image);
    			
    			nodes.push(Typeset.linebreak.box(image.width, image));
    	
    			if (i === items.length - 1) {
    				nodes.push(Typeset.linebreak.penalty(0, -Typeset.linebreak.infinity, 1));
    			} else {
    				nodes.push(Typeset.linebreak.glue(options.space.width, options.space.stretch, options.space.shrink));
    			}
    		};
    		
    		// Perform the line breaking
    		breaks = Typeset.linebreak(nodes, [options.containerWidth], {tolerance: 100000});
    	
    		// Try again with a higher tolerance if the line breaking failed.
    		if (breaks.length === 0) {
    			breaks = Typeset.linebreak(nodes, [options.containerWidth], {tolerance: 1000000});
    			// And again
    			if (breaks.length === 0) {
    				breaks = Typeset.linebreak(nodes, [options.containerWidth], {tolerance: 10000000});
    			}
    		}	
    		
    		// Build lines from the line breaks found.
    		for (i = 1; i < breaks.length; i++) {
    			point = breaks[i].position,
    			r = breaks[i].ratio;
    	
    			for (var j = lineStart; j < nodes.length; j++) {
    				// After a line break, we skip any nodes unless they are boxes
    				if (nodes[j].type === 'box') {
    					lineStart = j;
    					break;
    				}
    			}
    			lines.push({ratio: r, nodes: nodes.slice(lineStart, point + 1), position: point});
    			lineStart = point;
    		}
    		
    		return lines;	
    		
		},
		_layout:function(lines, options){
			lines.forEach(function (line) {
    			var	
    				lineImages = [],
    				imagesTotalWidth = 0,
    				lineHeight = 0;

    			// Filter out the spacers to just leave the images:
    			line.nodes.forEach(function (n, index, array) {
    				if (n.type === 'box') {
    					var image = n.value;
    					
    					imagesTotalWidth += image.width;
    					lineHeight = image.height > lineHeight ? image.height : lineHeight;
    					
    					lineImages.push(image);
    				}
    			});
    				
    			if (lineImages.length > 0) {
    				var 
    					spacing = lineImages.length <= 1 ? 0 : (options.containerWidth - imagesTotalWidth) / (lineImages.length - 1),
    					totalHorzCrop = 0, totalVertCrop = 0,
    					scale = 1;
    				
    				if (lineImages.length > 1) {
	    				// Do we have to crop images to fit on this line?
    					if (spacing < options.space.width) {
    						//Total up the crop so we can apply it proportionately to the images on the line
    						totalHorzCrop = (lineImages.length - 1) * (options.space.width - spacing);
    						
    						scale = 1;
    						
    						//We shrink enough that we can get perfect minimum spacing
    						spacing = options.space.width;
    					} else if (spacing > options.space.width) {
    						// We have to inflate the images to fit on the line
    						scale = (options.containerWidth - (lineImages.length - 1) * options.space.width) / imagesTotalWidth;
    							    						
    						spacing = (options.containerWidth - imagesTotalWidth * scale) / (lineImages.length - 1);
    					}
    				} else {
    					//Scale up or down (infinitely) to fill the line
    					scale = options.containerWidth / imagesTotalWidth;
    					spacing = 0;
    				}
    				
					//Do we have to overfill the line vertically in order to fill it horizontally?
					if (scale > options.maxVertScale) {
						totalVertCrop = lineHeight * scale - targetHeight * maxVertScale;
					}
    				
    				//Now lay out the images
    				x = 0;
    				
    				// ThumbnailView: .thumb > .crop-wrap > .crop > IMG
    				for (var i = 0; i < lineImages.length; i++) {
    					var 
    						image = lineImages[i],
	    					border = image.tag.parentNode,  // A or DIV
	    					thumbViewEl = image.tag.parentNode.parentNode.parentNode, // ThumbnailView.el
	    					imageHorzCrop = 0; 
    					
    					if (totalHorzCrop > 0) {
    						imageHorzCrop = (image.width / imagesTotalWidth) * totalHorzCrop;
    					} else if (scale != 1) {
    						image.width *= scale;
    						image.height *= scale;
    					}

    					image.tag.style.top = '0px';
    					thumbViewEl.style.top = options._layout_y + "px";

						if (i == lineImages.length - 1) {
	    					//The rightmost image should be flush with the right margin:
    						x = options.containerWidth - (image.width - imageHorzCrop);
    					}
							    					
    					thumbViewEl.style.left = x + "px";

						if (!options.supportsBackgroundStretch && image.tag.src.indexOf('/img/spacer.gif') > -1) {
							// On IE < 9 we will have to weaken the right click protection slightly by moving the image from the background to the src attribute
							image.tag.src = image.tag.style.backgroundImage.match(/url\((.+)\)/)[1];
							image.tag.style.backgroundImage = "none";
						}

    					if (image.tag.src.indexOf('/img/spacer.gif') > -1) {
	    					image.tag.style.backgroundSize = Math.round(image.width) + 'px ' + Math.round(image.height) + 'px';
	    					image.tag.style.backgroundPosition = -Math.floor(imageHorzCrop / 2) + "px " + -Math.floor(totalVertCrop / 2) + "px";
	    						
	    					image.tag.style.height = Math.round(image.height - totalVertCrop) + "px";
	    					image.tag.style.width = Math.round(image.width - imageHorzCrop) + "px";	    						
    					} else {
	    					image.tag.style.width = Math.round(image.width) + 'px';
	    					image.tag.style.height = Math.round(image.height) + 'px';
	    					
	    					// adjust img src prefix to fit actual dim
							var thumbsize_prefix = mixins.Href.getThumbsizePrefix(image);
							image.tag.src = mixins.Href.getImgSrc(image.model, thumbsize_prefix, i);
		
    						border.style.height = Math.round(image.height - totalVertCrop) + "px";
    						border.style.width = Math.round(image.width - imageHorzCrop) + "px";
    						
    						image.tag.style.left = -Math.floor(imageHorzCrop / 2) + "px";
    						image.tag.style.top = -Math.floor(totalVertCrop / 2) + "px";
    					}
    					
    					x += image.width - imageHorzCrop + spacing;
    				}
    			  				
    				options._layout_y += lineHeight * scale - totalVertCrop + options.space.width;
    			}
    		});	
		},
	}
	
})( snappi.mixins);