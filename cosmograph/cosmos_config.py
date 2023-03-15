import json
from os.path import join, dirname, abspath

f = open(join(dirname(abspath(__file__)), 'cosmos_config.json'))
data = json.load(f)
cosmos_config = data['config']
f.close()