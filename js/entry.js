import 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.js'; // lodash.debounce
import cleanData from './clean-data.js';
import graphicOverview from './graphic-overview.js';
import graphicTime from './graphic-time.js';
import graphicPrice from './graphic-price.js';
import graphicThings from './graphic-things.js';
import preloadImages from './preload-image.js';

const $body = d3.select('body');
let previousWidth = 0;

function resize() {
	// only do resize on width changes, not height
	// (remove the conditional if you want to trigger on height change)
	const width = $body.node().offsetWidth;
	if (previousWidth !== width) {
		previousWidth = width;
		graphicOverview.resize();
		graphicTime.resize();
		graphicPrice.resize();
		// graphicThings.resize();
	}
}

function init() {
	// add mobile class to body tag
	// setup resize event
	window.addEventListener('resize', _.debounce(resize, 150));

	// kick off graphic code
	d3.csv('data/data.csv').then(function (response) {
		const singerData = cleanData.singer(response);
		graphicOverview.init(singerData);
		graphicTime.init(singerData);
		graphicPrice.init(singerData);
		graphicThings.init(singerData);
		preloadImages(singerData);
	})
	// .catch(function (error) {
	// 	reject(error);
	// });
}

init();
