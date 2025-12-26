/**
 * Composant graphiques avancés avec Chart.js / Recharts
 * Pour statistiques et analytics
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations'

/**
 * Bar Chart simple (sans dépendance externe)
 */
export function BarChart({ data, title, color = '#8b5cf6' }) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <motion.div variants={fadeInUp} className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-3">
        {data.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
            
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              ></motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Line Chart simple
 */
export function LineChart({ data, title, color = '#8b5cf6' }) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  
  const points = data.map((item, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((item.value - minValue) / range) * 100
    return `${x},${y}`
  }).join(' ')
  
  return (
    <motion.div variants={fadeInUp} className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <svg viewBox="0 0 100 100" className="w-full h-48" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area under curve */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.6 }}
          points={`0,100 ${points} 100,100`}
          fill={color}
        />
        
        {/* Line */}
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {data.map((item, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = 100 - ((item.value - minValue) / range) * 100
          
          return (
            <motion.circle
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              cx={x}
              cy={y}
              r="2"
              fill="white"
              stroke={color}
              strokeWidth="1"
            />
          )
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Donut Chart (Pie Chart)
 */
export function DonutChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90
  
  const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
  
  return (
    <motion.div variants={fadeInUp} className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex items-center gap-6">
        {/* Chart */}
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100
            const angle = (percentage / 100) * 360
            
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle = endAngle
            
            const startRad = (startAngle * Math.PI) / 180
            const endRad = (endAngle * Math.PI) / 180
            
            const x1 = 50 + 40 * Math.cos(startRad)
            const y1 = 50 + 40 * Math.sin(startRad)
            const x2 = 50 + 40 * Math.cos(endRad)
            const y2 = 50 + 40 * Math.sin(endRad)
            
            const largeArc = angle > 180 ? 1 : 0
            
            return (
              <motion.path
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[i % colors.length]}
              />
            )
          })}
          
          {/* Center hole */}
          <circle cx="50" cy="50" r="25" fill="#1e1932" />
          
          {/* Total in center */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-white"
          >
            {total}
          </text>
        </svg>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[i % colors.length] }}
                ></div>
                <span className="text-sm text-gray-400">{item.label}</span>
              </div>
              <span className="text-sm font-semibold">
                {item.value} ({((item.value / total) * 100).toFixed(0)}%)
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Stat Card avec trend indicator
 */
export function StatCard({ title, value, trend, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'border-primary-500/30 text-primary-400',
    green: 'border-green-500/30 text-green-400',
    red: 'border-red-500/30 text-red-400',
    blue: 'border-blue-500/30 text-blue-400',
    purple: 'border-purple-500/30 text-purple-400'
  }
  
  const isPositive = trend > 0
  
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)' }}
      className={`glass p-6 rounded-xl border ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon className={`w-8 h-8 ${colors[color].split(' ')[1]}`} />}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  )
}

/**
 * Activity Timeline
 */
export function ActivityTimeline({ activities }) {
  return (
    <motion.div variants={fadeInUp} className="glass p-6 rounded-xl">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Activité récente
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 relative"
          >
            {/* Timeline line */}
            {i < activities.length - 1 && (
              <div className="absolute left-2 top-8 bottom-0 w-px bg-gray-700"></div>
            )}
            
            {/* Icon */}
            <div className={`w-4 h-4 rounded-full ${activity.color || 'bg-primary-500'} flex-shrink-0 mt-1 z-10`}></div>
            
            {/* Content */}
            <div className="flex-1">
              <p className="text-sm text-white">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
