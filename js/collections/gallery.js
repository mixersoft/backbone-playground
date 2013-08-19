// /js/collections/gallery.js

/*
 * notes from Robert
 * - GalleryCollection extends paginator
 * - pass constructor array of Shots
 * - should auto render grid of Thumbs 
 * 
 */
var snappi = snappi || {};

/*
 * Collection: GalleryCollection
 * properties:
 * - thumbSize
 * - layout
 * methods:
 * - nextPage()
 * - prevPage()
 */
snappi.GalleryCollection = Backbone.Collection.extend({
  model: snappi.Shot
});