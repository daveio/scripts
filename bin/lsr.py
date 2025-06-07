import logging
import sys
import time
from binascii import a2b_base64 as b64
from collections import deque

from broadlink import (
    discover as bl_discover,  # https://github.com/mjg59/python-broadlink
)
from rtmidi import midiutil  # https://github.com/SpotlightKid/python-rtmidi
from rtmidi.midiconstants import SONG_CONTINUE, SONG_START, SONG_STOP, TIMING_CLOCK

log = logging.getLogger("midiin_callback")
logging.basicConfig(level=logging.INFO)


class MIDIClockReceiver:
    pkt_ptrn = "JgBQAAABJJIUERQSExITEhMSExITEhMSEzcTNxM3EzcTNxM3EzgSNxM3FBEUERQ2FBEUEhMSExITEhM3EzcTEhM3EzcTNxQ2Ew=="
    pkt_30_pc = "JgBQAAABIZQSFBEUERQSExITExIUERQRFDYUNhQ2FDYUNhQ2FDYUNhQSExITNRU3ExITEhMSExITNxQ2FBEUERQ2FDYUNhQ2FA=="
    pkt_60_pc = "JgBYAAABJJIUEhMSExITEhMSExITEhQRFDYUNhQ2FDYUNhQ2FDYUNhQ3ExITNxMSExITEhMSExIUERQ2FBEUNhQ2FDYUNhQ2FA=="
    pkt_100_pc = "JgBQAAABJJIUERQRFBEUERQSExITEhMSEzcTNxM3EzcUNhQ2FDYUNhQRFDYUNhQ3ExITEhMSExITNxMSExITEhQ2FDYUNhQ2FA=="

    def __init__(self, bpm=None, device=None):
        self.device = device
        self.cycle = [
            self.pkt_100_pc,
            self.pkt_60_pc,
            self.pkt_30_pc,
        ]  # , pkt_chg_ptrn]
        self.cycle_ctr = 0
        self.bpm = bpm if bpm is not None else 120.0
        self.sync = False
        self.running = True
        self._samples = deque()
        self._last_clock = None
        self.clock_ctr = 0

    def on_beat(self):
        self.device.send_data(b64(self.pkt_ptrn))

    def __call__(self, event, data=None):
        msg, _ = event
        if msg[0] == TIMING_CLOCK:
            now = time.time()
            if self._last_clock is not None:
                self._samples.append(now - self._last_clock)
            self._last_clock = now
            self.clock_ctr += 1
            if self.clock_ctr >= 23:
                self.on_beat()
                self.clock_ctr = 0
            if len(self._samples) > 24:
                self._samples.popleft()
            if len(self._samples) >= 2:
                self.bpm = 2.5 / (sum(self._samples) / len(self._samples))
                self.sync = True
        elif msg[0] in (SONG_CONTINUE, SONG_START):
            self.running = True
            print("START/CONTINUE received.")
        elif msg[0] == SONG_STOP:
            self.running = False
            print("STOP received.")


def main(args=None):
    print("INFO:broadlink:Locating infrared transmitter. This may take a few attempts.")
    devices = []
    while len(devices) < 1:
        print("INFO:broadlink:Running discovery with 10s timeout.")
        devices = bl_discover(timeout=10)
    print("INFO:broadlink:Transmitter found. Authenticating.")
    devices[0].auth()
    print("INFO:broadlink:Ready to transmit.")

    clock = MIDIClockReceiver(bpm=None, device=devices[0])

    try:
        m_in, port_name = midiutil.open_midiinput(args[0] if args else 0)
    except (EOFError, KeyboardInterrupt):
        return 1

    m_in.set_callback(clock)
    # Important: enable reception of MIDI Clock messages (status 0xF8)
    m_in.ignore_types(timing=False)

    try:
        print("Waiting for clock sync...")
        while True:
            time.sleep(1)

            if clock.running:
                if clock.sync:
                    print("%.2f bpm" % clock.bpm)
                else:
                    print("%.2f bpm (no sync)" % clock.bpm)

    except KeyboardInterrupt:
        pass
    finally:
        m_in.close_port()
        del m_in


if __name__ == "__main__":

    sys.exit(main(sys.argv[1:]) or 0)
