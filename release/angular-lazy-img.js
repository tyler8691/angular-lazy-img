/*
 * angular-lazy-load
 *
 * Copyright(c) 2014 Paweł Wszoła <wszola.p@gmail.com>
 * MIT Licensed
 *
 */

/**
 * @author Paweł Wszoła (wszola.p@gmail.com)
 *
 */

angular.module('angularLazyImg', []);

angular.module('angularLazyImg').factory('LazyImgMagic', [
  '$window', 'lazyImgConfig', 'lazyImgHelpers',
  function($window, lazyImgConfig, lazyImgHelpers){
    'use strict';

    var winDimensions, $win, images, isListening, options;
    var checkImagesT, saveWinOffsetT;

    images = [];
    isListening = false;
    options = lazyImgConfig.getOptions();
    $win = angular.element($window);
    winDimensions = lazyImgHelpers.getWinDimensions();
    saveWinOffsetT = lazyImgHelpers.throttle(function(){
      winDimensions = lazyImgHelpers.getWinDimensions();
    }, 60);

    function checkImages(){
      winDimensions.scrollY = $window.scrollY;
      winDimensions.scrollX = $window.scrollX;

      for(var i = 0, l = images.length; i < l; i++){
        var image = images[i];
        if(image && lazyImgHelpers.isImageInView(image, options.offset, winDimensions)){
          loadImage(image);
          removeImage(image);
          i--;
        }
      }
    }

    checkImagesT = lazyImgHelpers.throttle(checkImages, 30);

    function listen(param){
      (options.container || $win)[param]('scroll', checkImagesT);
      (options.container || $win)[param]('touchmove', checkImagesT);
      $win[param]('resize', checkImagesT);
      $win[param]('resize', saveWinOffsetT);
    }

    function startListening(){
      isListening = true;
      setTimeout(function(){
        checkImages();
        listen('on');
      }, 1);
    }

    function stopListening(){
      isListening = false;
      listen('off');
    }

    function removeImage(image){
      var index = images.indexOf(image);
      if(index != -1) {
        images.splice(index, 1);
      }
    }

    function loadImage(photo){
      var img = new Image();

      if(options.errorClass){
        photo.$elem.removeClass(options.errorClass);
      }

      if(options.successClass){
        photo.$elem.removeClass(options.successClass);
      }

      img.onerror = function(){
        setPhotoSrc(photo.$elem, null);
        if(options.errorClass){
          photo.$elem.addClass(options.errorClass);
        }
        options.onError(photo);
      };
      img.onload = function(){
        setPhotoSrc(photo.$elem, photo.src);
        if(options.successClass){
          photo.$elem.addClass(options.successClass);
        }
        options.onSuccess(photo);
      };
      img.src = photo.src;
    }

    function setPhotoSrc($elem, src){
      if ($elem[0].nodeName.toLowerCase() === 'img') {
        if (src) {
          $elem[0].src = src;
        } else {
          $elem.removeAttr('src');
        }
      } else {
        $elem.css('background-image', 'url("' + src + '")');
      }
    }

    // PHOTO
    function Photo($elem){
      this.$elem = $elem;
      this.cachedRect = {
        clientRect : null,
        scrollY : null,
        scrollX : null
      }
    }

    Photo.prototype.setSource = function(source){
      this.src = source;
      images.push(this);
      if (!isListening){ startListening(); }
    };

    Photo.prototype.removeImage = function(){
      removeImage(this);
      if(images.length === 0){ stopListening(); }
    };

    return Photo;

  }
]);

angular.module('angularLazyImg').provider('lazyImgConfig', function() {
  'use strict';

  this.options = {
    offset       : 100,
    errorClass   : null,
    successClass : null,
    onError      : function(){},
    onSuccess    : function(){}
  };

  this.$get = function() {
    var options = this.options;
    return {
      getOptions: function() {
        return options;
      }
    };
  };

  this.setOptions = function(options) {
    angular.extend(this.options, options);
  };
});
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
      if (!rect || image.cachedRect.scrollY != winDimensions.scrollY || image.cachedRect.scrollX != winDimensions.scrollX) {
        var elem = image.$elem[0];
        rect = elem.getBoundingClientRect();

        image.cachedRect.clientRect = rect;
        image.cachedRect.scrollY = scrollY;
        image.cachedRect.scrollX = scrollX;
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
angular.module('angularLazyImg').directive('lazyImg', [
  'LazyImgMagic', function(LazyImgMagic){
    'use strict';

    function link(scope, element, attributes) {
      var lazyImage = new LazyImgMagic(element);
      attributes.$observe('lazyImg', function(newSource){
        if (newSource){
          // in angular 1.3 it might be nice to remove observer here
          lazyImage.setSource(newSource);
        }
      });
      scope.$on('$destroy', function(){
        lazyImage.removeImage();
      });
    }

    return {
      link: link,
      restrict: 'A'
    };
  }
]);