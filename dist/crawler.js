/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _crawlerService = __webpack_require__(1);

	var _rsvp = __webpack_require__(4);

	var _rsvp2 = _interopRequireDefault(_rsvp);

	var _lodash = __webpack_require__(5);

	var _lodash2 = _interopRequireDefault(_lodash);

	var _url = __webpack_require__(6);

	var _url2 = _interopRequireDefault(_url);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var config = {
	    address: 'http://beeradvocate.com'
	};

	var getBeerStats = function getBeerStats() {
	    (0, _crawlerService.findAvailableStateCodes)(_url2.default.parse(config.address + '/place/directory/0/US/')).then(function (validStateCodes) {
	        console.log('Received valid state codes: ' + validStateCodes);

	        var promises = {};
	        // go get the breweries count
	        validStateCodes.map(function (stateCode) {
	            promises[stateCode] = (0, _crawlerService.getBreweryCount)(_url2.default.parse(config.address + '/place/list/?c_id=US&s_id=' + stateCode + '&brewery=Y'));
	        });
	        return _rsvp2.default.hash(promises);
	    }).then(function (breweryCountPerState) {

	        console.log('Received brewery count per state:');
	        console.dir(breweryCountPerState);

	        // get all brewery links per state and condense them all to a large list of every brewery link
	        var promises = [];
	        // this will now allow us to traverse the entire state's brewery list

	        var _loop = function _loop(stateCode) {
	            _lodash2.default.range(0, breweryCountPerState[stateCode], 20).forEach(function (startKey) {
	                promises.push((0, _crawlerService.getBreweryLinks)(_url2.default.parse(config.address + '/place/list/?start=' + startKey + '&c_id=US&s_id=' + stateCode + '&brewery=Y')));
	            });
	        };

	        for (var stateCode in breweryCountPerState) {
	            _loop(stateCode);
	        };
	        return _rsvp2.default.all(promises).then(function (result) {
	            return _lodash2.default.flattenDeep(result);
	        });
	    }).then(function (breweryLinks) {
	        console.log('Received brewery links for every state: ' + breweryLinks.length + ' total breweries found.');
	        // console.log(breweryLinks);
	        //get all beer links per brewery

	        var promises = [];
	        breweryLinks.slice(0, 2).forEach(function (link) {
	            promises.push((0, _crawlerService.getBeerLinks)(_url2.default.parse('' + config.address + link)));
	        });

	        return _rsvp2.default.all(promises).then(function (result) {
	            return _lodash2.default.flattenDeep(result);
	        });
	    }).then(function (beerLinks) {
	        console.log('Received beer links for every brewery: ' + beerLinks.length + ' total beers found.');
	        // got all the beer links
	        beerLinks.map(function (link) {
	            console.log('' + config.address + link);
	        });
	    });
	};

	getBeerStats();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.getBeer = exports.getBeerLinks = exports.getBreweryLinks = exports.getBreweryCount = exports.findAvailableStateCodes = undefined;

	var _nodeFetch = __webpack_require__(2);

	var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

	var _cheerio = __webpack_require__(3);

	var _cheerio2 = _interopRequireDefault(_cheerio);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var findAvailableStateCodes = function findAvailableStateCodes(url) {
	    return (0, _nodeFetch2.default)(url.href).then(function (resp) {
	        return resp.text();
	    }).then(function (body) {
	        // load cheerio to parse the html of the response
	        var $ = _cheerio2.default.load(body);

	        // find all anchor tags
	        // then get valid anchor tags that have the href attribute
	        // then if the href attribute starts with the url.path return true else false
	        // -- this logic was known by looking at the page structure
	        // the filteredNodes is an array that contains all the valid state links
	        var filteredNodes = Array.prototype.filter.call($('a'), function (i) {
	            var link = $(i).attr('href');
	            if (link && link.startsWith(url.path)) {
	                return true;
	            } else {
	                return false;
	            }
	        });

	        // validate the state codes
	        // the value of 5 -- this is known by looking at the url path that the page returns.
	        // if the code length is 2 then it is valid state code
	        var validStateCodes = filteredNodes.map(function (node) {
	            return $(node).attr('href').split('/')[5];
	        }).filter(function (code) {
	            return code.length === 2;
	        });

	        return validStateCodes;
	    }).catch(function (err) {
	        console.log(err);
	    });
	};

	var getBreweryCount = function getBreweryCount(url) {
	    // url is a url object that will include the state code.
	    return (0, _nodeFetch2.default)(url.href).then(function (resp) {
	        return resp.text();
	    }).then(function (body) {
	        var $ = _cheerio2.default.load(body);
	        // the below will selector will aim to get the total
	        // using that we can find how far to traverse this state's brewery list page.
	        var countText = $('table tr td span b', '#ba-content').first().text();
	        return countText.match(/out of (\d+)/g)[0].match(/(\d+)/g)[0];
	    }).catch(function (err) {
	        console.log(err);
	    });
	};

	var getBreweryLinks = function getBreweryLinks(url) {
	    // we are given a brewery list page
	    // go find all the brewery links
	    return (0, _nodeFetch2.default)(url.href).then(function (resp) {
	        return resp.text();
	    }).then(function (body) {
	        var $ = _cheerio2.default.load(body);
	        var filteredNodes = Array.prototype.filter.call($('a'), function (i) {
	            var link = $(i).attr('href');
	            if (link && link.startsWith('/beer/profile/')) {
	                return true;
	            } else {
	                return false;
	            }
	        });

	        var validLinks = filteredNodes.map(function (node) {
	            return $(node).attr('href');
	        });

	        return validLinks;
	    }).catch(function (err) {
	        console.log(err);
	    });
	};

	var getBeerLinks = function getBeerLinks(url) {
	    // we are given the brewery page
	    // go find all beer links
	    return (0, _nodeFetch2.default)(url.href).then(function (resp) {
	        return resp.text();
	    }).then(function (body) {
	        // process the text body of beers list
	        var $ = _cheerio2.default.load(body);
	        var filteredNodes = Array.prototype.filter.call($('a'), function (i) {
	            var link = $(i).attr('href');
	            if (link && link.startsWith(url.path)) {
	                return true;
	            } else {
	                return false;
	            }
	        });

	        var validLinks = filteredNodes.map(function (node) {
	            return $(node).attr('href');
	        }).filter(function (links) {
	            return links.match(/\/$/);
	        });
	        return validLinks;
	    }).catch(function (err) {
	        console.log(err);
	    });
	};

	var getBeer = function getBeer(url) {
	    console.log('going to ', url);
	    return (0, _nodeFetch2.default)(url).then(function (resp) {
	        return resp.text();
	    }).then(function (body) {
	        // process the text body of the beer profile
	        var $ = _cheerio2.default.load(body);
	        var title = $('.titleBar > h1').text();
	        var score = $('.BAscore_big.ba-score').text();
	        var scoreText = $('.ba-score_text').text();

	        var beer = {
	            name: title.split(' | ')[0],
	            brewery: title.split(' | ')[1],
	            beerScore: score,
	            scoreText: scoreText
	        };
	        return beer;
	    }).catch(function (err) {
	        console.log(err);
	    });
	};

	exports.findAvailableStateCodes = findAvailableStateCodes;
	exports.getBreweryCount = getBreweryCount;
	exports.getBreweryLinks = getBreweryLinks;
	exports.getBeerLinks = getBeerLinks;
	exports.getBeer = getBeer;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("node-fetch");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("cheerio");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("rsvp");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("lodash");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("url");

/***/ }
/******/ ]);