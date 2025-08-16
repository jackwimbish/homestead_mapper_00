'use client'

import { useState, useEffect } from 'react'
import * as turf from '@turf/turf'

const FEET_PER_METER = 3.28084
const SQFT_PER_SQM = 10.7639

interface InspectorProps {
  selectedFeatures: any[]
  groups: any
  featureToGroup: any
  drawRef: any
}

export default function Inspector({
  selectedFeatures,
  groups,
  featureToGroup,
  drawRef
}: InspectorProps) {
  const [featureName, setFeatureName] = useState('')

  useEffect(() => {
    if (selectedFeatures.length === 1) {
      const feature = selectedFeatures[0]
      setFeatureName(feature.properties?.name || '')
    } else if (selectedFeatures.length > 1) {
      // Check if all selected features are in the same group
      const groupIds = selectedFeatures
        .map(f => f.id && featureToGroup.get(f.id))
        .filter(Boolean)
      
      if (groupIds.length === selectedFeatures.length) {
        const uniqueGroupIds = [...new Set(groupIds)]
        if (uniqueGroupIds.length === 1) {
          const group = groups.get(uniqueGroupIds[0])
          if (group) {
            setFeatureName(group.name)
          }
        }
      }
    }
  }, [selectedFeatures, groups, featureToGroup])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setFeatureName(newName)
    
    if (selectedFeatures.length === 1 && drawRef.current) {
      const feature = selectedFeatures[0]
      drawRef.current.setFeatureProperty(feature.id, 'name', newName)
    }
  }

  const getMeasurements = () => {
    if (selectedFeatures.length !== 1) return null
    
    const feature = selectedFeatures[0]
    const geom = feature.geometry
    
    if (!geom) return null
    
    const measurements: any = {}
    
    if (geom.type === 'LineString') {
      const length = turf.length(feature, { units: 'meters' })
      measurements.length = (length * FEET_PER_METER).toFixed(1) + ' ft'
      
      // Calculate segment lengths
      const segments = []
      for (let i = 0; i < geom.coordinates.length - 1; i++) {
        const segmentLength = turf.distance(
          turf.point(geom.coordinates[i]),
          turf.point(geom.coordinates[i + 1]),
          { units: 'meters' }
        )
        segments.push((segmentLength * FEET_PER_METER).toFixed(1))
      }
      if (segments.length > 0) {
        measurements.segments = segments.join(', ') + ' ft'
      }
    } else if (geom.type === 'Polygon') {
      const area = turf.area(feature)
      measurements.area = (area * SQFT_PER_SQM).toFixed(1) + ' sq ft'
      
      if (feature.properties?.eeShape === 'circle' && feature.properties?.eeDiameterFt) {
        measurements.diameter = feature.properties.eeDiameterFt.toFixed(1) + ' ft'
      } else {
        // Calculate perimeter for non-circles
        const perimeter = turf.length(turf.lineString(geom.coordinates[0]), { units: 'meters' })
        measurements.perimeter = (perimeter * FEET_PER_METER).toFixed(1) + ' ft'
      }
    }
    
    return measurements
  }

  const measurements = getMeasurements()

  return (
    <section className="w-80 border-l border-gray-300 p-3 overflow-auto bg-white">
      <h2 className="text-base font-semibold mb-2">Inspector</h2>
      
      <div className="text-sm text-gray-700 mb-3">
        {selectedFeatures.length === 0 ? (
          'No selection'
        ) : selectedFeatures.length === 1 ? (
          `1 selected – ${featureName || '(unnamed)'}`
        ) : (
          `${selectedFeatures.length} selected`
        )}
      </div>

      {selectedFeatures.length === 1 && (
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-1">Name</label>
          <input
            type="text"
            value={featureName}
            onChange={handleNameChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>
      )}

      {measurements && (
        <div className="text-sm leading-relaxed">
          {measurements.segments && (
            <div className="mb-2">
              <strong>Segments:</strong> {measurements.segments}
            </div>
          )}
          {measurements.length && (
            <div className="mb-2">
              <strong>Total length:</strong> {measurements.length}
            </div>
          )}
          {measurements.area && (
            <div className="mb-2">
              <strong>Area:</strong> {measurements.area}
            </div>
          )}
          {measurements.diameter && (
            <div className="mb-2">
              <strong>Circle diameter:</strong> {measurements.diameter}
            </div>
          )}
          {measurements.perimeter && (
            <div className="mb-2">
              <strong>Perimeter:</strong> {measurements.perimeter}
            </div>
          )}
        </div>
      )}
    </section>
  )
}