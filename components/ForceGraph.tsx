import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, GroupCenter } from '../types';
import { COLORS, GROUP_LABELS } from '../constants';

interface ForceGraphProps {
  width: number;
  height: number;
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeClick: (node: GraphNode) => void;
  showLabels: boolean;
  groupCount: number;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ width, height, data, onNodeClick, showLabels, groupCount }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Keep track of the callback without triggering re-renders of the effect
  const onNodeClickRef = useRef(onNodeClick);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Handle Label Visibility separately to avoid restarting simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.select('.labels-container')
      .transition()
      .duration(300)
      .style('opacity', showLabels ? 1 : 0)
      .style('pointer-events', showLabels ? 'all' : 'none');
  }, [showLabels]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); 

    // Layout Logic:
    // To segregate colors while keeping 0 central space, we use a "Star" gravity layout.
    // 1. Group Foci are pulled OUTWARDS (radius 130) to distinct sectors.
    // 2. A strong Radial Force pulls everything INWARDS to center (0,0).
    // Result: Wedges of color meeting in the middle.
    const layoutRadius = 130; 
    const centerPoint = { x: width / 2, y: height / 2 };
    
    // Dynamic foci generation based on groupCount prop
    const groupFoci: GroupCenter[] = Array.from({ length: groupCount }, (_, i) => {
      const angle = (i * 2 * Math.PI) / groupCount - Math.PI / 2;
      return {
        x: centerPoint.x + layoutRadius * Math.cos(angle),
        y: centerPoint.y + layoutRadius * Math.sin(angle),
        label: GROUP_LABELS[i] || `Group ${i + 1}`, // Fallback label
        color: COLORS[i] || '#999', // Fallback color
      };
    });

    // Simulation
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links)
        .id(d => d.id)
        .strength(d => d.value === 1 ? 0.05 : 0.001) // Virtually 0 strength for cross-links to prevent mixing
      )
      // Low repulsion allows nodes to pack tightly into the wedges
      .force('charge', d3.forceManyBody().strength(-3)) 
      .force('collide', d3.forceCollide<GraphNode>((d) => d.radius + 1).strength(1)) 
      // Global center pull
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
      // **NEW**: Radial force pulling strictly to the middle to crush any donut hole
      .force('radial', d3.forceRadial(0, width / 2, height / 2).strength(0.15))
      // Strong sector sorting: Pulls nodes strongly towards their color's direction
      // Fix: Safely access groupFoci[d.group] to prevent crash when data/groupCount are out of sync during slider updates
      .force('x', d3.forceX<GraphNode>((d) => (groupFoci[d.group] || groupFoci[0]).x).strength(0.55)) 
      .force('y', d3.forceY<GraphNode>((d) => (groupFoci[d.group] || groupFoci[0]).y).strength(0.55));

    // Draw Links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', (d) => {
        const sourceNode = typeof d.source === 'object' ? d.source : data.nodes.find(n => n.id === d.source);
        if (!sourceNode) return '#ccc';
        const color = COLORS[sourceNode.group] || COLORS[0];
        return color;
      })
      .attr('stroke-opacity', 0.15)
      .attr('stroke-width', 0.5);

    // Draw Nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => COLORS[d.group] || COLORS[0]) // Safe access
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        // Stop propagation to prevent any background clicks
        event.stopPropagation();
        onNodeClickRef.current(d);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

    // Hover effect for nodes
    node.on('mouseover', function() {
      d3.select(this).transition().duration(200).attr('stroke-width', 2).attr('stroke', '#333');
    }).on('mouseout', function() {
      d3.select(this).transition().duration(200).attr('stroke-width', 0.5).attr('stroke', '#fff');
    });

    // Draw Labels (Groups) - Wrapped in a container class for easy selection
    const labelGroup = svg.append('g')
      .attr('class', 'labels-container')
      .style('opacity', showLabels ? 1 : 0) // Initialize with current prop value
      .style('pointer-events', showLabels ? 'all' : 'none')
      .selectAll('g')
      .data(groupFoci)
      .join('g')
      .style('cursor', 'pointer'); 

    // Background Rect (Pill/Card)
    labelGroup.append('rect')
      .attr('rx', 14)
      .attr('ry', 14)
      .attr('fill', 'white')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2);

    // Text
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('class', 'font-sans font-bold text-sm fill-gray-800 pointer-events-none')
      .text((d) => d.label);

    // Dynamic Sizing
    labelGroup.each(function() {
      const g = d3.select(this);
      const text = g.select('text').node() as SVGTextElement;
      if (text) {
        const bbox = text.getBBox();
        const paddingX = 28;
        const paddingY = 16;
        
        g.select('rect')
          .attr('x', -bbox.width / 2 - paddingX / 2)
          .attr('y', -bbox.height / 2 - paddingY / 2)
          .attr('width', bbox.width + paddingX)
          .attr('height', bbox.height + paddingY);
      }
    });

    // Tick Function
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!);

      node
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);

      // Calculate centroids
      const centroids: { [key: number]: { x: number; y: number; count: number } } = {};
      
      data.nodes.forEach(n => {
        if (n.x === undefined || n.y === undefined) return;
        if (!centroids[n.group]) centroids[n.group] = { x: 0, y: 0, count: 0 };
        centroids[n.group].x += n.x;
        centroids[n.group].y += n.y;
        centroids[n.group].count += 1;
      });

      labelGroup.attr('transform', (d, i) => {
        const c = centroids[i];
        if (c && c.count > 0) {
           const cx = c.x / c.count;
           const cy = c.y / c.count;
           
           // Push labels outwards dynamically
           const dx = cx - centerPoint.x;
           const dy = cy - centerPoint.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           let finalX = cx;
           let finalY = cy;

           // If clusters are very mashed in the center (dist < 60), push them out radially
           // Increased threshold because nodes are now spread slightly more due to wedges
           if (dist < 60) {
             const angle = (i * 2 * Math.PI) / groupCount - Math.PI / 2;
             const pushOut = 200; // Push labels out to the rim
             finalX = centerPoint.x + Math.cos(angle) * pushOut;
             finalY = centerPoint.y + Math.sin(angle) * pushOut;
           } else {
             // Normal push based on centroid
             const pushFactor = 1.3; 
             finalX = centerPoint.x + dx * pushFactor;
             finalY = centerPoint.y + dy * pushFactor;
           }

           return `translate(${finalX}, ${finalY})`;
        }
        return `translate(${d.x}, ${d.y})`;
      });
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [width, height, data, groupCount]);

  return <svg ref={svgRef} width={width} height={height} className="block w-full h-full" />;
};

export default ForceGraph;