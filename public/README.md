# Treat Dispenser Web App

This is a progressive web app used to control the Particle Photon treat dispenser in this repo.

## Features

* Progressive - Can be "installed" on mobile phones
  * Assets are stored for offline use. Only variables and webcam feed update
* User authentication via [auth0](http://www.auth0.com)
* Webcam display (using user authentication in auth0 database)
* Treat Dispenser Function Control:
  * Treat dispense
  * Meal dispense
  * Debug: Make auger spin out
  * Debug: Make auger spin in
  * Debug: Make auger spin in then out until told to stop
  * Debug: Force stop the auger
  * Debug: Play "warning" tone
  * Debug: Execute testing function in Photon (I frequently changed the code of this function for quick testing)
* Requests variables from Treat Dispenser and auto-loads them in web app
* Treat Dispenser Variable Controls:
  * Treat Size, Meal Size
  * Toggle: Run continuously or only between Start and End Times
    * Interval Start Time, Interval End Time
    * Dispense Interval On/Off
    * Dispense Interval Time (hours:minutes)
  * Toggle: Scheduled Dispensing On/Off
    * Schedule Days
    * 3 Different Dispensing Times