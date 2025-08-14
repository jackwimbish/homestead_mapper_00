'use client'

interface ToolbarProps {
  activeTool: string | null
  onToolSelect: (tool: string) => void
}

const tools = [
  { id: 'select', name: 'Select', icon: '👆' },
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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Drawing Tools</h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
              ${
                activeTool === tool.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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