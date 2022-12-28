"""Base functionality of cosmograph"""

from typing import List, Optional, Tuple
from pydantic import BaseModel

NodeId = str  # TODO: Also include ints? Oblige ids to be valid python identifiers?


class Node(BaseModel):
    id: NodeId


class Link(BaseModel):
    source: NodeId
    target: NodeId


# TODO: Find a way to make these have a .validate (with pydantic)
Nodes = List[Node]
Links = List[Link]


class GraphJson(BaseModel):
    links: Links
    nodes: Nodes = []

