"use client"


import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Brain,
  Pill,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts"
import StatsCard from "@/components/dashboard/StatsCard"

// Mock data - replace with actual API calls
const patientOverviewStats = {
  totalPatients: 48,
  activePatients: 42,
  highRiskPatients: 8,
  avgMigraineFrequency: 3.2,
  patientGrowth: "+12% from last month",
  riskTrend: "+2 from last month"
}

const migraineFrequencyTrend = [
  { month: 'Jul', avgFrequency: 4.2, totalEvents: 168 },
  { month: 'Aug', avgFrequency: 3.8, totalEvents: 152 },
  { month: 'Sep', avgFrequency: 4.5, totalEvents: 189 },
  { month: 'Oct', avgFrequency: 3.5, totalEvents: 140 },
  { month: 'Nov', avgFrequency: 3.2, totalEvents: 128 },
  { month: 'Dec', avgFrequency: 3.0, totalEvents: 120 },
]

const severityDistribution = [
  { severity: 'Mild (1-3)', count: 145, percentage: 35 },
  { severity: 'Moderate (4-6)', count: 205, percentage: 50 },
  { severity: 'Severe (7-10)', count: 62, percentage: 15 },
]

const commonTriggers = [
  { trigger: 'Stress', patients: 32, percentage: 67, color: '#ef4444' },
  { trigger: 'Sleep Deprivation', patients: 28, percentage: 58, color: '#f97316' },
  { trigger: 'Weather Changes', patients: 24, percentage: 50, color: '#eab308' },
  { trigger: 'Hormonal Changes', patients: 18, percentage: 38, color: '#8b5cf6' },
  { trigger: 'Food Triggers', patients: 15, percentage: 31, color: '#06b6d4' },
]

const medicationAdherence = [
  { name: 'Excellent (>90%)', value: 15, color: '#10b981' },
  { name: 'Good (70-90%)', value: 20, color: '#3b82f6' },
  { name: 'Fair (50-70%)', value: 10, color: '#f59e0b' },
  { name: 'Poor (<50%)', value: 3, color: '#ef4444' },
]

const treatmentOutcomes = [
  { month: 'Jul', improved: 12, stable: 28, worsened: 5 },
  { month: 'Aug', improved: 15, stable: 25, worsened: 4 },
  { month: 'Sep', improved: 18, stable: 24, worsened: 3 },
  { month: 'Oct', improved: 20, stable: 23, worsened: 2 },
  { month: 'Nov', improved: 22, stable: 22, worsened: 2 },
  { month: 'Dec', improved: 25, stable: 20, worsened: 1 },
]

const highRiskPatients = [
  { 
    id: 1, 
    name: 'Sarah Johnson', 
    riskLevel: 'HIGH', 
    frequency: 8.5, 
    lastEvent: '2 days ago',
    adherence: 45,
    concerns: ['Increasing frequency', 'Low adherence']
  },
  { 
    id: 2, 
    name: 'Michael Chen', 
    riskLevel: 'HIGH', 
    frequency: 7.2, 
    lastEvent: '1 day ago',
    adherence: 62,
    concerns: ['Severe episodes', 'Multiple triggers']
  },
  { 
    id: 3, 
    name: 'Emily Rodriguez', 
    riskLevel: 'MEDIUM', 
    frequency: 5.8, 
    lastEvent: '5 days ago',
    adherence: 78,
    concerns: ['New symptoms reported']
  },
  { 
    id: 4, 
    name: 'David Park', 
    riskLevel: 'MEDIUM', 
    frequency: 5.2, 
    lastEvent: '3 days ago',
    adherence: 55,
    concerns: ['Medication change needed']
  },
]

const chartConfig = {
  avgFrequency: {
    label: "Avg Frequency",
    color: "#3b82f6",
  },
  totalEvents: {
    label: "Total Events",
    color: "#8b5cf6",
  },
  improved: {
    label: "Improved",
    color: "#10b981",
  },
  stable: {
    label: "Stable",
    color: "#3b82f6",
  },
  worsened: {
    label: "Worsened",
    color: "#ef4444",
  },
}

export default function DoctorAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Patient Analytics
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Comprehensive insights across your patient population
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <Tabs defaultValue="6m" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="1m">1 Month</TabsTrigger>
            <TabsTrigger value="3m">3 Months</TabsTrigger>
            <TabsTrigger value="6m">6 Months</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatsCard
          title="Total Patients"
          value={patientOverviewStats.totalPatients.toString()}
          icon={Users}
          iconColor="text-blue-600"
          change={patientOverviewStats.patientGrowth}
          changeType="positive"
        />
        <StatsCard
          title="Active Patients"
          value={patientOverviewStats.activePatients.toString()}
          icon={Activity}
          iconColor="text-green-600"
          change="87.5% active rate"
          changeType="positive"
        />
        <StatsCard
          title="High Risk Patients"
          value={patientOverviewStats.highRiskPatients.toString()}
          icon={AlertTriangle}
          iconColor="text-red-600"
          change={patientOverviewStats.riskTrend}
          changeType="negative"
        />
        <StatsCard
          title="Avg Migraine/Month"
          value={patientOverviewStats.avgMigraineFrequency.toString()}
          icon={Brain}
          iconColor="text-purple-600"
          change="-0.5 from last month"
          changeType="positive"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Migraine Frequency Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Migraine Frequency Trend
            </CardTitle>
            <CardDescription>
              Average migraine frequency across all patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={migraineFrequencyTrend}>
                <defs>
                  <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="avgFrequency" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorFrequency)" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Treatment Outcomes */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Treatment Outcomes
            </CardTitle>
            <CardDescription>
              Patient progress over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={treatmentOutcomes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="improved" fill="#10b981" stackId="a" />
                <Bar dataKey="stable" fill="#3b82f6" stackId="a" />
                <Bar dataKey="worsened" fill="#ef4444" stackId="a" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Severity Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Severity Distribution
            </CardTitle>
            <CardDescription>
              Total episodes by severity level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {severityDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.severity}</span>
                    <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medication Adherence */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Medication Adherence
            </CardTitle>
            <CardDescription>
              Patient compliance distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={medicationAdherence}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {medicationAdherence.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {medicationAdherence.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1">{item.name}</span>
                  <span className="font-medium">{item.value} patients</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Triggers */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Common Triggers
            </CardTitle>
            <CardDescription>
              Most reported migraine triggers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commonTriggers.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.trigger}</span>
                    <span className="text-sm text-gray-600">{item.patients} pts ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Patients Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            High Risk Patients
          </CardTitle>
          <CardDescription>
            Patients requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Risk Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Frequency</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Adherence</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Last Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Concerns</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskPatients.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{patient.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={patient.riskLevel === 'HIGH' ? 'destructive' : 'default'}
                        className={patient.riskLevel === 'MEDIUM' ? 'bg-orange-500' : ''}
                      >
                        {patient.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{patient.frequency}/month</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              patient.adherence >= 70 ? 'bg-green-500' : 
                              patient.adherence >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${patient.adherence}%` }}
                          />
                        </div>
                        <span className="text-sm">{patient.adherence}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{patient.lastEvent}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {patient.concerns.map((concern, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-600 text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">2.3 hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-600 text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-600 text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Appointments This Week</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}