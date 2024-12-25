import os

from mutagen.flac import FLAC
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4

decoders = {"flac": FLAC, "mp3": MP3, "m4a": MP4}


def get_samplerate_bitdepth(directory):
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            ext = os.path.splitext(filename)[1][1:]
            file_path = os.path.join(dirpath, filename)
            if ext not in decoders:
                print(f"{file_path} : NO DECODER)")
            else:
                decoder = decoders.get(ext)
                audio = decoder(file_path)
                if ext == "mp3":
                    print(f"{file_path} : {audio.info.sample_rate}Hz")
                else:
                    print(
                        f"{file_path} : {audio.info.sample_rate}Hz : {audio.info.bits_per_sample}-bit"
                    )


# Change the directory path to the top-level directory to start searching
directory_path = "/Users/dave/Music/out.picard"
get_samplerate_bitdepth(directory_path)
