angular.module('angularLazyImg').factory('lazyImgHelpers', [
  '$window', function($window){
    'use strict';

    function getWinDimensions(){
      return {
        height: $window.innerHeight,
        width: $window.innerWidth
      };
    }

    function isImageInView(image, offset, winDimensions) {
      var rect = image.cachedRect.clientRect;
      if (image.cachedRectNeedsUpdate(winDimensions)) {
        var elem = image.$elem[0];
        rect = elem.getBoundingClientRect();

        image.cachedRect.clientRect = rect;
        image.cachedRect.winDimensions = winDimensions;
      }

      var bottomline = winDimensions.height + offset;
      return (
       rect.left >= -rect.width && rect.right <= winDimensions.width + offset && (
         rect.top >= -rect.height && rect.top <= bottomline ||
         rect.bottom <= bottomline && rect.bottom >= 0 - offset
        ));
    }

    // http://remysharp.com/2010/07/21/throttling-function-calls/
    function throttle(fn, threshhold, scope) {
      var last, deferTimer;
      return function () {
        var context = scope || this;
        var now = +new Date(),
            args = arguments;
        if (last && now < last + threshhold) {
          clearTimeout(deferTimer);
          deferTimer = setTimeout(function () {
            last = now;
            fn.apply(context, args);
          }, threshhold);
        } else {
          last = now;
          fn.apply(context, args);
        }
      };
    }

    return {
      isImageInView: isImageInView,
      getWinDimensions: getWinDimensions,
      throttle: throttle
    };

  }
]);