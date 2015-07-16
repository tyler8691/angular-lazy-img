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
        winDimensions : null
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

    Photo.prototype.cachedRectNeedsUpdate = function(winDimensions) {
      return !this.cachedRect.clientRect ||
        !this.cachedRect.winDimensions ||
        this.cachedRect.winDimensions.scrollX != winDimensions.scrollX ||
        this.cachedRect.winDimensions.scrollY != winDimensions.scrollY ||
        this.cachedRect.winDimensions.width != winDimensions.width ||
        this.cachedRect.winDimensions.height != winDimensions.height;
    };

    return Photo;

  }
]);
