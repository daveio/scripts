import os
from mutagen.flac import FLAC


def get_flac_details(directory):
    for dirpath, dirnames, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith('.flac'):
                file_path = os.path.join(dirpath, filename)
                audio = FLAC(file_path)
                print(f'{file_path} : {audio.info.sample_rate}Hz : {audio.info.bits_per_sample}-bit ')


# Change the directory path to the top-level directory to start searching
directory_path = '/Users/dave/Music/out.picard'
get_flac_details(directory_path)
