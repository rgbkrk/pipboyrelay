# pipboyrelay

[![npm version](https://badge.fury.io/js/pipboyrelay.svg)](https://badge.fury.io/js/pipboyrelay)

Relay for the pip boy app for Fallout 4

![It's Close to Metal!](https://8d8dcdd952aa2708c2ff-519cda130c91226e76017ae910bdb276.ssl.cf1.rackcdn.com/close-to-metal-ba0f30d76e986ef9fa02e7fbb1c3a8a954b268777325adf87250e3f0cfc4ef17.png)

[Read the blog post for more details](https://getcarina.com/blog/fallout-4-service-discovery-and-relay)

The entire protocol has been decoded and there are now full node bindings at [pipboylib](https://github.com/RobCoIndustries/pipboylib)!

## Requirements

* Fallout 4 for the PC or PS4. (XBONE has not been diagnosed)
* pip boy app for Android or iOS
* pip boy app enabled in-game on Fallout 4
* nodejs >= 4.x, npm

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

```
UDP and TCP Relay created for:  { address: '192.168.1.71', family: 'IPv4', port: 28000, size: 50 }
listening
[TCP Relay] 192.168.1.71:27000 -> ::ffff:192.168.1.67:55232
00000000: 2300 0000 017b 226c 616e 6722 3a22 656e  #....{"lang":"en
00000010: 222c 2276 6572 7369 6f6e 223a 2231 2e31  ","version":"1.1
00000020: 2e32 312e 3022 7d0a                      .21.0"}.

[TCP Relay] 192.168.1.71:27000 -> ::ffff:192.168.1.67:55232
00000000: 754e 0600 0306 5290 0f00 2447 656e 6572  uN....R...$Gener
00000010: 616c 0003 6290 0f00 1e00 0000 0661 900f  al..b........a..
00000020: 004c 6f63 6174 696f 6e73 2044 6973 636f  .Locations.Disco
...
[TCP Relay] 192.168.1.71:27000 -> ::ffff:192.168.1.67:55232
00000000: 7565 002d 910f 0074 6578 7400 2f91 0f00  ue.-...text./...
00000010: 7368 6f77 4966 5a65 726f 0000 0003 3291  showIfZero....2.
00000020: 0f00 0000 0000 0631 910f 0046 6974 7320  .......1...Fits.
...
```

Interesting bit above - look at byte 0x18 (0x1e), occurring right before
"Locations Discovered". That's the current number of locations discovered with
my current character. It's a binary format but it's in plaintext. Should be able
to decode this and hopefully send instructions to the running server.
