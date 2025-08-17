'use client'

import { useState } from 'react'

interface AddressFormProps {
  onSubmit: (address: string) => void
  initialAddress?: string
}

export default function AddressForm({ onSubmit, initialAddress = '' }: AddressFormProps) {
  const [address, setAddress] = useState(initialAddress || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (address.trim()) {
      onSubmit(address.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-4">
        <label htmlFor="address" className="text-lg font-bold text-gray-900">
          Enter Property Address
        </label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, State"
          className="px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400"
          disabled={!address || !address.trim()}
        >
          Find Property
        </button>
      </div>
    </form>
  )
}