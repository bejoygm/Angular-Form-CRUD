import os
import json
import subprocess
import pathlib
import string
import shutil
import re
from urllib.parse import urlencode, parse_qs, urlsplit, urlunsplit, unquote

config = json.load(open('config.json'))
PAGES_DIRECTORY = config['app_directory'] + config["pages_directory"]
MODULE_NAME = config['module_name']
ANGULAR_MODULE_NAME = "".join(i.title() for i in MODULE_NAME.split("-"))
MODLUE_DISPLAY_NAME = " ".join(re.findall('[A-Z][^A-Z]*', ANGULAR_MODULE_NAME))
MODULE_DIRECTORY = PAGES_DIRECTORY + MODULE_NAME
SCRIPT_DIRECTORY = os.getcwd()

def set_query_parameter(url):
    """Given a URL, set or replace a query parameter and return the
    modified URL.

    >>> set_query_parameter('http://example.com?foo=bar&biz=baz', 'foo', 'stuff')
    'http://example.com?foo=stuff&biz=baz'

    """
    scheme, netloc, path, query_string, fragment = urlsplit(url)
    query_params = parse_qs(query_string, keep_blank_values=True)

    for param_name in query_params:
        if query_params[param_name][0] == '':
            query_params[param_name] = '${event.data.' + param_name + '}'
    new_query_string = urlencode(query_params, doseq=True)

    return unquote(urlunsplit((scheme, netloc, path, new_query_string, fragment)))

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
    with open(output_file_name, 'w') as output:
        output.write(src.safe_substitute(data))
    filein.close()

def insert_to_file(file, decision_func):
    temp = open('temp', 'w+')
    with open(file, 'r') as f:
        decision_func(temp, f)
    temp.close()
    shutil.move('temp', file)

def add_to_page_routes(temp, f):
    var_found = False
    for line in f:
        if line.strip("\n") == config['page_route_var']:
            var_found = True

        if var_found:
            if config['page_route_end_identifier'] in line.strip("\n"):
                # switch back to false            
                var_found = False
                line = line.replace('}', f'''}}, {{
    path: '{MODULE_NAME}',
    loadChildren: './{MODULE_NAME}/{MODULE_NAME}.module#{ANGULAR_MODULE_NAME}Module',
  }}''')
        temp.write(line)

def add_to_page_menu(temp, f):
    var_found = False
    for line in f:
        if line.strip("\n") == config['page_menu_var']:
            var_found = True

        if var_found:
            if config['page_menu_end_identifier'] in line.strip("\n"):
                # switch back to false            
                var_found = False
                line = line.replace(']', f'''  {{
    title: '{MODLUE_DISPLAY_NAME}',
    icon: 'nb-compose',
    link: '/pages/{MODULE_NAME}/view',
    home: true,
  }}
]''')
        temp.write(line)

# change directory to Angular Pages Folder
with cd(PAGES_DIRECTORY):
    # insert_to_file('pages-routing.module.ts', add_to_page_routes)
    # insert_to_file('pages-menu.ts', add_to_page_menu)
    # create folder structure
    pathlib.Path(MODULE_DIRECTORY).mkdir(parents=True, exist_ok=True)
    pathlib.Path(MODULE_DIRECTORY + '/create').mkdir(parents=True, exist_ok=True)
    pathlib.Path(MODULE_DIRECTORY + '/edit').mkdir(parents=True, exist_ok=True)
    
    # create module level files
    with cd(MODULE_DIRECTORY):
        data = {
            'module_display_name': MODLUE_DISPLAY_NAME,
            'module_name': MODULE_NAME, 
            'angular_module_name': ANGULAR_MODULE_NAME,
            "api_url": config["api_url"],
            "create_api": config["create_api"],
            "get_api": config["get_api"],
            "update_api": config["update_api"],
            "delete_api": config["delete_api"],
            "table_columns": config["table_columns"]
        }


        search_params = str([{'field': param, 'search': 'query'} for param in config["search_params"]])
        search_params = search_params.replace("'query'", 'query')
        data["search_params"] = search_params

        data['delete_api'] = set_query_parameter(config['delete_api'])

        make_file('module-template.ts', f'{MODULE_NAME}.module.ts', data)
        make_file('module-component-template.ts', f'{MODULE_NAME}.component.ts', data)
        make_file('routing-template.ts', f'{MODULE_NAME}-routing.module.ts', data)

    # create actions (CRUD)
    for action in ['create', 'edit']:
        with cd(MODULE_DIRECTORY + f'/{action}'):
            make_file(f'{action}-template.html', f'{MODULE_NAME}-{action}.component.html', data)
            make_file(f'{action}-component-template.ts', f'{MODULE_NAME}-{action}.component.ts', data)
  






