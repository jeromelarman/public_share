
    .controller('CameraCtrl', function ($scope, $ionicPopup, $translate, BridgeService) {
        console.log('in CameraCtrl');
        // number max of videos which can be attached to a publication
        const nbVideosMax = 3;
        $scope.request.image = [];
        // is android platform to apply specific ui hook ( ie. input file)
        $scope.isAndroid = typeof device !== 'undefined' && device.platform == 'Android';         
        var handleImageCompression = function (imageFile) {
            // 1350px with was the size of the modal on desktop
            var options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1349,
                useWebWorker: true
            }
            return imageCompression(imageFile, options)
                .then(function (compressedFile) {
                    return compressedFile; // write your own logic
                })
                .catch(function (error) {
                    console.log(error.message);
                });
        }
        /**
         * show error message
         * TODO : update message to generic CAN NOT ACCESS CAMERA
         */
        var showNotificationBrowserNotSupportCamera = function (error) {
            var alertPopup = $ionicPopup.alert({
                title: $translate.instant('GLOBAL.ERROR'),
                template: $translate.instant('GLOBAL.BROWSER_NOT_SUPPORT_CAMERA')
            });
        }
        /**
         * show error message
         * TODO : update message to generic CAN NOT ACCESS CAMERA
         */
        var showNotificationPermissionError = function (error) {
            var alertPopup = $ionicPopup.alert({
                title: $translate.instant('GLOBAL.ERROR'),
                template: error
            });
        }
        /**
         * apply image to the context, ready to display in preview
         * and size / format optimized to reduce upload process
         * @param {*} image 
         */
        function processApplyImage(image) {
            // compress image before send to server
            handleImageCompression(image).then(function(compressedFile) {
    
                var reader = new FileReader();
    
                // continue processing file, read file from user storage
                reader.readAsDataURL(compressedFile);
    
                reader.onload = function () {
                    console.debug(reader.result);
                    $scope.$apply(function () {
                        $scope.request.image.push({type: 'image', src: reader.result});
                    });
                };
    
                reader.onerror = function () {
                    console.log(reader.error);
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('GLOBAL.ERROR'),
                        template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                    });
                };
            }).catch(function(error) {
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                });
            });
        }
        
        /**
         * 
         * @param {*} index 
         */
        $scope.delete = function (index) {
            console.log('in delete from index : ' + index);
            if(typeof index == "undefined" || index == null) {
                $scope.request.image = [];
            }
            else if(index < $scope.request.image.length) {
                $scope.request.image.splice(index,1);
            }
        };
        /**
         * 
         * @param {*} index 
         */
        $scope.up = function (index) {
            console.log('in up from index : ' + index);
            if (index > 0) {
                let el = $scope.request.image[index];
                $scope.request.image[index] = $scope.request.image[index - 1];
                $scope.request.image[index - 1] = el;
            }
              
        };
        /**
         * 
         * @param {*} index 
         */
        $scope.down = function (index) {
            console.log('in down from index : ' + index);
            if (index !== -1 && index < $scope.request.image.length - 1) {
              let el = $scope.request.image[index];
              $scope.request.image[index] = $scope.request.image[index + 1];
              $scope.request.image[index + 1] = el;
            }
        }
        /****************************************************/
        /****************************************************/
        /******************** NATIVE ************************/
        /****************************************************/
        /****************************************************/
        /**
         * custom input file dedicated to android native application
         */
        $scope.inputFileAndroid = function() {
            console.log('in inputFileAndroid');
            var permissions = cordova.plugins.permissions;
            // for this feature, we need camera permission to open photo camera
            var listPermissions = [
                permissions.CAMERA,
            ];
            permissions.checkPermission(listPermissions, processCameraPermissions, showNotificationBrowserNotSupportCamera);
            // specific dataURItoBlob method with mediaType,
            // otherwise handleImageCompression not work, it 
            // can not detect blob is image
            var dataURItoBlob = function (dataURI, mediaType) {
                // convert base64 to raw binary data held in a string
                // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
                var byteString = atob(dataURI.split(',')[1]);
    
                // separate out the mime component
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    
                // write the bytes of the string to an ArrayBuffer
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
    
                // write the ArrayBuffer to a blob, and you're done
                var bb = new Blob([ab], { type: mediaType });
                return bb;
            };
            function processCameraPermissions(statusCameraPermission) {
                if (!statusCameraPermission.hasPermission) {
                    permissions.requestPermissions(
                        listPermissions,
                        function (status) {
                            if (!status.hasPermission) {
                                showNotificationBrowserNotSupportCamera();
                            }
                            else {
                                processGetImage();
                            }
                        },
                        showNotificationPermissionError);
    
                }
                else {
                    processGetImage();
                }
            }
            /**
             * get image from camera, galery or file manager
             */
            function processGetImage() {
                inputFile.getFile("image/jpeg").then(function(file) {
                    // apply selected image
                    processApplyImage(dataURItoBlob(file.dataURI, file.mediaType));
   
                }, function (err) {
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('GLOBAL.ERROR'),
                        template: err
                    });
                });
                
            }
            
        }
        /**
         * custom input video dedicated to android native application
         */
        $scope.inputVideoAndroid = function() {
            var images = $scope.request.image;
   
            var nbVideo = 0;
            for (let index = 0; index < images.length; index++) {
                if(images[index].type == 'video') {
                    nbVideo = nbVideo + 1;
                }
            }
            console.log('detection du nombre de vidéos : ' + nbVideo);
            
            if(nbVideo >= nbVideosMax) {
                
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('GLOBAL.VIDEO_MAX_LIMIT_EXCEEDED')
                });
                
                return;
            }
            
            var permissions = cordova.plugins.permissions;
            
            // for this feature, we need camera permission to open photo camera
            var listPermissions = [
                permissions.READ_EXTERNAL_STORAGE,
            ];
            permissions.checkPermission(listPermissions, processStoragePermissions, showNotificationBrowserNotSupportCamera);
            function processStoragePermissions(statusStoragePermission) {
                if (!statusStoragePermission.hasPermission) {
                    permissions.requestPermissions(
                        listPermissions,
                        function (status) {
                            if (!status.hasPermission) {
                                showNotificationBrowserNotSupportCamera();
                            }
                            else {
                                processGetVideo();
                            }
                        },
                        showNotificationPermissionError);
    
                }
                else {
                    processGetVideo();
                }
            }
            function processGetVideo() {
                new Promise((resolve, reject) => {
                    navigator.device.capture.captureVideo(
                        function (mediaFiles) {
                            resolve(mediaFiles[0]);
                        },
                        function (err) {
                            reject(err);
                        },
                        {
                            limit: 1,
                            quality: 1,
                            duration: 30
                        }
                    );
                }).then(function(mediaFile) {
                    successVideo(mediaFile);
                })
                .catch(function(err) {
                    console.log(err);
                });
                var successVideo = function(mediaFile) {
                    // init loading
                    BridgeService.showLoading('#015');
                    // force refresh context and reload loading
                    BridgeService.setLoaderContext({
                        message: 'Chargement de la vidéo'
                    });
                    
                    // reload loafding spinner with its new context
                    BridgeService.showLoading('#016');
        
                    BridgeService.getProgressBar().start();
                    var videoUrl = mediaFile.fullPath;
                    // if (this.isiOS) videoUrl = "file://" + videoUrl.substring(8);
    
                    console.log('videoUrl : ' + videoUrl);
    
                    window.resolveLocalFileSystemURL(videoUrl, function (entry) {
                        entry.file(function (file) {
                            // limit each file to 50PMb
                            var size = file.size;
                            console.log('size : ' + size);
                            // TikTok Max File size: 287.6 MB
                            if(size > 287600000) {
                                var alertPopup = $ionicPopup.alert({
                                    title: $translate.instant('GLOBAL.ERROR'),
                                    template: $translate('GLOBAL.VIDEO_MAX_SIZE_LIMIT_EXCEEDED') + " -> " + size / 1024 + "Mo"
                                });
                                return;
                            }
                                
                            var reader = new FileReader();
                            
                            reader.readAsArrayBuffer(file);
                            reader.onload = function () {
                                // The file reader gives us an ArrayBuffer:
                                var buffer = reader.result;
                                // We have to convert the buffer to a blob:
                                var videoBlob = new Blob([new Uint8Array(buffer)], { type: 'video/mp4' });
                                // Un objet File, Blob ou MediaSource pour lequel créer une URL d’objet.
                                // The blob gives us a URL to the video file:
                                var url = window.URL.createObjectURL(videoBlob);
                                $scope.$apply(function () {
                                    $scope.request.image.push({type: 'video', src: url});
                                    BridgeService.getProgressBar().complete();
                                    BridgeService.hideLoading();
                                });
                                
                            };
                
                            reader.onerror = function () {
                                console.log(reader.error);
                                BridgeService.getProgressBar().complete();
                                BridgeService.hideLoading();
                                var alertPopup = $ionicPopup.alert({
                                    title: $translate.instant('GLOBAL.ERROR'),
                                    template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                                });
                            };
                            reader.onprogress = function(data) {
                                if (data.lengthComputable) {    
                                    var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                                    console.log('on progress : ' + progress );
                                    BridgeService.getProgressBar().set(Math.round(progress));
                                }
                            }
                                
                        },
                        function (err) {
                            console.log(err);
                            BridgeService.getProgressBar().complete();
                            BridgeService.hideLoading();
                            var alertPopup = $ionicPopup.alert({
                                title: $translate.instant('GLOBAL.ERROR'),
                                template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                            });                                
                        });
                    },
                    function (err) {
                        console.log(err);
                        BridgeService.getProgressBar().complete();
                        BridgeService.hideLoading();
                        var alertPopup = $ionicPopup.alert({
                            title: $translate.instant('GLOBAL.ERROR'),
                            template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                        });
                    });
                }
            }
        };
        /****************************************************/
        /****************************************************/
        /******************** BROWSER ***********************/
        /****************************************************/
        /****************************************************/
        /**
         * generic html5 input file usage for browser, pwa, and ios
         */
         $scope.library = function (event) {
            console.debug(event);
            // get file
            var file = event.currentTarget.files[0];
            // compress image before send to server
            handleImageCompression(file).then(function(compressedFile) {
                var reader = new FileReader();
    
                // continue processing file, read file from user storage
                reader.readAsDataURL(compressedFile);
    
                reader.onload = function () {
                    console.debug(reader.result);
                    $scope.$apply(function () {
                        $scope.request.image = reader.result;
                    });
                };
    
                reader.onerror = function () {
                    console.log(reader.error);
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('GLOBAL.ERROR'),
                        template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                    });
                };
            }).catch(function(error) {
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                });
            });
        }
        /**
         * generic html5 input file ( multiple files ) usage for browser, pwa, and ios
         */
        $scope.libraries = function (event) {
            console.debug(event);
            // get file
            var file = event.currentTarget.files[0];
            // compress image before send to server
            handleImageCompression(file).then(function(compressedFile) {
                var reader = new FileReader();
                // continue processing file, read file from user storage
                reader.readAsDataURL(compressedFile);
                reader.onload = function () {
                    console.debug(reader.result);
                    $scope.$apply(function () {
                        $scope.request.image.push({type: 'image', src: reader.result});
                    });
                };
                reader.onerror = function () {
                    console.log(reader.error);
                    var alertPopup = $ionicPopup.alert({
                        title: $translate.instant('GLOBAL.ERROR'),
                        template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                    });
                };
            }).catch(function(error) {
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                });
            });
        }
        /**
         * generic html5 input file ( multiple files ) usage for browser, pwa, and ios
         */
        $scope.videos = function (event) {
            console.debug(event);
            var nbVideo = 0;
            var images = $scope.request.image;
            
            for (let index = 0; index < images.length; index++) {
                if(images[index].type == 'video') {
                    nbVideo = nbVideo + 1;
                }
            }
            console.log('detection du nombre de vidéos : ' + nbVideo);
            
            if(nbVideo >= nbVideosMax) {
                
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('GLOBAL.VIDEO_MAX_LIMIT_EXCEEDED')
                });
                
                return;
            }
            
            // get file
            var file = event.currentTarget.files[0];
            // limit each file to 50PMb
            var size = file.size;
            // TikTok Max File size: 287.6 MB
            if(size > 287600000) {
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('GLOBAL.VIDEO_MAX_SIZE_LIMIT_EXCEEDED')
                });
                return;
            }
            // init loading
            BridgeService.showLoading('#017');
            // force refresh context and reload loading
            BridgeService.setLoaderContext({
                message: 'Chargement de la vidéo'
            });
            
            // reload loafding spinner with its new context
            BridgeService.showLoading('#018');
            BridgeService.getProgressBar().start();
            var reader = new FileReader();
                            
            reader.readAsArrayBuffer(file);
            reader.onload = function () {
                // The file reader gives us an ArrayBuffer:
                var buffer = reader.result;
                // We have to convert the buffer to a blob:
                var videoBlob = new Blob([new Uint8Array(buffer)], { type: 'video/mp4' });
                // Un objet File, Blob ou MediaSource pour lequel créer une URL d’objet.
                // The blob gives us a URL to the video file:
                var url = window.URL.createObjectURL(videoBlob);
                $scope.$apply(function () {
                    $scope.request.image.push({type: 'video', src: url});
                    BridgeService.getProgressBar().complete();
                    BridgeService.hideLoading();
                });
                
                
            };
            reader.onerror = function () {
                console.log(reader.error);
                BridgeService.getProgressBar().complete();
                BridgeService.hideLoading();
                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('GLOBAL.ERROR'),
                    template: $translate('NEWS.IMPORT_CAN_NOT_OPEN')
                });
            };
            reader.onprogress = function(data) {
                if (data.lengthComputable) {    
                    var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                    console.log('on progress : ' + progress );
                    BridgeService.getProgressBar().set(Math.round(progress));
                }
            }
                    
        }
    })
