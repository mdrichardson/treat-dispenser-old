(function() {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',

    //foundation
    'foundation',
    'foundation.dynamicRouting',
    'foundation.dynamicRouting.animations',
      
    //auth0
    'auth0',
    'angular-storage',
    'angular-jwt',

  ])
.filter('trust', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}])
  
.factory('variableService', ['$http', 'NotificationFactory', '$rootScope', 'store', function($http, NotificationFactory, $rootScope, store) {
    var accessToken = function(){
        var profile = store.get('profile');
        return profile.user_metadata.particleAccessToken;
    };
    var apiURL = function() {
        var profile = store.get('profile');
        if (profile != null) {
            return "https://api.particle.io/v1/devices/" + profile.user_metadata.particleDevice_ID + "/";
        }        
    }
      
    var getVariable = function(getVar) {
        var userProfile = store.get('profile');
        return $http.get(apiURL()+  getVar + '?access_token=' + accessToken()).then(function (data) {
        return data.data.result;   
    }, function (err) {
        console.log('An error occurred while getting variable: ', err);
        throw err;                  
    });
    };
    
    var functionCall = function functionCall(functionName, functionArg) {
        var userProfile = store.get('profile');
        if (functionName == 'auger'){
            $(".button.auger").addClass('disabled');
        }
        return $http({
                method: 'POST',
                url: apiURL() + functionName + '?access_token=' + accessToken(),
                data: $.param({args: functionArg}),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                })
                .success(function(data, status, headers, config) {
                    console.log(functionName + ' performed succesfully: ' + functionArg);
                    $(".button.auger").removeClass('disabled');
                })
                .error(function(data, status, headers, config) {
                    console.log('An error occurred while getting variable: ', err);
                    $(".button.auger").removeClass('disabled');
                });
    };

    var notifSet = new NotificationFactory({
        position: 'top-right',
        'zf-swipe-close': 'right'
        });
    var notify = function(title,content,color,autoclose) {
        notifSet.addNotification({
        title: title,
        content: content,
        color: color,
        autoclose: autoclose
        });
    };        
    
    return {
        getVariable: getVariable,
        apiURL: apiURL,
        functionCall: functionCall,
        accessToken: accessToken,
        notify: notify
    };
}])
  
  .controller('homeCtrl', ['$scope', '$rootScope', '$state', '$interval', '$sce', 'variableService', 'store', function($scope, $rootScope, $state, $interval, $sce, variableService, store) {
    $scope.userProfile = store.get('profile');
    moment().format("hh:mm:ss");
    $scope.getLast = function() {
        variableService.getVariable("last").then(function (result) {
        if (moment.unix(result).fromNow() === "Invalid date") {
            $scope.last = "?";
        } else {
            $scope.last = moment.unix(result).fromNow();
        }
        }, function(err) {
            console.log('An error occurred while getting variable: ', err);
    });
    };
    $scope.treat = function() {
      variableService.functionCall("auger","treat").then(function (result) {
          variableService.notify("Treat Dispense","Successful","success","3000");
          $scope.getLast();
      }, function(err) {
          console.log('Error dispensing treat: ', err);
          variableService.notify("Treat Dispense","Failed","alert","3000");
      });      
    };
    $scope.meal = function() {
        variableService.functionCall("auger","meal").then(function (result) {
          variableService.notify("Meal Dispense","Successful","success","3000");
          $scope.getLast();
      }, function(err) {
          console.log('Error dispensing meal: ', err);
        variableService.notify("Meal Dispense","Failed","alert","3000");
      });      
    };
    $scope.loadVideo = function() {
        var userProfile = store.get('profile');
        return "https://syndac.no-ip.biz:8100/live/0?authToken=" + userProfile.user_metadata.videoAuthToken;
    };
    $scope.getLast();
    $interval(function(){
      $scope.getLast();
    }, 5000);
    $interval(function(){
      if (document.getElementById("video_0") != null) {
        var vid = document.getElementById("video_0");
        var delta = 5;
        var buffered = vid.buffered.end(0) - vid.buffered.start(0);
        var difference = buffered - vid.currentTime;
        if (difference > delta) {
            vid.currentTime = vid.buffered.end(0) - .001;
        }
      }
    }, 5000);  
    
  }])
  
  .controller('statusCtrl', ['$scope', '$rootScope', '$state', 'variableService', function($scope, $rootScope, $state, variableService) {
    $rootScope.status = 'Connecting...';
    $rootScope.activity = 'Idle';      
  }])
  
   .controller('settingsCtrl', ['$scope', '$rootScope', '$state', '$timeout', 'variableService', function($scope, $rootScope, $state, $timeout, variableService) {
    $scope.getSizes = function() {
        variableService.getVariable("sizes").then(function (data) {
          var sizes = JSON.parse(data);
          $("#treat0").removeClass("badge");
          $("#treat1").removeClass("badge");
          $("#treat2").removeClass("badge");
          $("#treat" + sizes.treat).addClass("badge");
          $("#meal0").removeClass("badge");
          $("#meal1").removeClass("badge");
          $("#meal2").removeClass("badge");
          $("#meal" + sizes.meal).addClass("badge");
        }, function(err) {
            console.log('An error occurred while getting mealSize: ', err);
    });
    };
    $scope.showSettings = function() {
        if ($rootScope.status == "Connected") {
            return true;
        } else {
            return true; // CHANGE LATER
        }
    };
    $scope.showIntervalSelect = function() {
        if ($scope.intervalSEon == 1) {
            return true;
        } else {
            return false;
        }
    } 
    $scope.treat = function(size) {
      variableService.functionCall("setSizes", "treat," + size).then(function (result) {
          $scope.getSizes();
      }, function(err) {
          console.log('Error setting treatSize: ', err);
      });      
    };
    $scope.meal = function(size) {
      variableService.functionCall("setSizes","meal," + size).then(function (result) {
          $scope.getSizes();
      }, function(err) {
          console.log('Error setting mealSize: ', err);
      });      
    };

// TO DO: Figure out how to display interval start/end. Figure out how to send the changes to Photon

    $scope.stopInterval = function() {
      $scope.intervalToggle = false;
      variableService.functionCall("setInterval","on,0");
      variableService.notify("Interval","Turned Off","success","3000");
    };
    $scope.getIntervals = function() {
        variableService.getVariable("intervals").then(function (data) {
        var intervals = JSON.parse(data);
        $scope.intervalOn = intervals.on;
        $scope.intervalSEon = intervals.SE;
        $scope.intervalStart = String(intervals.start);
        $scope.intervalEnd = String(intervals.end);
        $scope.intervalMinutes = String(intervals.min);
        $scope.intervalHours = String(intervals.hr);
        if ($scope.intervalOn == 1)
            {
                $scope.intervalToggle = true;
            } else {
                $scope.intervalToggle = false;
            }
        if ($scope.intervalStart.length == 3)
        {
            $scope.intervalStart = 0 + $scope.intervalStart;
        }
        if ($scope.intervalEnd.length == 3)
        {
            $scope.intervalEnd = 0 + $scope.intervalEnd;
        }
        $scope.intervalStartHours = $scope.intervalStart.substring(0,2);
        $scope.intervalStartMinutes = $scope.intervalStart.substring(2);
        $scope.intervalEndHours = $scope.intervalEnd.substring(0,2);
        $scope.intervalEndMinutes = $scope.intervalEnd.substring(2);
        if (parseInt($scope.intervalStartHours) > 12)
        {
          $scope.intervalStartHours = String(parseInt($scope.intervalStartHours) - 12);
          $scope.intervalStartAMPM = "PM";
        } else {
          $scope.intervalStartAMPM = "AM";
          if (parseInt($scope.intervalStartHours) < 10)
          {
            $scope.intervalStartHours = String(parseInt($scope.intervalStartHours));
          }
        }
        if (parseInt($scope.intervalEndHours) > 12)
        {
          $scope.intervalEndHours = String(parseInt($scope.intervalEndHours) - 12);
          $scope.intervalEndAMPM = "PM";
        } else {
          $scope.intervalEndAMPM = "AM";
          if (parseInt($scope.intervalEndHours) < 10)
          {
            $scope.intervalEndHours = String(parseInt($scope.intervalEndHours));
          }
        }
        }, function(err) {
            console.log('An error occurred while getting intervals: ', err);
    });
    };
    $scope.toggleInterval = function(){
        $scope.intervalOK = true;
        if ($scope.intervalToggle === true) {
            if ($scope.intervalSEon == 1 && $scope.intervalStart > $scope.intervalEnd)
            {
              $scope.intervalOK = false;
              $("#intervalAlert").html("End time must be later than Start time");
            }
            if ($scope.intervalHours == 0 && $scope.intervalMinutes == 0)
            {
              $scope.intervalOK = false;
              $("#intervalAlert").html("Hours and Minutes can't both be 0");
            }
            if ($scope.intervalOK)
            {
              variableService.functionCall("setInterval","on,1").then(function (result) {
                console.log('Interval Dispensing On');
                variableService.notify("Interval","Turned On","success","3000");
                }, function(err) {
                    console.log('Error setting Intervals: ', err);
                });
            } else {
               console.log('Interval Invalid');
               $scope.intervalToggle = false;
               $("#intervalAlert").html("Error Starting Interval");
           }            
        } else {
            $scope.stopInterval();
        }
    };
    $scope.interval = function(cmd) {
      variableService.functionCall("setInterval",cmd).then(function (result) {
          $scope.getIntervals();
      }, function(err) {
          console.log('Error setting Intervals: ', err);
      });      
    };
    $scope.intervalSE = function(category,type,value) {
      $scope.stopInterval();
      if (category == "start")
      {
        if (type == "ampm")
        {
          $scope.intervalStartAMPM = value;
        } else if (type == "hours")
        {
          $scope.intervalStartHours = value;
        } else if (type == "minutes")
        {
          $scope.intervalStartMinutes = value;
        }
        $scope.tempStartAMPM = $scope.intervalStartAMPM;
        $scope.tempStartHours = $scope.intervalStartHours;
        $scope.tempStartMinutes = $scope.intervalStartMinutes;
        if (type == "ampm")
        {
          $scope.tempStartAMPM = value;
        } else if (type == "hours")
        {
          $scope.tempStartHours = value;
        } else if (type == "minutes")
        {
          $scope.tempStartMinutes = value;
        }
        if ($scope.tempStartAMPM == "AM" && $scope.tempStartHours > 12)
        {
          $scope.tempStartHours = String(parseInt($scope.tempStartHours) - 12);
        } else if ($scope.tempStartAMPM == "PM" && $scope.tempStartHours < 12)
          {
            $scope.tempStartHours = String(parseInt($scope.tempStartHours) + 12);
          }
        if ($scope.tempStartHours.length == 1) {
          $scope.tempStartHours = 0 + $scope.tempStartHours;
        }
        $scope.intervalStart = parseInt($scope.tempStartHours + $scope.tempStartMinutes);
        variableService.functionCall("setInterval","start," + $scope.intervalStart).then(function (result) {
            $scope.getIntervals();
        }, function(err) {
            console.log('Error setting interval: ', err);
        });
      }
      if (category == "end")
      {
        if (type == "ampm")
        {
          $scope.intervalEndAMPM = value;
        } else if (type == "hours")
        {
          $scope.intervalEndHours = value;
        } else if (type == "minutes")
        {
          $scope.intervalEndMinutes = value;
        }
        $scope.tempEndAMPM = $scope.intervalEndAMPM;
        $scope.tempEndHours = $scope.intervalEndHours;
        $scope.tempEndMinutes = $scope.intervalEndMinutes;
        if (type == "ampm")
        {
          $scope.tempEndAMPM = value;
        } else if (type == "hours")
        {
          $scope.tempEndHours = value;
        } else if (type == "minutes")
        {
          $scope.tempEndMinutes = value;
        }
        if ($scope.tempEndAMPM == "AM" && $scope.tempEndHours > 12)
        {
          $scope.tempEndHours = String(parseInt($scope.tempEndHours) - 12);
        } else if ($scope.tempEndAMPM == "PM" && $scope.tempEndHours < 12)
          {
            $scope.tempEndHours = String(parseInt($scope.tempEndHours) + 12);
          }
        if ($scope.tempEndHours.length == 1) {
          $scope.tempEndHours = 0 + $scope.tempEndHours;
        }
        $scope.intervalEnd = parseInt($scope.tempEndHours + $scope.tempEndMinutes);
        variableService.functionCall("setInterval","end," + $scope.intervalEnd).then(function (result) {
            $scope.getIntervals();
        }, function(err) {
            console.log('Error setting interval: ', err);
        });
      }
    };
    $scope.intervalTime = function(unit, value) {
      $scope.stopInterval();
      variableService.functionCall("setInterval",unit + ',' + value).then(function (result) {
          $scope.getIntervals();
      }, function(err) {
          console.log('Error setting Intervals: ', err);
      });      
    };
    $scope.getSizes();
    $scope.getIntervals();
  }])
  
  .controller('debugCtrl', ['$scope', '$state', 'variableService', function($scope, $state, variableService) {
    $scope.load = function() {
      variableService.functionCall("auger","load");
      variableService.notify("Loading","","success","3000");
    };
    $scope.in = function() {
        variableService.functionCall("auger","in");
        variableService.notify("Pulling","","success","3000");
    };
    $scope.out = function() {
        variableService.functionCall("auger","out");
        variableService.notify("Pushing","","success","3000");
    };
    $scope.inout = function() {
        variableService.functionCall("auger","inout");
        variableService.notify("Moving","Back and Forth","success","3000");
    };
    $scope.stop = function() {
        variableService.functionCall("auger","stop");
        variableService.notify("Stopped","","alert","3000");
    };
    $scope.test = function() {
        variableService.functionCall("test","auger");
        variableService.notify("Testing","","warning","3000");
    };
    $scope.tone = function() {
        variableService.functionCall("test","tone");
        variableService.notify("Playing Tone","","success","3000");
    };
  }])
  .controller('loginCtrl', ['$scope', 'auth', 'store', function ($scope, auth, store) {
    $scope.login = function () {
    $scope.message = 'loading...';
    $scope.loading = true;
     auth.signin({
         sso: false,
         connection: 'TreatDispenserDB',
         username: $scope.user,
         password: $scope.pass,
         authParams: {
           scope: 'openid name email'
         }
        }, onLoginSuccess, onLoginFailed);
    };
    
    function onLoginSuccess(profile, token) {
      $scope.message = '';
      store.set('profile', profile);
      store.set('token', token);
      $scope.userProfile = profile;    
      $scope.loading = false;    
    }
    function onLoginFailed() {
      $scope.message.text = 'invalid credentials';
      $scope.loading = false;
    }
  }])
  
    .config(config)
    .run(run);

  config.$inject = ['$urlRouterProvider', '$locationProvider', 'authProvider'];

  function config($urlProvider, $locationProvider, authProvider) {
    $urlProvider.otherwise('/');

    $locationProvider.html5Mode({
      enabled:true,
      requireBase: false
    });

    $locationProvider.hashPrefix('!');
      
    authProvider.init({
      domain: 'syndac.auth0.com',
      clientID: 'TC1odA500q6xYJNYY6es1axmnPHEkqcl',
      loginState: 'login'
    });
    
    //Called when login is successful
    authProvider.on('loginSuccess', ['$location', 'profilePromise', 'idToken', 'store', '$rootScope', 'variableService', 
    function($location, profilePromise, idToken, store, $rootScope, variableService) {
      // Successfully log in
      // Access to user profile and token
      profilePromise.then(function(profile){
        // Empty loading message
         $rootScope.message = '';
         //Store credentials
         store.set('profile', profile);
         store.set('token', idToken);
         // Hide loading indicator
         $rootScope.loading = false;
        // Access to user profile and token
        profilePromise.then(function(profile){
          // profile
          $rootScope.userProfile = profile;
          var source = new EventSource(variableService.apiURL() + "events/?access_token=" + variableService.accessToken());
            source.addEventListener("status", function(event) {
                event = JSON.parse(event.data);
                $rootScope.status = event.data;
            });
            source.addEventListener("activity", function(event) {
                event = JSON.parse(event.data);
                $rootScope.activity = event.data;
                console.log("Activity: " + $rootScope.activity);
                });    
        });
         // Go home
          
         $location.path('/');
      });
    }]);

    //Called when login fails
    authProvider.on('loginFailure', ['$rootScope', function($rootScope) {
      // If anything goes wrong
       $rootScope.message = 'invalid credentials';
       // Hide loading indicator
       $rootScope.loading = false;
    }]);
    authProvider.on('authenticated', ['$rootScope', 'variableService', function($rootScope, variableService) {
        var source = new EventSource(variableService.apiURL() + "events/?access_token=" + variableService.accessToken());
        source.addEventListener("status", function(event) {
            event = JSON.parse(event.data);
            $rootScope.status = event.data;
        });
        source.addEventListener("activity", function(event) {
            event = JSON.parse(event.data);
            $rootScope.activity = event.data;
            console.log("Activity: " + $rootScope.activity);
            });
    }]);  
  }
  
  run.$inject = ['$rootScope', 'auth', 'store', 'jwtHelper']  
    
  function run($rootScope, auth, store, jwtHelper, $location) {
    FastClick.attach(document.body);
    $rootScope.$on('$locationChangeStart', function() {
    // Grab the user's token
    var token = store.get('token');
    // Check if token was actually stored
    if (token) {
      // Check if token is yet to expire
      if (!jwtHelper.isTokenExpired(token)) {
        // Check if the user is not authenticated
        if (!auth.isAuthenticated) {
          // Re-authenticate with the user's profile
          auth.authenticate(store.get('profile'), token);
        }
      } else {
        // Either show the login page
        $location.path('/login');
      }
    }
  });
  }
  
   /*if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }*/
})();
