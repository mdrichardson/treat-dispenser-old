(function() {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',

    //foundation
    'foundation',
    'foundation.dynamicRouting',
    'foundation.dynamicRouting.animations',
  ])

  .config(config)
  .run(run)

.filter('trust', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}])

// Factory for interacting with Photon
.factory('variableService', ['$http', 'NotificationFactory', function($http, NotificationFactory) {
    // Get access token from Auth0 account
    var accessToken = function(){
        //store.get('profile');
        var profile =
            {
                user_metadata: {
                    particleDevice_ID: "",
                    particleAccessToken: "",
                    videoURL: "https://localhost:8100/live/0?authToken=",
                    videoAuthToken: ""
                }
            }
        return profile.user_metadata.particleAccessToken;
    };
    // Get Photon ID from Auth0 account
    var apiURL = function() {
        //store.get('profile');
        var profile =
            {
                user_metadata: {
                    particleDevice_ID: "",
                    particleAccessToken: "",
                    videoURL: "https://localhost:8100/live/0?authToken=",
                    videoAuthToken: ""
                }
            }
        if (profile != null) {
            return "https://api.particle.io/v1/devices/" + profile.user_metadata.particleDevice_ID + "/";
        }        
    }
    // Get variable values from the Photon
    var getVariable = function(getVar) {
        return $http.get(apiURL()+  getVar + '?access_token=' + accessToken()).then(function (data) {
        return data.data.result;   
    }, function (err) {
        console.log('An error occurred while getting variable: ', err);
        throw err;                  
    });
    };
    // Call Photon functions
    var functionCall = function functionCall(functionName, functionArg) {
        if (functionName == 'auger'){
            $(".button.auger").addClass('disabled');
        }
        return $http({
                method: 'POST',
                url: apiURL() + functionName + '?access_token=' + accessToken(),
                data: $.param({args: functionArg}),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                })
                // Disable/Enable auger function while auger is/not in use
                .success(function() {
                    console.log(functionName + ' performed succesfully: ' + functionArg);
                    $(".button.auger").removeClass('disabled');
                })
                .error(function() {
                    console.log('An error occurred while getting variable: ', err);
                    $(".button.auger").removeClass('disabled');
                });
    };
    // Display notifications in web app
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
  // Home page controller
  .controller('homeCtrl', ['$scope', '$interval', '$sce', 'variableService', function($scope, $interval, $sce, variableService) {  
    //store.get('profile');
    $scope.userProfile =
    {
        user_metadata: {
            particleDevice_ID: "",
            particleAccessToken: "",
            videoURL: "https://localhost:8100/live/0?authToken=",
            videoAuthToken: ""
        }
    }
    moment().format("hh:mm:ss");
    // Update last treat dispense time
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
    // Dispense treat
    $scope.treat = function() {
      variableService.functionCall("auger","treat").then(function (result) {
          variableService.notify("Treat Dispense","Successful","success","3000");
          $scope.getLast();
      }, function(err) {
          console.log('Error dispensing treat: ', err);
          variableService.notify("Treat Dispense","Failed","alert","3000");
      });      
    };
    // Dispense meal
    $scope.meal = function() {
        variableService.functionCall("auger","meal").then(function (result) {
          variableService.notify("Meal Dispense","Successful","success","3000");
          $scope.getLast();
      }, function(err) {
          console.log('Error dispensing meal: ', err);
        variableService.notify("Meal Dispense","Failed","alert","3000");
      });      
    };
    // Play webcam video
    $scope.loadVideo = function() {
        //store.get('profile');
        var userProfile =
            {
                user_metadata: {
                    particleDevice_ID: "",
                    particleAccessToken: "",
                    videoURL: "https://localhost:8100/live/0?authToken=",
                    videoAuthToken: ""
                }
            }
        return userProfile.user_metadata.videoURL + userProfile.user_metadata.videoAuthToken; // This will be different for non-Netcam users
    };
    $scope.getLast();
    $interval(function(){
      $scope.getLast();
    }, 5000);
    // Ensure video stays properly synced
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
  // Status bar controller - Tracks current status of Photon
  .controller('statusCtrl', ['$rootScope', function($rootScope) {
    $rootScope.status = 'Connecting...';
    $rootScope.activity = 'Idle';  
  }])
  // Settings page controller
   .controller('settingsCtrl', ['$scope', '$rootScope', 'variableService', function($scope, $rootScope, variableService) {
    // Update variables from Photon and apply CSS badges, appropriately
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
    // Track when connected to Photon. Settings are unavailable when disconnected
    $scope.showSettings = function() {
        if ($rootScope.status == "Connected") {
            return true;
        } else {
            return false; // Set to return true for testing purposes, false otherwise
        }
    };
    // Update Interval settings
    $scope.showIntervalSelect = function() {
        if ($scope.intervalSEon == 1) {
            return true;
        } else {
            return false;
        }
    } 
    // Update Treat Size settings
    $scope.treat = function(size) {
      variableService.functionCall("setSizes", "treat," + size).then(function (result) {
          $scope.getSizes();
      }, function(err) {
          console.log('Error setting treatSize: ', err);
      });      
    };
    // Update Meal Size settings
    $scope.meal = function(size) {
      variableService.functionCall("setSizes","meal," + size).then(function (result) {
          $scope.getSizes();
      }, function(err) {
          console.log('Error setting mealSize: ', err);
      });      
    };
    // Toggle Interval Off
    $scope.stopInterval = function() {
      $scope.intervalToggle = false;
      variableService.functionCall("setInterval","on,0");
      variableService.notify("Interval","Turned Off","success","3000");
    };
    // Get Interval settings
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
        // Deal with H:MM vs HH:MM
        if ($scope.intervalStart.length == 3)
        {
            $scope.intervalStart = 0 + $scope.intervalStart;
        }
        if ($scope.intervalEnd.length == 3)
        {
            $scope.intervalEnd = 0 + $scope.intervalEnd;
        }
        // Break it up into hours and minutes
        $scope.intervalStartHours = $scope.intervalStart.substring(0,2);
        $scope.intervalStartMinutes = $scope.intervalStart.substring(2);
        $scope.intervalEndHours = $scope.intervalEnd.substring(0,2);
        $scope.intervalEndMinutes = $scope.intervalEnd.substring(2);
        // Figure out AM/PM
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
    // Toggle Interval On/Off and display alerts if Times are invalid
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
    // Set the interval
    $scope.interval = function(cmd) {
      variableService.functionCall("setInterval",cmd).then(function (result) {
          $scope.getIntervals();
      }, function(err) {
          console.log('Error setting Intervals: ', err);
      });      
    };
    // Set Interval Start and End Times
    $scope.intervalSE = function(category,type,value) {
      $scope.stopInterval();
      if (category == "start")
      // Convert to time format Photon understands. Sends hours and minutes separately
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
    // Sets dispensing interval time
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
  // Debug controller
  .controller('debugCtrl', ['$scope', 'variableService', function($scope, variableService) {
    // Functions are pretty self-explanatory
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

// Login Controller - currently uses auth0
  .controller('loginCtrl', ['$scope', function ($scope) {
  }])

    /* OLD AUTH0 CONFIG FUNCTION
    authProvider.init({
      domain: 'mdrichardson.auth0.com',
      clientID: 'RwemO0j428onYQYPbR5iBUyaaQ9ERJ53',
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
  */
//   run.$inject = ['$rootScope'] 
        /* OLD AUTH0 RUN FUNCTIONS
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
      
    } */
//     }]);
//   }
// ServiceWorker for progressive web app -- Currently disabled for testing
   /*if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }*/
  config.$inject = ['$urlRouterProvider', '$locationProvider'];
  run.$inject = ['$rootScope', 'variableService'];

  
  function config($urlProvider, $locationProvider) {
        $urlProvider.otherwise('/');

        $locationProvider.html5Mode({
        enabled:true,
        requireBase: false
        });

        $locationProvider.hashPrefix('!');
        }
    function run($rootScope, variableService) {
        FastClick.attach(document.body);
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
        }
})();
