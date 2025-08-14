'use client'

interface ToolbarProps {
  activeTool: string | null
  onToolSelect: (tool: string) => void
}

const tools = [
  { id: 'select', name: 'Select', icon: '👆' },
  { id: 'delete', name: 'Delete', icon: '🗑️' },
  { id: 'chicken_coop', name: 'Chicken Coop', icon: '🐔' },
  { id: 'food_forest', name: 'Food Forest', icon: '🌳' },
  { id: 'swale', name: 'Swale', icon: '〰️' },
  { id: 'garden_bed', name: 'Garden Bed', icon: '🌱' },
  { id: 'pond', name: 'Pond', icon: '💧' },
  { id: 'greenhouse', name: 'Greenhouse', icon: '🏡' },
  { id: 'compost', name: 'Compost', icon: '♻️' },
]

export default function Toolbar({ activeTool, onToolSelect }: ToolbarProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Drawing Tools</h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
              ${
                activeTool === tool.id
                  ? tool.id === 'delete' 
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                    : 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : tool.id === 'delete'
                    ? 'border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-800'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800'
              }
            `}
          >
            <span className="text-xl">{tool.icon}</span>
            <span className="text-sm font-medium">{tool.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}