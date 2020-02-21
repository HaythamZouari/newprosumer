(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["app"],{

/***/ "./assets/js/app.js":
/*!**************************!*\
  !*** ./assets/js/app.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! core-js/modules/es.symbol */ "./node_modules/core-js/modules/es.symbol.js");

__webpack_require__(/*! core-js/modules/es.symbol.description */ "./node_modules/core-js/modules/es.symbol.description.js");

__webpack_require__(/*! core-js/modules/es.symbol.iterator */ "./node_modules/core-js/modules/es.symbol.iterator.js");

__webpack_require__(/*! core-js/modules/es.array.concat */ "./node_modules/core-js/modules/es.array.concat.js");

__webpack_require__(/*! core-js/modules/es.array.from */ "./node_modules/core-js/modules/es.array.from.js");

__webpack_require__(/*! core-js/modules/es.array.is-array */ "./node_modules/core-js/modules/es.array.is-array.js");

__webpack_require__(/*! core-js/modules/es.array.iterator */ "./node_modules/core-js/modules/es.array.iterator.js");

__webpack_require__(/*! core-js/modules/es.date.to-string */ "./node_modules/core-js/modules/es.date.to-string.js");

__webpack_require__(/*! core-js/modules/es.number.constructor */ "./node_modules/core-js/modules/es.number.constructor.js");

__webpack_require__(/*! core-js/modules/es.object.to-string */ "./node_modules/core-js/modules/es.object.to-string.js");

__webpack_require__(/*! core-js/modules/es.regexp.to-string */ "./node_modules/core-js/modules/es.regexp.to-string.js");

__webpack_require__(/*! core-js/modules/es.string.iterator */ "./node_modules/core-js/modules/es.string.iterator.js");

__webpack_require__(/*! core-js/modules/web.dom-collections.iterator */ "./node_modules/core-js/modules/web.dom-collections.iterator.js");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var Finance = __webpack_require__(/*! financejs */ "./node_modules/financejs/finance.js");

var finance = new Finance();

window.tri = function tri(cashflowIn, cashflow) {
  return finance.IRR.apply(finance, [cashflowIn].concat(_toConsumableArray(cashflow)));
};

window.van2 = function van2(taux_credit, cashflow) {
  return finance.NPV.apply(finance, [taux_credit / 100, 0].concat(_toConsumableArray(cashflow)));
};

window.van = function van(taux_act, capex, subv, cashflow) {
  return finance.NPV.apply(finance, [taux_act / 100 * (capex * (1 - subv / 100))].concat(_toConsumableArray(cashflow)));
};

window.vancfads = function vancfads(taux_int, cfads) {
  return finance.NPV.apply(finance, [taux_int / 100, 0].concat(_toConsumableArray(cfads)));
};
/**
 * @return {number}
 */


window.wacc = function wacc(capex, subv, credit, taux_act, taux_credit) {
  return finance.WACC(capex * (1 - subv / 100) - credit, credit, taux_act / 100, taux_credit / 100, 0);
};

window.round = function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

window.tempretour = function temprtr(temp_proj, cashflow) {
  return finance.PP.apply(finance, [temp_proj].concat(_toConsumableArray(cashflow)));
};

window.triproj = function triproj(capex, subv, cfads) {
  return finance.IRR.apply(finance, [-1 * (capex * (1 - subv / 100))].concat(_toConsumableArray(cfads)));
};

/***/ })

},[["./assets/js/app.js","runtime","vendors~app"]]]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9hc3NldHMvanMvYXBwLmpzIl0sIm5hbWVzIjpbIkZpbmFuY2UiLCJyZXF1aXJlIiwiZmluYW5jZSIsIndpbmRvdyIsInRyaSIsImNhc2hmbG93SW4iLCJjYXNoZmxvdyIsIklSUiIsInZhbjIiLCJ0YXV4X2NyZWRpdCIsIk5QViIsInZhbiIsInRhdXhfYWN0IiwiY2FwZXgiLCJzdWJ2IiwidmFuY2ZhZHMiLCJ0YXV4X2ludCIsImNmYWRzIiwid2FjYyIsImNyZWRpdCIsIldBQ0MiLCJyb3VuZCIsInZhbHVlIiwiZGVjaW1hbHMiLCJOdW1iZXIiLCJNYXRoIiwidGVtcHJldG91ciIsInRlbXBydHIiLCJ0ZW1wX3Byb2oiLCJQUCIsInRyaXByb2oiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxPQUFPLEdBQUdDLG1CQUFPLENBQUMsc0RBQUQsQ0FBckI7O0FBRUEsSUFBSUMsT0FBTyxHQUFHLElBQUlGLE9BQUosRUFBZDs7QUFDQUcsTUFBTSxDQUFDQyxHQUFQLEdBQWEsU0FBU0EsR0FBVCxDQUFhQyxVQUFiLEVBQXdCQyxRQUF4QixFQUFpQztBQUUxQyxTQUFPSixPQUFPLENBQUNLLEdBQVIsT0FBQUwsT0FBTyxHQUFLRyxVQUFMLDRCQUFtQkMsUUFBbkIsR0FBZDtBQUNILENBSEQ7O0FBSUFILE1BQU0sQ0FBQ0ssSUFBUCxHQUFhLFNBQVNBLElBQVQsQ0FBY0MsV0FBZCxFQUEwQkgsUUFBMUIsRUFBbUM7QUFDNUMsU0FBT0osT0FBTyxDQUFDUSxHQUFSLE9BQUFSLE9BQU8sR0FBS08sV0FBVyxHQUFDLEdBQWpCLEVBQXFCLENBQXJCLDRCQUEwQkgsUUFBMUIsR0FBZDtBQUNILENBRkQ7O0FBR0FILE1BQU0sQ0FBQ1EsR0FBUCxHQUFZLFNBQVNBLEdBQVQsQ0FBYUMsUUFBYixFQUFzQkMsS0FBdEIsRUFBNEJDLElBQTVCLEVBQWlDUixRQUFqQyxFQUEwQztBQUNsRCxTQUFPSixPQUFPLENBQUNRLEdBQVIsT0FBQVIsT0FBTyxHQUFNVSxRQUFRLEdBQUMsR0FBVixJQUFnQkMsS0FBSyxJQUFFLElBQUdDLElBQUksR0FBQyxHQUFWLENBQXJCLENBQUwsNEJBQThDUixRQUE5QyxHQUFkO0FBQ0gsQ0FGRDs7QUFHQUgsTUFBTSxDQUFDWSxRQUFQLEdBQWtCLFNBQVNBLFFBQVQsQ0FBa0JDLFFBQWxCLEVBQTJCQyxLQUEzQixFQUFpQztBQUMvQyxTQUFPZixPQUFPLENBQUNRLEdBQVIsT0FBQVIsT0FBTyxHQUFLYyxRQUFRLEdBQUMsR0FBZCxFQUFrQixDQUFsQiw0QkFBdUJDLEtBQXZCLEdBQWQ7QUFDSCxDQUZEO0FBR0E7Ozs7O0FBR0FkLE1BQU0sQ0FBQ2UsSUFBUCxHQUFjLFNBQVNBLElBQVQsQ0FBY0wsS0FBZCxFQUFvQkMsSUFBcEIsRUFBeUJLLE1BQXpCLEVBQWdDUCxRQUFoQyxFQUF5Q0gsV0FBekMsRUFBc0Q7QUFDaEUsU0FBT1AsT0FBTyxDQUFDa0IsSUFBUixDQUFjUCxLQUFLLElBQUUsSUFBR0MsSUFBSSxHQUFDLEdBQVYsQ0FBTixHQUF1QkssTUFBcEMsRUFBMkNBLE1BQTNDLEVBQWtEUCxRQUFRLEdBQUMsR0FBM0QsRUFBK0RILFdBQVcsR0FBRyxHQUE3RSxFQUFpRixDQUFqRixDQUFQO0FBQ0gsQ0FGRDs7QUFHQU4sTUFBTSxDQUFDa0IsS0FBUCxHQUFlLFNBQVNBLEtBQVQsQ0FBZUMsS0FBZixFQUFzQkMsUUFBdEIsRUFBZ0M7QUFDdkMsU0FBT0MsTUFBTSxDQUFDQyxJQUFJLENBQUNKLEtBQUwsQ0FBV0MsS0FBSyxHQUFDLEdBQU4sR0FBVUMsUUFBckIsSUFBK0IsSUFBL0IsR0FBb0NBLFFBQXJDLENBQWI7QUFDSCxDQUZMOztBQUdBcEIsTUFBTSxDQUFDdUIsVUFBUCxHQUFvQixTQUFTQyxPQUFULENBQWlCQyxTQUFqQixFQUEyQnRCLFFBQTNCLEVBQXFDO0FBQ3RELFNBQVFKLE9BQU8sQ0FBQzJCLEVBQVIsT0FBQTNCLE9BQU8sR0FBSTBCLFNBQUosNEJBQWlCdEIsUUFBakIsR0FBZjtBQUNGLENBRkQ7O0FBR0FILE1BQU0sQ0FBQzJCLE9BQVAsR0FBZ0IsU0FBU0EsT0FBVCxDQUFpQmpCLEtBQWpCLEVBQXVCQyxJQUF2QixFQUE0QkcsS0FBNUIsRUFBbUM7QUFDL0MsU0FBT2YsT0FBTyxDQUFDSyxHQUFSLE9BQUFMLE9BQU8sR0FBSyxDQUFDLENBQUQsSUFBSVcsS0FBSyxJQUFFLElBQUdDLElBQUksR0FBQyxHQUFWLENBQVQsQ0FBTCw0QkFBa0NHLEtBQWxDLEdBQWQ7QUFDSCxDQUZELEMiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsibGV0IEZpbmFuY2UgPSByZXF1aXJlKCdmaW5hbmNlanMnKTtcblxubGV0IGZpbmFuY2UgPSBuZXcgRmluYW5jZSgpO1xud2luZG93LnRyaSA9IGZ1bmN0aW9uIHRyaShjYXNoZmxvd0luLGNhc2hmbG93KXtcblxuICAgIHJldHVybiBmaW5hbmNlLklSUihjYXNoZmxvd0luLC4uLmNhc2hmbG93KVxufTtcbndpbmRvdy52YW4yID1mdW5jdGlvbiB2YW4yKHRhdXhfY3JlZGl0LGNhc2hmbG93KXtcbiAgICByZXR1cm4gZmluYW5jZS5OUFYodGF1eF9jcmVkaXQvMTAwLDAsLi4uY2FzaGZsb3cpO1xufTtcbndpbmRvdy52YW4gPWZ1bmN0aW9uIHZhbih0YXV4X2FjdCxjYXBleCxzdWJ2LGNhc2hmbG93KXtcbiAgICByZXR1cm4gZmluYW5jZS5OUFYoKHRhdXhfYWN0LzEwMCkqKGNhcGV4KigxLShzdWJ2LzEwMCkpKSwuLi5jYXNoZmxvdyk7XG59O1xud2luZG93LnZhbmNmYWRzID0gZnVuY3Rpb24gdmFuY2ZhZHModGF1eF9pbnQsY2ZhZHMpe1xuICAgIHJldHVybiBmaW5hbmNlLk5QVih0YXV4X2ludC8xMDAsMCwuLi5jZmFkcylcbn07XG4vKipcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xud2luZG93LndhY2MgPSBmdW5jdGlvbiB3YWNjKGNhcGV4LHN1YnYsY3JlZGl0LHRhdXhfYWN0LHRhdXhfY3JlZGl0KSB7XG4gICAgcmV0dXJuIGZpbmFuY2UuV0FDQygoY2FwZXgqKDEtKHN1YnYvMTAwKSkpLWNyZWRpdCxjcmVkaXQsdGF1eF9hY3QvMTAwLHRhdXhfY3JlZGl0IC8gMTAwLDApXG59O1xud2luZG93LnJvdW5kID0gZnVuY3Rpb24gcm91bmQodmFsdWUsIGRlY2ltYWxzKSB7XG4gICAgICAgIHJldHVybiBOdW1iZXIoTWF0aC5yb3VuZCh2YWx1ZSsnZScrZGVjaW1hbHMpKydlLScrZGVjaW1hbHMpO1xuICAgIH07XG53aW5kb3cudGVtcHJldG91ciA9IGZ1bmN0aW9uIHRlbXBydHIodGVtcF9wcm9qLGNhc2hmbG93KSB7XG4gICByZXR1cm4gIGZpbmFuY2UuUFAodGVtcF9wcm9qLC4uLmNhc2hmbG93KTtcbn07XG53aW5kb3cudHJpcHJvaj0gZnVuY3Rpb24gdHJpcHJvaihjYXBleCxzdWJ2LGNmYWRzKSB7XG4gICAgcmV0dXJuIGZpbmFuY2UuSVJSKC0xKihjYXBleCooMS0oc3Vidi8xMDApKSksLi4uY2ZhZHMpO1xufTtcbiJdLCJzb3VyY2VSb290IjoiIn0=