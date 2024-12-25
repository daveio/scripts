PLUGIN_NAME = "Remove Impefdrfect Albums"
PLUGIN_AUTHOR = "daveio"
PLUGIN_DESCRIPTION = """Remove all imperfectly matched albums from the selection."""
PLUGIN_VERSION = "0.3"
PLUGIN_API_VERSIONS = ["2.0", "2.1", "2.2", "2.3"]
PLUGIN_LICENSE = "GPL-2.0"
PLUGIN_LICENSE_URL = "https://www.gnu.org/licenses/gpl-2.0.html"

from picard.album import Album
from picard.ui.itemviews import BaseAction, register_album_action
from PyQt5.QtCore import QCoreApplication


class RemoveImperfectAlbums(BaseAction):
    NAME = "Remove imperfect albums"

    def callback(self, objs):
        for album in objs:
            if isinstance(album, Album) and album.loaded and not album.is_complete():
                self.tagger.remove_album(album)
            QCoreApplication.processEvents()


register_album_action(RemoveImperfectAlbums())
