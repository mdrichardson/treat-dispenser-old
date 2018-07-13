// This #include statement was automatically added by the Particle IDE.
#include <SparkTime.h>

/*##################################################
#
#
#                Treat Dispenser
#        MAX 20 VARIABLES, 15 FUNCTIONS
#
###################################################*/

/*##################################################
#
#                  Servo
#
##################################################*/
Servo myservo;// create servo object using the built-in Particle Servo Library
int servoPin = D0;  //declare variable for servo
int run = 0; //for stopping a continuous push/pull

int stop = 1500;
int push = 0;
int pull = 180;
int pullDelay = 600;
int maxDelay = 3000;
int loadDelay = 7500;

unsigned long lastTime = 0UL;

String last = "?"; //declare variable for time since last action

/*##################################################
#
#                  Time Zone
#
##################################################*/
int tZone = -8; // Default is PST
UDP UDPClient;
SparkTime rtc;

/*##################################################
#
#                  Interval Dispensing
#
##################################################*/
int intervalOn = 0;
int intervalSEon = 1;
int intervalStart = 800;
int intervalEnd = 1700;
int intMinutes = 30;
int intHours = 1;
int intImmediate = 1;
int intervalFirst = 1;

char intervals[256];
// send the interval values in json format
char *getIntervals()
{
    sprintf(intervals,"{\"on\": %d, \"SE\": %d, \"start\": %d, \"end\": %d, \"min\": %d, \"hr\": %d, \"imm\": %d}"
    ,intervalOn,intervalSEon,intervalStart,intervalEnd,intMinutes,intHours,intImmediate);
    return intervals;
}

unsigned long lastInt = 0UL;

/*##################################################
#
#                  Scheduled Dispensing
#
##################################################*/
int scheduleOn = 0;
int schedTime1On = 0;
int schedTime2On = 0;
int schedTime3On = 0;
int schedTime1S = 1;
int schedTime2S = 1;
int schedTime3S = 1;
int schedTime1 = 800;
int schedTime2 = 1200;
int schedTime3 = 1700;
int schedSun = 0;
int schedMon = 0;
int schedTue = 0;
int schedWed = 0;
int schedThu = 0;
int schedFri = 0;
int schedSat = 0;

char scheduleInfo[256];
// send the schedule values in json format
char *getSchedInfo()
{
    sprintf(scheduleInfo,"{\"on\": %d, \"t1on\": %d, \"t2on\": %d, \"t3on\": %d, \"t1s\": %d, \"t2s\": %d, \"t3s\": %d, \"t1\": %d, \"t2\": %d, \"t3\": %d}",scheduleOn,schedTime1On,schedTime2On,schedTime3On,schedTime1S,schedTime2S,schedTime3S,schedTime1,schedTime2,schedTime3);
    return scheduleInfo;
}

char scheduleDays[256];
// send the schedule day values in json format
char *getSchedDays()
{
    sprintf(scheduleDays,"{\"sun\": %d, \"mon\": %d, \"tue\": %d, \"wed\": %d, \"thu\": %d, \"fri\": %d, \"sat\": %d}",schedSun,schedMon,schedTue,schedWed,schedThu,schedFri,schedSat);
    return scheduleDays;
}

unsigned long lastSchedule = 0UL;

/*##################################################
#
#                  Dispensing Amounts
#
##################################################*/
int treatSize = 0; //0=S,1=M,2=L
int mealSize = 0;

char sizes[256];
// send the size values in json format
char *getSizes()
{
    sprintf(sizes,"{\"treat\": %d, \"meal\": %d}",treatSize,mealSize);
    return sizes;
}

int treatDelay = 1500;
int mealDelay = 20000;
int treatDispense;
int mealDispense;

/*##################################################
#
#                  Dispense Warning Tone
#
##################################################*/
int tonePin = D1;
int toneDuration = 100;
int toneDelay = 750;
int tone1 = 1568; // Frequency for G6 tone
int tone2 = 2093; // Frequency for G3 tone
int servingDelay = 750;
int useTone = 1;

/*##################################################
#
#                  Debugging Support
#
##################################################*/
char debugServo[256];
// send the debug values in json format
char *getDebugServo()
{
    sprintf(debugServo,"{\"stop\": %d, \"push\": %d, \"pull\": %d, \"pullD\": %d, \"maxD\": %d, \"loadD\": %d, \"treatD\": %d, \"mealD\": %d}"
    ,stop,push,pull,pullDelay,maxDelay,loadDelay,treatDelay,mealDelay);
    return debugServo;
}
char debugTone[256];
// send the tone values in json format
char *getDebugTone()
{
    sprintf(debugTone,"{\"duration\": %d, \"toneD\": %d, \"tone1\": %d, \"tone2\": %d, \"servingD\": %d, \"use\": %d}"
    ,toneDuration,toneDelay,tone1,tone2,servingDelay,useTone);
    return debugTone;
}

String OGdebugServo = "{\"stop\": "+String(stop)+", \"push\": "+String(push)+", \"pull\": "+String(pull)+
    ", \"pullD\": "+String(pullDelay)+", \"maxD\": "+String(maxDelay)+", \"loadD\": "+String(loadDelay)+", \"treatD\": "+
    String(treatDelay)+", \"mealD\": "+String(mealDelay)+"}";
    
String OGdebugTone = "{\"duration\": "+String(toneDuration)+", \"toneD\": "+String(toneDelay)+", \"tone1\": "+String(tone1)+
    ", \"tone2\": "+String(tone2)+", \"servingD\": "+String(servingDelay)+", \"use\": "+String(useTone)+"}";

/*##################################################
#
#                  Track Barks
#
##################################################*/    
int barkCount = 0;
int lastBark = 0UL;
/*##################################################
#
#                  Servo Setup
#
##################################################*/
void setup()
{
    myservo.attach(servoPin); // Initialize the servo attached to pin D0
    myservo.detach(); //detach the servo to prevent it from jittering

/*##################################################
#
#                  Declare Cloud Functions
#
##################################################*/
    Particle.function("setTimeZone",setTimeZone);
    Particle.function("auger",auger);
    Particle.function("setInterval",setInterval);
    Particle.function("setSchedule",setSchedule);
    Particle.function("setSizes",setSizes);
    Particle.function("test",test);
    Particle.function("debug",setDebug);
    Particle.function("bark",bark);
    
/*##################################################
#
#                  Declare Cloud Variables
#
##################################################*/
    Particle.variable("connected","yes");
    Particle.variable("tZone",tZone);
    Particle.variable("intervals",getIntervals());
    Particle.variable("scheduleInfo",getSchedInfo());
    Particle.variable("scheduleDays",getSchedDays());
    Particle.variable("sizes",getSizes());
    Particle.variable("debugServo",getDebugServo());
    Particle.variable("debugTone",getDebugTone());
    Particle.variable("OGdebugServo",OGdebugServo);
    Particle.variable("OGdebugTone",OGdebugTone);
    Particle.variable("last", last);
    Particle.variable("barkCount",barkCount);
    Particle.variable("lastBark",lastBark);

 /*##################################################
#
#                  Startup Notifications
#
##################################################*/ 
    Particle.publish("activity", "Starting");
    Particle.publish("status", "Connected");
    Particle.publish("command","update"); // Ensure that page is updated if device reboots
    
    
    
 /*##################################################
#
#                  Time Zone Setup
#
##################################################*/
    rtc.begin(&UDPClient, "north-america.pool.ntp.org");
    rtc.setTimeZone(tZone);
    rtc.setUseDST(true);
        
}
 /*##################################################
#
#                  Looping Functions
#
##################################################*/
void loop()
{
    // Every 10 seconds publish connection status
    unsigned long now = millis();
    if (now-lastTime>10000UL)
    {
        lastTime = now;
        Particle.publish("status", "Connected");
    }
    // Check if interval needs to run
    if (intervalOn == 1)
    {
        unsigned long intervalInt = (intMinutes * 60000) + (intHours * 360000);
        if (intImmediate == 1 && intervalFirst == 1)
        {
            intervalFirst = 0;
            treats();
            lastInt = now;
            Particle.publish("Interval","Dispensing");
        }
        if (now - lastInt > intervalInt)
        {
            treats();
            lastInt = now;
            Particle.publish("Interval","Dispensing");
        }
    }
    // Check if Schedule needs to run
    if (scheduleOn == 1)
    {
        unsigned long currentDay = Time.weekday(Time.now());
        if ((schedSun == 1 && currentDay == 1) || (schedMon == 1 && currentDay == 2) || (schedTue == 1 && currentDay == 3) || (schedWed == 1 && currentDay == 4) || (schedThu == 1 && currentDay == 5)
         || (schedFri == 1 && currentDay == 6) || (schedSat == 1 && currentDay == 7))
         {
            String currentTime = rtc.hourString(rtc.now()) + rtc.minuteString(rtc.now());
            int currentTimeInt = atoi(currentTime);
            if (currentTimeInt == schedTime1 || currentTimeInt == schedTime2 || currentTimeInt == schedTime3)
            {
                if (now-lastSchedule > 5 * 60000UL) // Ensure there's at least a 5 minute delay between dispensing
                {
                    lastSchedule = now;
                    if (currentTimeInt == schedTime1)
                    {
                        if (schedTime1S == 0)
                        {
                            treats();
                            Particle.publish("Schedule","Dispensing Treat");
                        } else {
                            meals();
                            Particle.publish("Schedule","Dispensing Meal");
                        }
                    } else if (currentTimeInt == schedTime2) {
                        if (schedTime2S == 0)
                        {
                            treats();
                            Particle.publish("Schedule","Dispensing Treat");
                        } else {
                            meals();
                            Particle.publish("Schedule","Dispensing Meal");
                        }
                    } else if (currentTimeInt == schedTime3) {
                        if (schedTime3S == 0)
                        {
                            treats();
                            Particle.publish("Schedule","Dispensing Treat");
                        } else {
                            meals();
                            Particle.publish("Schedule","Dispensing Meal");
                        }
                    }
                    
                }
            }
         }
    }
}

 /*##################################################
#
#                  Time Zone Functions
#
##################################################*/
int setTimeZone(String offset)
{
    tZone = atoi(offset);
    rtc.setTimeZone(tZone);
    return 1;
}

 /*##################################################
#
#                  Tone Functions
#
##################################################*/
void playTone()
{
    if (useTone == 1)
    {
        tone(tonePin, tone1, toneDuration);
        delay(toneDelay + toneDuration);
        tone(tonePin, tone2, toneDuration);
        delay(servingDelay + toneDuration);
    }
}

 /*##################################################
#
#                  Servo functions
#
##################################################*/
// stop the servo
void end()
{
    run = 0;
    myservo.writeMicroseconds(stop);
    delay(1000);
    Particle.publish("activity", "Idle");
}

// dispense treats
void treats()
{
    if (treatSize == 0)
    {
        treatDispense = treatDelay;
    }
    else if (treatSize == 1)
    {
        treatDispense = treatDelay * 1.5;
    }
    else if (treatSize == 2)
    {
        treatDispense = treatDelay * 2;
    }
    noJam(treatDispense);
}

// dispense meals
void meals()
{
    if (mealSize == 0)
    {
        mealDispense = mealDelay;
    }
    else if (mealSize == 1)
    {
        mealDispense = mealDelay * 1.5;
    }
    else if (mealSize == 2)
    {
        mealDispense = mealDelay * 2;
    }
    noJam(mealDispense);
}

// briefly reverse auger and push again to prevent jams
void noJam(int amount)
{
    int remaining = amount;
    run = 1;
    Particle.publish("activity", "Dispensing");
    myservo.attach(servoPin);
    playTone();
    while (remaining > 0)
        {
        if (remaining <= maxDelay)
        {
            myservo.write(push);
            delay(remaining);
            myservo.write(pull);
            delay(pullDelay);
            remaining -= mealDispense;
            break;
        }
        else 
        {
            myservo.write(push);
            delay(maxDelay);
            myservo.write(pull);
            delay(pullDelay);
            remaining -= maxDelay;
        }
    }
    end();
}

// [Web command] move the auger
int auger(String command)
{
    // make sure auger isn't disabled
    if (run == 1)
    {
        end();    
    }
    // Normal commands
    if (command == "load")
    {
        Particle.publish("activity", "Loading");
        noJam(loadDelay);
        return 1;
    }
    else if (command == "treat")
    {
        
        treats();
        last = Time.now();
        return 1;
    }
    else if (command == "meal")
    {
        
        meals();
        last = Time.now();
        return 1;
    }
    // Debugging commands
    else if (command == "out")
    {
        run = 1;
        myservo.attach(servoPin);
        Particle.publish("activity", "Pushing");
        do
            {
                myservo.write(push);
                delay(maxDelay);
                myservo.writeMicroseconds(stop);
                delay(2000);
            } while (run==1);
        return 1;
    }
    else if (command == "in")
    {
        run = 1;
        myservo.attach(servoPin);
        Particle.publish("activity", "Pulling");
        do
            {
                myservo.write(pull);
                delay(maxDelay);
                myservo.writeMicroseconds(stop);
                delay(2000);
            } while (run == 1);
        return 1;
    }
    else if (command=="inout")
    {
        run = 1;
        myservo.attach(servoPin);
        do
            {   myservo.write(push);
                delay(maxDelay);
                myservo.write(pull);
                delay(maxDelay);
            } while (run == 1);
        return 1;
    }
    else if (command == "stop")
    {
        end();
        return 1;
    }
    else
    {
        return 0;
    }
    run = 0;
    return 1;
}

// [Web command] set treat sizes
int setSizes(String type0size)
{
    String type;
    String size;
    // Size comes in as a string with variables separated by commas
    // This converts the strings into appropriate variables
    for (int i = 0; i < type0size.length(); i++) {
      if (type0size.substring(i, i+1) == ",") {
        type = type0size.substring(0, i);
        size = atoi(type0size.substring(i+1));
        break;
      }
    }
    if (type == "treat")
    {
        treatSize = atoi(size);
    }
    else if (type == "meal")
    {
        mealSize = atoi(size);
    }
    else
    {
        return -1;
    }
    getSizes();
    return 1;
}

 /*##################################################
#
#                  Interval Functions
#
##################################################*/
// [Web command] Set the interval settings
int setInterval(String command0setting)
{
    String command;
    String setting;
    // command and setting comes in as a string with variables separated by commas
    // This converts the strings into appropriate variables
    for (int i = 0; i < command0setting.length(); i++) {
      if (command0setting.substring(i, i+1) == ",") {
        command = command0setting.substring(0, i);
        setting = atoi(command0setting.substring(i+1));
        break;
      }
    }
    if (command == "on")
    {
        intervalOn = atoi(setting);
        if (setting == "1")
        {
            Particle.publish("Interval","on");
        }
        else
        {
            Particle.publish("Interval","off");
        }
    }
    else if (command == "SEon")
    {
        intervalSEon = atoi(setting);
    }
    else if (command == "start")
    {
        intervalStart = atoi(setting);
    }
    else if (command == "end")
    {
        intervalEnd = atoi(setting);
    }
    else if (command == "minutes")
    {
        intMinutes = atoi(setting);
    }
    else if (command == "hours")
    {
        intHours = atoi(setting);
    }
    else if (command == "immediate")
    {
        intImmediate = atoi(setting);
    }
    else
    {
        return -1;
    }
    getIntervals();
    return 1;
}

 /*##################################################
#
#                  Schedule Functions
#
##################################################*/
// [Web command] Set schedule settings
int setSchedule(String command0setting)
{
    String command;
    String setting;
    // command and setting comes in as a string with variables separated by commas
    // This converts the strings into appropriate variables
    for (int i = 0; i < command0setting.length(); i++) {
      if (command0setting.substring(i, i+1) == ",") {
        command = command0setting.substring(0, i);
        setting = atoi(command0setting.substring(i+1));
        break;
      }
    }
    if (command == "on")
    {
        scheduleOn = atoi(setting);
        if (setting == "1")
        {
            Particle.publish("Schedule","on");
        }
        else
        {
            Particle.publish("Schedule","off");
        }
    }
    else if (command == "t1on")
    {
        schedTime1On = atoi(setting);
    }
    else if (command == "t2on")
    {
        schedTime2On = atoi(setting);
    }
    else if (command == "t3on")
    {
        schedTime3On = atoi(setting);
    }
     else if (command == "t1size")
    {
        schedTime1S = atoi(setting);
    }
    else if (command == "t2size")
    {
        schedTime2S = atoi(setting);
    }
    else if (command == "t3size")
    {
        schedTime3S = atoi(setting);
    }
    else if (command == "t1")
    {
        schedTime1 = atoi(setting);
    }
    else if (command == "t2")
    {
        schedTime2 = atoi(setting);
    }
    else if (command == "t3")
    {
        schedTime3 = atoi(setting);
    }
    else if (command == "sun")
    {
        schedSun = atoi(setting);
    }
    else if (command == "mon")
    {
        schedMon = atoi(setting);
    }
    else if (command == "tue")
    {
        schedTue = atoi(setting);
    }
    else if (command == "wed")
    {
        schedWed = atoi(setting);
    }
    else if (command == "thu")
    {
        schedThu = atoi(setting);
    }
    else if (command == "fri")
    {
        schedFri = atoi(setting);
    }
    else if (command == "sat")
    {
        schedSat = atoi(setting);
    }
    else
    {
        return -1;
    }
    getSchedInfo();
    getSchedDays();
    return 1;
}
 /*##################################################
#
#                  Debugging Functions
#
##################################################*/

// [Web command] Set debugging settings
int setDebug(String type0command0setting)
{
    // command and setting comes in as a string with variables separated by commas
    // This converts the strings into appropriate variables
    int commaIndex = type0command0setting.indexOf(',');
    int secondCommaIndex = type0command0setting.indexOf(',', commaIndex + 1);
    String type = type0command0setting.substring(0, commaIndex);
    String command = type0command0setting.substring(commaIndex + 1, secondCommaIndex);
    String setting = type0command0setting.substring(secondCommaIndex + 1);
    if (type == "servo")
    {
       if (command == "stop")
        {
            stop = atoi(setting);
        }
        else if (command == "push")
        {
            push = atoi(setting);
        }
        else if (command == "pull")
        {
            pull = atoi(setting);
        }
        else if (command == "pullD")
        {
            pullDelay = atoi(setting);
        }
         else if (command == "maxD")
        {
            maxDelay = atoi(setting);
        }
        else if (command == "loadD")
        {
            loadDelay = atoi(setting);
        }
        else if (command == "treatD")
        {
            treatDelay = atoi(setting);
        }
        else if (command == "mealD")
        {
            mealDelay = atoi(setting);
        }
        else
        {
            return -1;
        } 
    } else if (type == "tone")
    {
        if (command == "duration")
        {
            toneDuration = atoi(setting);
        }
        else if (command == "toneD")
        {
            toneDelay = atoi(setting);
        }
        else if (command == "tone1")
        {
            tone1 = atoi(setting);
        }
        else if (command == "tone2")
        {
            tone2 = atoi(setting);
        }
         else if (command == "servingD")
        {
            servingDelay = atoi(setting);
        }
        else if (command == "use")
        {
            useTone = atoi(setting);
        }
        else
        {
            return -1;
        }
    } else {
        return -1;
    }
    getDebugServo();
    getDebugTone();
    return 1;
}
 /*##################################################
#
#                  Bark Functions
#
##################################################*/
// Track barks - function is called by Netcam webcam, not web app
int bark(String command)
{
    if (command == "increase")
    {
        barkCount += 1;
        lastBark = Time.now();
    } 
    else if (command == "reset")
    {
        barkCount = 0;
        lastBark = 0UL;
    } 
    else 
    {
        return -1;
    }
    Particle.publish("bark",String(barkCount));
    return 1;
    
}
 /*##################################################
#
#                  Test Functions
#
##################################################*/
int test(String command)
{
    if (command == "tone")
    {
        playTone();
        playTone();
        playTone();
        return 1;
    } 
    else if (command == "auger")
    {
        myservo.attach(servoPin);
        Particle.publish("activity", "Testing");
        myservo.write(push);
        delay(1000);
        myservo.write(pull);
        delay(400);
        myservo.writeMicroseconds(stop);
        delay(1000);
        myservo.detach();
        return 1;
    }
    else 
    {
    return 0;
    }
}
