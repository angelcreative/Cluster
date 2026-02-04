import React, { useEffect, useState, useCallback, useRef } from 'react';
import ForceGraph from './components/ForceGraph';
import { GraphData, GraphNode, GraphLink } from './types';
import { NODE_COUNT, DEFAULT_GROUP_COUNT, COLORS, GROUP_LABELS } from './constants';

const NAMES_FIRST = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn", "Skyler", "Charlie"];
const NAMES_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const BIOS_TEMPLATES = [
  "Passionate about {topic} and building communities.",
  "Digital creator focused on {topic}.",
  "Sharing my journey in {topic}.",
  "Professional expert in {topic}.",
  "Lover of coffee and {topic}.",
  "Exploring the world of {topic} one day at a time.",
  "Advocate for {topic} and sustainable living.",
  "{topic} enthusiast and storyteller."
];

const App: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Interaction State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [groupCount, setGroupCount] = useState(DEFAULT_GROUP_COUNT);
  
  // Animation State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [originCoords, setOriginCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // 1. Create Nodes with User Data based on dynamic groupCount
    for (let i = 0; i < NODE_COUNT; i++) {
      const group = Math.floor(Math.random() * groupCount);
      const groupName = GROUP_LABELS[group].split(' ')[0]; // Extract simplified topic
      const randomFirst = NAMES_FIRST[Math.floor(Math.random() * NAMES_FIRST.length)];
      const randomLast = NAMES_LAST[Math.floor(Math.random() * NAMES_LAST.length)];
      
      nodes.push({
        id: `node-${i}`,
        group: group,
        // Larger sizes to fill the 500pxx500px area
        radius: Math.random() > 0.92 ? 12 + Math.random() * 10 : 5 + Math.random() * 5, 
        x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
        y: dimensions.height / 2 + (Math.random() - 0.5) * 50,
        name: `${randomFirst} ${randomLast}`,
        bio: BIOS_TEMPLATES[Math.floor(Math.random() * BIOS_TEMPLATES.length)].replace('{topic}', groupName),
        avatarUrl: `https://i.pravatar.cc/150?u=${i}`
      });
    }

    // 2. Internal Group Density (The Core)
    nodes.forEach((source) => {
      const sameGroup = nodes.filter(n => n.group === source.group && n.id !== source.id);
      const internalConnections = Math.floor(Math.random() * 2) + 1; 
      
      for (let j = 0; j < internalConnections; j++) {
        if (sameGroup.length === 0) break;
        const target = sameGroup[Math.floor(Math.random() * sameGroup.length)];
        links.push({ source: source.id, target: target.id, value: 1 });
      }
    });

    // 3. Global Cross-Pollination (The "Glue")
    // Drastically reduced probability (only 10%) to prevent color mixing
    nodes.forEach((source) => {
        if (Math.random() > 0.90) { 
            const differentGroupNodes = nodes.filter(n => n.group !== source.group);
            if (differentGroupNodes.length > 0) {
                const target = differentGroupNodes[Math.floor(Math.random() * differentGroupNodes.length)];
                links.push({ source: source.id, target: target.id, value: 0.5 });
            }
        }
    });

    setData({ nodes, links });
  }, [dimensions.width, dimensions.height, groupCount]); 

  // Handle opening the modal with animation
  const handleNodeClick = useCallback((node: GraphNode) => {
    setOriginCoords({ x: node.x || window.innerWidth / 2, y: node.y || window.innerHeight / 2 });
    setSelectedNode(node);
    
    // Slight delay to ensure DOM is ready for transition
    requestAnimationFrame(() => {
        setIsModalVisible(true);
    });
  }, []);

  // Handle closing with exit animation
  const closeModal = () => {
    setIsModalVisible(false);
    // Wait for transition to finish before removing from DOM
    setTimeout(() => {
        setSelectedNode(null);
    }, 300); // Matches the CSS transition duration
  };

  if (!data) return <div className="text-gray-500 flex items-center justify-center h-screen bg-gray-50 font-sans">Generando visualización...</div>;

  return (
    <div className="w-screen h-screen bg-white overflow-hidden relative font-sans">
      
      {/* Controls Container */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3">
         
         {/* Label Toggle */}
         <button 
           onClick={() => setShowLabels(!showLabels)}
           className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
         >
           {showLabels ? (
             <>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
               Hide Labels
             </>
           ) : (
             <>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
               Show Labels
             </>
           )}
         </button>

         {/* Segments Slider */}
         <div className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-1 w-48">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Segments</span>
                <span>{groupCount}</span>
            </div>
            <input 
                type="range" 
                min="2" 
                max="20" 
                value={groupCount} 
                onChange={(e) => setGroupCount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
         </div>

      </div>

      <ForceGraph 
        width={dimensions.width} 
        height={dimensions.height} 
        data={data} 
        onNodeClick={handleNodeClick}
        showLabels={showLabels}
        groupCount={groupCount}
      />

      {/* User Detail Modal with FLIP-like Animation */}
      {selectedNode && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
            isModalVisible ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-transparent pointer-events-none'
          }`} 
          onClick={closeModal}
        >
          <div 
            className="absolute bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
                top: isModalVisible ? '50%' : `${originCoords.y}px`,
                left: isModalVisible ? '50%' : `${originCoords.x}px`,
                width: '100%',
                maxWidth: '24rem', 
                transform: 'translate(-50%, -50%)',
                scale: isModalVisible ? 1 : 0.4,
                opacity: isModalVisible ? 1 : 0,
                // Simplification: Faster and standard ease-out for immediate feedback
                transition: 'all 0.3s ease-out', 
                transformOrigin: 'center center'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="flex flex-col items-center text-center p-6">
              <div 
                className="w-24 h-24 rounded-full p-1 mb-4 shadow-lg transition-transform duration-300"
                style={{ 
                    backgroundColor: COLORS[selectedNode.group],
                    transform: isModalVisible ? 'scale(1)' : 'scale(0.8)'
                }}
              >
                 <img 
                   src={selectedNode.avatarUrl} 
                   alt={selectedNode.name} 
                   className="w-full h-full rounded-full object-cover border-4 border-white"
                 />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedNode.name}</h2>
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 text-white"
                style={{ backgroundColor: COLORS[selectedNode.group] }}
              >
                {GROUP_LABELS[selectedNode.group].split(' ')[0]}
              </span>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                {selectedNode.bio}
              </p>

              <div className="w-full grid grid-cols-2 gap-3">
                 <button className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors">
                    Follow
                 </button>
                 <button className="flex-1 bg-gray-100 text-gray-900 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">
                    Message
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;