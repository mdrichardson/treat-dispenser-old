# Treat Dispenser and Web App

This is a dog treat dispenser that dispenses treats based off of input from a progressive web app, time intervals, and or feeding schedule. The dispenser, itself, is based lossely off of [this model.](https://www.thingiverse.com/thing:27854)

## TreatDispenser.ino

This is the code executed on a Particle Photon (similar to an Arduino--uses C/C++).

### Features

* Dispense treat on command
* Dispense treat on customizeable intervals
* Dispense treat on customizeable schedule
* Dispense treats or meals in customizeable sizes/amounts
* Optionally play an audible "warning tone" of customizeable frequency before dispensing
  * When I first used this, my dog was scared of the sound of the servo. Adding the "warning" tone helped
* Track how often your dog barks so that you can not dispense a treat if they are barking too much
  * You need something else to track the barks and send the command to the Photon. I used a webcam that executed a bark tracking script on my PC
* All settings can be tracked and changed in a web app

### How it Works

1. Command for dispensing treat is sent to Photon based off of user input, interval, or schedule
2. Photon receives command over its Wi-Fi connection
3. Photon optionally plays "warning" tone so dog isn't scared of servo starting up
4. Photon spins servo (motor) to push treats out of the dispensing hole
    * The amount it spins is time-based and can be customized
5. Dispensing is complete and web app is notified

### Hardware

![Particle Photon Treat Dispenser](https://raw.githubusercontent.com/mdrichardson/treat-dispenser/master/treat-dispenser-photon.png)

1. Breadboard - Connects all of the hardware pieces together
2. Particle Photon - Executes all code
3. Power Adapter - Additional power had to be applied because I used a servo with greater-than-standard torque. Otherwise, the Photon can be powered via USB
4. Capacitors - Provides cleaner power to the servo and helps prevent mechanical bugs
5. Resistor - Decreases power sent to speaker, so the "warning" tone is quieter
6. Piezo Speaker - Plays "warning" tone
7. Servo - Turns the auger, which dispenses treats

## public (folder)

This is the progressive web app. See the [`README.md`](https://github.com/mdrichardson/treat-dispenser/blob/master/public/README.md) inside it for details

## auger*.stl

These are the 3D-printed parts for the auger, which is used to dispense the treats.

## Limitations

* Currently only works with small treats
  * This can be fixed by using a larger auger
* Treats can easily become jammed or not dispense at all
  * A gravity-fed system would work better than this, which pushes horizontally
* Particle Photon has limited memory, which decreases:
  * Number of web variables - It would be nice to be able to track more.
    * I mostly overcame this limitation by rolling multiple variables into single `char` pointers
  * Number of features - More efficient code might allow for more
* Photon variables reset to defaults on power reset
  * This can be mitigated by storing them in the web database and having the Photon request them on startup

## To-Do

- [X] Comment the web app code
- [ ] Host the web app again (I took it down and deleted Auth0 account after no longer using it)
- [ ] Simplify the Photon code. Schdeuling features aren't really necessary.
- [ ] Write my own user authentication database (currently uses [Auth0](http://www.auth0.com))

## Needs to be done, but won't be unless I pick the project back up

- [ ] 3D print a gravity-fed system
- [ ] Store variable values in web database and have Photon request them at startup