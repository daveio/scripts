# `lsr`: Lightswitch Rave

This is a bunch of code I've written to turn my smart (and less smart) lighting into music-reactive party lighting.

Currently there's only one utility, in `main.py`. It controls cheap infrared-only mood lights I got from Amazon.

In future, I'm hoping to migrate away from LightDJ on the iPad and write my own automation for the Hue and Nanoleaf
lights I have, but for now this is it.

## What the hell is a lightswitch rave?

https://www.youtube.com/watch?v=O4gqsuww6lw

## `main.py`

This uses [python-rtmidi] in conjunction with anything which can output a MIDI clock (see below).
On each beat (24 MIDI clock cycles), it uses a Broadlink RM3 (though anything supported by [python-broadlink]
will work) to send an infrared command to the lights, telling them to change their pattern.

### Getting a MIDI clock

Originally I plumbed into Serato using Ableton Link, but it became head-slappingly obvious that getting clean BPM data
out of Serato would involve having the decks in SYNC mode permanently. I didn't fancy having to adjust everything before
playback, so I looked into less intelligent ways of doing things.

My first stop was [HoRNet Songkey], a VST/AU which I could put in the audio path using [Audio Hijack].
_This did not work_. I'm sure it's great for key analysis, but its BPM analysis is hot garbage and the MIDI output it
promises is only the chords it detects. No beat data. So no.

Next stop was [Wavesum], and this is where choirs of angels sang a heavenly chorus. There's a reason their software is
so overpriced, and that's because it works _really, really well_. I targeted the cheapest option, [Waveclock], which
only sends a MIDI clock out, and the result is good enough. I might upgrade later to [Wavetick], which sends out notes
based on bar, beat, and 'atom' as they call it. The bar phase analysis is actual witchcraft, and I haven't managed to
confuse it for more than a bar or two. It'd be quite cool to use the bar signal for major lighting changes, and the beat
for minor ones.

But I'm poor, so [Waveclock] it is. Again with the help of [Audio Hijack] to give it a fake line-in taken directly from
Serato's audio output path, so it can do its job without having an air gap in the way.

[python-rtmidi]: https://github.com/SpotlightKid/python-rtmidi
[python-broadlink]: https://github.com/mjg59/python-broadlink
[HoRNet Songkey]: https://www.hornetplugins.com/plugins/hornet-songkey-mk3
[Audio Hijack]: https://rogueamoeba.com/audiohijack
[Wavesum]: http://wavesum.net/products.html
[Waveclock]: http://wavesum.net/products.html
[Wavetick]: http://wavesum.net/products.html
