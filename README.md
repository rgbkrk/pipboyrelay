# pipboyrelay

Relay for the pip boy app for Fallout 4

Totally a work in progress. Checkout the TODO/ROADMAP to see what you could help with.

## Requirements

* Fallout 4 for the PC, PS4, or XBONE. Failing that, using this near your loved ones on the same wifi network
* pip boy app for Android or iOS
* pip boy app enabled in-game on Fallout 4
* nodejs, npm

## Installation

```
npm install -g pipboyrelay
```

## Usage

Run the pipboy relay at the command line:

```
$ pipboyrelay
Discovered:  { IsBusy: false,
  MachineType: 'PS4',
  info: { address: '192.168.1.71', family: 'IPv4', port: 28000, size: 50 } }
```

It will autodiscover any games running with an active server on your local network and create its own endpoints that the Android/iOS app will recognize.

Open up the mobile app, navigate to the connection settings screen and connect to the *other* address listed than you saw discovered above. You should start seeing data fly by.
