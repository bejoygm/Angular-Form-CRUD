import os
import json
import subprocess
import pathlib

class cd:
    """Context manager for changing the current working directory"""
    def __init__(self, newPath):
        self.newPath = os.path.expanduser(newPath)

    def __enter__(self):
        self.savedPath = os.getcwd()
        os.chdir(self.newPath)

    def __exit__(self, etype, value, traceback):
        os.chdir(self.savedPath)

config = json.load(open('config.json'))
PAGES_DIRECTORY = config['app_directory'] + config["pages_directory"]

# change directory to Angular Pages Folder
with cd(PAGES_DIRECTORY):
    pathlib.Path(PAGES_DIRECTORY + config['module_name']).mkdir(parents=True, exist_ok=True)
    pathlib.Path(PAGES_DIRECTORY + config['module_name'] + "/create").mkdir(parents=True, exist_ok=True)
    pathlib.Path(PAGES_DIRECTORY + config['module_name'] + "/edit").mkdir(parents=True, exist_ok=True)
    