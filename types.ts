import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  group: number;
  radius: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // User profile data
  name: string;
  bio: string;
  avatarUrl: string;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  value: number;
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface GroupCenter {
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}