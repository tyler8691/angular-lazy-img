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
      for(var i = 0, l = images.length; i < l; i++){
        var image = images[i];
        if(image && lazyImgHelpers.isElementInView(image.$elem[0], options.offset, winDimensions)){
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

    function removeImage(image){
      var index = images.indexOf(image);
      if(index != -1) {
        images.splice(index, 1);
      }
    }

    function loadImage(photo){
      var img = new Image();
      img.onerror = function(){
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
        $elem[0].src = src;
      } else {
        $elem.css('background-image', 'url("' + src + '")');
      }
    }

    // PHOTO
    function Photo($elem){
      this.$elem = $elem;
    }

    Photo.prototype.setSource = function(source){
      this.src = source;
      images.push(this);
      if (!isListening){ startListening(); }
    };

    Photo.prototype.removeImage = function(){
      removeImage(this);
    };

    return Photo;

  }
]);
