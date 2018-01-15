import os
import json
import subprocess
import pathlib
import string

config = json.load(open('config.json'))
PAGES_DIRECTORY = config['app_directory'] + config["pages_directory"]
MODULE_NAME = config['module_name']
ANGULAR_MODULE_NAME = "".join(i.title() for i in MODULE_NAME.split("-"))
MODULE_DIRECTORY = PAGES_DIRECTORY + MODULE_NAME
SCRIPT_DIRECTORY = os.getcwd()

class cd:
    """Context manager for changing the current working directory"""
    def __init__(self, newPath):
        self.newPath = os.path.expanduser(newPath)

    def __enter__(self):
        self.savedPath = os.getcwd()
        os.chdir(self.newPath)

    def __exit__(self, etype, value, traceback):
        os.chdir(self.savedPath)

def make_file(template_file, output_file_name, data):
    filein = open(SCRIPT_DIRECTORY + '/' + template_file)
    src = string.Template(filein.read())
    with open(output_file_name, 'w+') as output:
        output.write(src.substitute(data))
    filein.close()

# change directory to Angular Pages Folder
with cd(PAGES_DIRECTORY):
    # create folder structure
    pathlib.Path(MODULE_DIRECTORY).mkdir(parents=True, exist_ok=True)
    pathlib.Path(MODULE_DIRECTORY + '/create').mkdir(parents=True, exist_ok=True)
    pathlib.Path(MODULE_DIRECTORY + '/edit').mkdir(parents=True, exist_ok=True)
    
    # create files in module
    with cd(MODULE_DIRECTORY):
        data = {'module_name': MODULE_NAME, 'angular_module_name': ANGULAR_MODULE_NAME}
        make_file('module-template.ts', f'{MODULE_NAME}.module.ts', data)
        open(f'{MODULE_NAME}.component.ts', 'a+')
        open(f'{MODULE_NAME}-routing.module.ts', 'a+')

    with cd(MODULE_DIRECTORY + '/create'):
        open(f'{MODULE_NAME}-create.component.html', 'a+')
        open(f'{MODULE_NAME}-create.component.scss', 'a+')
        open(f'{MODULE_NAME}-create.component.ts', 'a+')

    with cd(MODULE_DIRECTORY + '/edit'):
        open(f'{MODULE_NAME}-edit.component.html', 'a+')
        open(f'{MODULE_NAME}-edit.component.scss', 'a+')
        open(f'{MODULE_NAME}-edit.component.ts', 'a+')






