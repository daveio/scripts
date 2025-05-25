import unittest
import os
import shutil
import tempfile
import logging
import argparse
import io # Added for StringIO
from unittest.mock import patch, MagicMock

# Add the script's directory to sys.path to ensure xmp_mover can be imported
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import xmp_mover
from xmp_mover import TARGET_DIR_NAME, XMP_EXTENSION

# Suppress logging output during tests
logging.disable(logging.CRITICAL)


class TestXmpMover(unittest.TestCase):

    def setUp(self):
        # Create a temporary directory
        self.test_dir = tempfile.mkdtemp()
        # Create a real Console instance but redirect its output for tests
        self.mock_console = xmp_mover.Console(file=io.StringIO())

    def tearDown(self):
        # Remove the temporary directory after the test
        shutil.rmtree(self.test_dir)

    def test_setup_target_dir_creation(self):
        """Test that the target directory is created if it doesn't exist."""
        target_dir_path = os.path.join(self.test_dir, TARGET_DIR_NAME)
        self.assertFalse(os.path.exists(target_dir_path))

        created_path = xmp_mover.setup_target_dir(self.test_dir)
        self.assertEqual(created_path, target_dir_path)
        self.assertTrue(os.path.exists(target_dir_path))

    def test_setup_target_dir_already_exists(self):
        """Test that the function handles an already existing target directory."""
        target_dir_path = os.path.join(self.test_dir, TARGET_DIR_NAME)
        os.makedirs(target_dir_path) # Create it beforehand
        self.assertTrue(os.path.exists(target_dir_path))

        created_path = xmp_mover.setup_target_dir(self.test_dir)
        self.assertEqual(created_path, target_dir_path)
        self.assertTrue(os.path.exists(target_dir_path)) # Still exists

    def test_setup_target_dir_creation_error(self):
        """Test that the function returns None if directory creation fails."""
        # Make self.test_dir read-only to cause an OSError on makedirs
        # This is hard to do reliably across platforms.
        # Instead, we can mock os.makedirs to raise an error.
        with patch('os.makedirs', side_effect=OSError("Test error")) as mock_makedirs:
            created_path = xmp_mover.setup_target_dir(self.test_dir)
            self.assertIsNone(created_path)
            mock_makedirs.assert_called_once()

    # --- Helper to create files ---
    def _create_file(self, dir_path, filename):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'w') as f:
            f.write("test content")
        return filepath

    # --- Tests for find_files_with_companions ---

    def test_find_no_files(self):
        """Test behavior when no files are present in the source directory."""
        target_dir = xmp_mover.setup_target_dir(self.test_dir)
        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir, self.mock_console
        )
        self.assertEqual(scanned, 0)
        self.assertEqual(moved, 0)
        self.assertEqual(errors, 0)

    def test_find_only_xmp_no_companion(self):
        """Test XMP file without companion is not moved."""
        self._create_file(self.test_dir, "photo1.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)
        
        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir, self.mock_console
        )
        self.assertEqual(scanned, 1) # Scanned the XMP
        self.assertEqual(moved, 0)
        self.assertEqual(errors, 0)
        self.assertFalse(os.path.exists(os.path.join(target_dir, "photo1.xmp")))

    def test_find_xmp_with_one_companion_move_both(self):
        """Test XMP and its companion are moved."""
        self._create_file(self.test_dir, "imageA.jpg")
        self._create_file(self.test_dir, "imageA.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir, self.mock_console, xmp_only=False, dry_run=False
        )
        self.assertEqual(scanned, 2)
        self.assertEqual(moved, 2) # Both jpg and xmp
        self.assertEqual(errors, 0)
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageA.jpg")))
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageA.xmp")))
        self.assertFalse(os.path.exists(os.path.join(self.test_dir, "imageA.jpg")))
        self.assertFalse(os.path.exists(os.path.join(self.test_dir, "imageA.xmp")))

    def test_find_xmp_with_multiple_companions_move_all(self):
        """Test XMP and its multiple companions are moved."""
        self._create_file(self.test_dir, "imageB.jpeg")
        self._create_file(self.test_dir, "imageB.png")
        self._create_file(self.test_dir, "imageB.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir, self.mock_console, xmp_only=False, dry_run=False
        )
        self.assertEqual(scanned, 3)
        self.assertEqual(moved, 3)
        self.assertEqual(errors, 0)
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageB.jpeg")))
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageB.png")))
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageB.xmp")))

    def test_find_xmp_with_companion_xmp_only(self):
        """Test only XMP is moved when --xmp-only is True."""
        self._create_file(self.test_dir, "imageC.raw")
        self._create_file(self.test_dir, "imageC.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir, self.mock_console, xmp_only=True, dry_run=False
        )
        self.assertEqual(scanned, 2)
        self.assertEqual(moved, 1) # Only xmp
        self.assertEqual(errors, 0)
        self.assertTrue(os.path.exists(os.path.join(target_dir, "imageC.xmp")))
        self.assertFalse(os.path.exists(os.path.join(target_dir, "imageC.raw")))
        self.assertTrue(os.path.exists(os.path.join(self.test_dir, "imageC.raw"))) # Companion stays

    def test_find_dry_run(self):
        """Test dry run: files are logged but not moved, shutil.move not called."""
        self._create_file(self.test_dir, "imageD.tif")
        self._create_file(self.test_dir, "imageD.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        with patch('shutil.move') as mock_move:
            scanned, moved, errors = xmp_mover.find_files_with_companions(
                self.test_dir, target_dir, self.mock_console, xmp_only=False, dry_run=True
            )
            self.assertEqual(scanned, 2)
            self.assertEqual(moved, 2) # Counts as "would move"
            self.assertEqual(errors, 0)
            mock_move.assert_not_called() # shutil.move should not be called
            self.assertTrue(os.path.exists(os.path.join(self.test_dir, "imageD.tif"))) # Still in source
            self.assertTrue(os.path.exists(os.path.join(self.test_dir, "imageD.xmp")))

    def test_find_skips_files_in_target_dir_itself(self):
        """Test that files directly within the root that is also the target_dir name are skipped."""
        # Create files in a directory that has the same name as TARGET_DIR_NAME
        # This is to test the `if os.path.basename(dirpath) == TARGET_DIR_NAME:` check
        
        # Main test directory
        # test_dir/
        #   with-xmp/  (this is the actual target dir for moves)
        #   subfolder/
        #     with-xmp/ (this one should be skipped by the os.walk skip logic)
        #       rogue.jpg
        #       rogue.xmp
        
        target_dir_proper = xmp_mover.setup_target_dir(self.test_dir) # test_dir/with-xmp

        subfolder_path = os.path.join(self.test_dir, "subfolder")
        os.makedirs(subfolder_path)
        
        dir_to_skip_path = os.path.join(subfolder_path, TARGET_DIR_NAME)
        os.makedirs(dir_to_skip_path)
        self._create_file(dir_to_skip_path, "rogue.jpg")
        self._create_file(dir_to_skip_path, "rogue.xmp")

        # Add a legitimate file pair to move
        self._create_file(subfolder_path, "good.tif")
        self._create_file(subfolder_path, "good.xmp")

        scanned, moved, errors = xmp_mover.find_files_with_companions(
            self.test_dir, target_dir_proper, self.mock_console
        )
        
        # Scanned should be 2 (good.tif, good.xmp).
        # The files in subfolder/with-xmp/ should not be scanned because that dir is skipped.
        # The files in the root test_dir (none) + target_dir_proper (none initially)
        # The structure is:
        # self.test_dir/
        #   subfolder/
        #     good.tif
        #     good.xmp
        #     with-xmp/  <- this whole dir is skipped by the progress.update(advance=len(filenames))
        #       rogue.jpg
        #       rogue.xmp
        #   with-xmp/    <- this is target_dir_proper
        #
        # So os.walk(self.test_dir) yields:
        # 1. (self.test_dir, ['subfolder', 'with-xmp'], [])
        # 2. (self.test_dir/subfolder, ['with-xmp'], ['good.tif', 'good.xmp']) -> good.tif, good.xmp scanned (2 files)
        # 3. (self.test_dir/subfolder/with-xmp, [], ['rogue.jpg', 'rogue.xmp']) -> this is skipped by `if os.path.basename(dirpath) == TARGET_DIR_NAME:`
        # 4. (self.test_dir/with-xmp, [], []) -> this is also skipped
        #
        # The pre-scan counts files in self.test_dir/subfolder (2) and self.test_dir/subfolder/with-xmp (2).
        # The actual scan advances by len(filenames) for skipped dirs.
        # So, total_files_scanned from the function should be 2 (good.tif, good.xmp).
        self.assertEqual(scanned, 2) 
        self.assertEqual(moved, 2)
        self.assertEqual(errors, 0)
        self.assertTrue(os.path.exists(os.path.join(target_dir_proper, "good.tif")))
        self.assertTrue(os.path.exists(os.path.join(target_dir_proper, "good.xmp")))
        self.assertFalse(os.path.exists(os.path.join(target_dir_proper, "rogue.jpg"))) # Not moved
        self.assertTrue(os.path.exists(os.path.join(dir_to_skip_path, "rogue.jpg")))   # Still in original skipped dir


    def test_find_destination_already_exists_warning(self):
        """Test that a warning is logged if a file to be moved already exists at the destination."""
        self._create_file(self.test_dir, "imageE.cr2")
        self._create_file(self.test_dir, "imageE.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        # Pre-create one of the files in the target directory
        self._create_file(target_dir, "imageE.xmp") 
        # And a dummy one for the companion to test that path too
        self._create_file(target_dir, "imageE.cr2") 

        with patch('logging.warning') as mock_log_warning:
            scanned, moved, errors = xmp_mover.find_files_with_companions(
                self.test_dir, target_dir, self.mock_console, xmp_only=False, dry_run=False
            )
            self.assertEqual(scanned, 2) # Both .cr2 and .xmp in source
            self.assertEqual(moved, 0)   # Nothing actually moved because dest exists
            self.assertEqual(errors, 0)
            
            # Check that logging.warning was called (at least twice, for xmp and companion)
            self.assertGreaterEqual(mock_log_warning.call_count, 2)
            # Example check for one of the calls
            mock_log_warning.assert_any_call(
                f"Destination already exists, skipping: {os.path.join(target_dir, 'imageE.xmp')}"
            )
            mock_log_warning.assert_any_call(
                f"Destination already exists, skipping: {os.path.join(target_dir, 'imageE.cr2')}"
            )

            # Ensure original files are still in source, as they were not moved
            self.assertTrue(os.path.exists(os.path.join(self.test_dir, "imageE.cr2")))
            self.assertTrue(os.path.exists(os.path.join(self.test_dir, "imageE.xmp")))


    @patch('shutil.move', side_effect=shutil.Error("Test shutil.Error"))
    def test_find_shutil_error_on_move(self, mock_shutil_move):
        """Test error handling when shutil.move raises an error."""
        self._create_file(self.test_dir, "imageF.nef")
        self._create_file(self.test_dir, "imageF.xmp")
        target_dir = xmp_mover.setup_target_dir(self.test_dir)

        with patch('logging.error') as mock_log_error:
            scanned, moved, errors = xmp_mover.find_files_with_companions(
                self.test_dir, target_dir, self.mock_console, xmp_only=False, dry_run=False
            )
            self.assertEqual(scanned, 2)
            self.assertEqual(moved, 0) # No files successfully moved
            self.assertEqual(errors, 2) # Both moves failed
            
            # shutil.move would be called for xmp and its companion
            self.assertEqual(mock_shutil_move.call_count, 2) 
            self.assertEqual(mock_log_error.call_count, 2)
            # For the XMP file itself
            mock_log_error.assert_any_call(f"Error moving {os.path.join(self.test_dir, 'imageF.xmp')}: Test shutil.Error")
            # For the companion file (which is imageF.nef in this test)
            mock_log_error.assert_any_call(f"Error moving companion {os.path.join(self.test_dir, 'imageF.nef')}: Test shutil.Error")


    # --- Tests for main ---
    @patch('xmp_mover.setup_target_dir')
    @patch('xmp_mover.find_files_with_companions')
    @patch('xmp_mover.Console') # Patch Console as it's imported in xmp_mover module
    @patch('argparse.ArgumentParser.parse_args')
    def test_main_flow_dry_run(self, mock_parse_args, mock_xmp_mover_console, mock_find_files, mock_setup_target):
        """Test the main function flow with --dry-run."""
        
        mock_parse_args.return_value = argparse.Namespace(xmp_only=False, dry_run=True)
        mock_setup_target.return_value = os.path.join(self.test_dir, TARGET_DIR_NAME)
        mock_find_files.return_value = (5, 2, 0) # scanned, moved, errors

        # This is the mock for the Console() call inside main()
        mock_stdout_console_instance = mock_xmp_mover_console.return_value
        
        xmp_mover.main()

        mock_setup_target.assert_called_once()
        # Check that find_files_with_companions is called with the stdout_console from main
        # The actual instance is MockRichConsole.return_value
        mock_find_files.assert_called_once_with(
            os.getcwd(), 
            mock_setup_target.return_value, 
            mock_stdout_console_instance, # This is the console passed for progress
            False, # xmp_only
            True   # dry_run
        )
        
        # Check that table.add_row was called appropriately for summary
        # We are checking the calls on the *instance* of the console used for table output
        self.assertTrue(mock_stdout_console_instance.print.called)
        # Further checks could inspect the Table object passed to print, but this is complex.
        # For now, just verify it was called.

    @patch('xmp_mover.setup_target_dir')
    @patch('xmp_mover.find_files_with_companions')
    @patch('xmp_mover.Console') # Patch Console as it's imported in xmp_mover module
    @patch('argparse.ArgumentParser.parse_args')
    @patch('sys.exit') # To prevent test from exiting
    def test_main_setup_target_dir_fails(self, mock_sys_exit, mock_parse_args, mock_xmp_mover_console, mock_find_files, mock_setup_target):
        """Test main function exits if setup_target_dir fails."""
        mock_parse_args.return_value = argparse.Namespace(xmp_only=False, dry_run=False)
        mock_setup_target.return_value = None # Simulate failure
        
        # If sys.exit works, find_files_with_companions should not be called.
        # However, if it were called, it needs a proper return value to avoid unpack error.
        mock_find_files.return_value = (0, 0, 0) 
        
        # Mock the console instance that might be created if flow continued.
        mock_stdout_console_instance = mock_xmp_mover_console.return_value

        xmp_mover.main()

        mock_setup_target.assert_called_once()
        mock_sys_exit.assert_called_once_with(1)


if __name__ == '__main__':
    # Need to re-enable logging if running file directly for debugging,
    # but keep it disabled for automated test runs.
    # logging.disable(logging.NOTSET) 
    unittest.main()
