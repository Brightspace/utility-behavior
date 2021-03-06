/*
* General utility functions for parsing organization siren entities.
*/
export const D2LOrganizationHMMixin = (superclass) => class extends superclass {
	constructor() {
		super();
		this._sizeNames = ['lowMin', 'lowMid', 'lowMax', 'highMin', 'highMid', 'highMax'];

		this._srcSetBreakpoints = {
			tile: {
				lowMin: 145, lowMid: 220, lowMax: 540,
				highMin: 290, highMid: 440, highMax: 1080
			},
			narrow: {
				lowMin: 320, lowMid: 375, lowMax: 767,
				highMin: 640, highMid: 750, highMax: 1534
			}
		};
	}

	/**
	 * Creates a a set of `srcset` strings from a Siren organization-image
	 * entity to be used as <source>s in a <picture> tag.
	 * @param {Entity} image Siren organization image entity. Must be a hydrated entity (not a linked entity).
	 * @param {string} imageClass Class used to find correct organization image links. Defaults to `tile`.
	 * @param {bool} forceImageRefresh If true, generated URLs will include a cache-busting timestamp.
	 * @return {{type: string, srcset: string}[]} `srcset` and `type` pairs to use as a <source>.
	 */
	getPictureSrcsets(image, imageClass, forceImageRefresh) {
		if (!image || image.href) {
			return;
		}

		var self = this;

		var linksByType = this._getImageLinks(image, imageClass);
		var sources = Object.keys(linksByType).map(function(type) {
			var srcset = self._getSrcSet(linksByType[type], imageClass, forceImageRefresh);
			return { type: type, srcset: srcset };
		});
		return sources;
	}
	/**
	 * Creates a `srcset` string from a Siren organization-image entity to
	 * be used with an <img> tag.
	 * @param {Entity} image Siren organization image entity. Must be a hydrated entity (not a linked entity).
	 * @param {string} imageClass Class used to find correct organization image links. Defaults to `tile`.
	 * @param {bool} forceImageRefresh If true, generated URLs will include a cache-busting timestamp
	 * @return {string} `srcset` to be used with an <img> tag.
	 */
	getImageSrcset(image, imageClass, forceImageRefresh) {
		if (!image || image.href) {
			return;
		}

		var defaultLinks = this._getBestImageLinks(image, imageClass);
		var srcset = this._getSrcSet(defaultLinks, imageClass, forceImageRefresh);
		return srcset;
	}
	/**
	 * Gets the link to the image entity with the given `imageClass` class
	 * Defaults to the image entity with the `tile` class if `imageClass`
	 * is not provided.
	 * @param {Entity} image Siren organization-image entity. Must be a hydrated entity (not a linked entity).
	 * @param {string} imageClass Class used to find correct organization image link. Defaults to `tile`.
	 * @return {string} URL of image with the requested `imageClass`.
	 */
	getDefaultImageLink(image, imageClass) {
		if (!image || image.href) {
			return;
		}

		var sizes = this._getBestImageLinks(image, imageClass);
		if (!sizes) {
			return;
		}
		return sizes.highMax || sizes.lowMax || sizes.highMid || sizes.lowMid || sizes.highMin || sizes.lowMin;
	}
	_getImageLinks(image, imageClass) {
		var imageLinks = image.getLinksByClass(imageClass || 'tile'),
			sizesByType = {};
		imageLinks.forEach(function(link) {
			var sizes = sizesByType[link.type] = sizesByType[link.type] || {};
			var size = link.hasClass('min') && 'Min' || link.hasClass('mid') && 'Mid' || link.hasClass('max') && 'Max',
				density = link.hasClass('high-density') ? 'high' : 'low';
			sizes[density + size] = link.href;
		});
		return sizesByType;
	}
	_getBestImageLinks(image, imageClass) {
		var linksByType = this._getImageLinks(image, imageClass);

		var jpegLinks = linksByType['image/jpeg'];
		if (jpegLinks) {
			return jpegLinks;
		}

		for (var type in linksByType) {
			return linksByType[type];
		}
	}
	_getSrcSet(sizes, imageClass, forceImageRefresh) {
		var breakpoints = this._getSrcsetBreakpoints(imageClass);

		var srcset = this._sizeNames.reduce(function(srcset, sizeName) {
			if (!sizes[sizeName]) {
				return srcset;
			}

			var sizeHref = sizes[sizeName];
			if (forceImageRefresh) {
				var separator = sizeHref.split('?')[1] ? '&' : '?';
				sizeHref += separator + 'timestamp=' + Date.now();
			}

			srcset += sizeHref + ' ' + breakpoints[sizeName] + 'w, ';
			return srcset;
		}, '');

		return srcset.replace(/,\s*$/, '');
	}

	_getSrcsetBreakpoints(imageClass) {
		var breakpoints = this._srcSetBreakpoints;

		return breakpoints[imageClass] || breakpoints.narrow;
	}
};
